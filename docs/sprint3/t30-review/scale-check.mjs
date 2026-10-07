import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { createTimeScale, durationToWidth, timeToX } from "../../../frontend/src/features/gantt/timeScale.js";

// Review-only checks: keep production code unchanged and record each unmet expectation.
const results = [];
function check(name, run) {
    try {
        run();
        results.push({ name, status: "PASS" });
    } catch (error) {
        results.push({ name, status: "FAIL", message: error.message });
    }
}

check("three hand-calculated numeric milestones: 0, 7, 14 days => 0, 350, 700 px", () => {
    const scale = createTimeScale({ start: 0, end: 14, width: 700 });
    assert.deepEqual([0, 7, 14].map(scale.timeToX), [0, 350, 700]);
    assert.equal(durationToWidth(3, scale), 150);
    assert.equal(timeToX(7, scale), 350);
});
check("three hand-calculated calendar milestones across year boundary", () => {
    const scale = createTimeScale({ startDate: "2025-12-25", endDate: "2026-01-08", width: 700 });
    assert.deepEqual(["2025-12-25", "2026-01-01", "2026-01-08"].map(scale.timeToX), [0, 350, 700]);
});
check("switching day/week changes ticks and labels while retaining coordinates", () => {
    const day = createTimeScale({ start: 0, end: 14, width: 700, unit: "day" });
    const week = createTimeScale({ start: 0, end: 14, width: 700, unit: "week" });
    assert.equal(day.ticks.length, 15);
    assert.deepEqual(week.ticks.map(({ value, x, label }) => [value, x, label]), [
        [0, 0, "Tuần 1"], [7, 350, "Tuần 2"], [14, 700, "Tuần 3"]
    ]);
    assert.deepEqual([0, 3.5, 7, 14].map(day.timeToX), [0, 3.5, 7, 14].map(week.timeToX));
});
check("nonzero origin, fractions, and positions outside range", () => {
    const scale = createTimeScale({ start: 5, end: 15, width: 200 });
    assert.deepEqual([0, 5, 7.5, 15, 20].map(scale.timeToX), [-100, 0, 50, 200, 300]);
});
check("leap day and DST boundary use calendar days", () => {
    const leap = createTimeScale({ startDate: "2024-02-28", endDate: "2024-03-02", width: 300 });
    assert.deepEqual(leap.ticks.map((tick) => tick.label), ["28/02", "29/02", "01/03", "02/03"]);
    const dst = createTimeScale({ startDate: "2024-03-09", endDate: "2024-03-12", width: 300 });
    assert.deepEqual(["2024-03-09", "2024-03-10", "2024-03-11", "2024-03-12"].map(dst.timeToX), [0, 100, 200, 300]);
});
check("Date at UTC midnight and date-only strings agree", () => {
    const scale = createTimeScale({ startDate: "2024-01-01", endDate: "2024-01-11", width: 100 });
    assert.equal(scale.timeToX(new Date("2024-01-06T00:00:00Z")), scale.timeToX("2024-01-06"));
});
check("invalid numeric ranges, widths, and unsupported units are rejected", () => {
    for (const options of [
        { start: 2, end: 2 }, { start: 2, end: 1 }, { end: Infinity },
        { width: 0 }, { width: -1 }, { width: NaN }, { width: Infinity }, { unit: "month" }
    ]) assert.throws(() => createTimeScale(options), RangeError);
});
check("reversed calendar range and invalid start date are rejected", () => {
    assert.throws(() => createTimeScale({ startDate: "2024-01-02", endDate: "2024-01-01" }), RangeError);
    assert.throws(() => createTimeScale({ startDate: "2024-02-30", endDate: "2024-03-02" }), RangeError);
});
check("nonexistent end date must be rejected instead of falling back to one day", () => {
    assert.throws(() => createTimeScale({ startDate: "2024-02-28", endDate: "2024-02-30", width: 300 }), RangeError);
});
check("malformed end date must be rejected instead of falling back to one day", () => {
    assert.throws(() => createTimeScale({ startDate: "2024-02-28", endDate: "bad-date", width: 300 }), RangeError);
});
check("two invalid calendar boundaries must be rejected", () => {
    assert.throws(() => createTimeScale({ startDate: "bad-start", endDate: "bad-end" }), RangeError);
});
check("Date source mutation must not change a previously created scale", () => {
    const start = new Date("2024-01-01T00:00:00Z");
    const scale = createTimeScale({ startDate: start, endDate: "2024-01-11", width: 100 });
    const before = scale.timeToX("2024-01-06");
    start.setUTCDate(2);
    assert.equal(scale.timeToX("2024-01-06"), before);
});

const detail = {};
const invalidEnd = createTimeScale({ startDate: "2024-02-28", endDate: "2024-02-30", width: 300 });
detail.invalidEnd = { duration: invalidEnd.duration, ticks: invalidEnd.ticks };
const start = new Date("2024-01-01T00:00:00Z");
const mutable = createTimeScale({ startDate: start, endDate: "2024-01-11", width: 100 });
detail.dateMutation = { before: mutable.timeToX("2024-01-06") };
start.setUTCDate(2);
detail.dateMutation.after = mutable.timeToX("2024-01-06");
const report = {
    timezone: process.env.TZ || "system default",
    node: process.version,
    pass: results.filter((result) => result.status === "PASS").length,
    fail: results.filter((result) => result.status === "FAIL").length,
    results,
    detail
};
await writeFile(new URL(`./scale-results-${(process.env.TZ || "default").replaceAll("/", "-")}.json`, import.meta.url), JSON.stringify(report, null, 2) + "\n");
for (const result of results) console.log(`${result.status}: ${result.name}${result.message ? ` (${result.message.split("\n")[0]})` : ""}`);
console.log(`${report.pass} passed; ${report.fail} failed; TZ=${report.timezone}`);
process.exitCode = report.fail ? 1 : 0;
