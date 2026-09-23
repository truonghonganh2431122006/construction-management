function createUserModel(pool) {
    return {
        async withLockedUser(email, operation) {
            const client = await pool.connect();
            try {
                await client.query("BEGIN");
                const { rows } = await client.query(`
                    SELECT id, email, password_hash, role_id, failed_login_attempts,
                           locked_until,
                           locked_until > clock_timestamp()::timestamp AS is_locked,
                           locked_until IS NOT NULL
                               AND locked_until <= clock_timestamp()::timestamp AS lock_expired
                    FROM users
                    WHERE email = $1
                    FOR UPDATE
                `, [email]);
                const user = rows[0] || null;
                const changes = {
                    async recordFailure(attempts) {
                        await client.query(`
                            UPDATE users
                            SET failed_login_attempts = $2,
                                locked_until = CASE WHEN $2 >= 5
                                    THEN clock_timestamp() + INTERVAL '15 minutes'
                                    ELSE NULL END,
                                updated_at = CURRENT_TIMESTAMP
                            WHERE id = $1
                        `, [user.id, attempts]);
                    },
                    async resetFailures() {
                        await client.query(`
                            UPDATE users
                            SET failed_login_attempts = 0, locked_until = NULL,
                                updated_at = CURRENT_TIMESTAMP
                            WHERE id = $1
                        `, [user.id]);
                    }
                };

                const result = await operation(user, changes);
                await client.query("COMMIT");
                return result;
            } catch (error) {
                try {
                    await client.query("ROLLBACK");
                } catch (rollbackError) {
                    throw new AggregateError([error, rollbackError], "Login transaction rollback failed.", {
                        cause: rollbackError
                    });
                }
                throw error;
            } finally {
                client.release();
            }
        }
    };
}

module.exports = { createUserModel };
