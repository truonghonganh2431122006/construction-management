const { workingDate } = require("../src/services/workingCalendar");
const { peakAssignments } = require("../src/services/projectOperationsService");

test("working date handles Sunday start, holidays, duplicate exclusions and leap day", () => {
    const days = [1,2,3,4,5,6];
    expect(workingDate("2026-10-04", 0, days)).toBe("2026-10-05");
    expect(workingDate("2026-10-03", 2, days, ["2026-10-04", "2026-10-05", "2026-10-05"])).toBe("2026-10-07");
    expect(workingDate("2028-02-28", 2, days)).toBe("2028-03-01");
    expect(workingDate("2026-10-05", 4, [1])).toBe("2026-11-02");
    expect(workingDate(null, 0, days)).toBeNull();
    expect(workingDate("2026-10-05", 2147483649, days)).toBeNull();
});
test("calendar arithmetic agrees with day-by-day reference over varied weeks and holidays", () => {
    for (const days of [[1], [0,6], [1,2,3,4,5], [0,1,2,3,4,5,6]]) {
        const holidays = ["2026-10-03", "2026-10-05", "2026-10-18", "2026-12-25"];
        let index = -1;
        const cursor = new Date("2026-10-03T00:00:00Z");
        while (index < 100) {
            const day = cursor.toISOString().slice(0,10);
            if (days.includes(cursor.getUTCDay()) && !holidays.includes(day)) {
                index++;
                expect(workingDate("2026-10-03", index, days, holidays)).toBe(day);
            }
            cursor.setUTCDate(cursor.getUTCDate() + 1);
        }
    }
});
test("overload counts actual simultaneous intervals, not all tasks touching the assigned task", () => {
    const task = { team_id: 1, es: 0, ef: 10 };
    const sequential = [0,2,4,6,8].map((es) => ({ team_id: 1, es, ef: es + 2 }));
    expect(peakAssignments([task, ...sequential], task)).toBe(2);
    expect(peakAssignments([task, ...Array.from({ length: 3 }, () => ({ team_id: 1, es: 3, ef: 6 }))], task)).toBe(4);
});
