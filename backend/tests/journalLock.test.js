const request = require("supertest");
const { createSiteManagementService } = require("../src/services/siteManagementService");
const { createSiteManagementController } = require("../src/controllers/siteManagementController");
const express = require("express");

describe("Journal Locking (TTKN-93 [S-24]) API Tests", () => {
    let app, service, model;

    beforeEach(() => {
        model = {
            transaction: jest.fn(async (projectId, callback) => callback(model)),
            journal: jest.fn(),
            dayLock: jest.fn(),
            setDayLock: jest.fn(),
            lockJournalRecord: jest.fn(),
            audit: jest.fn(),
            journals: jest.fn(),
            item: jest.fn(async () => ({ id: 1, is_leaf: true })),
            photoIds: jest.fn(async () => []),
            updateJournal: jest.fn(),
            deleteJournal: jest.fn()
        };

        service = createSiteManagementService({ model });
        const controller = createSiteManagementController({ service, pdfService: jest.fn() });

        app = express();
        app.use(express.json());
        app.use((req, res, next) => {
            req.user = { id: 10 };
            req.projectMember = { role: "admin" };
            next();
        });

        app.post("/projects/:projectId/journals/lock", controller.lockJournal);
        app.post("/api/v1/projects/:projectId/journals/lock", controller.lockJournal);
        app.post("/projects/:projectId/journals/:recordId/lock", controller.lockJournal);
        app.put("/projects/:projectId/journals/:recordId", controller.saveJournal);
        app.patch("/projects/:projectId/journals/:recordId", controller.saveJournal);
        app.delete("/projects/:projectId/journals/:recordId", controller.deleteJournal);

        // eslint-disable-next-line no-unused-vars
        app.use((err, req, res, next) => {
            res.status(err.status || 500).json({ message: err.message });
        });
    });

    test("Lock journal via POST /projects/:projectId/journals/lock succeeds and returns lock fields", async () => {
        model.dayLock.mockResolvedValue(null);
        model.setDayLock.mockResolvedValue({
            project_id: 1,
            day: "2026-10-10",
            locked: true,
            changed_by: 10,
            updated_at: "2026-10-08T10:00:00.000Z"
        });

        const res = await request(app)
            .post("/projects/1/journals/lock")
            .send({ day: "2026-10-10", is_locked: true })
            .expect(200);

        expect(res.body.lock).toBeDefined();
        expect(res.body.lock.is_locked).toBe(true);
        expect(res.body.lock.locked_at).toBeDefined();
        expect(res.body.lock.locked_by).toBe(10);
    });

    test("Lock journal via POST /api/v1/projects/:projectId/journals/lock succeeds", async () => {
        model.dayLock.mockResolvedValue(null);
        model.setDayLock.mockResolvedValue({
            project_id: 1,
            day: "2026-10-10",
            locked: true,
            changed_by: 10,
            updated_at: "2026-10-08T10:00:00.000Z"
        });

        const res = await request(app)
            .post("/api/v1/projects/1/journals/lock")
            .send({ day: "2026-10-10", is_locked: true })
            .expect(200);

        expect(res.body.lock.is_locked).toBe(true);
    });

    test("Updating locked journal via PUT returns 403 Forbidden with exact message", async () => {
        model.journal.mockResolvedValue({
            id: 5,
            project_id: 1,
            day: "2026-10-10",
            author_id: 10,
            is_locked: true,
            revision: 1
        });
        model.dayLock.mockResolvedValue({ locked: true });

        const res = await request(app)
            .put("/projects/1/journals/5")
            .send({
                work_item_id: 1,
                day: "2026-10-10",
                time: "08:00",
                content: "Attempt update",
                manpower: 5,
                equipment: "",
                weather: "Nắng",
                revision: 1,
                photo_ids: []
            })
            .expect(403);

        expect(res.body.message).toBe("Nhật ký ngày đã bị khóa sổ, không thể chỉnh sửa hoặc xóa.");
    });

    test("Updating locked journal via PATCH returns 403 Forbidden with exact message", async () => {
        model.journal.mockResolvedValue({
            id: 5,
            project_id: 1,
            day: "2026-10-10",
            author_id: 10,
            is_locked: true,
            revision: 1
        });
        model.dayLock.mockResolvedValue({ locked: true });

        const res = await request(app)
            .patch("/projects/1/journals/5")
            .send({
                work_item_id: 1,
                day: "2026-10-10",
                time: "08:00",
                content: "Attempt patch update",
                manpower: 5,
                equipment: "",
                weather: "Nắng",
                revision: 1,
                photo_ids: []
            })
            .expect(403);

        expect(res.body.message).toBe("Nhật ký ngày đã bị khóa sổ, không thể chỉnh sửa hoặc xóa.");
    });

    test("Deleting locked journal via DELETE returns 403 Forbidden with exact message", async () => {
        model.journal.mockResolvedValue({
            id: 5,
            project_id: 1,
            day: "2026-10-10",
            author_id: 10,
            is_locked: true,
            revision: 1
        });
        model.dayLock.mockResolvedValue({ locked: true });

        const res = await request(app)
            .delete("/projects/1/journals/5")
            .send({ revision: 1 })
            .expect(403);

        expect(res.body.message).toBe("Nhật ký ngày đã bị khóa sổ, không thể chỉnh sửa hoặc xóa.");
    });
});
