function createTaskModel(pool) {
    return {
        async findWbsNode(wbsNodeId) {
            const { rows } = await pool.query(
                "SELECT id, project_id, parent_id, title FROM work_items WHERE id = $1",
                [wbsNodeId]
            );
            return rows[0] || null;
        },

        async isLeafNode(wbsNodeId) {
            const { rows } = await pool.query(
                "SELECT 1 FROM work_items WHERE parent_id = $1 LIMIT 1",
                [wbsNodeId]
            );
            return rows.length === 0;
        },

        async create({ wbsNodeId, name, description, duration }) {
            const { rows } = await pool.query(`
                INSERT INTO tasks (wbs_node_id, name, description, duration)
                VALUES ($1, $2, $3, $4)
                RETURNING id, wbs_node_id, name, description, duration, created_at, updated_at
            `, [wbsNodeId, name, description || null, duration]);
            return rows[0];
        },

        async findById(id) {
            const { rows } = await pool.query(`
                SELECT
                    t.id,
                    t.wbs_node_id,
                    t.name,
                    t.description,
                    t.duration,
                    t.created_at,
                    t.updated_at,
                    w.project_id,
                    w.title AS wbs_node_title
                FROM tasks t
                JOIN work_items w ON w.id = t.wbs_node_id
                WHERE t.id = $1
            `, [id]);
            return rows[0] || null;
        },

        async list({ wbsNodeId, projectId } = {}) {
            let query = `
                SELECT
                    t.id,
                    t.wbs_node_id,
                    t.name,
                    t.description,
                    t.duration,
                    t.created_at,
                    t.updated_at,
                    w.project_id,
                    w.title AS wbs_node_title
                FROM tasks t
                JOIN work_items w ON w.id = t.wbs_node_id
            `;
            const params = [];
            const conditions = [];

            if (wbsNodeId !== undefined && wbsNodeId !== null) {
                params.push(wbsNodeId);
                conditions.push(`t.wbs_node_id = $${params.length}`);
            }

            if (projectId !== undefined && projectId !== null) {
                params.push(projectId);
                conditions.push(`w.project_id = $${params.length}`);
            }

            if (conditions.length > 0) {
                query += ` WHERE ${conditions.join(" AND ")}`;
            }

            query += " ORDER BY t.id ASC";

            const { rows } = await pool.query(query, params);
            return rows;
        },

        async update({ id, wbsNodeId, name, description, duration }) {
            const existing = await this.findById(id);
            if (!existing) return null;

            const nextWbsNodeId = wbsNodeId !== undefined ? wbsNodeId : existing.wbs_node_id;
            const nextName = name !== undefined ? name : existing.name;
            const nextDescription = description !== undefined ? description : existing.description;
            const nextDuration = duration !== undefined ? duration : existing.duration;

            const { rows } = await pool.query(`
                UPDATE tasks
                SET wbs_node_id = $2,
                    name = $3,
                    description = $4,
                    duration = $5,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $1
                RETURNING id, wbs_node_id, name, description, duration, created_at, updated_at
            `, [id, nextWbsNodeId, nextName, nextDescription, nextDuration]);
            return rows[0] || null;
        },

        async remove(id) {
            const { rowCount } = await pool.query(
                "DELETE FROM tasks WHERE id = $1",
                [id]
            );
            return rowCount > 0;
        }
    };
}

module.exports = { createTaskModel };
