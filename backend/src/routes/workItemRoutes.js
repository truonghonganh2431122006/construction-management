const express = require("express");
const { requireAuth } = require("../middleware/auth");
const { createProjectAccess } = require("../middleware/projectAccess");
const { createProjectMemberModel } = require("../models/projectMemberModel");
const { createWorkItemCrudModel } = require("../models/workItemCrudModel");
const { createWorkItemController } = require("../controllers/workItemController");

function createWorkItemRoutes({ authorization = { requireAuth }, memberModel, model } = {}) {
    if (!memberModel || !model) {
        const pool = require("../config/database");
        memberModel ||= createProjectMemberModel(pool);
        model ||= createWorkItemCrudModel(pool);
    }

    const router = express.Router();
    const projectAccess = createProjectAccess({ memberModel });
    const controller = createWorkItemController({ model });
    router.use(authorization.requireAuth);
    router.use("/:projectId/items", projectAccess.requireProjectMember(
        "admin", "manager", "engineer", "member", "project_manager"
    ));
    router.get("/:projectId/items", controller.list);
    router.post("/:projectId/items", controller.create);
    router.patch("/:projectId/items/:itemId", controller.update);
    router.delete("/:projectId/items/:itemId", controller.remove);
    return router;
}

module.exports = { createWorkItemRoutes };
