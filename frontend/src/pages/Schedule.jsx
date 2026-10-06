import { useEffect, useState } from "react";
import { Alert, Button, Checkbox, Empty, Modal, Spin, Table, Tag } from "antd";
import { Link, useSearchParams } from "react-router-dom";
import { getSchedule } from "../services/scheduleApi";
import { saveTask } from "../services/taskApi";
import DashboardLayout from "../components/DashboardLayout";
import Icon from "../components/OperationsIcon";
import { SectionHeading } from "../components/OperationsVisuals";
import "../styles/Schedule.css";

const day = (value) => `Ngày ${value.toLocaleString("vi-VN")}`;
const columns = [
    { title: "Tên công việc", dataIndex: "name", key: "name" },
    { title: "Thời lượng", dataIndex: "duration_days", key: "duration", render: (value) => `${value.toLocaleString("vi-VN")} ngày` },
    { title: "Khởi sớm (ES)", dataIndex: "es", key: "es", render: day },
    { title: "Kết sớm (EF)", dataIndex: "ef", key: "ef", render: day },
    { title: "Khởi muộn (LS)", dataIndex: "ls", key: "ls", render: day },
    { title: "Kết muộn (LF)", dataIndex: "lf", key: "lf", render: day },
    { title: "Độ trễ", dataIndex: "slack", key: "slack", render: (value) => `${value.toLocaleString("vi-VN")} ngày` },
    { title: "Trạng thái", dataIndex: "isCritical", key: "critical", render: (value, record) => {
        if (record?.newlyCritical) return <Tag color="orange">Mới thành găng</Tag>;
        return <Tag color={value ? "red" : "default"}>{value ? "Găng" : "Không găng"}</Tag>;
    } }
];

function TaskProgressModal({ task, projectId, onClose, onSaved }) {
    const [actualStart, setActualStart] = useState(() => (task?.actual_start ? task.actual_start.slice(0, 10) : ""));
    const [actualFinish, setActualFinish] = useState(() => (task?.actual_finish ? task.actual_finish.slice(0, 10) : ""));
    const [progressPercent, setProgressPercent] = useState(() => (typeof task?.progress_percent === "number" ? task.progress_percent : 0));
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const isDateInvalid = Boolean(actualStart && actualFinish && actualFinish < actualStart);
    const wasCompleted = Boolean(task?.actual_finish || task?.progress_percent === 100);
    const willBeIncomplete = Boolean(!actualFinish || Number(progressPercent) < 100);

    const handleSave = () => {
        if (isDateInvalid) {
            setError("Ngày hoàn thành thực tế không được trước ngày bắt đầu thực tế");
            return;
        }

        const doSubmit = async () => {
            setSaving(true);
            setError("");
            try {
                await saveTask(projectId, task.id, {
                    actual_start: actualStart || null,
                    actual_finish: actualFinish || null,
                    progress_percent: Math.min(100, Math.max(0, Number(progressPercent) || 0))
                });
                onSaved();
                onClose();
            } catch (err) {
                setError(err.response?.data?.message || err.message || "Không thể cập nhật tiến độ");
            } finally {
                setSaving(false);
            }
        };

        if (wasCompleted && willBeIncomplete) {
            Modal.confirm({
                title: "Mở lại công việc đã hoàn thành?",
                content: "Công việc này đã được đánh dấu hoàn thành trước đó. Bạn có chắc chắn muốn mở lại công việc không?",
                okText: "Đồng ý mở lại",
                cancelText: "Hủy",
                onOk: () => doSubmit()
            });
        } else {
            doSubmit();
        }
    };

    return (
        <Modal
            title={`Cập nhật tiến độ: ${task?.name || ""}`}
            open
            onCancel={onClose}
            onOk={handleSave}
            confirmLoading={saving}
            okButtonProps={{ disabled: isDateInvalid }}
            okText="Lưu tiến độ"
            cancelText="Đóng"
        >
            <div className="task-progress-form">
                {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 16 }} />}
                <div className="form-group">
                    <label htmlFor="actual-start-input">Ngày bắt đầu thực tế</label>
                    <input
                        id="actual-start-input"
                        type="date"
                        className="ant-input"
                        value={actualStart}
                        onChange={(event) => {
                            setActualStart(event.target.value);
                            setError("");
                        }}
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="actual-finish-input">Ngày hoàn thành thực tế</label>
                    <input
                        id="actual-finish-input"
                        type="date"
                        className={`ant-input ${isDateInvalid ? "ant-input-status-error" : ""}`}
                        value={actualFinish}
                        onChange={(event) => {
                            setActualFinish(event.target.value);
                            setError("");
                        }}
                    />
                    {isDateInvalid && (
                        <div className="field-validation-error">
                            Ngày hoàn thành thực tế không được trước ngày bắt đầu thực tế
                        </div>
                    )}
                </div>
                <div className="form-group">
                    <label htmlFor="progress-percent-input">Tiến độ hoàn thành (%)</label>
                    <input
                        id="progress-percent-input"
                        type="number"
                        min={0}
                        max={100}
                        className="ant-input"
                        value={progressPercent}
                        onChange={(event) => {
                            setProgressPercent(event.target.value);
                            setError("");
                        }}
                    />
                </div>
            </div>
        </Modal>
    );
}

function Gantt({ tasks, onTaskClick }) {
    const [zoom, setZoom] = useState(1);
    const end = Math.max(1, ...tasks.map((task) => task.lf));
    const step = Math.max(1, Math.ceil(end / 8));
    const horizon = Math.ceil(end / step) * step;
    const ticks = Array.from({ length: horizon / step + 1 }, (_, index) => index * step);
    return <section className="schedule-gantt" aria-label="Biểu đồ Gantt"><div className="gantt-tools"><div className="gantt-legend"><span><i className="critical" />Công việc găng</span><span><i className="newly-critical" />Mới thành găng</span><span><i />Công việc thường</span><span><i className="float" />Khoảng dự trữ</span></div><label>Hiển thị <select aria-label="Tỷ lệ Gantt" value={zoom} onChange={(event)=>setZoom(Number(event.target.value))}><option value={1}>Vừa khung</option><option value={1.5}>150%</option><option value={2}>200%</option></select></label></div><div className="gantt-scroll" tabIndex={0} role="region" aria-label="Dòng thời gian công việc"><div className="gantt-canvas" style={{minWidth:`${780 * zoom}px`}}><div className="gantt-header"><span>Công việc / Thời lượng</span><div className="gantt-axis">{ticks.map((tick)=><span key={tick} style={{left:`${tick / horizon * 100}%`}}>{tick}</span>)}</div></div>{tasks.map((task)=><div className={`gantt-row ${task.newlyCritical ? "is-newly-critical" : task.isCritical ? "is-critical" : ""}`} key={task.id} onClick={() => onTaskClick && onTaskClick(task)} title="Nhấp để cập nhật tiến độ"><div className="gantt-task"><Icon name="task" size={16} /><span><strong>{task.name}</strong><small>{task.duration_days} ngày · {task.newlyCritical ? "Mới thành găng" : task.isCritical ? "Đường găng" : `Dự trữ ${task.slack} ngày`}</small></span></div><div className="gantt-lane" style={{backgroundSize:`${step / horizon * 100}% 100%`}}>{task.slack > 0 && <span className="gantt-float" style={{left:`${task.ef / horizon * 100}%`,width:`${task.slack / horizon * 100}%`}} title={`Dự trữ ${task.slack} ngày`} />}<span className={`gantt-bar ${task.duration_days === 0 ? "is-milestone" : ""}`} style={{left:`${task.es / horizon * 100}%`,width:`${(task.ef - task.es) / horizon * 100}%`}} title={`${task.name}: ES ${task.es}, EF ${task.ef}, LS ${task.ls}, LF ${task.lf}, dự trữ ${task.slack} ngày${task.newlyCritical ? " (Mới thành găng)" : ""}`}><span>{task.es} → {task.ef}</span></span></div></div>)}</div></div><p className="gantt-caption">Đơn vị: ngày tương đối từ mốc 0. Thanh màu thể hiện ES → EF; phần nét đứt thể hiện độ dự trữ.</p></section>;
}

function ProjectSchedule({ projectId }) {
    const [criticalOnly, setCriticalOnly] = useState(false);
    const [attempt, setAttempt] = useState(0);
    const [state, setState] = useState({ loading: true, schedule: [], error: "" });
    const [editingTask, setEditingTask] = useState(null);

    useEffect(() => {
        const controller = new AbortController();
        getSchedule(projectId, { criticalOnly, signal: controller.signal })
            .then((schedule) => {
                if (!controller.signal.aborted) setState({ loading: false, schedule, error: "" });
            })
            .catch((error) => {
                if (!controller.signal.aborted) setState({
                    loading: false, schedule: [],
                    error: error.response?.data?.message || "Không thể tải tiến độ. Vui lòng thử lại."
                });
            });
        return () => controller.abort();
    }, [projectId, criticalOnly, attempt]);

    const changeFilter = (checked) => {
        setState({ loading: true, schedule: [], error: "" });
        setCriticalOnly(checked);
    };
    const retry = () => {
        setState({ loading: true, schedule: [], error: "" });
        setAttempt((value) => value + 1);
    };

    const summary = state.schedule?.summary || {};
    const plannedFinish = typeof summary.plannedFinish === "number"
        ? summary.plannedFinish
        : (state.schedule.length ? Math.max(0, ...state.schedule.map((task) => task.ef)) : 0);
    const currentFinish = typeof summary.currentFinish === "number"
        ? summary.currentFinish
        : (state.schedule.length ? Math.max(0, ...state.schedule.map((task) => task.ef)) : 0);
    const delayDays = typeof summary.delayDays === "number"
        ? summary.delayDays
        : (currentFinish - plannedFinish);

    return (
        <section className="ops-card schedule-panel">
            <SectionHeading icon="trend" title="Tiến độ công việc" description={`Dự án #${projectId} · Kế hoạch theo đường găng CPM`} />
            <div className="schedule-heading-links">
                <Link to={`/work-items?projectId=${projectId}`}>Quay lại cây hạng mục</Link>
                <Link to={`/calendar?projectId=${projectId}`}>Lịch thi công & ngày nghỉ</Link>
                <Link to={`/field-assignments?projectId=${projectId}`}>Giao việc hiện trường</Link>
            </div>
            <p className="schedule-note">Các mốc tính bằng ngày kể từ lúc khởi công (Ngày 0).
                {" "}Độ trễ là số ngày có thể trì hoãn; công việc găng có độ trễ bằng 0. Nhấp vào hàng hoặc thanh Gantt để cập nhật tiến độ thực tế.</p>
            <div className="schedule-toolbar">
                <Checkbox checked={criticalOnly} onChange={(event) => changeFilter(event.target.checked)}>
                    Chỉ hiện công việc găng
                </Checkbox>
                <Button onClick={retry} disabled={state.loading}>Tải lại</Button>
            </div>
            {state.loading ? <div className="schedule-loading" role="status" aria-live="polite">
                <Spin /><span>Đang tải tiến độ…</span>
            </div> : state.error ? <Alert type="error" showIcon title={state.error} />
                : state.schedule.length === 0 ? <Empty description={criticalOnly
                    ? "Không có công việc găng." : "Dự án chưa có công việc. Thêm công việc từ cây hạng mục để tính tiến độ."} />
                    : <>
                        <div className="schedule-summary">
                            <div>
                                <span>Công việc hiển thị</span>
                                <strong>{state.schedule.length}</strong>
                            </div>
                            <div>
                                <span>Công việc găng</span>
                                <strong className="schedule-critical-number">{state.schedule.filter((task)=>task.isCritical).length}</strong>
                            </div>
                            <div>
                                <span>Kế hoạch hoàn thành</span>
                                <strong>Ngày {plannedFinish}</strong>
                            </div>
                            <div>
                                <span>Dự kiến hiện tại</span>
                                <strong>Ngày {currentFinish}</strong>
                            </div>
                            <div>
                                <span>Chênh lệch tiến độ</span>
                                {delayDays > 0 ? (
                                    <Tag color="error" className="schedule-delay-tag">Chậm {delayDays} ngày</Tag>
                                ) : delayDays < 0 ? (
                                    <Tag color="success" className="schedule-early-tag">Sớm {Math.abs(delayDays)} ngày</Tag>
                                ) : (
                                    <Tag color="success" className="schedule-ontime-tag">Đúng kế hoạch</Tag>
                                )}
                            </div>
                        </div>
                        <Gantt tasks={state.schedule} onTaskClick={(task) => setEditingTask(task)} />
                        <div className="schedule-cpm-heading">
                            <h2>Chi tiết tính toán CPM</h2>
                            <span>ES / EF · LS / LF · Độ dự trữ (Nhấp vào hàng để cập nhật tiến độ)</span>
                        </div>
                        <Table
                            rowKey="id"
                            columns={columns}
                            dataSource={state.schedule}
                            pagination={false}
                            scroll={{ x: 1000 }}
                            onRow={(record) => ({
                                onClick: () => setEditingTask(record),
                                style: { cursor: "pointer" },
                                title: "Nhấp để cập nhật tiến độ thực tế"
                            })}
                            rowClassName={(task) => task.newlyCritical
                                ? "schedule-newly-critical-row"
                                : task.isCritical ? "schedule-critical-row" : ""}
                        />
                    </>}
            {editingTask && (
                <TaskProgressModal
                    key={editingTask.id}
                    task={editingTask}
                    projectId={projectId}
                    onClose={() => setEditingTask(null)}
                    onSaved={retry}
                />
            )}
        </section>
    );
}

export default function Schedule() {
    const [params] = useSearchParams();
    const projectId = Number(params.get("projectId"));
    const validProject = Number.isInteger(projectId) && projectId > 0 && projectId <= 2147483647;
    return <DashboardLayout title="Tiến độ & đường găng" description="Theo dõi trình tự thi công, thời lượng và các công việc quyết định tiến độ."><div className="schedule-page">
        {validProject ? <ProjectSchedule key={projectId} projectId={projectId} />
            : <Alert type="error" showIcon title="Vui lòng chọn dự án hợp lệ từ cây hạng mục để xem tiến độ." />}
    </div></DashboardLayout>;
}
