const express = require("express");
const { requireAuth } = require("../middleware/auth");
const { createProjectMemberModel } = require("../models/projectMemberModel");
const { createTaskModel } = require("../models/taskModel");
const { createTaskController } = require("../controllers/taskController");

function createTaskRoutes({ authorization = { requireAuth }, memberModel, model } = {}) {
    if (!memberModel || !model) {
        const pool = require("../config/database");
        memberModel ||= createProjectMemberModel(pool);
        model ||= createTaskModel(pool);
    }

    const router = express.Router();
    const controller = createTaskController({ model, memberModel });

    router.use(authorization.requireAuth);

    router.get("/", controller.list);
    router.post("/", controller.create);
    router.get("/:id", controller.getById);
    router.patch("/:id", controller.update);
    router.delete("/:id", controller.remove);

    return router;
}

module.exports = { createTaskRoutes };
