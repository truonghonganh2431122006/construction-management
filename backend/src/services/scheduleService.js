/**
 * Sắp xếp thứ tự thực hiện công việc bằng thuật toán Kahn (Topological Sort)
 * và phát hiện chu trình (cycle detection).
 * 
 * @param {Array<{ id: string|number, name?: string }>} tasks Danh sách các công việc
 * @param {Array<{ fromTaskId: string|number, toTaskId: string|number }>} dependencies 
 *        Quan hệ phụ thuộc (từ fromTaskId sang toTaskId, nghĩa là toTaskId phụ thuộc fromTaskId)
 * @returns {Array<string|number>} Danh sách ID công việc đã được sắp xếp theo thứ tự thực hiện
 * @throws {Error} Ném lỗi nếu phát hiện chu trình phụ thuộc (Cycle Detected)
 */
function topologicalSort(tasks, dependencies = []) {
  const inDegree = new Map();
  const adjList = new Map();

  // Khởi tạo đồ thị
  tasks.forEach(task => {
    inDegree.set(task.id, 0);
    adjList.set(task.id, []);
  });

  // Xây dựng danh sách kề và tính bậc vào (in-degree)
  dependencies.forEach(({ fromTaskId, toTaskId }) => {
    if (!inDegree.has(fromTaskId) || !inDegree.has(toTaskId)) {
      throw new Error(`Công việc liên kết không tồn tại trong danh sách: ${fromTaskId} -> ${toTaskId}`);
    }
    adjList.get(fromTaskId).push(toTaskId);
    inDegree.set(toTaskId, inDegree.get(toTaskId) + 1);
  });

  // Hàng đợi chứa các node không phụ thuộc vào node nào khác (in-degree == 0)
  const queue = [];
  inDegree.forEach((degree, taskId) => {
    if (degree === 0) {
      queue.push(taskId);
    }
  });

  const sortedOrder = [];

  while (queue.length > 0) {
    const current = queue.shift();
    sortedOrder.push(current);

    const neighbors = adjList.get(current) || [];
    for (const neighbor of neighbors) {
      inDegree.set(neighbor, inDegree.get(neighbor) - 1);
      if (inDegree.get(neighbor) === 0) {
        queue.push(neighbor);
      }
    }
  }

  // Nếu số node sắp xếp được không bằng tổng số node -> tồn tại chu trình (Cycle)
  if (sortedOrder.length !== tasks.length) {
    throw new Error('Cycle detected: Tồn tại vòng lặp phụ thuộc giữa các công việc');
  }

  return sortedOrder;
}

module.exports = {
  topologicalSort
};