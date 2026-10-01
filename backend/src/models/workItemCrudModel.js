function createWorkItemCrudModel(pool) {
    async function withParent(projectId, parentId, operation) {
        if (parentId == null) return operation(pool);
        const client = await pool.connect();
        try {
            await client.query("BEGIN");
            const parent = await client.query(
                "SELECT id FROM work_items WHERE project_id = $1 AND id = $2 FOR UPDATE",
                [projectId, parentId]
            );
            if (!parent.rowCount) {
                throw Object.assign(new Error("Không tìm thấy hạng mục cha trong dự án"), { status: 400, expose: true });
            }
            const tasks = await client.query("SELECT 1 FROM tasks WHERE work_item_id = $1 LIMIT 1", [parentId]);
            if (tasks.rowCount) {
                throw Object.assign(new Error("Hạng mục đã có công việc, không thể thêm hạng mục con"), { status: 409, expose: true });
            }
            const result = await operation(client);
            await client.query("COMMIT");
            return result;
        } catch (error) {
            await client.query("ROLLBACK");
            throw error;
        } finally {
            client.release();
        }
    }

    return {
        async findTree(projectId) {
            const { rows } = await pool.query(`
                WITH RECURSIVE item_tree AS (
                    SELECT
                        id, project_id, parent_id, title, description, status,
                        created_at, updated_at, 0 AS depth, ARRAY[id] AS path
                    FROM work_items
                    WHERE project_id = $1 AND parent_id IS NULL

                    UNION ALL

                    SELECT
                        child.id, child.project_id, child.parent_id, child.title,
                        child.description, child.status, child.created_at,
                        child.updated_at, item_tree.depth + 1,
                        item_tree.path || child.id
                    FROM work_items AS child
                    JOIN item_tree
                      ON child.parent_id = item_tree.id
                     AND child.project_id = item_tree.project_id
                    WHERE NOT child.id = ANY(item_tree.path)
                )
                SELECT * FROM item_tree ORDER BY path
            `, [projectId]);
            return rows;
        },

        async create({ projectId, parentId, title, description, status }) {
            const { rows } = await withParent(projectId, parentId, (client) => client.query(`
                INSERT INTO work_items (project_id, parent_id, title, description, status)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING *
            `, [projectId, parentId || null, title, description || null, status || "todo"]));
            return rows[0];
        },

        async update({ projectId, itemId, parentId, title, description, status }) {
            const { rows } = await withParent(projectId, parentId, (client) => client.query(`
                UPDATE work_items
                SET parent_id = $3,
                    title = $4,
                    description = $5,
                    status = $6,
                    updated_at = CURRENT_TIMESTAMP
                WHERE project_id = $1 AND id = $2
                RETURNING *
            `, [projectId, itemId, parentId || null, title, description || null, status || "todo"]));
            return rows[0] || null;
        },

        async findParentCycle({ projectId, itemId, parentId }) {
            const { rows } = await pool.query(`
                WITH RECURSIVE descendants AS (
                    SELECT id, parent_id
                    FROM work_items
                    WHERE project_id = $1 AND id = $2

                    UNION ALL

                    SELECT child.id, child.parent_id
                    FROM work_items AS child
                    JOIN descendants ON child.parent_id = descendants.id
                    WHERE child.project_id = $1
                )
                SELECT
                    source.title AS source_title,
                    proposed_parent.title AS parent_title
                FROM work_items AS source
                JOIN work_items AS proposed_parent ON proposed_parent.id = $3
                WHERE source.project_id = $1
                  AND source.id = $2
                  AND EXISTS (
                      SELECT 1 FROM descendants WHERE descendants.id = $3
                  )
            `, [projectId, itemId, parentId]);
            return rows[0] || null;
        },

        async findSubtreeSummary({ projectId, itemId }) {
            const { rows } = await pool.query(`
                WITH RECURSIVE item_tree AS (
                    SELECT id, parent_id, title
                    FROM work_items
                    WHERE project_id = $1 AND id = $2

                    UNION ALL

                    SELECT child.id, child.parent_id, child.title
                    FROM work_items AS child
                    JOIN item_tree ON child.parent_id = item_tree.id
                    WHERE child.project_id = $1
                )
                SELECT
                    MAX(title) FILTER (WHERE id = $2) AS item_title,
                    COUNT(*)::INTEGER AS subtree_count,
                    COUNT(*) FILTER (WHERE id <> $2)::INTEGER AS descendant_count
                FROM item_tree
            `, [projectId, itemId]);
            return rows[0] || null;
        },

        async remove({ projectId, itemId }) {
            const { rowCount } = await pool.query(
                "DELETE FROM work_items WHERE project_id = $1 AND id = $2",
                [projectId, itemId]
            );
            return rowCount > 0;
        }
    };
}

module.exports = { createWorkItemCrudModel };
