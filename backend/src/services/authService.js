const { verifyPassword: verifyArgon2id } = require("../config/password");

function createAuthService({ userModel, verifyPassword = verifyArgon2id }) {
    return {
        async login(email, password) {
            if (typeof email !== "string" || !email.trim() || email.trim().length > 255
                || typeof password !== "string" || !password || Buffer.byteLength(password) > 1024) {
                return null;
            }

            return userModel.withLockedUser(email.trim(), async (user, changes) => {
                // Unknown and locked accounts still perform a password verification.
                const hash = user && !user.is_locked ? user.password_hash : null;
                const matches = await verifyPassword(hash, password);
                if (!user || user.is_locked) return null;

                if (!matches) {
                    const previousAttempts = user.lock_expired ? 0 : (user.failed_login_attempts || 0);
                    await changes.recordFailure(Math.min(previousAttempts + 1, 5));
                    return null;
                }

                await changes.resetFailures();
                return { id: user.id, email: user.email, role_id: user.role_id };
            });
        }
    };
}

module.exports = { createAuthService };
