function createScheduleController({ service }) {
    return {
        async get(req, res) {
            if (req.query.critical !== undefined && !["true", "false"].includes(req.query.critical)) {
                return res.status(400).json({ message: "Bộ lọc critical phải là true hoặc false" });
            }
            const schedule = await service.getSchedule(Number(req.params.projectId), {
                criticalOnly: req.query.critical === "true"
            });
            const response = { schedule };
            if (schedule?.summary && schedule.length > 0) {
                response.summary = schedule.summary;
            }
            return res.json(response);
        }
    };
}

module.exports = { createScheduleController };
