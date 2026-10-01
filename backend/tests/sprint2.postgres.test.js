const { Pool } = require("pg");
const express = require("express");
const request = require("supertest");
const { randomUUID } = require("node:crypto");
const { runMigrations } = require("../src/run-migration");
const { createTaskModel } = require("../src/models/taskModel");
const { createTaskRoutes } = require("../src/routes/taskRoutes");
const { createWorkItemCrudModel } = require("../src/models/workItemCrudModel");
const { createWorkItemRoutes } = require("../src/routes/workItemRoutes");
const { loadProjectGraph } = require("../src/services/scheduleService");
const errorHandler = require("../src/middleware/errorHandler");

// Opt in to a real PostgreSQL server. Each run owns an isolated schema;
// no application schema or rows are changed, including during rollback tests.
const describePostgres = process.env.SPRINT2_TEST_DATABASE_URL ? describe : describe.skip;

describePostgres("Sprint 2 real PostgreSQL constraints, migrations and API", () => {
    let admin;
    let pool;
    let app;
    let member;
    let model;
    let items;
    let project;
    let otherProject;
    const schema = `sprint2_test_${randomUUID().replaceAll("-", "")}`;
    const migrate = async (command) => {
        const client = await pool.connect();
        try {
            return await runMigrations({ client, command });
        } finally {
            client.release();
        }
    };

    beforeAll(async () => {
        admin = new Pool({ connectionString: process.env.SPRINT2_TEST_DATABASE_URL });
        await admin.query(`CREATE SCHEMA "${schema}"`);
        pool = new Pool({
            connectionString: process.env.SPRINT2_TEST_DATABASE_URL,
            options: `-c search_path=${schema}`
        });
        await migrate("up");
        model = createTaskModel(pool);
        const memberModel = { findByProjectAndUser: async () => member };
        const authorization = { requireAuth: (req, res, next) => {
            if (req.get("x-test-auth") === "none") return res.sendStatus(401);
            req.user = { id: 1 };
            next();
        } };
        app = express();
        app.set("env", "test");
        app.use(express.json());
        app.use("/projects", createTaskRoutes({ model, memberModel, authorization }));
        app.use("/projects", createWorkItemRoutes({ model: createWorkItemCrudModel(pool), memberModel, authorization }));
        app.use(errorHandler);
    });

    afterAll(async () => {
        if (pool) await pool.end();
        if (admin) {
            await admin.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
            await admin.end();
        }
    });

    beforeEach(async () => {
        member = { role: "engineer" };
        await pool.query("TRUNCATE dependencies, tasks, work_items, projects CASCADE");
        [project, otherProject] = (await pool.query("INSERT INTO projects (name) VALUES ('Sprint 2'), ('Other') RETURNING id")).rows.map((row) => row.id);
        const parent = (await pool.query("INSERT INTO work_items (project_id, title) VALUES ($1, 'Parent') RETURNING id", [project])).rows[0].id;
        const leaf = (await pool.query("INSERT INTO work_items (project_id, parent_id, title) VALUES ($1, $2, 'Leaf') RETURNING id", [project, parent])).rows[0].id;
        const other = (await pool.query("INSERT INTO work_items (project_id, title) VALUES ($1, 'Other') RETURNING id", [otherProject])).rows[0].id;
        items = { parent, leaf, other };
    });

    const insertTask = async (name = "Task", workItemId = items.leaf, duration = 1) => (
        await pool.query("INSERT INTO tasks (work_item_id, name, duration_days) VALUES ($1, $2, $3) RETURNING *", [workItemId, name, duration])
    ).rows[0];
    const insertDependency = (predecessor, successor, type = "FS", lag = 0) => pool.query(`
        INSERT INTO dependencies (predecessor_task_id, successor_task_id, dependency_type, lag_days)
        VALUES ($1, $2, $3, $4) RETURNING *
    `, [predecessor, successor, type, lag]);

    test("009/010 schema types, constraints and both dependency indexes exist", async () => {
        const { rows } = await pool.query(`
            SELECT table_name, column_name, data_type FROM information_schema.columns
            WHERE table_schema = $1 AND table_name IN ('tasks', 'dependencies')
        `, [schema]);
        for (const [table, column] of [["tasks", "work_item_id"], ["tasks", "duration_days"], ["dependencies", "lag_days"]]) {
            expect(rows.find((row) => row.table_name === table && row.column_name === column).data_type).toBe("integer");
        }
        const indexes = await pool.query("SELECT indexname FROM pg_indexes WHERE schemaname = $1 AND tablename = 'dependencies'", [schema]);
        expect(indexes.rows.map((row) => row.indexname)).toEqual(expect.arrayContaining([
            "dependencies_predecessor_task_id_idx", "dependencies_successor_task_id_idx", "dependencies_pair_key"
        ]));
    });

    test("T-11 direct INSERT accepts 1, rejects zero, negative, fractional, null and invalid FK", async () => {
        expect((await insertTask()).duration_days).toBe(1);
        for (const duration of [0, -1]) {
            await expect(insertTask("Invalid", items.leaf, duration)).rejects.toMatchObject({ code: "23514" });
        }
        await expect(insertTask("Invalid", items.leaf, 1.5)).rejects.toMatchObject({ code: "22P02" });
        await expect(insertTask("Invalid", items.leaf, null)).rejects.toMatchObject({ code: "23502" });
        await expect(insertTask("Invalid", 2147483647)).rejects.toMatchObject({ code: "23503" });
    });

    test("T-13 all four types, negative/zero/positive lag; invalid type, self, duplicate and FK rejected", async () => {
        const source = await insertTask("Source");
        for (const [index, type] of ["FS", "SS", "FF", "SF"].entries()) {
            const target = await insertTask(type);
            const lag = [-2, 0, 3, -1][index];
            expect((await insertDependency(source.id, target.id, type, lag)).rows[0].lag_days).toBe(lag);
            await expect(insertDependency(source.id, target.id, "SF")).rejects.toMatchObject({ code: "23505" });
        }
        const target = await insertTask("Target");
        await expect(insertDependency(source.id, target.id, "XX")).rejects.toMatchObject({ code: "23514" });
        await expect(insertDependency(source.id, source.id)).rejects.toMatchObject({ code: "23514" });
        await expect(insertDependency(2147483647, target.id)).rejects.toMatchObject({ code: "23503" });
        await expect(insertDependency(source.id, 2147483647)).rejects.toMatchObject({ code: "23503" });
        await expect(insertDependency(source.id, target.id, "FS", 0.5)).rejects.toMatchObject({ code: "22P02" });
    });

    test("rollback refuses populated tables, then down 010/down 009/up succeeds without changing T-08", async () => {
        const first = await insertTask("First");
        const second = await insertTask("Second");
        await insertDependency(first.id, second.id);
        await expect(migrate("down")).rejects.toThrow(/dependencies contain data/);
        await pool.query("DELETE FROM dependencies");
        expect((await migrate("down"))[0]).toContain("010_create_dependencies.sql");
        await expect(migrate("down")).rejects.toThrow(/tasks contain data/);
        await pool.query("DELETE FROM tasks");
        expect((await migrate("down"))[0]).toContain("009_create_tasks.sql");
        expect((await pool.query("SELECT to_regclass('tasks') AS tasks, to_regclass('dependencies') AS dependencies")).rows[0])
            .toEqual({ tasks: null, dependencies: null });
        expect((await pool.query("SELECT count(*)::int AS count FROM work_items")).rows[0].count).toBe(3);
        expect(await migrate("up")).toEqual([
            "Applied: 009_create_tasks.sql", "Applied: 010_create_dependencies.sql"
        ]);
    });

    test("T-12 API creates, lists, edits, blocks parent and cross-project items", async () => {
        const created = await request(app).post(`/projects/${project}/tasks`)
            .send({ work_item_id: items.leaf, name: "  Concrete  ", duration_days: 1 }).expect(201);
        const id = created.body.task.id;
        expect(created.body.task.name).toBe("Concrete");
        const updated = await request(app).patch(`/projects/${project}/tasks/${id}`)
            .send({ name: "Concrete updated", duration_days: 4 }).expect(200);
        expect(updated.body.task.duration_days).toBe(4);
        expect(updated.body.task.work_item_id).toBe(items.leaf);
        const list = await request(app).get(`/projects/${project}/tasks`).expect(200);
        expect(list.body.tasks).toHaveLength(1);
        await request(app).post(`/projects/${project}/tasks`)
            .send({ work_item_id: items.parent, name: "Invalid", duration_days: 1 }).expect(400);
        await request(app).patch(`/projects/${project}/tasks/${id}`)
            .send({ work_item_id: items.parent }).expect(400);
        await request(app).post(`/projects/${project}/tasks`)
            .send({ work_item_id: items.other, name: "Invalid", duration_days: 1 }).expect(404);
        await request(app).patch(`/projects/${otherProject}/tasks/${id}`)
            .send({ duration_days: 3 }).expect(404);
        await request(app).delete(`/projects/${project}/items/${items.leaf}`).expect(409);
        await request(app).post(`/projects/${project}/items`)
            .send({ title: "Cannot become parent", parentId: items.leaf }).expect(409);
        await request(app).patch(`/projects/${project}/items/${items.parent}`)
            .send({ title: "Reparenting", parentId: items.leaf }).expect(422);
    });

    test.each([0, -1, 1.5, null, "2", 2147483648])("T-12 API rejects duration %p on create and update", async (duration_days) => {
        const task = await insertTask();
        await request(app).post(`/projects/${project}/tasks`)
            .send({ work_item_id: items.leaf, name: "Invalid", duration_days }).expect(400);
        await request(app).patch(`/projects/${project}/tasks/${task.id}`).send({ duration_days }).expect(400);
        expect((await model.findById(project, task.id)).duration_days).toBe(1);
    });

    test("T-14 API supports all types, duplicate/self/type/lag errors and project isolation", async () => {
        const source = await insertTask("Source");
        for (const type of ["FS", "SS", "FF", "SF"]) {
            const target = await insertTask(type);
            const endpoint = `/projects/${project}/tasks/${target.id}/dependencies`;
            const values = { predecessor_task_id: source.id, dependency_type: type, lag_days: -2 };
            const created = await request(app).post(endpoint).send(values).expect(201);
            expect(created.body.dependency.lag_days).toBe(-2);
            const duplicate = await request(app).post(endpoint).send({ ...values, dependency_type: "SF" }).expect(409);
            expect(duplicate.body.message).toMatch(/đã có/);
        }
        const endpoint = `/projects/${project}/tasks/${source.id}/dependencies`;
        const target = await insertTask("Other", items.other);
        await request(app).post(endpoint).send({ predecessor_task_id: source.id, dependency_type: "FS" }).expect(400);
        await request(app).post(endpoint).send({ predecessor_task_id: target.id, dependency_type: "XX" }).expect(400);
        await request(app).post(endpoint).send({ predecessor_task_id: target.id, dependency_type: "FS", lag_days: 0.5 }).expect(400);
        await request(app).post(endpoint).send({ predecessor_task_id: target.id, dependency_type: "FS" }).expect(404);
        await request(app).post(`/projects/${project}/tasks/${target.id}/dependencies`)
            .send({ predecessor_task_id: source.id, dependency_type: "FS" }).expect(404);
        const list = await request(app).get(`/projects/${project}/dependencies`).expect(200);
        expect(list.body.dependencies).toHaveLength(4);
        const dependency = list.body.dependencies[0];
        await request(app).delete(`/projects/${otherProject}/tasks/${dependency.successor_task_id}/dependencies/${dependency.id}`).expect(404);
        await request(app).delete(`/projects/${project}/tasks/${dependency.successor_task_id}/dependencies/${dependency.id}`).expect(204);
    });

    test("task and dependency endpoints require authentication and project membership", async () => {
        for (const path of ["tasks", "dependencies"]) {
            await request(app).get(`/projects/${project}/${path}`).set("x-test-auth", "none").expect(401);
            member = null;
            await request(app).get(`/projects/${project}/${path}`).expect(403);
            member = { role: "viewer" };
            await request(app).get(`/projects/${project}/${path}`).expect(403);
        }
    });

    test("T-15 executes exactly two real SELECTs and excludes another project", async () => {
        const first = await insertTask("First");
        const second = await insertTask("Second");
        await insertTask("Foreign", items.other);
        await insertDependency(first.id, second.id);
        const query = jest.fn((...args) => pool.query(...args));
        const graph = await loadProjectGraph({ query }, project);
        expect(query).toHaveBeenCalledTimes(2);
        expect([...graph.tasks.keys()]).toEqual([first.id, second.id]);
        expect(graph.adjacency.get(first.id)).toEqual([second.id]);
        expect(graph.reverseAdjacency.get(second.id)).toEqual([first.id]);
        expect(graph.indegree.get(second.id)).toBe(1);
    });

    test("concurrent task creation and adding a child cannot leave tasks on a parent", async () => {
        const leaf = (await pool.query("INSERT INTO work_items (project_id, title) VALUES ($1, 'Race') RETURNING id", [project])).rows[0].id;
        const results = await Promise.all([
            request(app).post(`/projects/${project}/tasks`).send({ work_item_id: leaf, name: "Race task", duration_days: 1 }),
            request(app).post(`/projects/${project}/items`).send({ parentId: leaf, title: "Race child" })
        ]);
        expect(results.filter((response) => response.status === 201)).toHaveLength(1);
        expect(results.filter((response) => [400, 409].includes(response.status))).toHaveLength(1);
    });
});
