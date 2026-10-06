const { createTaskModel } = require("../models/taskModel");
const { calculateScheduleCPM } = require("./cpmService");

// Normalize database rows into the existing CPM task/dependency interface.
// All structures and records are new: callers retain ownership of their input.
function buildGraph(taskRows, dependencyRows) {
    const tasks = new Map();
    const adjacency = new Map();
    const reverseAdjacency = new Map();
    const indegree = new Map();
    for (const row of taskRows) {
        if (tasks.has(row.id)) throw new Error(`Duplicate task: ${row.id}`);
        tasks.set(row.id, { ...row, duration: row.duration_days, dependencies: [] });
        adjacency.set(row.id, []);
        reverseAdjacency.set(row.id, []);
        indegree.set(row.id, 0);
    }
    for (const row of dependencyRows) {
        const predecessorId = row.predecessor_task_id;
        const successorId = row.successor_task_id;
        if (!tasks.has(predecessorId) || !tasks.has(successorId)) {
            throw new Error("Dependency references a task outside the graph");
        }
        adjacency.get(predecessorId).push(successorId);
        reverseAdjacency.get(successorId).push(predecessorId);
        indegree.set(successorId, indegree.get(successorId) + 1);
        tasks.get(successorId).dependencies.push({
            predecessorId, type: row.dependency_type, lag: row.lag_days
        });
    }
    return { tasks, adjacency, reverseAdjacency, indegree };
}

// Only inspect Kahn's residual subgraph. Iterative strongly connected components
// distinguish cycles from downstream tails AND bridges between separate cycles.
function cycleTasksInResidual(graph, residual) {
    const visited = new Set();
    const finishOrder = [];
    for (const start of residual) {
        if (visited.has(start)) continue;
        visited.add(start);
        const stack = [{ id: start, next: 0 }];
        while (stack.length) {
            const frame = stack[stack.length - 1];
            const successors = graph.adjacency.get(frame.id);
            if (frame.next === successors.length) {
                finishOrder.push(frame.id);
                stack.pop();
                continue;
            }
            const next = successors[frame.next++];
            if (residual.has(next) && !visited.has(next)) {
                visited.add(next);
                stack.push({ id: next, next: 0 });
            }
        }
    }

    const assigned = new Set();
    const cycleTasks = [];
    for (let index = finishOrder.length - 1; index >= 0; index--) {
        const start = finishOrder[index];
        if (assigned.has(start)) continue;
        const component = [];
        const stack = [start];
        assigned.add(start);
        while (stack.length) {
            const id = stack.pop();
            component.push(id);
            for (const predecessor of graph.reverseAdjacency.get(id)) {
                if (residual.has(predecessor) && !assigned.has(predecessor)) {
                    assigned.add(predecessor);
                    stack.push(predecessor);
                }
            }
        }
        if (component.length > 1 || graph.adjacency.get(start).includes(start)) {
            for (const id of component) cycleTasks.push(id);
        }
    }
    return cycleTasks;
}

function topologicalSort(graph) {
    const indegree = new Map(graph.indegree);
    const queue = [];
    const order = [];
    for (const [id, degree] of indegree) {
        if (degree === 0) queue.push(id);
    }
    // A queue head avoids Array.shift's repeated copying. No recursion.
    for (let head = 0; head < queue.length; head++) {
        const id = queue[head];
        order.push(id);
        for (const successor of graph.adjacency.get(id)) {
            const degree = indegree.get(successor) - 1;
            indegree.set(successor, degree);
            if (degree === 0) queue.push(successor);
        }
    }
    const hasCycle = order.length < graph.tasks.size;
    const residual = new Set();
    if (hasCycle) {
        for (const [id, degree] of indegree) {
            if (degree > 0) residual.add(id);
        }
    }
    return {
        order,
        sortedTasks: order.map((id) => graph.tasks.get(id)),
        hasCycle,
        cycleTasks: hasCycle ? cycleTasksInResidual(graph, residual) : []
    };
}

async function loadProjectGraph(source, projectId) {
    const model = typeof source.query === "function" ? createTaskModel(source) : source;
    // Exactly two SELECTs, independent of task count; no per-task queries.
    const tasks = await model.list(projectId);
    const dependencies = await model.listDependencies(projectId);
    return buildGraph(tasks, dependencies);
}

// Find an actual closed walk in reverse ("waits for") order. An SCC's array
// order alone is not a valid path, especially with multiple separate cycles.
function createCycleError(graph, cycleTasks, preferredStart) {
    const allowed = new Set(cycleTasks);
    const visited = new Set();
    const starts = allowed.has(preferredStart)
        ? [preferredStart, ...cycleTasks.filter((id) => id !== preferredStart)] : cycleTasks;
    let cycleIds = [];
    for (const start of starts) {
        if (visited.has(start)) continue;
        const positions = new Map([[start, 0]]);
        const stack = [{ id: start, next: 0 }];
        visited.add(start);
        while (stack.length && cycleIds.length === 0) {
            const frame = stack[stack.length - 1];
            const predecessors = graph.reverseAdjacency.get(frame.id);
            if (frame.next === predecessors.length) {
                positions.delete(frame.id);
                stack.pop();
                continue;
            }
            const next = predecessors[frame.next++];
            if (!allowed.has(next)) continue;
            if (positions.has(next)) {
                cycleIds = stack.slice(positions.get(next)).map((entry) => entry.id);
            } else if (!visited.has(next)) {
                visited.add(next);
                positions.set(next, stack.length);
                stack.push({ id: next, next: 0 });
            }
        }
        if (cycleIds.length) break;
    }
    const cycle = cycleIds.map((id) => ({ id, name: graph.tasks.get(id).name }));
    const message = "Phát hiện vòng phụ thuộc: " + cycle.map((task, index) => {
        const next = cycle[(index + 1) % cycle.length];
        return `Công việc "${task.name}" ${index === cycle.length - 1 ? "lại chờ" : "chờ"} "${next.name}"`;
    }).join(", ") + ".";
    return Object.assign(new Error(message), { status: 422, expose: true, cycle });
}

async function ensureProjectSchedule(transaction, project, projectId) {
    if (project.schedule_needs_recalc) {
        const graph = await loadProjectGraph(transaction.tasks, projectId);
        const sorted = topologicalSort(graph);
        if (sorted.hasCycle) throw createCycleError(graph, sorted.cycleTasks);
        const results = sorted.sortedTasks.length ? calculateScheduleCPM(sorted.sortedTasks) : new Map();
        await transaction.replaceResults(projectId, [...results.values()]);
    }
}

function createScheduleService({ model }) {
    return {
        async getSchedule(projectId, { criticalOnly = false } = {}) {
            return model.withProjectTransaction(projectId, async (transaction, project) => {
                await ensureProjectSchedule(transaction, project, projectId);
                return transaction.listResults(projectId, criticalOnly);
            });
        }
    };
}

module.exports = { buildGraph, topologicalSort, loadProjectGraph, createCycleError, createScheduleService, ensureProjectSchedule };
