import axios from "axios";

const requestConfig = { withCredentials: true };

export async function listTasks({ projectId, wbsNodeId } = {}) {
    const params = {};
    if (projectId != null) params.projectId = projectId;
    if (wbsNodeId != null) params.wbs_node_id = wbsNodeId;
    const { data } = await axios.get("/tasks", { ...requestConfig, params });
    if (!Array.isArray(data?.tasks)) {
        throw new Error("API trả về danh sách công việc không hợp lệ");
    }
    return data.tasks;
}

export async function getTask(taskId) {
    const { data } = await axios.get(`/tasks/${taskId}`, requestConfig);
    return data.task;
}

export async function createTask(values) {
    const { data } = await axios.post("/tasks", values, requestConfig);
    return data.task;
}

export async function updateTask(taskId, values) {
    const { data } = await axios.patch(`/tasks/${taskId}`, values, requestConfig);
    return data.task;
}

export async function deleteTask(taskId) {
    await axios.delete(`/tasks/${taskId}`, requestConfig);
}
