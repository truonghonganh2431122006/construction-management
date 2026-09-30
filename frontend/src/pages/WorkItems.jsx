import { useEffect, useState } from "react";
import { Alert, Button, Card, Form, Input, message, Popconfirm, Space, Spin, Table, Tag } from "antd";
import { useSearchParams } from "react-router-dom";
import WorkItemTree from "../components/WorkItemTree";
import TaskModal from "../components/TaskModal";
import { createWorkItem, deleteWorkItem, listWorkItems, updateWorkItem } from "../services/workItemApi";
import { deleteTask, listTasks } from "../services/taskApi";
import "../styles/WorkItems.css";

export default function WorkItems() {
    const [searchParams] = useSearchParams();
    const projectId = Number(searchParams.get("projectId") || 1);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [parentId, setParentId] = useState(null);
    const [form] = Form.useForm();

    // Task management state
    const [tasks, setTasks] = useState([]);
    const [tasksLoading, setTasksLoading] = useState(false);
    const [taskModalOpen, setTaskModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState(null);
    const [defaultWbsNodeId, setDefaultWbsNodeId] = useState(null);

    const refreshTasks = async () => {
        try {
            setTasksLoading(true);
            const fetched = await listTasks({ projectId });
            setTasks(fetched);
        } catch {
            // Task fetch failure is non-blocking
        } finally {
            setTasksLoading(false);
        }
    };

    useEffect(() => {
        let active = true;
        Promise.all([listWorkItems(projectId), listTasks({ projectId }).catch(() => [])])
            .then(([nextItems, nextTasks]) => {
                if (active) {
                    setItems(nextItems);
                    setTasks(nextTasks || []);
                    setError("");
                }
            })
            .catch((requestError) => {
                if (active) {
                    setError(requestError.response?.data?.message || "Không thể tải cây hạng mục");
                }
            })
            .finally(() => {
                if (active) setLoading(false);
            });

        return () => { active = false; };
    }, [projectId]);

    const save = async (itemId, values) => {
        try {
            if (itemId) await updateWorkItem(projectId, itemId, values);
            else await createWorkItem(projectId, { ...values, parentId });
            setParentId(null);
            form.resetFields();
            setItems(await listWorkItems(projectId));
        } catch (requestError) {
            message.error(requestError.response?.data?.message || "Không thể lưu hạng mục");
        }
    };

    const remove = async (item) => {
        try {
            await deleteWorkItem(projectId, item.id);
            setItems(await listWorkItems(projectId));
            await refreshTasks();
        } catch (requestError) {
            message.error(requestError.response?.data?.message || "Không thể xóa hạng mục");
        }
    };

    const openCreateTask = (wbsNodeId = null) => {
        setEditingTask(null);
        setDefaultWbsNodeId(wbsNodeId);
        setTaskModalOpen(true);
    };

    const openEditTask = (task) => {
        setEditingTask(task);
        setDefaultWbsNodeId(task.wbs_node_id);
        setTaskModalOpen(true);
    };

    const handleDeleteTask = async (task) => {
        try {
            await deleteTask(task.id);
            message.success("Đã xóa công việc");
            await refreshTasks();
        } catch (err) {
            message.error(err.response?.data?.message || "Không thể xóa công việc");
        }
    };

    const taskColumns = [
        {
            title: "Mã",
            dataIndex: "id",
            key: "id",
            width: 70
        },
        {
            title: "Tên công việc",
            dataIndex: "name",
            key: "name",
            render: (text) => <strong>{text}</strong>
        },
        {
            title: "Hạng mục WBS",
            dataIndex: "wbs_node_id",
            key: "wbs_node_id",
            render: (wbsNodeId, record) => {
                const node = items.find((i) => i.id === wbsNodeId);
                const title = node?.title || record.wbs_node_title || `#${wbsNodeId}`;
                return <Tag color="blue">{title}</Tag>;
            }
        },
        {
            title: "Thời lượng",
            dataIndex: "duration",
            key: "duration",
            width: 160,
            render: (duration) => (
                <span className="duration-tag">{duration} ngày làm việc</span>
            )
        },
        {
            title: "Mô tả",
            dataIndex: "description",
            key: "description",
            render: (text) => text || <span style={{ color: "#999" }}>Không có mô tả</span>
        },
        {
            title: "Thao tác",
            key: "actions",
            width: 140,
            render: (_, record) => (
                <Space size="small">
                    <Button size="small" onClick={() => openEditTask(record)}>Sửa</Button>
                    <Popconfirm
                        title="Xác nhận xóa"
                        description="Bạn có chắc chắn muốn xóa công việc này không? Hạng mục WBS sẽ không bị ảnh hưởng."
                        onConfirm={() => handleDeleteTask(record)}
                        okText="Xóa"
                        cancelText="Hủy"
                        okButtonProps={{ danger: true }}
                    >
                        <Button size="small" danger>Xóa</Button>
                    </Popconfirm>
                </Space>
            )
        }
    ];

    return (
        <main className="work-items-page">
            <Card className="work-items-panel" title="Cây hạng mục & Quản lý công việc">
                <p className="work-items-meta">Dự án #{projectId}</p>
                <Space style={{ marginBottom: 16 }}>
                    <Button type="primary" onClick={() => setParentId(null)}>Thêm hạng mục gốc</Button>
                    <Button onClick={() => openCreateTask(null)}>Thêm công việc</Button>
                </Space>
                {parentId !== null && <p className="work-items-meta">Đang thêm hạng mục con cho ID #{parentId}</p>}
                <Form form={form} layout="inline" onFinish={(values) => save(null, values)} style={{ marginBottom: 16 }}>
                    <Form.Item name="title" rules={[{ required: true, message: "Nhập tên hạng mục" }]}>
                        <Input placeholder="Tên hạng mục mới" />
                    </Form.Item>
                    <Button htmlType="submit">Tạo hạng mục</Button>
                </Form>
                {error && <Alert type="error" message={error} style={{ marginBottom: 16 }} />}
                {loading ? (
                    <Spin />
                ) : (
                    <WorkItemTree
                        items={items}
                        onSave={save}
                        onDelete={remove}
                        onAdd={(id) => setParentId(id)}
                        onAddTask={(leafId) => openCreateTask(leafId)}
                    />
                )}

                <div className="tasks-section">
                    <div className="tasks-header">
                        <h3 className="tasks-title">Danh sách công việc gắn vào WBS leaf ({tasks.length})</h3>
                        <Button type="primary" onClick={() => openCreateTask(null)}>+ Thêm công việc</Button>
                    </div>
                    <Table
                        rowKey="id"
                        dataSource={tasks}
                        columns={taskColumns}
                        loading={tasksLoading}
                        pagination={{ pageSize: 10 }}
                        locale={{ emptyText: "Chưa có công việc nào gắn vào hạng mục lá của dự án này." }}
                    />
                </div>
            </Card>

            <TaskModal
                open={taskModalOpen}
                task={editingTask}
                wbsItems={items}
                defaultWbsNodeId={defaultWbsNodeId}
                onCancel={() => setTaskModalOpen(false)}
                onSuccess={async () => {
                    setTaskModalOpen(false);
                    await refreshTasks();
                }}
            />
        </main>
    );
}
