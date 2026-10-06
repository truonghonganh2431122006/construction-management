const fs = require("node:fs");
const path = require("node:path");

const migration = fs.readFileSync(path.join(__dirname, "../src/migrations/016_add_actual_progress.sql"), "utf8");
const rollback = fs.readFileSync(path.join(__dirname, "../src/migrations/016_add_actual_progress.down.sql"), "utf8");

test("T-34 migration declares actual progress columns and safe constraints", () => {
    expect(migration).toMatch(/actual_start_date\s+DATE/);
    expect(migration).toMatch(/actual_end_date\s+DATE/);
    expect(migration).toMatch(/percent_complete\s+INTEGER\s+NOT NULL\s+DEFAULT 0/);
    expect(migration).toMatch(/percent_complete BETWEEN 0 AND 100/);
    expect(migration).toMatch(/actual_end_date >= actual_start_date/);
    expect(rollback).toMatch(/DROP CONSTRAINT tasks_actual_dates_order_check/);
    expect(rollback).toMatch(/DROP CONSTRAINT tasks_percent_complete_check/);
    expect(rollback).toMatch(/Cannot rollback actual progress/);
    for (const column of ["actual_start_date", "actual_end_date", "percent_complete"]) {
        expect(rollback).toMatch(new RegExp(`DROP COLUMN ${column}`));
    }
});
