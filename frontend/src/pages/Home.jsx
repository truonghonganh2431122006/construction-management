import { Link, useLocation } from "react-router-dom";
import useRemote from "../hooks/useRemote";
import { scopedLink } from "../services/navigation";
import "../styles/Home.css";

const heroImg =
  "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=85";
const logSlab =
  "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=500&q=80";
const logFormwork =
  "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=500&q=80";
const avatarMinh =
  "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=200&q=80";

/* ---------------- icons ---------------- */
const I = {
  home: "M3 10.5 12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z",
  project: "M3 7h7l2 2h9v11H3z",
  users: "M16 19v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 9a4 4 0 1 0 0-8 4 4 0 0 0 0 8m13 10v-2a4 4 0 0 0-3-3.9",
  tree: "M4 4h6v5H4zM14 2h6v5h-6zM14 11h6v5h-6zM10 6.5h4M10 13.5h4M7 9v10h7",
  gantt: "M4 6h9M4 11h13M4 16h7M4 21h16M4 3v18",
  calendar: "M3 5h18v16H3zM3 10h18M8 3v4M16 3v4",
  assign: "M9 11l3 3 7-7M4 5h10M4 10h5M4 15h7M4 20h9",
  journal: "M5 3h14v18H5zM9 7h7M9 11h7M9 15h4",
  check: "M4 4h16v16H4zM8 12l3 3 5-6",
  payment: "M3 7h18v10H3zM3 11h18M7 15h3",
  cost: "M12 2 3 7v10l9 5 9-5V7zM3 7l9 5 9-5M12 12v10",
  photo: "M3 5h18v14H3zM3 15l5-5 4 4 3-3 6 6",
  report: "M6 3h9l4 4v14H6zM14 3v5h5M9 13h7M9 17h5",
  bell: "M18 16V11a6 6 0 1 0-12 0v5l-2 3h16zM10 22h4",
  system: "M4 5h16v14H4zM8 9h8M8 13h5",
  settings:
    "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2V21a2 2 0 1 1-4 0v-.1A1.7 1.7 0 0 0 7 19.4a1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0-1.2-2.9H1a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 2.6 7",
  search: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16m10 2-4.5-4.5",
  help: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20M9.5 9a2.5 2.5 0 1 1 3.4 2.3c-.6.3-.9.9-.9 1.5v.5M12 17h.01",
  chevron: "m6 9 6 6 6-6",
  building: "M4 21V5l8-3v19M12 21V9l8 3v9M7 8h2M7 12h2M7 16h2M15 13h2M15 17h2",
  warn: "M12 3 2 20h20zM12 9v5M12 17h.01",
  cube: "M12 2 3 7v10l9 5 9-5V7zM3 7l9 5 9-5M12 12v10",
  money: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20M12 6v12M14.5 9.5c0-1-1.1-1.5-2.5-1.5s-2.5.5-2.5 1.7S10.8 11.5 12 12s2.6 1 2.6 2.2S13.4 16 12 16s-2.5-.6-2.5-1.5",
  arrow: "M5 12h14M13 6l6 6-6 6",
  plus: "M12 5v14M5 12h14",
  folder: "M3 7h7l2 2h9v11H3z",
  trend: "M3 17l6-6 4 4 7-7M14 8h6v6",
  bolt: "M13 2 4 14h7l-1 8 9-12h-7z",
  user: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8",
  info: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20M12 8h.01M11 12h1v5h1",
  chevronR: "m9 6 6 6-6 6",
  chevronD: "m6 9 6 6 6-6",
  collapse: "m11 17-5-5 5-5M18 17l-5-5 5-5",
};

function Icon({
  d,
  size = 18,
  color = "currentColor",
  width = 1.8,
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={width}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  );
}

/* ---------------- data ---------------- */
const MENU = [
  { label: "Tổng quan", icon: I.home, to: "/home", active: true },
  { label: "Dự án", icon: I.project, to: "/projects" },
  { label: "Thành viên & phân quyền", icon: I.users, to: "/members" },
  { label: "Cây hạng mục", icon: I.tree, to: "/work-items" },
  { label: "Tiến độ & đường găng", icon: I.gantt, to: "/schedule" },
  { label: "Lịch làm việc", icon: I.calendar, to: "/calendar" },
  { label: "Giao việc hiện trường", icon: I.assign, to: "/field-assignments" },
  { label: "Nhật ký công trường", icon: I.journal, to: "/site-journal" },
  { label: "Nghiệm thu khối lượng", icon: I.check, to: "/acceptance" },
  { label: "Thanh toán", icon: I.payment, to: "/payments" },
  { label: "Chi phí & vật tư", icon: I.cost, to: "/costs-materials" },
  { label: "Ảnh hiện trường", icon: I.photo, to: "/site-photos" },
  { label: "Báo cáo", icon: I.report, to: "/reports" },
  { label: "Thông báo", icon: I.bell, to: "/notifications" },
  { label: "Nhật ký hệ thống", icon: I.system, to: "/audit-logs" },
  { label: "Cài đặt", icon: I.settings, to: "/settings" },
];

const KPIS = [
  {
    label: "Dự án đang hoạt động",
    value: "6",
    trend: "+1",
    note: "so với tháng trước",
    icon: I.building,
    color: "#1988ff",
    bg: "#e8f2ff",
  },
  { label: "Tiến độ tổng", value: "68%", trend: "+6%", note: "so với tháng trước", donut: 68 },
  {
    label: "Công việc găng",
    value: "3",
    trend: "+1",
    note: "đang chậm tiến độ",
    icon: I.warn,
    color: "#ef4444",
    bg: "#fdecec",
    down: true,
  },
  {
    label: "Nhật ký chờ đồng bộ",
    value: "5",
    trend: "+2",
    note: "mục chưa đồng bộ",
    icon: I.journal,
    color: "#ff8500",
    bg: "#fff3e2",
    down: true,
  },
  {
    label: "Khối lượng đã nghiệm thu",
    value: "12.350 m³",
    trend: "+8%",
    note: "so với kỳ trước",
    icon: I.cube,
    color: "#17b7e8",
    bg: "#e5f6fd",
  },
  {
    label: "Giá trị thanh toán đề nghị",
    value: "8,5 tỷ VNĐ",
    trend: "+12%",
    note: "so với kỳ trước",
    icon: I.money,
    color: "#ff8500",
    bg: "#fff3e2",
  },
];

const GANTT = [
  { name: "1. Thi công phần móng", pct: "100%", caret: "down", bar: { l: 1, w: 20, type: "done" } },
  { name: "2. Thi công phần thân", pct: "70%", caret: "down", bar: { l: 21, w: 37, type: "normal" } },
  { name: "2.1. Cột, vách tầng 1-10", pct: "100%", child: true, bar: { l: 22, w: 17, type: "done" } },
  { name: "2.2. Cột, vách tầng 11-20", pct: "75%", child: true, bar: { l: 33, w: 20, type: "light" } },
  {
    name: "2.3. Sàn tầng 11-20 (Công việc găng)",
    pct: "",
    child: true,
    critical: true,
    bar: { l: 45, w: 27, type: "critical" },
  },
  { name: "3. Thi công hoàn thiện", pct: "25%", caret: "right", bar: { l: 60, w: 24, type: "notstarted" } },
  { name: "4. Hạ tầng, cảnh quan", pct: "0%", caret: "right", bar: { l: 76, w: 22, type: "notstarted" } },
];

const TASKS = [
  ["Thi công sàn tầng 15", "01/08/2025", "05/08/2025", "Đội bê tông", "Sắp đến hạn", "orange"],
  ["Lắp đặt coppha sàn tầng 16", "03/08/2025", "07/08/2025", "Đội coppha", "Sắp đến hạn", "orange"],
  ["Thi công tường bao tầng 12", "28/07/2025", "06/08/2025", "Đội xây", "Đang thực hiện", "blue"],
  ["Lắp đặt MEP tầng 10-12", "01/08/2025", "10/08/2025", "Đội MEP", "Bình thường", "green"],
  ["Hoàn thiện mặt đứng block A", "05/08/2025", "15/08/2025", "Đội hoàn thiện", "Bình thường", "green"],
];

const LOGS = [
  {
    img: logSlab,
    title: "Thi công sàn tầng 14 - Block A",
    meta: "Hôm nay, 08:30  |  Nguyễn Văn Minh",
    photos: "12 ảnh",
    place: "Vị trí: Tầng 14",
    status: "Đã đồng bộ",
    tone: "green",
  },
  {
    img: logFormwork,
    title: "Lắp đặt cốp pha cột tầng 15",
    meta: "Hôm qua, 16:20  |  Trần Văn Hùng",
    photos: "8 ảnh",
    place: "Vị trí: Tầng 15",
    status: "Chờ đồng bộ",
    tone: "orange",
  },
  {
    img: logSlab,
    title: "Nghiệm thu thép sàn tầng 13",
    meta: "01/08/2025, 14:15  |  Lê Minh Quân",
    photos: "15 ảnh",
    place: "Vị trí: Tầng 13",
    status: "Đã đồng bộ",
    tone: "green",
  },
  {
    img: logFormwork,
    title: "Thi công tường bao tầng 12",
    meta: "01/08/2025, 10:20  |  Phạm Thị Hạnh",
    photos: "6 ảnh",
    place: "Vị trí: Tầng 12",
    status: "Chờ đồng bộ",
    tone: "orange",
  },
];

const COSTS = [
  { name: "Phần móng", plan: 12.0, real: 10.5 },
  { name: "Phần thân", plan: 38.0, real: 28.5 },
  { name: "Hoàn thiện", plan: 32.0, real: 20.1 },
  { name: "MEP", plan: 18.0, real: 11.2 },
  { name: "Hạ tầng cảnh quan", plan: 20.0, real: 8.3 },
];

const ALERTS = [
  {
    tone: "red",
    icon: I.warn,
    title: 'Công việc găng "Sàn tầng 11-20" trễ 3 ngày',
    desc: "Cần đẩy nhanh tiến độ thi công.",
    time: "2 giờ trước",
  },
  {
    tone: "orange",
    icon: I.warn,
    title: "Chu trình phụ thuộc bị chặn",
    desc: 'Công việc "Lắp đặt MEP tầng 10-12" chưa thể bắt đầu do "Hoàn thiện trần tầng 9" chưa xong.',
    time: "4 giờ trước",
  },
  {
    tone: "orange",
    icon: I.warn,
    title: "Hạng mục hoàn thiện sắp vượt dự toán",
    desc: "Đã sử dụng 85% ngân sách, cần kiểm soát chặt.",
    time: "6 giờ trước",
  },
  {
    tone: "blue",
    icon: I.info,
    title: "Nhật ký ngoại tuyến còn 5 mục chưa đồng bộ",
    desc: "Vui lòng kiểm tra kết nối và đồng bộ dữ liệu.",
    time: "1 ngày trước",
  },
  {
    tone: "blue",
    icon: I.info,
    title: "Ảnh hiện trường thiếu siêu dữ liệu",
    desc: "Có 12 ảnh thiếu thông tin vị trí, thời gian. Đánh dấu nghi vấn.",
    time: "1 ngày trước",
  },
];

const ROLES = [
  { name: "Ban quản lý", count: 6, color: "#1988ff" },
  { name: "Chủ đầu tư", count: 4, color: "#ff8500" },
  { name: "Chỉ huy trưởng", count: 3, color: "#17b26a" },
  { name: "Kỹ sư giám sát", count: 8, color: "#8b5cf6" },
  { name: "Đội trưởng", count: 5, color: "#f97316" },
  { name: "Kế toán", count: 2, color: "#f0a7c0" },
];

/* ---------------- small components ---------------- */
function Donut({
  value,
  size = 46,
  stroke = 7,
  color = "#17b26a",
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e9eef5" strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={`${(c * value) / 100} ${c}`}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </svg>
  );
}

function RoleDonut() {
  const total = ROLES.reduce((s, r) => s + r.count, 0);
  const size = 150;
  const stroke = 24;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        {ROLES.map((role, index) => {
          const len = (c * role.count) / total;
          const offset = (c * ROLES.slice(0, index).reduce((sum, entry) => sum + entry.count, 0)) / total;
          return (
            <circle
              key={role.name}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={role.color}
              strokeWidth={stroke}
              strokeDasharray={`${len - 2} ${c - len + 2}`}
              strokeDashoffset={-offset}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          );
        })}
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <strong style={{ fontSize: 22 }}>{total}</strong>
        <span style={{ fontSize: 11, color: "#667085" }}>thành viên</span>
      </div>
    </div>
  );
}

function CostChart() {
  const max = 40;
  return (
    <div className="xds-chart">
      <div className="xds-chart-legend">
        <span>
          <i style={{ background: "#1988ff" }} />
          Dự toán
        </span>
        <span>
          <i style={{ background: "#ff8500" }} />
          Thực tế
        </span>
      </div>
      <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            fontSize: 10,
            color: "#98a2b3",
            height: 130,
            paddingBottom: 18,
          }}
        >
          {[40, 30, 20, 10, 0].map((t) => (
            <span key={t}>{t}</span>
          ))}
        </div>
        <div style={{ flex: 1, display: "flex", alignItems: "flex-end", gap: 8, height: 130 }}>
          {COSTS.map((item) => (
            <div
              key={item.name}
              style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}
            >
              <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 112, width: "100%" }}>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
                  <span style={{ fontSize: 9, textAlign: "center", color: "#475467" }}>{item.plan}</span>
                  <div
                    style={{
                      height: `${(item.plan / max) * 100}%`,
                      background: "#1988ff",
                      borderRadius: "3px 3px 0 0",
                    }}
                  />
                </div>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
                  <span style={{ fontSize: 9, textAlign: "center", color: "#475467" }}>{item.real}</span>
                  <div
                    style={{
                      height: `${(item.real / max) * 100}%`,
                      background: "#ff8500",
                      borderRadius: "3px 3px 0 0",
                    }}
                  />
                </div>
              </div>
              <span
                style={{
                  fontSize: 9,
                  color: "#667085",
                  textAlign: "center",
                  lineHeight: 1.15,
                  minHeight: 22,
                }}
              >
                {item.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------------- page ---------------- */
export default function Home() {
  const { search } = useLocation();
  const membersProjectId = new URLSearchParams(search).get("projectId");
  const projects = useRemote("/projects");
  const selectedProject = projects.data?.projects.find((project) => project.id === Number(membersProjectId));
  return (
    <div className="xds-dashboard">
      {/* SIDEBAR */}
      <aside className="xds-sidebar">
        <div className="xds-brand">
          <span className="xds-brand-logo">
            <Icon d={I.building} size={20} color="#1988ff" />
          </span>
          <span className="xds-brand-text">
            <div className="xds-brand-name">XÂY DỰNG SỐ</div>
            <div className="xds-brand-sub">Nền tảng điều hành thi công công trình</div>
          </span>
        </div>

        <nav className="xds-nav">
          {MENU.map((item) =>
            item.to ? (
              <Link
                key={item.label}
                to={scopedLink(item.to, membersProjectId)}
                className={`xds-nav-item${item.active ? " is-active" : ""}`}
              >
                <Icon d={item.icon} />
                <span>{item.label}</span>
                {item.badge ? <span className="xds-nav-badge">{item.badge}</span> : null}
              </Link>
            ) : (
              <button key={item.label} type="button" className="xds-nav-item">
                <Icon d={item.icon} />
                <span>{item.label}</span>
                {item.badge ? <span className="xds-nav-badge">{item.badge}</span> : null}
              </button>
            ),
          )}
        </nav>

        <button type="button" className="xds-collapse">
          <Icon d={I.collapse} size={16} />
          <span>Thu gọn</span>
        </button>
      </aside>

      {/* MAIN */}
      <div className="xds-main">
        <header className="xds-topbar">
          <div className="xds-topbar-left">
            <span className="xds-topbar-label">Dự án hiện tại:</span>
            <Link className="xds-select" to={scopedLink("/projects", membersProjectId)}>
              {selectedProject?.name || "Chọn dự án"}
              <Icon d={I.chevronD} size={16} color="#667085" />
            </Link>
          </div>

          <div className="xds-search">
            <Icon d={I.search} size={16} color="#98a2b3" />
            <input placeholder="Tìm kiếm hạng mục, công việc, thành viên..." />
            <span className="xds-kbd">Ctrl + K</span>
          </div>

          <div className="xds-topbar-right">
            <button type="button" className="xds-icon-btn" aria-label="Thông báo">
              <Icon d={I.bell} size={20} color="#1988ff" />
              <span className="xds-dot-badge">5</span>
            </button>
            <button type="button" className="xds-icon-btn">
              <Icon d={I.help} size={19} />
              Trợ giúp
            </button>
            <div className="xds-user">
              <img src={avatarMinh} alt="Nguyễn Văn Minh" width={816} height={816} loading="lazy" />
              <div>
                <div className="xds-user-name">Nguyễn Văn Minh</div>
                <div className="xds-user-role">Quản lý dự án</div>
              </div>
              <Icon d={I.chevronD} size={16} color="#98a2b3" />
            </div>
          </div>
        </header>

        <main className="xds-content">
          {/* KPI */}
          <section className="xds-kpis">
            {KPIS.map((k) => (
              <div className="xds-card xds-kpi" key={k.label}>
                {k.donut ? (
                  <div className="xds-donut-sm">
                    <Donut value={k.donut} />
                  </div>
                ) : (
                  <span className="xds-kpi-icon" style={{ background: k.bg }}>
                    <Icon d={k.icon} size={21} color={k.color ?? "#1988ff"} />
                  </span>
                )}
                <div style={{ minWidth: 0 }}>
                  <div className="xds-kpi-label">{k.label}</div>
                  <div className="xds-kpi-value">
                    {k.value}
                    <span className={`xds-trend ${k.down ? "down" : "up"}`}>↑ {k.trend}</span>
                  </div>
                  <div className="xds-kpi-note">{k.note}</div>
                </div>
              </div>
            ))}
          </section>

          {/* ROW 1 */}
          <section className="xds-row-1">
            {/* A. Tổng quan dự án */}
            <article className="xds-card">
              <div className="xds-card-head">
                <h2 className="xds-card-title">Tổng quan dự án</h2>
                <button type="button" className="xds-link-btn">
                  Xem chi tiết tại dự án →
                </button>
              </div>
              <div className="xds-card-body">
                <div className="xds-project-grid">
                  <img
                    className="xds-project-hero"
                    src={heroImg}
                    alt="Chung cư Riverside"
                    width={944}
                    height={704}
                  />
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <h3 className="xds-project-name">Chung cư Riverside</h3>
                      <span className="xds-badge red">Chậm tiến độ</span>
                    </div>
                    <div className="xds-muted" style={{ marginTop: 4 }}>
                      Khu căn hộ cao tầng ven sông Sài Gòn
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10 }}>
                      <span className="xds-muted">Giai đoạn hiện tại</span>
                      <span className="xds-badge blue">Thi công phần thân</span>
                    </div>
                    <div className="xds-muted" style={{ marginTop: 10 }}>
                      Tiến độ hoàn thành
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 5 }}>
                      <div className="xds-progress" style={{ flex: 1 }}>
                        <span style={{ width: "68%" }} />
                      </div>
                      <strong style={{ fontSize: 13 }}>68%</strong>
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 9, marginTop: 12 }}>
                  <div className="xds-date-box">
                    <Icon d={I.calendar} size={18} color="#1988ff" />
                    <div>
                      <div className="xds-date-label">Ngày hoàn thành theo kế hoạch</div>
                      <div className="xds-date-value">30/09/2025</div>
                    </div>
                  </div>
                  <div className="xds-date-box">
                    <Icon d={I.calendar} size={18} color="#ef4444" />
                    <div>
                      <div className="xds-date-label">Ngày hoàn thành dự kiến</div>
                      <div className="xds-date-value red">03/10/2025</div>
                      <span className="xds-badge red" style={{ marginTop: 4 }}>
                        Trễ 3 ngày
                      </span>
                    </div>
                  </div>
                </div>

                <div className="xds-people">
                  {[
                    ["Chủ đầu tư", "Công ty CP Đầu tư Riverside"],
                    ["Ban quản lý", "Ban QLDA Riverside"],
                    ["Chỉ huy trưởng", "Trần Văn Hùng"],
                  ].map(([role, name]) => (
                    <div className="xds-person" key={role}>
                      <span className="xds-avatar-box">
                        <Icon d={I.user} size={16} />
                      </span>
                      <div style={{ minWidth: 0 }}>
                        <div className="xds-person-role">{role}</div>
                        <div className="xds-person-name">{name}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </article>

            {/* B. Tiến độ & đường găng */}
            <article className="xds-card">
              <div className="xds-card-head">
                <h2 className="xds-card-title">Tiến độ &amp; đường găng</h2>
                <span className="xds-badge red">⚠ 1 công việc găng trễ 3 ngày</span>
              </div>
              <div className="xds-legend">
                <span>
                  <i style={{ background: "#3b9bff" }} />
                  Công việc thường
                </span>
                <span>
                  <i style={{ background: "#ff8500" }} />
                  Công việc găng
                </span>
                <span>
                  <i style={{ background: "#37c48a" }} />
                  Đã hoàn thành
                </span>
                <span>
                  <i style={{ background: "#1988ff" }} />
                  Đang thực hiện
                </span>
                <span>
                  <i style={{ background: "#cfd7e3" }} />
                  Chưa bắt đầu
                </span>
              </div>

              <div className="xds-gantt">
                <div className="xds-gantt-left">
                  <div className="xds-gantt-head">Hạng mục / Công việc</div>
                  {GANTT.map((row) => (
                    <div
                      key={row.name}
                      className={`xds-gantt-row${row.child ? " child" : ""}${row.critical ? " critical" : ""}`}
                    >
                      {row.caret ? (
                        <Icon d={row.caret === "down" ? I.chevronD : I.chevronR} size={11} color="#98a2b3" />
                      ) : null}
                      <span
                        style={{
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {row.name}
                      </span>
                      {row.pct ? <span className="pct">{row.pct}</span> : null}
                    </div>
                  ))}
                </div>

                <div className="xds-gantt-right">
                  <div className="xds-gantt-head xds-gantt-months">
                    <div>Tháng 6/2025</div>
                    <div>Tháng 7/2025</div>
                    <div>Tháng 8/2025</div>
                    <div>Tháng 9/2025</div>
                  </div>
                  <div className="xds-gantt-grid">
                    <div />
                    <div />
                    <div />
                    <div />
                  </div>
                  <div className="xds-gantt-bars">
                    {GANTT.map((row) => (
                      <div className="xds-bar-row" key={row.name}>
                        <div
                          className={`xds-bar ${row.bar.type}`}
                          style={{ left: `${row.bar.l}%`, width: `${row.bar.w}%` }}
                        />
                      </div>
                    ))}
                    <div className="xds-today" style={{ left: "60%" }}>
                      <span>Hôm nay</span>
                    </div>
                  </div>
                </div>
              </div>
            </article>

            {/* C. Công việc sắp đến hạn */}
            <article className="xds-card">
              <div className="xds-card-head">
                <h2 className="xds-card-title">Công việc sắp đến hạn</h2>
                <button type="button" className="xds-link-btn">
                  Xem tất cả
                </button>
              </div>
              <div className="xds-table-wrap">
                <table className="xds-table">
                  <thead>
                    <tr>
                      <th>Công việc</th>
                      <th>Ngày bắt đầu</th>
                      <th>Ngày kết thúc</th>
                      <th>Phụ trách</th>
                      <th>Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {TASKS.map((t) => (
                      <tr key={t[0]}>
                        <td style={{ fontWeight: 600 }}>{t[0]}</td>
                        <td>{t[1]}</td>
                        <td className={t[5] === "orange" ? "date-red" : ""}>{t[2]}</td>
                        <td>{t[3]}</td>
                        <td>
                          <span className={`xds-badge ${t[5]}`}>{t[4]}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>
          </section>

          {/* ROW 2 */}
          <section className="xds-row-2">
            {/* Nhật ký công trường */}
            <article className="xds-card">
              <div className="xds-card-head">
                <h2 className="xds-card-title">Nhật ký công trường</h2>
                <button type="button" className="xds-link-btn">
                  Xem tất cả
                </button>
              </div>
              <div className="xds-card-body" style={{ paddingTop: 0 }}>
                {LOGS.map((log, i) => (
                  <div className="xds-log" key={`${log.title}-${i}`}>
                    <img src={log.img} alt={log.title} width={816} height={816} loading="lazy" />
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                        <div className="xds-log-title">{log.title}</div>
                        <span className={`xds-badge ${log.tone}`} style={{ marginLeft: "auto" }}>
                          {log.status}
                        </span>
                      </div>
                      <div className="xds-log-meta">{log.meta}</div>
                      <div className="xds-log-foot">
                        <span>
                          <Icon d={I.photo} size={12} /> {log.photos}
                        </span>
                        <span>|</span>
                        <span>{log.place}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </article>

            {/* Nghiệm thu & thanh toán */}
            <article className="xds-card">
              <div className="xds-card-head">
                <h2 className="xds-card-title">Nghiệm thu &amp; thanh toán</h2>
                <button type="button" className="xds-link-btn">
                  Xem chi tiết
                </button>
              </div>
              <div className="xds-card-body" style={{ paddingTop: 0 }}>
                <div className="xds-metric">
                  <span className="xds-metric-icon" style={{ background: "#e8f2ff" }}>
                    <Icon d={I.cube} size={17} color="#1988ff" />
                  </span>
                  <div>
                    <div className="xds-metric-label">Khối lượng hợp đồng</div>
                    <div className="xds-metric-value">25.000 m³</div>
                  </div>
                </div>
                <div className="xds-metric">
                  <span className="xds-metric-icon" style={{ background: "#e7f7ef" }}>
                    <Icon d={I.check} size={17} color="#17b26a" />
                  </span>
                  <div style={{ flex: 1 }}>
                    <div className="xds-metric-label">Khối lượng lũy kế đã nghiệm thu</div>
                    <div className="xds-metric-value">12.350 m³</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 5 }}>
                      <div className="xds-progress green" style={{ flex: 1 }}>
                        <span style={{ width: "49.4%" }} />
                      </div>
                      <strong style={{ fontSize: 12 }}>49,4%</strong>
                    </div>
                  </div>
                </div>
                <div className="xds-metric">
                  <span className="xds-metric-icon" style={{ background: "#e5f6fd" }}>
                    <Icon d={I.trend} size={17} color="#17b7e8" />
                  </span>
                  <div style={{ flex: 1 }}>
                    <div className="xds-metric-label">Tỷ lệ so với hợp đồng</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div className="xds-metric-value green">49,4%</div>
                      <span className="xds-badge green" style={{ marginLeft: "auto" }}>
                        Không vượt
                      </span>
                    </div>
                  </div>
                </div>
                <div className="xds-metric">
                  <span className="xds-metric-icon" style={{ background: "#fff3e2" }}>
                    <Icon d={I.money} size={17} color="#ff8500" />
                  </span>
                  <div>
                    <div className="xds-metric-label">Giá trị đề nghị thanh toán kỳ này</div>
                    <div className="xds-metric-value">8,5 tỷ VNĐ</div>
                  </div>
                </div>
                <div className="xds-metric">
                  <span className="xds-metric-icon" style={{ background: "#f1f4f8" }}>
                    <Icon d={I.report} size={17} color="#566178" />
                  </span>
                  <div>
                    <div className="xds-metric-label">Trạng thái hồ sơ</div>
                    <span className="xds-badge blue" style={{ marginTop: 3 }}>
                      Đang trình duyệt
                    </span>
                  </div>
                </div>
              </div>
            </article>

            {/* Chi phí & vật tư */}
            <article className="xds-card">
              <div className="xds-card-head">
                <h2 className="xds-card-title">Chi phí &amp; vật tư</h2>
                <button type="button" className="xds-link-btn">
                  Xem chi tiết
                </button>
              </div>
              <div className="xds-card-body" style={{ paddingTop: 10 }}>
                <div className="xds-cost-grid">
                  <div>
                    <div className="xds-metric-label">Tổng dự toán</div>
                    <div className="xds-metric-value">120 tỷ VNĐ</div>
                  </div>
                  <div>
                    <div className="xds-metric-label">Chi phí thực tế</div>
                    <div className="xds-metric-value">78,6 tỷ VNĐ</div>
                  </div>
                  <div>
                    <div className="xds-metric-label">Tỷ lệ thực hiện</div>
                    <div className="xds-metric-value">65,5%</div>
                    <div className="xds-progress green" style={{ marginTop: 5 }}>
                      <span style={{ width: "65.5%" }} />
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: 12, fontWeight: 700, marginTop: 12 }}>
                  Chi phí theo hạng mục (tỷ VNĐ)
                </div>
                <CostChart />

                <div className="xds-alert-banner">
                  <Icon d={I.warn} size={14} color="#ff8500" />
                  <span>Hạng mục Phần hoàn thiện đã sử dụng 85% dự toán</span>
                  <Icon d={I.chevronR} size={13} color="#c08a3e" />
                </div>
              </div>
            </article>

            {/* Cảnh báo / thông báo */}
            <article className="xds-card">
              <div className="xds-card-head">
                <h2 className="xds-card-title">Cảnh báo / thông báo</h2>
                <button type="button" className="xds-link-btn">
                  Xem tất cả
                </button>
              </div>
              <div className="xds-card-body" style={{ paddingTop: 0 }}>
                {ALERTS.map((a) => (
                  <div className="xds-alert" key={a.title}>
                    <span
                      className="xds-metric-icon"
                      style={{
                        background:
                          a.tone === "red" ? "#fdecec" : a.tone === "orange" ? "#fff3e2" : "#e8f2ff",
                        width: 28,
                        height: 28,
                        flex: "0 0 28px",
                      }}
                    >
                      <Icon
                        d={a.icon}
                        size={15}
                        color={a.tone === "red" ? "#ef4444" : a.tone === "orange" ? "#ff8500" : "#1988ff"}
                      />
                    </span>
                    <div style={{ minWidth: 0 }}>
                      <div className={`xds-alert-title ${a.tone}`}>{a.title}</div>
                      <div className="xds-alert-desc">{a.desc}</div>
                      <div className="xds-alert-time">{a.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </article>

            {/* Người dùng theo vai trò */}
            <article className="xds-card">
              <div className="xds-card-head">
                <h2 className="xds-card-title">Người dùng theo vai trò</h2>
                <button type="button" className="xds-link-btn">
                  Xem tất cả
                </button>
              </div>
              <div className="xds-card-body">
                <div className="xds-roles">
                  <RoleDonut />
                  <div className="xds-role-legend">
                    {ROLES.map((r) => (
                      <div key={r.name}>
                        <i style={{ background: r.color }} />
                        {r.name}
                        <b>{r.count}</b>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </article>
          </section>

          {/* QUICK ACTIONS */}
          <section className="xds-card xds-quick">
            <span className="xds-quick-title">
              <Icon d={I.bolt} size={17} color="#ff8500" />
              Thao tác nhanh
            </span>
            <button type="button" className="xds-btn primary">
              <Icon d={I.plus} size={16} />
              Tạo dự án
            </button>
            <button type="button" className="xds-btn">
              <Icon d={I.folder} size={16} color="#667085" />
              Thêm hạng mục
            </button>
            <button type="button" className="xds-btn">
              <Icon d={I.trend} size={16} color="#1988ff" />
              Cập nhật tiến độ
            </button>
            <button type="button" className="xds-btn">
              <Icon d={I.journal} size={16} color="#667085" />
              Ghi nhật ký
            </button>
            <button type="button" className="xds-btn">
              <Icon d={I.check} size={16} color="#1988ff" />
              Lập phiếu nghiệm thu
            </button>
            <button type="button" className="xds-btn warn">
              <Icon d={I.money} size={16} />
              Tạo đề nghị thanh toán
            </button>
          </section>
        </main>
      </div>
    </div>
  );
}
