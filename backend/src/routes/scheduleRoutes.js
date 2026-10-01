const express = require("express");
const { requireAuth } = require("../middleware/auth");
const { createProjectAccess } = require("../middleware/projectAccess");
const { createProjectMemberModel } = require("../models/projectMemberModel");
const { createScheduleModel } = require("../models/scheduleModel");
const { createScheduleService } = require("../services/scheduleService");
const { createScheduleController } = require("../controllers/scheduleController");

function createScheduleRoutes({ authorization = { requireAuth }, memberModel, model } = {}) {
    if (!memberModel || !model) {
        const pool = require("../config/database");
        memberModel ||= createProjectMemberModel(pool);
        model ||= createScheduleModel(pool);
    }
    const router = express.Router();
    const access = createProjectAccess({ memberModel });
    const controller = createScheduleController({ service: createScheduleService({ model }) });
    router.get("/:projectId/schedule", authorization.requireAuth,
        access.requireProjectMember("admin", "manager", "engineer", "member", "project_manager"), controller.get);
    return router;
}

module.exports = { createScheduleRoutes };
