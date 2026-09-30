const request = require("supertest");
const express = require("express");
const { createTaskRoutes } = require("../src/routes/taskRoutes");

function createApp({
    user = { id: 1, role: "engineer" },
    member = { role: "engineer" },
    modelOverrides = {}
} = {}) {
    const defaultModel = {
        findWbsNode: jest.fn(async (id) => {
            if (id === 10) return { id: 10, project_id: 1, parent_id: null, title: "Foundation Leaf" };
            if (id === 20) return { id: 20, project_id: 1, parent_id: null, title: "Structure Parent" };
            if (id === 30) return { id: 30, project_id: 2, parent_id: null, title: "Other Project Leaf" };
            return null;
        }),
        isLeafNode: jest.fn(async (id) => {
            if (id === 10) return true;
            if (id === 20) return false;
            if (id === 30) return true;
            return false;
        }),
        create: jest.fn(async (values) => ({
            id: 101,
            wbs_node_id: values.wbsNodeId,
            name: values.name,
            description: values.description,
            duration: values.duration,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        })),
        findById: jest.fn(async (id) => {
            if (id === 101) {
                return {
                    id: 101,
                    wbs_node_id: 10,
                    project_id: 1,
                    name: "Thi công móng",
                    description: "Đổ bê tông",
                    duration: 5,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                };
            }
            return null;
        }),
        list: jest.fn(async () => [
            {
                id: 101,
                wbs_node_id: 10,
                project_id: 1,
                name: "Thi công móng",
                duration: 5
            }
        ]),
        update: jest.fn(async (values) => ({
            id: values.id,
            wbs_node_id: values.wbsNodeId ?? 10,
            name: values.name ?? "Thi công móng",
            description: values.description,
            duration: values.duration ?? 5,
            updated_at: new Date().toISOString()
        })),
        remove: jest.fn(async (id) => id === 101)
    };

    const model = { ...defaultModel, ...modelOverrides };

    const memberModel = {
        findByProjectAndUser: jest.fn(async ({ projectId }) => {
            if (member === null) return null;
            if (projectId === 2 && member.role !== "admin") return null;
            return member;
        })
    };

    const authorization = {
        requireAuth: (req, res, next) => {
            if (!user) {
                return res.status(401).json({ message: "Vui lòng đăng nhập" });
            }
            req.user = user;
            next();
        }
    };

    const app = express();
    app.use(express.json());
    app.use("/tasks", createTaskRoutes({
        authorization,
        memberModel,
        model
    }));

    return { app, model, memberModel };
}

describe("Task CRUD and leaf WBS API", () => {
    describe("CREATE /tasks", () => {
        test("creates task attached to a WBS leaf node with valid integer duration", async () => {
            const { app, model } = createApp();
            const res = await request(app)
                .post("/tasks")
                .send({
                    name: "Thi công móng",
                    description: "Thi công phần móng công trình",
                    duration: 5,
                    wbs_node_id: 10
                })
                .expect(201);

            expect(res.body.task).toBeDefined();
            expect(res.body.task.id).toBe(101);
            expect(res.body.task.duration).toBe(5);
            expect(model.findWbsNode).toHaveBeenCalledWith(10);
            expect(model.isLeafNode).toHaveBeenCalledWith(10);
            expect(model.create).toHaveBeenCalledWith({
                wbsNodeId: 10,
                name: "Thi công móng",
                description: "Thi công phần móng công trình",
                duration: 5
            });
        });

        test("rejects when duration is 0", async () => {
            const { app } = createApp();
            const res = await request(app)
                .post("/tasks")
                .send({ name: "Task 1", duration: 0, wbs_node_id: 10 })
                .expect(400);
            expect(res.body.message).toMatch(/Thời lượng/);
        });

        test("rejects when duration is negative", async () => {
            const { app } = createApp();
            const res = await request(app)
                .post("/tasks")
                .send({ name: "Task 1", duration: -2, wbs_node_id: 10 })
                .expect(400);
            expect(res.body.message).toMatch(/Thời lượng/);
        });

        test("rejects when duration is a decimal (1.5)", async () => {
            const { app } = createApp();
            const res = await request(app)
                .post("/tasks")
                .send({ name: "Task 1", duration: 1.5, wbs_node_id: 10 })
                .expect(400);
            expect(res.body.message).toMatch(/Thời lượng/);
        });

        test("rejects when duration is numeric string ('5')", async () => {
            const { app } = createApp();
            const res = await request(app)
                .post("/tasks")
                .send({ name: "Task 1", duration: "5", wbs_node_id: 10 })
                .expect(400);
            expect(res.body.message).toMatch(/Thời lượng/);
        });

        test("rejects when duration is null or missing", async () => {
            const { app } = createApp();
            await request(app)
                .post("/tasks")
                .send({ name: "Task 1", duration: null, wbs_node_id: 10 })
                .expect(400);

            await request(app)
                .post("/tasks")
                .send({ name: "Task 1", wbs_node_id: 10 })
                .expect(400);
        });

        test("rejects when name is missing or empty", async () => {
            const { app } = createApp();
            await request(app)
                .post("/tasks")
                .send({ name: "", duration: 3, wbs_node_id: 10 })
                .expect(400);

            await request(app)
                .post("/tasks")
                .send({ name: "   ", duration: 3, wbs_node_id: 10 })
                .expect(400);
        });

        test("rejects when wbs_node_id is missing or invalid", async () => {
            const { app } = createApp();
            await request(app)
                .post("/tasks")
                .send({ name: "Task 1", duration: 3 })
                .expect(400);

            await request(app)
                .post("/tasks")
                .send({ name: "Task 1", duration: 3, wbs_node_id: "abc" })
                .expect(400);
        });

        test("rejects when WBS node does not exist (e.g. node 999)", async () => {
            const { app } = createApp();
            const res = await request(app)
                .post("/tasks")
                .send({ name: "Task 1", duration: 3, wbs_node_id: 999 })
                .expect(404);
            expect(res.body.message).toMatch(/không tồn tại/i);
        });

        test("rejects when WBS node is a parent (has children)", async () => {
            const { app } = createApp();
            const res = await request(app)
                .post("/tasks")
                .send({ name: "Task 1", duration: 3, wbs_node_id: 20 })
                .expect(400);
            expect(res.body.message).toMatch(/lá/i);
        });

        test("rejects when user is not authenticated", async () => {
            const { app } = createApp({ user: null });
            await request(app)
                .post("/tasks")
                .send({ name: "Task 1", duration: 3, wbs_node_id: 10 })
                .expect(401);
        });

        test("rejects when user is authenticated but not member of project", async () => {
            const { app } = createApp({ member: null });
            await request(app)
                .post("/tasks")
                .send({ name: "Task 1", duration: 3, wbs_node_id: 10 })
                .expect(403);
        });

        test("rejects when user has viewer role in project (cannot write)", async () => {
            const { app } = createApp({ member: { role: "viewer" } });
            await request(app)
                .post("/tasks")
                .send({ name: "Task 1", duration: 3, wbs_node_id: 10 })
                .expect(403);
        });
    });

    describe("READ /tasks", () => {
        test("lists tasks", async () => {
            const { app, model } = createApp();
            const res = await request(app).get("/tasks?wbs_node_id=10").expect(200);
            expect(res.body.tasks).toHaveLength(1);
            expect(model.list).toHaveBeenCalledWith({ wbsNodeId: 10, projectId: undefined });
        });

        test("gets task by id", async () => {
            const { app } = createApp();
            const res = await request(app).get("/tasks/101").expect(200);
            expect(res.body.task.id).toBe(101);
            expect(res.body.task.name).toBe("Thi công móng");
        });

        test("returns 404 for non-existent task", async () => {
            const { app } = createApp();
            await request(app).get("/tasks/999").expect(404);
        });
    });

    describe("UPDATE /tasks/:id", () => {
        test("updates name, description, duration", async () => {
            const { app, model } = createApp();
            const res = await request(app)
                .patch("/tasks/101")
                .send({
                    name: "Thi công móng cập nhật",
                    description: "Bổ sung cốt thép",
                    duration: 8
                })
                .expect(200);
            expect(res.body.task.name).toBe("Thi công móng cập nhật");
            expect(model.update).toHaveBeenCalled();
        });

        test("updates WBS node to another valid leaf", async () => {
            const { app, model } = createApp({
                user: { id: 1, role: "admin" } // admin can access all projects
            });
            await request(app)
                .patch("/tasks/101")
                .send({ wbs_node_id: 30 })
                .expect(200);
            expect(model.isLeafNode).toHaveBeenCalledWith(30);
        });

        test("rejects updating WBS node to a parent node", async () => {
            const { app } = createApp();
            const res = await request(app)
                .patch("/tasks/101")
                .send({ wbs_node_id: 20 })
                .expect(400);
            expect(res.body.message).toMatch(/lá/i);
        });

        test("rejects updating WBS node to a nonexistent node", async () => {
            const { app } = createApp();
            await request(app)
                .patch("/tasks/101")
                .send({ wbs_node_id: 999 })
                .expect(404);
        });

        test("rejects updating duration with invalid values (0, decimal)", async () => {
            const { app } = createApp();
            await request(app)
                .patch("/tasks/101")
                .send({ duration: 0 })
                .expect(400);

            await request(app)
                .patch("/tasks/101")
                .send({ duration: 2.5 })
                .expect(400);
        });

        test("rejects unauthorized update", async () => {
            const { app } = createApp({ member: { role: "viewer" } });
            await request(app)
                .patch("/tasks/101")
                .send({ duration: 10 })
                .expect(403);
        });
    });

    describe("DELETE /tasks/:id", () => {
        test("deletes an existing task without deleting WBS", async () => {
            const { app, model } = createApp();
            await request(app).delete("/tasks/101").expect(204);
            expect(model.remove).toHaveBeenCalledWith(101);
        });

        test("returns 404 when deleting nonexistent task", async () => {
            const { app } = createApp();
            await request(app).delete("/tasks/999").expect(404);
        });

        test("rejects unauthorized delete", async () => {
            const { app } = createApp({ member: { role: "viewer" } });
            await request(app).delete("/tasks/101").expect(403);
        });
    });
});
