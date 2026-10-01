import { useState } from "react";
import { Button, Input, Select, Space } from "antd";

function childrenOf(items, parentId) {
    return items.filter((item) => (item.parent_id ?? null) === parentId);
}

function WorkItemEditor({ item, onSave, onCancel }) {
    const [title, setTitle] = useState(item?.title || "");
    const [status, setStatus] = useState(item?.status || "todo");

    return (
        <Space.Compact className="work-item-editor">
            <Input value={title} onChange={(event) => setTitle(event.target.value)} autoFocus />
            <Select value={status} onChange={setStatus} options={[
                { value: "todo", label: "Todo" },
                { value: "doing", label: "Doing" },
                { value: "done", label: "Done" }
            ]} />
            <Button type="primary" onClick={() => onSave({ title, status })}>Lưu</Button>
            <Button onClick={onCancel}>Hủy</Button>
        </Space.Compact>
    );
}

function WorkItemNode({ item, items, tasks, onAddTask, onEditTask, depth, expanded, editingId, onToggle, onEdit, onSave, onCancel, onDelete, onAdd }) {
    const children = childrenOf(items, item.id);
    const itemTasks = tasks.filter((task) => task.work_item_id === item.id);
    const isExpanded = expanded.has(item.id);
    return (
        <div className="work-item-node" style={{ "--depth": depth }}>
            <div className="work-item-row">
                <button className="tree-toggle" onClick={() => onToggle(item.id)} aria-label="Mở rộng">
                    {children.length ? (isExpanded ? "-" : "+") : ""}
                </button>
                {editingId === item.id ? (
                    <WorkItemEditor item={item} onSave={(values) => onSave(item.id, values)} onCancel={onCancel} />
                ) : (
                    <>
                        <span className="work-item-title">{item.title}</span>
                        <span className={`work-item-status status-${item.status}`}>{item.status}</span>
                        <Button size="small" disabled={itemTasks.length > 0} onClick={() => onAdd(item.id)}>Thêm con</Button>
                        {children.length === 0 && <Button size="small" onClick={() => onAddTask(item.id)}>Thêm công việc</Button>}
                        <Button size="small" onClick={() => onEdit(item.id)}>Sửa</Button>
                        <Button size="small" danger onClick={() => onDelete(item)}>Xóa</Button>
                    </>
                )}
            </div>
            {itemTasks.map((task) => <div className="task-tree-row" key={task.id}>
                <span>{task.name}</span><span>{task.duration_days} ngày</span>
                <Button size="small" onClick={() => onEditTask(task)}>Sửa công việc</Button>
            </div>)}
            {isExpanded && children.map((child) => (
                <WorkItemNode key={child.id} item={child} items={items} depth={depth + 1}
                    tasks={tasks} onAddTask={onAddTask} onEditTask={onEditTask}
                    expanded={expanded} editingId={editingId} onToggle={onToggle} onEdit={onEdit}
                    onSave={onSave} onCancel={onCancel} onDelete={onDelete} onAdd={onAdd} />
            ))}
        </div>
    );
}

export default function WorkItemTree({ items, tasks = [], onAddTask, onEditTask, onSave, onDelete, onAdd }) {
    const initialExpanded = new Set(items.filter((item) => item.depth < 2).map((item) => item.id));
    const [expanded, setExpanded] = useState(initialExpanded);
    const [editingId, setEditingId] = useState(null);

    const toggle = (id) => setExpanded((current) => {
        const next = new Set(current);
        next.has(id) ? next.delete(id) : next.add(id);
        return next;
    });

    return (
        <div className="work-item-tree">
            {items.filter((item) => item.parent_id == null).map((item) => (
                <WorkItemNode key={item.id} item={item} items={items} depth={0}
                    tasks={tasks} onAddTask={onAddTask} onEditTask={onEditTask}
                    expanded={expanded} editingId={editingId} onToggle={toggle}
                    onEdit={setEditingId} onSave={(id, values) => { setEditingId(null); onSave(id, values); }}
                    onCancel={() => setEditingId(null)} onDelete={onDelete} onAdd={onAdd} />
            ))}
        </div>
    );
}
