const WRITE_ROLES = ["admin", "project_manager", "manager", "engineer", "member"];
const READ_ROLES = ["admin", "project_manager", "manager", "engineer", "worker", "accountant", "viewer", "member"];

function createTaskController({ model, memberModel }) {
    async function checkProjectAuthorization(req, res, projectId, allowedRoles) {
        if (!req.user) {
            res.status(401).json({ message: "Vui lòng đăng nhập" });
            return false;
        }

        if (req.user.role === "admin") {
            return true;
        }

        if (memberModel) {
            const member = await memberModel.findByProjectAndUser({
                projectId: Number(projectId),
                userId: req.user.id
            });
            if (!member || !allowedRoles.includes(member.role)) {
                res.status(403).json({ message: "Bạn không có quyền thực hiện thao tác này" });
                return false;
            }
            return true;
        }

        if (allowedRoles.includes(req.user.role)) {
            return true;
        }

        res.status(403).json({ message: "Bạn không có quyền thực hiện thao tác này" });
        return false;
    }

    function validateName(name) {
        if (typeof name !== "string" || !name.trim()) {
            return "Tên công việc là bắt buộc";
        }
        return null;
    }

    function validateDuration(duration) {
        if (duration === undefined || duration === null) {
            return "Thời lượng là bắt buộc";
        }
        if (
            typeof duration !== "number" ||
            !Number.isInteger(duration) ||
            !Number.isFinite(duration) ||
            duration < 1
        ) {
            return "Thời lượng phải là số nguyên lớn hơn hoặc bằng 1";
        }
        return null;
    }

    function validateWbsNodeId(wbsNodeId) {
        if (
            wbsNodeId === undefined ||
            wbsNodeId === null ||
            typeof wbsNodeId === "boolean" ||
            typeof wbsNodeId === "object" ||
            (typeof wbsNodeId === "string" && !/^\d+$/.test(wbsNodeId.trim()))
        ) {
            return "Hạng mục WBS là bắt buộc";
        }
        const parsed = Number(wbsNodeId);
        if (!Number.isInteger(parsed) || parsed <= 0) {
            return "Hạng mục WBS không hợp lệ";
        }
        return null;
    }

    return {
        async list(req, res, next) {
            try {
                const wbsNodeId = req.query.wbs_node_id !== undefined ? Number(req.query.wbs_node_id) : undefined;
                const projectId = req.query.projectId !== undefined ? Number(req.query.projectId) : undefined;

                if (projectId !== undefined) {
                    const authorized = await checkProjectAuthorization(req, res, projectId, READ_ROLES);
                    if (!authorized) return;
                }

                if (wbsNodeId !== undefined) {
                    const node = await model.findWbsNode(wbsNodeId);
                    if (!node) {
                        return res.status(404).json({ message: "Hạng mục WBS không tồn tại" });
                    }
                    const authorized = await checkProjectAuthorization(req, res, node.project_id, READ_ROLES);
                    if (!authorized) return;
                }

                const tasks = await model.list({ wbsNodeId, projectId });
                return res.json({ tasks });
            } catch (error) {
                return next(error);
            }
        },

        async getById(req, res, next) {
            try {
                const taskId = Number(req.params.id);
                if (!Number.isInteger(taskId) || taskId <= 0) {
                    return res.status(400).json({ message: "Mã công việc không hợp lệ" });
                }

                const task = await model.findById(taskId);
                if (!task) {
                    return res.status(404).json({ message: "Không tìm thấy công việc" });
                }

                const authorized = await checkProjectAuthorization(req, res, task.project_id, READ_ROLES);
                if (!authorized) return;

                return res.json({ task });
            } catch (error) {
                return next(error);
            }
        },

        async create(req, res, next) {
            try {
                const { name, description, duration, wbs_node_id } = req.body;

                const nameError = validateName(name);
                if (nameError) {
                    return res.status(400).json({ message: nameError });
                }

                const durationError = validateDuration(duration);
                if (durationError) {
                    return res.status(400).json({ message: durationError });
                }

                const wbsError = validateWbsNodeId(wbs_node_id);
                if (wbsError) {
                    return res.status(400).json({ message: wbsError });
                }

                const nodeId = Number(wbs_node_id);
                const wbsNode = await model.findWbsNode(nodeId);
                if (!wbsNode) {
                    return res.status(404).json({ message: "Hạng mục WBS không tồn tại" });
                }

                const isLeaf = await model.isLeafNode(nodeId);
                if (!isLeaf) {
                    return res.status(400).json({
                        message: "Hạng mục WBS đã chọn không phải là hạng mục lá (node có hạng mục con)"
                    });
                }

                const authorized = await checkProjectAuthorization(req, res, wbsNode.project_id, WRITE_ROLES);
                if (!authorized) return;

                const task = await model.create({
                    wbsNodeId: nodeId,
                    name: name.trim(),
                    description: description ? String(description).trim() : null,
                    duration
                });

                return res.status(201).json({ task });
            } catch (error) {
                return next(error);
            }
        },

        async update(req, res, next) {
            try {
                const taskId = Number(req.params.id);
                if (!Number.isInteger(taskId) || taskId <= 0) {
                    return res.status(400).json({ message: "Mã công việc không hợp lệ" });
                }

                const task = await model.findById(taskId);
                if (!task) {
                    return res.status(404).json({ message: "Không tìm thấy công việc" });
                }

                const authorizedCurrent = await checkProjectAuthorization(req, res, task.project_id, WRITE_ROLES);
                if (!authorizedCurrent) return;

                const { name, description, duration, wbs_node_id } = req.body;

                let nextName;
                if (name !== undefined) {
                    const nameError = validateName(name);
                    if (nameError) return res.status(400).json({ message: nameError });
                    nextName = name.trim();
                }

                let nextDuration;
                if (duration !== undefined) {
                    const durationError = validateDuration(duration);
                    if (durationError) return res.status(400).json({ message: durationError });
                    nextDuration = duration;
                }

                let nextWbsNodeId;
                if (wbs_node_id !== undefined && wbs_node_id !== null) {
                    const wbsError = validateWbsNodeId(wbs_node_id);
                    if (wbsError) return res.status(400).json({ message: wbsError });

                    const targetNodeId = Number(wbs_node_id);
                    const wbsNode = await model.findWbsNode(targetNodeId);
                    if (!wbsNode) {
                        return res.status(404).json({ message: "Hạng mục WBS không tồn tại" });
                    }

                    const isLeaf = await model.isLeafNode(targetNodeId);
                    if (!isLeaf) {
                        return res.status(400).json({
                            message: "Hạng mục WBS đã chọn không phải là hạng mục lá (node có hạng mục con)"
                        });
                    }

                    if (wbsNode.project_id !== task.project_id) {
                        const authorizedTarget = await checkProjectAuthorization(req, res, wbsNode.project_id, WRITE_ROLES);
                        if (!authorizedTarget) return;
                    }

                    nextWbsNodeId = targetNodeId;
                }

                const updated = await model.update({
                    id: taskId,
                    wbsNodeId: nextWbsNodeId,
                    name: nextName,
                    description: description !== undefined ? (description ? String(description).trim() : null) : undefined,
                    duration: nextDuration
                });

                return res.json({ task: updated });
            } catch (error) {
                return next(error);
            }
        },

        async remove(req, res, next) {
            try {
                const taskId = Number(req.params.id);
                if (!Number.isInteger(taskId) || taskId <= 0) {
                    return res.status(400).json({ message: "Mã công việc không hợp lệ" });
                }

                const task = await model.findById(taskId);
                if (!task) {
                    return res.status(404).json({ message: "Không tìm thấy công việc" });
                }

                const authorized = await checkProjectAuthorization(req, res, task.project_id, WRITE_ROLES);
                if (!authorized) return;

                const removed = await model.remove(taskId);
                return removed
                    ? res.status(204).end()
                    : res.status(404).json({ message: "Không tìm thấy công việc" });
            } catch (error) {
                return next(error);
            }
        }
    };
}

module.exports = { createTaskController, WRITE_ROLES, READ_ROLES };
