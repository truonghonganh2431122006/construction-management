const express = require("express");
const routes = require("./routes");
const { createSession, createSessionStore } = require("./config/session");
const { createUserModel } = require("./models/userModel");
const { createAuthService } = require("./services/authService");
const { createAuthRoutes } = require("./routes/authRoutes");
const errorHandler = require("./middleware/errorHandler");

function createApp({ authService, sessionStore, sessionSecret, secureCookies, trustProxy } = {}) {
    if (!authService || !sessionStore) {
        const pool = require("./config/database");
        authService ||= createAuthService({ userModel: createUserModel(pool) });
        sessionStore ||= createSessionStore(pool);
    }

    const app = express();
    app.set("trust proxy", trustProxy ?? (process.env.TRUST_PROXY === "1" ? 1 : false));
    const session = createSession({ store: sessionStore, secret: sessionSecret, secureCookies });
    app.use(express.json());
    app.use(session.middleware);
    app.use("/", routes);
    app.use("/auth", createAuthRoutes({ authService, ...session }));
    app.use(errorHandler);
    return app;
}

module.exports = createApp();
module.exports.createApp = createApp;
