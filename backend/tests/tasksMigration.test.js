const fs = require("fs");
const path = require("path");

const migrationDirectory = path.join(__dirname, "../src/migrations");
const upMigration = fs.readFileSync(
    path.join(migrationDirectory, "009_create_tasks.sql"),
    "utf8"
);
const downMigration = fs.readFileSync(
    path.join(migrationDirectory, "009_create_tasks.down.sql"),
    "utf8"
);

describe("T-09 tasks migration", () => {
    test("creates tasks table referencing work_items with integer duration", () => {
        expect(upMigration).toContain("CREATE TABLE tasks");
        expect(upMigration).toMatch(/wbs_node_id INTEGER NOT NULL/);
        expect(upMigration).toMatch(
            /REFERENCES work_items\(id\) ON DELETE CASCADE/
        );
        expect(upMigration).toMatch(/duration INTEGER NOT NULL/);
        expect(upMigration).toMatch(/CHECK \(duration > 0\)/);
        expect(upMigration).toMatch(
            /CREATE INDEX tasks_wbs_node_id_idx ON tasks \(wbs_node_id\)/
        );
    });

    test("rollback protects task data and drops indexes and table", () => {
        expect(downMigration).toMatch(/IF EXISTS \(SELECT 1 FROM tasks\)/);
        expect(downMigration).toContain("DROP INDEX tasks_wbs_node_id_idx");
        expect(downMigration).toContain("DROP TABLE tasks");
    });
});
