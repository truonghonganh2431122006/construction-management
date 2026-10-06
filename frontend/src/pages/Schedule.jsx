import { useEffect, useState } from "react";
import { Alert, Button, Checkbox, Empty, Spin, Table, Tag } from "antd";
import { Link, useSearchParams } from "react-router-dom";
import { getSchedule } from "../services/scheduleApi";
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
    { title: "Trạng thái", dataIndex: "isCritical", key: "critical", render: (value) =>
        <Tag color={value ? "red" : "default"}>{value ? "Găng" : "Không găng"}</Tag> }
];

function Gantt({ tasks }) {
    const [zoom, setZoom] = useState(1);
    const end = Math.max(1, ...tasks.map((task) => task.lf));
    const step = Math.max(1, Math.ceil(end / 8));
    const horizon = Math.ceil(end / step) * step;
    const ticks = Array.from({ length: horizon / step + 1 }, (_, index) => index * step);
    return <section className="schedule-gantt" aria-label="Biểu đồ Gantt"><div className="gantt-tools"><div className="gantt-legend"><span><i className="critical" />Công việc găng</span><span><i />Công việc thường</span><span><i className="float" />Khoảng dự trữ</span></div><label>Hiển thị <select aria-label="Tỷ lệ Gantt" value={zoom} onChange={(event)=>setZoom(Number(event.target.value))}><option value={1}>Vừa khung</option><option value={1.5}>150%</option><option value={2}>200%</option></select></label></div><div className="gantt-scroll" tabIndex={0} role="region" aria-label="Dòng thời gian công việc"><div className="gantt-canvas" style={{minWidth:`${780 * zoom}px`}}><div className="gantt-header"><span>Công việc / Thời lượng</span><div className="gantt-axis">{ticks.map((tick)=><span key={tick} style={{left:`${tick / horizon * 100}%`}}>{tick}</span>)}</div></div>{tasks.map((task)=><div className={`gantt-row ${task.isCritical ? "is-critical" : ""}`} key={task.id}><div className="gantt-task"><Icon name="task" size={16} /><span><strong>{task.name}</strong><small>{task.duration_days} ngày · {task.isCritical ? "Đường găng" : `Dự trữ ${task.slack} ngày`}</small></span></div><div className="gantt-lane" style={{backgroundSize:`${step / horizon * 100}% 100%`}}>{task.slack > 0 && <span className="gantt-float" style={{left:`${task.ef / horizon * 100}%`,width:`${task.slack / horizon * 100}%`}} title={`Dự trữ ${task.slack} ngày`} />}<span className={`gantt-bar ${task.duration_days === 0 ? "is-milestone" : ""}`} style={{left:`${task.es / horizon * 100}%`,width:`${(task.ef - task.es) / horizon * 100}%`}} title={`${task.name}: ES ${task.es}, EF ${task.ef}, LS ${task.ls}, LF ${task.lf}, dự trữ ${task.slack} ngày`}><span>{task.es} → {task.ef}</span></span></div></div>)}</div></div><p className="gantt-caption">Đơn vị: ngày tương đối từ mốc 0. Thanh màu thể hiện ES → EF; phần nét đứt thể hiện độ dự trữ.</p></section>;
}

function ProjectSchedule({ projectId }) {
    const [criticalOnly, setCriticalOnly] = useState(false);
    const [attempt, setAttempt] = useState(0);
    const [state, setState] = useState({ loading: true, schedule: [], error: "" });

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

    return (
        <section className="ops-card schedule-panel">
            <SectionHeading icon="trend" title="Tiến độ công việc" description={`Dự án #${projectId} · Kế hoạch theo đường găng CPM`} />
            <div className="schedule-heading-links">
                <Link to={`/work-items?projectId=${projectId}`}>Quay lại cây hạng mục</Link>
                <Link to={`/field-assignments?projectId=${projectId}`}>Giao việc hiện trường</Link>
            </div>
            <p className="schedule-note">Các mốc tính bằng ngày kể từ lúc khởi công (Ngày 0).
                {" "}Độ trễ là số ngày có thể trì hoãn; công việc găng có độ trễ bằng 0.</p>
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
                    : <><div className="schedule-summary"><div><span>Công việc hiển thị</span><strong>{state.schedule.length}</strong></div><div><span>Công việc găng</span><strong className="schedule-critical-number">{state.schedule.filter((task)=>task.isCritical).length}</strong></div><div><span>Kết thúc sớm nhất trong kết quả</span><strong>Ngày {Math.max(...state.schedule.map((task)=>task.ef))}</strong></div></div><Gantt tasks={state.schedule} /><div className="schedule-cpm-heading"><h2>Chi tiết tính toán CPM</h2><span>ES / EF · LS / LF · Độ dự trữ</span></div><Table rowKey="id" columns={columns} dataSource={state.schedule}
                        pagination={false} scroll={{ x: 1000 }}
                        rowClassName={(task) => task.isCritical ? "schedule-critical-row" : ""} /></>}
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
