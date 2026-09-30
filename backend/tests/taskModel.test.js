const { createTaskModel } = require("../src/models/taskModel");

describe("Task model database queries", () => {
    test("isLeafNode returns true if no children exist and false if children exist", async () => {
        const pool = {
            query: jest.fn()
                .mockResolvedValueOnce({ rows: [] })
                .mockResolvedValueOnce({ rows: [{ id: 12 }] })
        };
        const model = createTaskModel(pool);

        await expect(model.isLeafNode(10)).resolves.toBe(true);
        expect(pool.query).toHaveBeenCalledWith(
            "SELECT 1 FROM work_items WHERE parent_id = $1 LIMIT 1",
            [10]
        );

        await expect(model.isLeafNode(20)).resolves.toBe(false);
        expect(pool.query).toHaveBeenCalledWith(
            "SELECT 1 FROM work_items WHERE parent_id = $1 LIMIT 1",
            [20]
        );
    });

    test("create inserts task into tasks table and returns row", async () => {
        const row = {
            id: 1,
            wbs_node_id: 10,
            name: "Lắp đặt cốt thép",
            description: "Cốt thép dầm sàn",
            duration: 3
        };
        const pool = {
            query: jest.fn(async () => ({ rows: [row] }))
        };
        const model = createTaskModel(pool);

        const created = await model.create({
            wbsNodeId: 10,
            name: "Lắp đặt cốt thép",
            description: "Cốt thép dầm sàn",
            duration: 3
        });
        expect(created).toEqual(row);
        const [query, params] = pool.query.mock.calls[0];
        expect(query).toMatch(/INSERT INTO tasks/);
        expect(params).toEqual([10, "Lắp đặt cốt thép", "Cốt thép dầm sàn", 3]);
    });

    test("findById joins work_items for project_id", async () => {
        const row = {
            id: 1,
            wbs_node_id: 10,
            project_id: 4,
            name: "Lắp đặt cốt thép",
            duration: 3
        };
        const pool = {
            query: jest.fn(async () => ({ rows: [row] }))
        };
        const model = createTaskModel(pool);

        const found = await model.findById(1);
        expect(found).toEqual(row);
        const [query, params] = pool.query.mock.calls[0];
        expect(query).toMatch(/JOIN work_items/);
        expect(params).toEqual([1]);
    });

    test("remove deletes from tasks table without affecting work_items", async () => {
        const pool = {
            query: jest.fn(async () => ({ rowCount: 1 }))
        };
        const model = createTaskModel(pool);

        const result = await model.remove(1);
        expect(result).toBe(true);
        const [query, params] = pool.query.mock.calls[0];
        expect(query).toBe("DELETE FROM tasks WHERE id = $1");
        expect(params).toEqual([1]);
    });
});
