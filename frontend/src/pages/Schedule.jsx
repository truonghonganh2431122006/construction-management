<<<<<<< HEAD
import { useEffect, useState } from "react";
import { Alert, Button, Checkbox, Empty, Spin, Table, Tag } from "antd";
import { Link, useSearchParams } from "react-router-dom";
import { getSchedule, saveBaseline, listMilestoneAlerts } from "../services/scheduleApi";
=======
import { useEffect, useMemo, useState } from "react";
import { Alert, Table, Tag } from "antd";
import { Link, useSearchParams } from "react-router-dom";
import { getSchedule } from "../services/scheduleApi";
import { updateTaskProgress } from "../services/progressApi";
import { listDependencies, listTasks, saveTask } from "../services/taskApi";
import { listWorkItems } from "../services/workItemApi";
import TaskForm from "../components/TaskForm";
import { Gantt, toBarModel } from "../features/gantt";
import TaskDetailsDrawer from "../features/gantt/TaskDetailsDrawer";
import { CalendarSettings, ScheduleIcon, ScheduleKpis, ScheduleLegend, ScheduleSkeleton, ScheduleToolbar } from "../features/gantt/ScheduleControls";
import { calendarValue, dayForDate, filterTasks, formatPlanDay, ganttRows, scheduleRange, todayDate } from "../features/gantt/scheduleViewModel";
>>>>>>> ed6121f (feat: complete tasks T-29 through T-35)
import DashboardLayout from "../components/DashboardLayout";
import "../styles/Schedule.css";

const INITIAL_FILTERS = { search: "", status: "all", assignee: "all", criticalOnly: false };
const number = (value) => Number.isFinite(value) ? value.toLocaleString("vi-VN") : "—";
const day = (value) => Number.isFinite(value) ? `Ngày ${number(value)}` : "—";
const columns = [
    { title: "Tên công việc", dataIndex: "name", key: "name" },
    { title: "Thời lượng", dataIndex: "duration_days", key: "duration", render: (value) => `${number(value)} ngày` },
    { title: "Khởi sớm (ES)", dataIndex: "es", key: "es", render: day },
    { title: "Kết sớm (EF)", dataIndex: "ef", key: "ef", render: day },
    { title: "Khởi muộn (LS)", dataIndex: "ls", key: "ls", render: day },
    { title: "Kết muộn (LF)", dataIndex: "lf", key: "lf", render: day },
<<<<<<< HEAD
    { title: "Độ trễ", dataIndex: "slack", key: "slack", render: (value) => `${value.toLocaleString("vi-VN")} ngày` },
    { title: "Trạng thái", dataIndex: "isCritical", key: "critical", render: (value) =>
        <Tag color={value ? "red" : "default"}>{value ? "Găng" : "Không găng"}</Tag> }
];

function Gantt({ tasks }) {
    const [zoom, setZoom] = useState(1);
    const end = Math.max(1, ...tasks.map((task) => Math.max(task.lf || 0, task.baseline_lf || 0)));
    const step = Math.max(1, Math.ceil(end / 8));
    const horizon = Math.ceil(end / step) * step;
    const ticks = Array.from({ length: horizon / step + 1 }, (_, index) => index * step);
    return (
        <section className="schedule-gantt" aria-label="Biểu đồ Gantt">
            <div className="gantt-tools">
                <div className="gantt-legend">
                    <span><i className="critical" />Công việc găng</span>
                    <span><i />Công việc thường</span>
                    <span><i className="float" />Khoảng dự trữ</span>
                    <span><i className="baseline" />Kế hoạch gốc (mờ)</span>
                </div>
                <label>
                    Hiển thị
                    <select aria-label="Tỷ lệ Gantt" value={zoom} onChange={(event) => setZoom(Number(event.target.value))}>
                        <option value={1}>Vừa khung</option>
                        <option value={1.5}>150%</option>
                        <option value={2}>200%</option>
                    </select>
                </label>
            </div>
            <div className="gantt-scroll" tabIndex={0} role="region" aria-label="Dòng thời gian công việc">
                <div className="gantt-canvas" style={{ minWidth: `${780 * zoom}px` }}>
                    <div className="gantt-header">
                        <span>Công việc / Thời lượng</span>
                        <div className="gantt-axis">
                            {ticks.map((tick) => (
                                <span key={tick} style={{ left: `${tick / horizon * 100}%` }}>{tick}</span>
                            ))}
                        </div>
                    </div>
                    {tasks.map((task) => (
                        <div className={`gantt-row ${task.isCritical ? "is-critical" : ""}`} key={task.id}>
                            <div className="gantt-task">
                                <Icon name="task" size={16} />
                                <span>
                                    <strong>{task.name}</strong>
                                    <small>{task.duration_days} ngày · {task.isCritical ? "Đường găng" : `Dự trữ ${task.slack} ngày`}</small>
                                </span>
                            </div>
                            <div className="gantt-lane" style={{ backgroundSize: `${step / horizon * 100}% 100%` }}>
                                {task.slack > 0 && (
                                    <span
                                        className="gantt-float"
                                        style={{ left: `${task.ef / horizon * 100}%`, width: `${task.slack / horizon * 100}%` }}
                                        title={`Dự trữ ${task.slack} ngày`}
                                    />
                                )}
                                <span
                                    className={`gantt-bar ${task.duration_days === 0 ? "is-milestone" : ""}`}
                                    style={{ left: `${task.es / horizon * 100}%`, width: `${(task.ef - task.es) / horizon * 100}%` }}
                                    title={`${task.name}: ES ${task.es}, EF ${task.ef}, LS ${task.ls}, LF ${task.lf}, dự trữ ${task.slack} ngày`}
                                >
                                    <span>{task.es} → {task.ef}</span>
                                </span>
                                {task.baseline_es != null ? (
                                    <span
                                        className="gantt-baseline-bar"
                                        style={{
                                            left: `${task.baseline_es / horizon * 100}%`,
                                            width: `${Math.max(0.5, (task.baseline_ef - task.baseline_es) / horizon * 100)}%`
                                        }}
                                        title={`Kế hoạch gốc: ES ${task.baseline_es} → EF ${task.baseline_ef} (LS ${task.baseline_ls} → LF ${task.baseline_lf})`}
                                    />
                                ) : null}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <p className="gantt-caption">
                Đơn vị: ngày tương đối từ mốc 0. Thanh màu thể hiện ES → EF; thanh xám mờ bên dưới thể hiện kế hoạch gốc đã chốt; nét đứt thể hiện độ dự trữ.
            </p>
        </section>
    );
=======
    { title: "Độ trễ", dataIndex: "slack", key: "slack", render: (value) => `${number(value)} ngày` },
    { title: "Trạng thái", dataIndex: "isCritical", key: "critical", render: (value, record) =>
        record.newlyCritical ? <Tag color="orange">Mới thành găng</Tag>
            : <Tag color={value ? "volcano" : "default"}>{value ? "Găng" : "Không găng"}</Tag> }
];

function storedOrigin(projectId) {
    try {
        const value = localStorage.getItem(`xds-schedule-origin-${projectId}`) || "";
        return calendarValue(value) !== null ? value : "";
    } catch { return ""; }
>>>>>>> ed6121f (feat: complete tasks T-29 through T-35)
}

function ProjectSchedule({ projectId }) {
    const [attempt, setAttempt] = useState(0);
    const [state, setState] = useState({ loading: true, schedule: [], error: "" });
<<<<<<< HEAD
    const [savingBaseline, setSavingBaseline] = useState(false);
    const [alerts, setAlerts] = useState([]);
    const [selectedAlert, setSelectedAlert] = useState(null);

    useEffect(() => {
        const controller = new AbortController();
        Promise.all([
            getSchedule(projectId, { criticalOnly, signal: controller.signal }),
            listMilestoneAlerts(projectId).catch(() => [])
        ])
            .then(([schedule, alertList]) => {
                if (!controller.signal.aborted) {
                    setState({ loading: false, schedule, error: "" });
                    setAlerts(alertList);
                }
            })
            .catch((error) => {
                if (!controller.signal.aborted) {
                    setState({
                        loading: false,
                        schedule: [],
                        error: error.response?.data?.message || "Không thể tải tiến độ. Vui lòng thử lại."
                    });
                }
=======
    const [support, setSupport] = useState({ items: [], tasks: [], dependencies: [], dependenciesLoaded: false, ready: false, unavailable: [] });
    const [filters, setFilters] = useState(INITIAL_FILTERS);
    const [selectedId, setSelectedId] = useState(null);
    const [editingProgress, setEditingProgress] = useState(false);
    const [progressState, setProgressState] = useState({ saving: false, error: "", success: false });
    const [taskEditor, setTaskEditor] = useState(null);
    const [timeUnit, setTimeUnit] = useState("day");
    const [calendarOrigin, setCalendarOrigin] = useState(() => storedOrigin(projectId));
    const [collapsedGroups, setCollapsedGroups] = useState([]);
    const [cpmExpanded, setCpmExpanded] = useState(false);
    const [navigation, setNavigation] = useState(null);
    const [today, setToday] = useState(todayDate);

    useEffect(() => {
        const timer = setInterval(() => setToday(todayDate()), 60000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const controller = new AbortController();
        getSchedule(projectId, { signal: controller.signal }).then((schedule) => {
            if (!controller.signal.aborted) setState({ loading: false, schedule, error: "" });
        }).catch((error) => {
            if (!controller.signal.aborted) setState({ loading: false, schedule: [], error: error.response?.data?.message || "Không thể tải tiến độ. Vui lòng thử lại." });
        });
        // Independent supporting reads: an unavailable optional endpoint must not hide the schedule.
        Promise.allSettled([
            listWorkItems(projectId, { signal: controller.signal }),
            listTasks(projectId, { signal: controller.signal }),
            listDependencies(projectId, { signal: controller.signal })
        ]).then((results) => {
            if (controller.signal.aborted) return;
            const valid = (index) => results[index].status === "fulfilled" && Array.isArray(results[index].value);
            setSupport({
                items: valid(0) ? results[0].value : [], tasks: valid(1) ? results[1].value : [],
                dependencies: valid(2) ? results[2].value : [], dependenciesLoaded: valid(2), ready: true,
                unavailable: ["hạng mục", "thông tin công việc", "quan hệ phụ thuộc"].filter((_, index) => !valid(index))
>>>>>>> ed6121f (feat: complete tasks T-29 through T-35)
            });
        });
        return () => controller.abort();
<<<<<<< HEAD
    }, [projectId, criticalOnly, attempt]);

    const changeFilter = (checked) => {
        setState({ loading: true, schedule: [], error: "" });
        setCriticalOnly(checked);
    };

    const retry = () => {
        setState({ loading: true, schedule: [], error: "" });
        setAttempt((value) => value + 1);
    };

    const handleLockBaseline = async () => {
        try {
            setSavingBaseline(true);
            await saveBaseline(projectId);
            retry();
        } catch (err) {
            alert(err.response?.data?.message || "Không thể chốt kế hoạch gốc");
        } finally {
            setSavingBaseline(false);
        }
    };

    const hasBaseline = state.schedule.some((t) => t.baseline_es != null);

    return (
        <section className="ops-card schedule-panel">
            <SectionHeading
                icon="trend"
                title="Tiến độ công việc"
                description={`Dự án #${projectId} · Kế hoạch theo đường găng CPM`}
                action={
                    <Button
                        type="primary"
                        onClick={handleLockBaseline}
                        loading={savingBaseline}
                        disabled={state.loading || state.schedule.length === 0}
                    >
                        Chốt kế hoạch gốc
                    </Button>
                }
            />
            <div className="schedule-heading-links">
                <Link to={`/work-items?projectId=${projectId}`}>Quay lại cây hạng mục</Link>
                <Link to={`/field-assignments?projectId=${projectId}`}>Giao việc hiện trường</Link>
            </div>

            {!state.loading && state.schedule.length > 0 && !hasBaseline && (
                <div className="baseline-alert-notice">
                    <span>
                        <Icon name="info" size={16} /> <strong>Chưa chốt kế hoạch gốc</strong>: Sơ đồ hiện tại đang chạy theo kế hoạch tính toán động. Bấm &quot;Chốt kế hoạch gốc&quot; để lưu mốc chuẩn làm căn cứ so sánh.
                    </span>
                </div>
            )}

            <p className="schedule-note">
                Các mốc tính bằng ngày kể từ lúc khởi công (Ngày 0). Độ trễ là số ngày có thể trì hoãn; công việc găng có độ trễ bằng 0.
            </p>
            <div className="schedule-toolbar">
                <Checkbox checked={criticalOnly} onChange={(event) => changeFilter(event.target.checked)}>
                    Chỉ hiện công việc găng
                </Checkbox>
                <Button onClick={retry} disabled={state.loading}>Tải lại</Button>
            </div>
            {state.loading ? (
                <div className="schedule-loading" role="status" aria-live="polite">
                    <Spin /><span>Đang tải tiến độ…</span>
                </div>
            ) : state.error ? (
                <Alert type="error" showIcon title={state.error} />
            ) : state.schedule.length === 0 ? (
                <Empty
                    description={
                        criticalOnly
                            ? "Không có công việc găng."
                            : "Dự án chưa có công việc. Thêm công việc từ cây hạng mục để tính tiến độ."
                    }
                />
            ) : (
                <>
                    <div className="schedule-summary">
                        <div>
                            <span>Công việc hiển thị</span>
                            <strong>{state.schedule.length}</strong>
                        </div>
                        <div>
                            <span>Công việc găng</span>
                            <strong className="schedule-critical-number">
                                {state.schedule.filter((task) => task.isCritical).length}
                            </strong>
                        </div>
                        <div>
                            <span>Kết thúc sớm nhất trong kết quả</span>
                            <strong>Ngày {Math.max(...state.schedule.map((task) => task.ef))}</strong>
                        </div>
                    </div>
                    <Gantt tasks={state.schedule} />

                    {/* T-45: Danh sách cảnh báo mốc kèm chuỗi việc gây chậm */}
                    {alerts.length > 0 && (
                        <div className="alerts-section">
                            <div className="alerts-header">
                                <h3>Cảnh báo mốc bàn giao ({alerts.filter((a) => a.status === "open").length} đang mở)</h3>
                            </div>
                            <Table
                                rowKey="id"
                                pagination={false}
                                dataSource={alerts}
                                columns={[
                                    {
                                        title: "Mốc / Hạng mục",
                                        render: (_, r) => (
                                            <div>
                                                <strong>{r.milestone_name}</strong>
                                                <div style={{ fontSize: 11, color: "#64748b" }}>{r.work_item_title}</div>
                                            </div>
                                        )
                                    },
                                    {
                                        title: "Hạn cam kết",
                                        dataIndex: "milestone_target_date"
                                    },
                                    {
                                        title: "Số ngày vượt",
                                        dataIndex: "overdue_working_days",
                                        render: (val, r) => (
                                            <span style={{ color: r.status === "open" ? "#ef4444" : "#64748b", fontWeight: 600 }}>
                                                {val > 0 ? `Vượt ${val} ngày làm việc` : "Đúng tiến độ"}
                                            </span>
                                        )
                                    },
                                    {
                                        title: "Trạng thái",
                                        dataIndex: "status",
                                        render: (val) => (
                                            <span className={val === "open" ? "alerts-badge-danger" : "alerts-badge-success"}>
                                                {val === "open" ? "Đang mở" : "Đã khắc phục"}
                                            </span>
                                        )
                                    },
                                    {
                                        title: "Chuỗi việc gây chậm",
                                        render: (_, r) => (
                                            <Button size="small" onClick={() => setSelectedAlert(r)}>
                                                Xem chuỗi việc ({Array.isArray(r.critical_path) ? r.critical_path.length : 0})
                                            </Button>
                                        )
                                    }
                                ]}
                            />
                        </div>
                    )}

                    <div className="schedule-cpm-heading">
                        <h2>Chi tiết tính toán CPM</h2>
                        <span>ES / EF · LS / LF · Độ dự trữ</span>
                    </div>
                    <Table
                        rowKey="id"
                        columns={columns}
                        dataSource={state.schedule}
                        pagination={false}
                        scroll={{ x: 1000 }}
                        rowClassName={(task) => (task.isCritical ? "schedule-critical-row" : "")}
                    />
                </>
            )}

            {selectedAlert && (
                <div style={{
                    position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
                    background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center",
                    justifyContent: "center", zIndex: 1000
                }}>
                    <div style={{
                        background: "#fff", padding: 24, borderRadius: 8, maxWidth: 550, width: "90%",
                        maxHeight: "80vh", overflowY: "auto"
                    }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                            <h3>Chuỗi công việc gây chậm: {selectedAlert.milestone_name}</h3>
                            <Button size="small" onClick={() => setSelectedAlert(null)}>Đóng</Button>
                        </div>
                        <p style={{ color: "#475569", fontSize: 13, marginBottom: 12 }}>
                            Trình tự các công việc trên đường găng dẫn từ đầu đến công việc cuối của hạng mục (theo tên công việc):
                        </p>
                        <div className="critical-chain-tags">
                            {Array.isArray(selectedAlert.critical_path) && selectedAlert.critical_path.length > 0 ? (
                                selectedAlert.critical_path.map((name, index) => (
                                    <span key={index} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                        <span className="critical-chain-step">{name}</span>
                                        {index < selectedAlert.critical_path.length - 1 && (
                                            <span className="critical-chain-arrow">→</span>
                                        )}
                                    </span>
                                ))
                            ) : (
                                <span style={{ color: "#94a3b8" }}>Không có chuỗi phụ thuộc</span>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
=======
    }, [projectId, attempt]);

    const tasks = useMemo(() => {
        const details = new Map(support.tasks.map((task) => [String(task.id), task]));
        return state.schedule.map((task) => toBarModel({ ...details.get(String(task.id)), ...task }));
    }, [support.tasks, state.schedule]);
    const todayOffset = calendarOrigin ? dayForDate(today, calendarOrigin) : null;
    const visible = useMemo(() => filterTasks(tasks, filters, todayOffset), [tasks, filters, todayOffset]);
    const assignees = useMemo(() => [...new Set(tasks.map((task) => task.assignee).filter(Boolean))], [tasks]);
    const range = useMemo(() => scheduleRange(tasks), [tasks]);
    const width = Math.max(1200, Math.min(48000, (range.end - range.start) * 56));
    const selected = tasks.find((task) => String(task.id) === String(selectedId)) || null;
    const groupIds = useMemo(() => ganttRows(visible, support.items).filter((row) => row.group).map((row) => row.group.id), [visible, support.items]);
    const tableTasks = state.schedule.filter((task) => visible.some((entry) => String(entry.id) === String(task.id)));
    const summary = state.schedule?.summary || {};
    const plannedFinish = typeof summary.plannedFinish === "number"
        ? summary.plannedFinish : Math.max(0, ...tasks.map((task) => task.ef ?? 0));
    const currentFinish = typeof summary.currentFinish === "number"
        ? summary.currentFinish : Math.max(0, ...tasks.map((task) => task.ef ?? 0));
    const delayDays = typeof summary.delayDays === "number" ? summary.delayDays : currentFinish - plannedFinish;

    const retry = () => {
        setState((current) => ({ ...current, loading: true, error: "" }));
        setSupport((current) => ({ ...current, ready: false }));
        setSelectedId(null);
        setAttempt((value) => value + 1);
    };
    const selectTask = (task) => {
        setSelectedId(task.id);
        setEditingProgress(false);
        setProgressState({ saving: false, error: "", success: false });
    };
    const setOrigin = (value) => {
        setCalendarOrigin(value);
        try { localStorage.setItem(`xds-schedule-origin-${projectId}`, value); } catch { /* Viewing still works without browser storage. */ }
    };
    const saveProgress = async (values) => {
        if (!selected || progressState.saving) return;
        const taskId = selected.id;
        setProgressState({ saving: true, error: "", success: false });
        try {
            const saved = await updateTaskProgress(projectId, taskId, values);
            const progress = { actualStart: saved.actual_start_date ?? saved.actualStart ?? null, actualEnd: saved.actual_end_date ?? saved.actualEnd ?? null, percentComplete: saved.percent_complete ?? saved.percentComplete };
            setState((current) => ({ ...current, schedule: current.schedule.map((task) => String(task.id) === String(saved.id) ? { ...task, ...progress } : task) }));
            setEditingProgress(false);
            setProgressState({ saving: false, error: "", success: true });
        } catch (error) {
            setProgressState({ saving: false, error: error.response?.data?.message || "Không thể lưu tiến độ thực tế", success: false });
        }
    };
    const persistTask = async (taskId, values) => {
        const saved = await saveTask(projectId, taskId, values);
        setSupport((current) => ({ ...current, tasks: taskId ? current.tasks.map((task) => String(task.id) === String(saved.id) ? saved : task) : [...current.tasks, saved] }));
        setTaskEditor(saved);
        try {
            // A duration/name edit uses the existing server CPM recalculation; never recompute ES/EF locally.
            const schedule = await getSchedule(projectId);
            setState({ loading: false, schedule, error: "" });
        } catch (error) {
            setState({ loading: false, schedule: [], error: error.response?.data?.message || "Công việc đã lưu nhưng chưa tải lại được tiến độ. Vui lòng tải lại." });
        }
    };
    const editTask = () => {
        const original = support.tasks.find((task) => String(task.id) === String(selectedId)) || state.schedule.find((task) => String(task.id) === String(selectedId));
        setTaskEditor(original);
        setSelectedId(null);
    };
    const addTask = () => setTaskEditor({ work_item_id: support.items.find((item) => !support.items.some((child) => child.parent_id === item.id))?.id });
    const updateDependency = (dependency, removedId) => {
        setSupport((current) => ({ ...current, dependencies: removedId !== undefined ? current.dependencies.filter((entry) => entry.id !== removedId) : [...current.dependencies, dependency] }));
        getSchedule(projectId).then((schedule) => setState({ loading: false, schedule, error: "" })).catch((error) => setState({ loading: false, schedule: [], error: error.response?.data?.message || "Không thể tải tiến độ" }));
    };

    return <div className="schedule-workspace">
        <header className="schedule-heading">
            <div className="schedule-header-actions"><div className="schedule-timeline-nav">
                <button type="button" className="schedule-button" disabled={todayOffset === null || !tasks.length} title={todayOffset === null ? "Gắn ngày khởi công để định vị Hôm nay" : "Đến ngày hôm nay"} onClick={() => setNavigation({ kind: "today", token: Date.now() })}>Hôm nay</button>
                <button type="button" className="schedule-icon-button" aria-label="Cuộn về trước" onClick={() => setNavigation({ kind: "step", direction: -1, token: Date.now() })}><ScheduleIcon name="chevron" /></button>
                <button type="button" className="schedule-icon-button next" aria-label="Cuộn về sau" onClick={() => setNavigation({ kind: "step", direction: 1, token: Date.now() })}><ScheduleIcon name="chevron" /></button>
            </div><div className="schedule-time-unit" role="group" aria-label="Đơn vị trục thời gian">{[["day", "Ngày"], ["week", "Tuần"], ["month", "Tháng"]].map(([unit, label]) => <button key={unit} type="button" aria-pressed={unit === timeUnit} onClick={() => setTimeUnit(unit)}>{label}</button>)}</div>
                {support.items.length ? <button type="button" className="schedule-button primary" onClick={addTask}><ScheduleIcon name="plus" />Công việc</button> : <Link className="schedule-button primary" to={`/work-items?projectId=${projectId}`}><ScheduleIcon name="plus" />Công việc</Link>}
                <Link className="schedule-button" to={`/field-assignments?projectId=${projectId}`}>Giao việc hiện trường</Link>
            </div>
        </header>
        {state.loading ? <ScheduleSkeleton /> : <>
            <ScheduleKpis tasks={tasks} today={todayOffset} />
            {tasks.length > 0 && <div className="schedule-forecast schedule-summary" aria-label="Dự báo hoàn thành CPM">
                <div><span>Kế hoạch hoàn thành</span><strong>{formatPlanDay(plannedFinish, calendarOrigin)}</strong></div>
                <div><span>Dự kiến hiện tại</span><strong>{formatPlanDay(currentFinish, calendarOrigin)}</strong></div>
                <div><span>Chênh lệch tiến độ</span><strong className={delayDays > 0 ? "is-delayed" : "is-early"}>
                    {delayDays > 0 ? `Chậm ${number(delayDays)} ngày` : delayDays < 0 ? `Sớm ${number(Math.abs(delayDays))} ngày` : "Đúng kế hoạch"}
                </strong></div>
            </div>}
            <div className="schedule-board">
                <ScheduleToolbar filters={filters} assignees={assignees} groupIds={groupIds}
                    onChange={(key, value) => setFilters((current) => ({ ...current, [key]: value }))}
                    onCollapse={() => setCollapsedGroups(groupIds)} onShowAll={() => { setFilters(INITIAL_FILTERS); setCollapsedGroups([]); }} />
                <div className="schedule-board-meta"><div><ScheduleIcon name="calendar" /><strong>{calendarOrigin ? `${formatPlanDay(range.start, calendarOrigin)} – ${formatPlanDay(range.end, calendarOrigin)}` : `Ngày ${range.start} – Ngày ${range.end}`}</strong><span>{visible.length}/{tasks.length} công việc</span></div>
                    <div><CalendarSettings value={calendarOrigin} onChange={setOrigin} /><button type="button" className="schedule-icon-button" aria-label="Tải lại" onClick={retry}><ScheduleIcon name="refresh" /></button></div>
                </div>
                {state.error ? <div className="schedule-error"><Alert type="error" showIcon title={state.error} /><button type="button" className="schedule-button" onClick={retry}>Thử lại</button></div> : !tasks.length ? <div className="schedule-empty"><i><ScheduleIcon name="layers" size={30} /></i><h2>Chưa có công việc</h2><p>Bắt đầu xây dựng tiến độ cho dự án bằng cách thêm công việc đầu tiên.</p>
                    {support.items.length ? <button type="button" className="schedule-button primary" onClick={addTask}>+ Thêm công việc</button> : <Link className="schedule-button primary" to={`/work-items?projectId=${projectId}`}>+ Thêm công việc</Link>}
                </div> : !visible.length ? <div className="schedule-empty"><ScheduleIcon name="search" size={28} /><h2>{filters.criticalOnly ? "Không có công việc găng phù hợp" : "Không tìm thấy công việc"}</h2><p>Thử từ khóa khác hoặc bỏ bộ lọc để xem toàn bộ tiến độ.</p><button className="schedule-button" type="button" onClick={() => setFilters(INITIAL_FILTERS)}>Xóa bộ lọc</button></div> : <Gantt tasks={visible} start={range.start} end={range.end} width={width} unit={timeUnit} calendarOrigin={calendarOrigin} today={todayOffset}
                    items={support.items} dependencies={support.dependencies} collapsedGroups={collapsedGroups} navigation={navigation} selectedId={selectedId}
                    onToggleGroup={(id) => setCollapsedGroups((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id])} onBarSelect={selectTask} />}
                <ScheduleLegend tasks={tasks} />
            </div>
            {tasks.length > 0 && <details className="schedule-cpm-details" onToggle={(event) => setCpmExpanded(event.currentTarget.open)}><summary><div><ScheduleIcon name="critical" /><strong>Chi tiết đường găng</strong><span>ES · EF · LS · LF · Float</span></div><span className="schedule-details-chevron">⌄</span></summary>
                <p className="schedule-note">Các mốc tính bằng ngày kể từ lúc khởi công (Ngày 0). Độ trễ là số ngày có thể trì hoãn; công việc găng có độ trễ bằng 0.</p>
                {cpmExpanded && <Table rowKey="id" columns={columns} dataSource={tableTasks} pagination={false} scroll={{ x: 1000 }} rowClassName={(task) => task.newlyCritical ? "schedule-newly-critical-row" : task.isCritical ? "schedule-critical-row" : ""}
                    onRow={(record) => ({ onClick: () => selectTask(toBarModel(record)), onKeyDown: (event) => { if (event.key === "Enter") selectTask(toBarModel(record)); }, tabIndex: 0 })} />}
            </details>}
            {support.ready && support.unavailable.length > 0 && <p className="schedule-support-note">Chưa tải được {support.unavailable.join(", ")}. <button type="button" className="schedule-text-button" onClick={retry}>Tải lại</button></p>}
            <footer className="schedule-footer"><span><i />Kế hoạch thi công · {calendarOrigin ? "Lịch theo mốc khởi công đã chọn" : timeUnit === "month" ? "Tháng quy ước 30 ngày · Chưa gắn lịch dự án" : "Các mốc tính theo ngày tương đối"}</span><Link to={`/work-items?projectId=${projectId}`}>Quay lại cây hạng mục</Link></footer>
        </>}
        <TaskDetailsDrawer task={selected} tasks={tasks} dependencies={support.dependencies} dependenciesLoaded={support.dependenciesLoaded} calendarOrigin={calendarOrigin} today={todayOffset}
            editProgress={editingProgress} onEditProgress={(editing) => { setEditingProgress(editing); setProgressState((current) => ({ ...current, error: "", success: false })); }}
            onEditTask={editTask} onClose={() => { if (!progressState.saving) setSelectedId(null); }} onSaveProgress={saveProgress} saving={progressState.saving} error={progressState.error} success={progressState.success} />
        {taskEditor && <TaskForm key={`${projectId}-${taskEditor.id || "new"}`} projectId={projectId} task={taskEditor} items={support.items} tasks={support.tasks.length ? support.tasks : state.schedule} dependencies={support.dependencies}
            onSave={persistTask} onClose={() => setTaskEditor(null)} onDependencyAdded={(dependency) => updateDependency(dependency)} onDependencyRemoved={(id) => updateDependency(null, id)} />}
    </div>;
>>>>>>> ed6121f (feat: complete tasks T-29 through T-35)
}

export default function Schedule() {
    const [params] = useSearchParams();
    const projectId = Number(params.get("projectId"));
    const validProject = Number.isInteger(projectId) && projectId > 0 && projectId <= 2147483647;
<<<<<<< HEAD
    return (
        <DashboardLayout
            title="Tiến độ & đường găng"
            description="Theo dõi trình tự thi công, thời lượng và các công việc quyết định tiến độ."
        >
            <div className="schedule-page">
                {validProject ? (
                    <ProjectSchedule key={projectId} projectId={projectId} />
                ) : (
                    <Alert type="error" showIcon title="Vui lòng chọn dự án hợp lệ từ cây hạng mục để xem tiến độ." />
                )}
            </div>
        </DashboardLayout>
    );
=======
    return <DashboardLayout title="Tiến độ dự án" description="Theo dõi tiến độ, công việc găng và lịch thi công."><main className="schedule-page">
        {validProject ? <ProjectSchedule key={projectId} projectId={projectId} />
            : <Alert type="error" showIcon title="Vui lòng chọn dự án hợp lệ từ cây hạng mục để xem tiến độ." />}
    </main></DashboardLayout>;
>>>>>>> ed6121f (feat: complete tasks T-29 through T-35)
}
