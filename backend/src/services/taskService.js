const { buildGraph, topologicalSort, createCycleError } = require("./scheduleService");

const MAX_INTEGER = 2147483647;
const TYPES = ["FS", "SS", "FF", "SF"];

function inputError(message, status = 400) {
    return Object.assign(new Error(message), { status, expose: true });
}

function positiveInteger(value) {
    return Number.isInteger(value) && value > 0 && value <= MAX_INTEGER;
}

function validateId(value) {
    if (!positiveInteger(value)) throw inputError("Mã công việc hoặc hạng mục không hợp lệ");
}

function nullableDate(value, field) {
    if (value === null || value === undefined || value === "") return null;
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        throw inputError(`${field} phải có định dạng YYYY-MM-DD`);
    }
    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
        throw inputError(`${field} không hợp lệ`);
    }
    return value;
}

async function translateErrors(operation) {
    try {
        return await operation();
    } catch (error) {
        if (error.code === "ITEM_NOT_FOUND") throw inputError("Không tìm thấy hạng mục trong dự án", 404);
        if (error.code === "ITEM_NOT_LEAF") throw inputError("Chỉ được gắn công việc vào hạng mục lá");
        if (error.code === "23505" && error.constraint === "dependencies_pair_key") {
            throw inputError("Cặp công việc trước và sau đã có quan hệ phụ thuộc", 409);
        }
        if (error.code === "23503") throw inputError("Công việc hoặc hạng mục không còn tồn tại", 409);
        if (error.code === "23514" && ["tasks_actual_dates_check", "tasks_actual_dates_order_check"]
            .some(constraint => error.constraint === constraint || String(error.message).includes(constraint))) {
            throw inputError("Ngày kết thúc thực tế không được sớm hơn ngày bắt đầu");
        }
        if (error.code === "23514" && ["tasks_progress_percent_check", "tasks_percent_complete_check"]
            .some(constraint => error.constraint === constraint || String(error.message).includes(constraint))) {
            throw inputError("Tiến độ phải là số nguyên từ 0 đến 100");
        }
        if (error.code === "23514") throw inputError("Thời lượng hoặc quan hệ phụ thuộc không hợp lệ");
        throw error;
    }
}

function createTaskService({ model }) {
    return {
        list: (projectId) => model.list(projectId),
        listDependencies: (projectId) => model.listDependencies(projectId),

        async save(projectId, taskId, body) {
            if (!body || typeof body !== "object" || Array.isArray(body)) throw inputError("Dữ liệu không hợp lệ");
            let current = {};
            if (taskId != null) {
                validateId(taskId);
                current = await model.findById(projectId, taskId);
                if (!current) throw inputError("Không tìm thấy công việc", 404);
            }
            const values = {
                work_item_id: body.work_item_id === undefined ? current.work_item_id : body.work_item_id,
                name: body.name === undefined ? current.name : body.name,
                duration_days: body.duration_days === undefined ? current.duration_days : body.duration_days,
                actual_start: body.actual_start === undefined ? (current.actual_start || null) : (body.actual_start || null),
                actual_finish: body.actual_finish === undefined ? (current.actual_finish || null) : (body.actual_finish || null),
                progress_percent: body.progress_percent === undefined ? (current.progress_percent ?? 0) : Number(body.progress_percent)
            };
            validateId(values.work_item_id);
            if (typeof values.name !== "string" || !values.name.trim() || values.name.trim().length > 255) {
                throw inputError("Tên công việc phải có từ 1 đến 255 ký tự");
            }
            if (!positiveInteger(values.duration_days)) {
                throw inputError("Thời lượng phải là số nguyên ngày lớn hơn 0");
            }
            if (!Number.isInteger(values.progress_percent) || values.progress_percent < 0 || values.progress_percent > 100) {
                throw inputError("Tiến độ phải là số nguyên từ 0 đến 100");
            }
            if (values.actual_start && values.actual_finish && values.actual_finish < values.actual_start) {
                throw inputError("Ngày kết thúc thực tế không được sớm hơn ngày bắt đầu");
            }
            values.name = values.name.trim();
            const task = await translateErrors(() => model.save(projectId, taskId, values));
            if (!task) throw inputError("Không tìm thấy công việc", 404);
            return task;
        },

        async updateProgress(projectId, taskId, body) {
            validateId(taskId);
            if (!body || typeof body !== "object" || Array.isArray(body)) throw inputError("Dữ liệu không hợp lệ");
            const current = await model.findById(projectId, taskId);
            if (!current) throw inputError("Không tìm thấy công việc", 404);
            const supplied = (snake, camel, fallback) => Object.prototype.hasOwnProperty.call(body, snake)
                ? body[snake] : Object.prototype.hasOwnProperty.call(body, camel) ? body[camel] : fallback;
            const values = {
                actual_start_date: supplied("actual_start_date", "actualStart", current.actual_start_date ?? current.actualStart ?? null),
                actual_end_date: supplied("actual_end_date", "actualEnd", current.actual_end_date ?? current.actualEnd ?? null),
                percent_complete: supplied("percent_complete", "percentComplete", current.percent_complete ?? current.percentComplete ?? 0)
            };
            values.actual_start_date = nullableDate(values.actual_start_date, "Ngày bắt đầu thực tế");
            values.actual_end_date = nullableDate(values.actual_end_date, "Ngày kết thúc thực tế");
            if (values.actual_start_date && values.actual_end_date && values.actual_end_date < values.actual_start_date) {
                throw inputError("Ngày kết thúc thực tế không được sớm hơn ngày bắt đầu thực tế");
            }
            if (!Number.isInteger(values.percent_complete) || values.percent_complete < 0 || values.percent_complete > 100) {
                throw inputError("Phần trăm hoàn thành phải nằm trong khoảng 0 đến 100");
            }
            return translateErrors(async () => {
                const task = await model.updateProgress(projectId, taskId, values);
                if (!task) throw inputError("Không tìm thấy công việc", 404);
                return task;
            });
        },

        async addDependency(projectId, successorId, body) {
            validateId(successorId);
            if (!body || typeof body !== "object") throw inputError("Dữ liệu không hợp lệ");
            const { predecessor_task_id, dependency_type, lag_days = 0 } = body;
            validateId(predecessor_task_id);
            if (predecessor_task_id === successorId) throw inputError("Công việc không thể phụ thuộc chính nó");
            if (!TYPES.includes(dependency_type)) throw inputError("Loại quan hệ phải là FS, SS, FF hoặc SF");
            if (!Number.isInteger(lag_days) || lag_days < -2147483648 || lag_days > MAX_INTEGER) {
                throw inputError("Độ trễ phải là số nguyên ngày (có thể âm)");
            }
            return translateErrors(() => model.withProjectTransaction(projectId, async (transaction) => {
                const tasks = await transaction.list(projectId);
                const dependencies = await transaction.listDependencies(projectId);
                if (!tasks.some((task) => task.id === predecessor_task_id)
                    || !tasks.some((task) => task.id === successorId)) {
                    throw inputError("Hai công việc phải tồn tại trong cùng dự án", 404);
                }
                if (dependencies.some((edge) => edge.predecessor_task_id === predecessor_task_id
                    && edge.successor_task_id === successorId)) {
                    throw inputError("Cặp công việc trước và sau đã có quan hệ phụ thuộc", 409);
                }
                const candidate = { predecessor_task_id, successor_task_id: successorId, dependency_type, lag_days };
                const graph = buildGraph(tasks, [...dependencies, candidate]);
                const sorted = topologicalSort(graph);
                if (sorted.hasCycle) throw createCycleError(graph, sorted.cycleTasks, successorId);
                const dependency = await transaction.createDependency(projectId, successorId, candidate);
                if (!dependency) throw inputError("Hai công việc phải tồn tại trong cùng dự án", 404);
                return dependency;
            }));
        },

        async removeDependency(projectId, taskId, dependencyId) {
            validateId(taskId);
            validateId(dependencyId);
            await model.withProjectTransaction(projectId, async (transaction) => {
                if (!await transaction.removeDependency(projectId, taskId, dependencyId)) {
                    throw inputError("Không tìm thấy quan hệ phụ thuộc", 404);
                }
            });
        }
    };
}

module.exports = { createTaskService };
