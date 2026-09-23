const INVALID_CREDENTIALS = "Thông tin đăng nhập không chính xác";

function createAuthController({ authService, cookieName, cookieOptions }) {
    return {
        async login(req, res) {
            const { email, password } = req.body || {};
            const user = await authService.login(email, password);
            if (!user) return res.status(401).json({ message: INVALID_CREDENTIALS });

            await new Promise((resolve, reject) => {
                req.session.regenerate(error => error ? reject(error) : resolve());
            });
            req.session.userId = user.id;
            try {
                await new Promise((resolve, reject) => {
                    req.session.save(error => error ? reject(error) : resolve());
                });
            } catch (error) {
                const failedSession = req.session;
                // Prevent express-session from retrying an authenticated save on a 500 response.
                delete req.session;
                res.clearCookie(cookieName, cookieOptions);
                try {
                    await new Promise((resolve, reject) => {
                        failedSession.destroy(cleanupError => cleanupError ? reject(cleanupError) : resolve());
                    });
                } catch (cleanupError) {
                    throw new AggregateError([error, cleanupError], "Session save and cleanup failed.", {
                        cause: cleanupError
                    });
                }
                throw error;
            }
            return res.json({ message: "Đăng nhập thành công", user });
        },

        async logout(req, res) {
            await new Promise((resolve, reject) => {
                req.session.destroy(error => error ? reject(error) : resolve());
            });
            res.clearCookie(cookieName, cookieOptions);
            return res.json({ message: "Đăng xuất thành công" });
        }
    };
}

module.exports = { createAuthController };
