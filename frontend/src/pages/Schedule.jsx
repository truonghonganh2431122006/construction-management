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
}

function ProjectSchedule({ projectId }) {
    const [attempt, setAttempt] = useState(0);
    const [state, setState] = useState({ loading: true, schedule: [], error: "" });
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
            });
        });
        return () => controller.abort();
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
}

export default function Schedule() {
    const [params] = useSearchParams();
    const projectId = Number(params.get("projectId"));
    const validProject = Number.isInteger(projectId) && projectId > 0 && projectId <= 2147483647;
    return <DashboardLayout title="Tiến độ dự án" description="Theo dõi tiến độ, công việc găng và lịch thi công."><main className="schedule-page">
        {validProject ? <ProjectSchedule key={projectId} projectId={projectId} />
            : <Alert type="error" showIcon title="Vui lòng chọn dự án hợp lệ từ cây hạng mục để xem tiến độ." />}
    </main></DashboardLayout>;
}
