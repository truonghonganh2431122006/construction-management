const { createTaskModel } = require("./taskModel");
const { withProjectTransaction } = require("./projectTransaction");

function createScheduleModel(pool) {
    return {
        tasks: createTaskModel(pool),

        withProjectTransaction(projectId, operation) {
            return withProjectTransaction(pool, projectId, (client, project) =>
                operation(createScheduleModel(client), project));
        },

        async replaceResults(projectId, results) {
            await pool.query(`
                DELETE FROM schedule_results r USING tasks t, work_items w
                WHERE r.task_id = t.id AND t.work_item_id = w.id AND w.project_id = $1
            `, [projectId]);
            // One bulk write, including all tasks; never a query per task.
            await pool.query(`
                INSERT INTO schedule_results
                    (task_id, early_start, early_finish, late_start, late_finish, total_float, is_critical, initially_critical, planned_early_finish)
                SELECT id, es, ef, ls, lf, slack, "isCritical", coalesce("initiallyCritical", "isCritical"), coalesce("plannedEf", ef)
                FROM jsonb_to_recordset($1::jsonb) AS result(
                    id INTEGER, es BIGINT, ef BIGINT, ls BIGINT, lf BIGINT, slack BIGINT, "isCritical" BOOLEAN, "initiallyCritical" BOOLEAN, "plannedEf" BIGINT
                )
            `, [JSON.stringify(results.map(({ id, es, ef, ls, lf, slack, isCritical, initiallyCritical, plannedEf }) => ({
                id, es, ef, ls, lf, slack, isCritical, initiallyCritical: initiallyCritical ?? isCritical, plannedEf: plannedEf ?? ef
            })))]);
            await pool.query("UPDATE projects SET schedule_needs_recalc = FALSE WHERE id = $1", [projectId]);
        },

        async listResults(projectId, criticalOnly = false) {
            const { rows } = await pool.query(`
                SELECT t.id, t.name, t.duration_days, t.work_item_id,
                    t.actual_start::text AS actual_start, t.actual_finish::text AS actual_finish,
                    coalesce(t.progress_percent, 0) AS progress_percent,
                    r.early_start::double precision AS es, r.early_finish::double precision AS ef,
                    r.late_start::double precision AS ls, r.late_finish::double precision AS lf,
                    r.total_float::double precision AS slack, r.is_critical AS "isCritical",
                    coalesce(r.initially_critical, r.is_critical) AS "initiallyCritical",
                    (r.is_critical AND NOT coalesce(r.initially_critical, false)) AS "newlyCritical",
                    coalesce(r.planned_early_finish, r.early_finish)::double precision AS "plannedEf",
                    r.calculated_at
                FROM schedule_results r
                JOIN tasks t ON t.id = r.task_id
                JOIN work_items w ON w.id = t.work_item_id
                WHERE w.project_id = $1 AND (NOT $2::boolean OR r.is_critical)
                ORDER BY r.early_start, t.id
            `, [projectId, criticalOnly]);
            return rows;
        }
    };
}

module.exports = { createScheduleModel };
