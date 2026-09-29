const { topologicalSort } = require('../src/services/scheduleService');

describe('[S-07] Topological Sort & Cycle Detection', () => {
  test('Sắp xếp công việc tuyến tính đơn giản A -> B -> C', () => {
    const tasks = [{ id: 'A' }, { id: 'B' }, { id: 'C' }];
    const dependencies = [
      { fromTaskId: 'A', toTaskId: 'B' },
      { fromTaskId: 'B', toTaskId: 'C' }
    ];

    const result = topologicalSort(tasks, dependencies);
    expect(result).toEqual(['A', 'B', 'C']);
  });

  test('Sắp xếp công việc phân nhánh đồ thị DAG', () => {
    const tasks = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }];
    const dependencies = [
      { fromTaskId: 1, toTaskId: 2 },
      { fromTaskId: 1, toTaskId: 3 },
      { fromTaskId: 2, toTaskId: 4 },
      { fromTaskId: 3, toTaskId: 4 }
    ];

    const result = topologicalSort(tasks, dependencies);
    expect(result.indexOf(1)).toBeLessThan(result.indexOf(2));
    expect(result.indexOf(1)).toBeLessThan(result.indexOf(3));
    expect(result.indexOf(2)).toBeLessThan(result.indexOf(4));
    expect(result.indexOf(3)).toBeLessThan(result.indexOf(4));
    expect(result.length).toBe(4);
  });

  test('Phát hiện vòng lặp chu trình (Cycle Detection)', () => {
    const tasks = [{ id: 'A' }, { id: 'B' }, { id: 'C' }];
    const dependencies = [
      { fromTaskId: 'A', toTaskId: 'B' },
      { fromTaskId: 'B', toTaskId: 'C' },
      { fromTaskId: 'C', toTaskId: 'A' }
    ];

    expect(() => {
      topologicalSort(tasks, dependencies);
    }).toThrow('Cycle detected');
  });

  test('Báo lỗi khi phụ thuộc vào công việc không tồn tại', () => {
    const tasks = [{ id: 'A' }];
    const dependencies = [{ fromTaskId: 'A', toTaskId: 'UNKNOWN' }];

    expect(() => {
      topologicalSort(tasks, dependencies);
    }).toThrow('không tồn tại');
  });
});