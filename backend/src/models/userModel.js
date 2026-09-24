function createUserModel(pool) {
    async function query(operation, sql, values) {
        try {
            return await pool.query(sql, values);
        } catch (error) {
            error.operation = `userModel.${operation}`;
            throw error;
        }
    }

    return {
        async findByEmail(email) {
            const { rows } = await query(
                "findByEmail",
                "SELECT id, email FROM users WHERE lower(email) = $1",
                [email]
            );
            return rows[0] || null;
        },

        async findRoleByName(name) {
            const { rows } = await query(
                "findRoleByName",
                "SELECT id, name FROM roles WHERE name = $1",
                [name]
            );
            return rows[0] || null;
        },

        async createUser({ fullname, email, passwordHash, roleId }) {
            const { rows } = await query("createUser", `
                INSERT INTO users (fullname, email, password_hash, role_id)
                VALUES ($1, $2, $3, $4)
                RETURNING id, fullname, email, role_id, created_at
            `, [fullname, email, passwordHash, roleId]);
            return rows[0];
        },

        async findByIdWithRole(id) {
            const { rows } = await query("findByIdWithRole", `
                SELECT
                    users.id,
                    users.fullname,
                    users.email,
                    users.role_id,
                    roles.name AS role
                FROM users
                LEFT JOIN roles ON roles.id = users.role_id
                WHERE users.id = $1
            `, [id]);
            return rows[0] || null;
        },

        async withLockedUser(email, operation) {
            const client = await pool.connect();

            try {
                await client.query("BEGIN");

                const { rows } = await client.query(`
                    SELECT
                        users.id,
                        users.fullname,
                        users.email,
                        users.password_hash,
                        users.role_id,
                        roles.name AS role,
                        users.failed_login_attempts,
                        users.locked_until,
                        users.locked_until > clock_timestamp()::timestamp AS is_locked,
                        users.locked_until IS NOT NULL
                            AND users.locked_until <= clock_timestamp()::timestamp AS lock_expired
                    FROM users
                    LEFT JOIN roles ON roles.id = users.role_id
                    WHERE lower(users.email) = $1
                    FOR UPDATE OF users
                `, [email]);

                const user = rows[0] || null;
                const changes = {
                    async recordFailure(attempts) {
                        await client.query(`
                            UPDATE users
                            SET failed_login_attempts = $2,
                                locked_until = CASE
                                    WHEN $2 >= 5
                                    THEN clock_timestamp() + INTERVAL '15 minutes'
                                    ELSE NULL
                                END,
                                updated_at = CURRENT_TIMESTAMP
                            WHERE id = $1
                        `, [user.id, attempts]);
                    },

                    async resetFailures() {
                        await client.query(`
                            UPDATE users
                            SET failed_login_attempts = 0,
                                locked_until = NULL,
                                updated_at = CURRENT_TIMESTAMP
                            WHERE id = $1
                        `, [user.id]);
                    }
                };

                const result = await operation(user, changes);
                await client.query("COMMIT");
                return result;
            } catch (error) {
                error.operation ||= "userModel.withLockedUser";

                try {
                    await client.query("ROLLBACK");
                } catch (rollbackError) {
                    throw new AggregateError(
                        [error, rollbackError],
                        "Login transaction rollback failed.",
                        { cause: rollbackError }
                    );
                }

                throw error;
            } finally {
                client.release();
            }
        }
    };
}

module.exports = { createUserModel };
