const express = require("express");
const { requireAuth } = require("../middleware/auth");
const { createProjectAccess } = require("../middleware/projectAccess");
const { createProjectMemberModel } = require("../models/projectMemberModel");
const { createTaskModel } = require("../models/taskModel");
const { createTaskService } = require("../services/taskService");
const { createTaskController } = require("../controllers/taskController");

function createTaskRoutes({ authorization = { requireAuth }, memberModel, model } = {}) {
    if (!memberModel || !model) {
        const pool = require("../config/database");
        memberModel ||= createProjectMemberModel(pool);
        model ||= createTaskModel(pool);
    }
    const router = express.Router();
    const access = createProjectAccess({ memberModel });
    const controller = createTaskController({ service: createTaskService({ model }) });
    const membership = access.requireProjectMember("admin", "manager", "engineer", "member", "project_manager");
    router.use(authorization.requireAuth);
    router.use(["/:projectId/tasks", "/:projectId/dependencies"], membership);
    router.get("/:projectId/tasks", controller.list);
    router.post("/:projectId/tasks", controller.create);
    router.patch("/:projectId/tasks/:taskId", controller.update);
    router.get("/:projectId/dependencies", controller.listDependencies);
    router.post("/:projectId/tasks/:taskId/dependencies", controller.addDependency);
    router.delete("/:projectId/tasks/:taskId/dependencies/:dependencyId", controller.removeDependency);
    return router;
}

module.exports = { createTaskRoutes };
