import { useEffect, useState } from "react";
import { Alert, Button, Card, Checkbox, Empty, Spin, Table, Tag } from "antd";
import { Link, useSearchParams } from "react-router-dom";
import { getSchedule } from "../services/scheduleApi";
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
        <Card className="schedule-panel">
            <div className="schedule-heading">
                <div><h1>Tiến độ công việc</h1><p>Dự án #{projectId}</p></div>
                <Link to={`/work-items?projectId=${projectId}`}>Quay lại cây hạng mục</Link>
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
                    : <Table rowKey="id" columns={columns} dataSource={state.schedule}
                        pagination={false} scroll={{ x: 1000 }}
                        rowClassName={(task) => task.isCritical ? "schedule-critical-row" : ""} />}
        </Card>
    );
}

export default function Schedule() {
    const [params] = useSearchParams();
    const projectId = Number(params.get("projectId"));
    const validProject = Number.isInteger(projectId) && projectId > 0 && projectId <= 2147483647;
    return <main className="schedule-page">
        {validProject ? <ProjectSchedule key={projectId} projectId={projectId} />
            : <Alert type="error" showIcon title="Vui lòng chọn dự án hợp lệ từ cây hạng mục để xem tiến độ." />}
    </main>;
}
