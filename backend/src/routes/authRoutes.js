const express = require("express");
const { createAuthController } = require("../controllers/authController");

function createAuthRoutes(options) {
    const router = express.Router();
    const controller = createAuthController(options);
    router.post("/register", controller.register);
    router.post("/login", controller.login);
    router.post("/logout", controller.logout);
    return router;
}

module.exports = { createAuthRoutes };
