import axios from "axios";

export async function getSchedule(projectId, { criticalOnly = false, signal } = {}) {
    const { data } = await axios.get(`/projects/${projectId}/schedule`, {
        withCredentials: true,
        params: criticalOnly ? { critical: true } : {},
        signal
    });
    if (!Array.isArray(data?.schedule)) throw new Error("API trả về tiến độ không hợp lệ");
    if (data.summary) {
        data.schedule.summary = data.summary;
    }
    return data.schedule;
}
