import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import "../styles/Register.css";

/* ---------------- icons (inline SVG) ---------------- */

const Ico = {
  user: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  mail: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-10 6L2 7" />
    </svg>
  ),
  phone: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="6" y="2" width="12" height="20" rx="2.5" />
      <path d="M11 18.5h2" />
    </svg>
  ),
  building: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <path d="M8 7h2M14 7h2M8 11h2M14 11h2M8 15h2M14 15h2" />
    </svg>
  ),
  lock: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="10" width="16" height="11" rx="2.5" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  ),
  caret: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 9 6 6 6-6" />
    </svg>
  ),
  eye: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  eyeOff: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3l18 18" />
      <path d="M10.6 6.2A9.9 9.9 0 0 1 12 6c6.4 0 10 7 10 7a17.6 17.6 0 0 1-3.4 4.1M6.2 7.4A17.4 17.4 0 0 0 2 13s3.6 7 10 7a9.7 9.7 0 0 0 4-.8" />
      <path d="M9.9 10.1a3 3 0 0 0 4.1 4.2" />
    </svg>
  ),
  info: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 8h.01" />
    </svg>
  ),
  arrow: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h13M13 6l6 6-6 6" />
    </svg>
  ),
  rocket: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 15c-1.5 1.5-2 6-2 6s4.5-.5 6-2c.9-.9.9-2.3 0-3.2a2.2 2.2 0 0 0-4 -.8Z" />
      <path d="M15 9a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
      <path d="M9 15 6.5 12.5C6.5 7 11 2.5 19 3c.5 8-4 12.5-9.5 12.5L9 15Z" />
    </svg>
  ),
  chart: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round">
      <path d="M6 18V11M12 18V6M18 18v-5" />
    </svg>
  ),
  team: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="8" r="3.2" />
      <path d="M2.5 19a6.5 6.5 0 0 1 13 0" />
      <path d="M16.5 6.2a3 3 0 0 1 0 5.6M18 19a6.4 6.4 0 0 0-2-4.6" />
    </svg>
  ),
  shield: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l7.5 3v5.5c0 4.6-3.1 8.4-7.5 9.5-4.4-1.1-7.5-4.9-7.5-9.5V6L12 3Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  ),
  people: (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="8" r="3" />
      <path d="M3 19a6 6 0 0 1 12 0" />
      <circle cx="18" cy="9" r="2.2" />
    </svg>
  ),
  trend: (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 16 5-5 4 4 8-8" />
      <path d="M15 7h5v5" />
    </svg>
  ),
  gift: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="8" width="18" height="13" rx="2" />
      <path d="M3 12h18M12 8v13" />
      <path d="M12 8S10.5 3 8 3a2.5 2.5 0 0 0 0 5M12 8s1.5-5 4-5a2.5 2.5 0 0 1 0 5" />
    </svg>
  ),
  badge: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M7 8h4M7 12h10M7 16h10" />
    </svg>
  ),
  shieldSmall: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l7 3v5.5c0 4.3-2.9 7.9-7 9-4.1-1.1-7-4.7-7-9V6l7-3Z" />
      <path d="m9.5 12 1.8 1.8L15 10" />
    </svg>
  ),
  chipUser: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="3.4" />
      <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
    </svg>
  ),
};

const FEATURES = [
  { tone: "blue", icon: Ico.rocket, title: "Khởi tạo dự án nhanh", desc: "Thiết lập dự án dễ dàng, sẵn sàng triển khai ngay." },
  { tone: "orange", icon: Ico.chart, title: "Quản lý tiến độ thời gian thực", desc: "Cập nhật công trường 24/7, kiểm soát chặt chẽ." },
  { tone: "green", icon: Ico.team, title: "Theo dõi nhân sự & vật tư", desc: "Quản lý nhân lực, thiết bị, vật tư tập trung, minh bạch." },
  { tone: "purple", icon: Ico.shield, title: "Báo cáo và cảnh báo an toàn", desc: "Chủ động phòng ngừa rủi ro, đảm bảo công trường an toàn." },
];

const PARTNERS = ["VINGROUP", "HÒA BÌNH", "COTECCONS", "DELTA", "RICONS", "PHỤC HƯNG"];

const ROLES = [
  { value: "engineer", label: "Kỹ sư" },
  { value: "worker", label: "Công nhân" },
  { value: "viewer", label: "Người xem" },
];

const NAV = ["Tổng quan", "Dự án", "Tiến độ", "Nhân sự", "Vật tư", "Báo cáo"];

const KPIS = [
  { value: "68%", label: "Tiến độ tổng", delta: "↑ 12% so với tháng trước" },
  { value: "342", label: "Nhân sự đang làm việc", delta: "↑ 8% so với tháng trước" },
  { value: "125,8 tỷ", label: "Giá trị thi công", delta: "↑ 5% so với tháng trước" },
  { value: "98%", label: "Tỷ lệ an toàn", delta: "↑ 2% so với tháng trước" },
];

const CHART = [
  [38, 30], [46, 40], [42, 48], [55, 44], [50, 58], [62, 52],
  [58, 66], [70, 60], [66, 74], [78, 70], [74, 86], [88, 80],
];

const PROJECTS = [
  { name: "Vinhomes Ocean Park 3", pct: 78 },
  { name: "The Matrix One", pct: 62 },
  { name: "KCN Bắc Ninh mở rộng", pct: 35 },
  { name: "Cầu Trần Hưng Đạo", pct: 80 },
];

/* Payload dễ chỉnh sửa: chỉ gửi field backend hỗ trợ. */
async function registerAccount(payload) {
  const res = await fetch("/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    throw new Error(
      data?.message || data?.error || "Không thể tạo tài khoản. Vui lòng thử lại.",
    );
  }
  return data;
}

function RegisterPage() {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  function validate() {
    const e = {};
    if (!fullName.trim()) e.fullName = "Vui lòng nhập họ và tên.";
    if (!email.trim()) e.email = "Vui lòng nhập email công việc.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      e.email = "Email không hợp lệ.";

    const digits = phone.replace(/[^\d]/g, "");
    if (!phone.trim()) e.phone = "Vui lòng nhập số điện thoại.";
    else if (!/^(\+84|0)?\d{8,11}$/.test(phone.trim().replace(/[\s.-]/g, "")) || digits.length < 9 || digits.length > 11)
      e.phone = "Số điện thoại không hợp lệ.";

    if (!company.trim()) e.company = "Vui lòng nhập tên công ty hoặc đơn vị.";
    if (!role) e.role = "Vui lòng chọn vai trò.";

    if (!password) e.password = "Vui lòng nhập mật khẩu.";
    else if (password.length < 8 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password))
      e.password = "Mật khẩu tối thiểu 8 ký tự, gồm chữ hoa, chữ thường và số.";

    if (!confirmPassword) e.confirmPassword = "Vui lòng nhập lại mật khẩu.";
    else if (confirmPassword !== password)
      e.confirmPassword = "Xác nhận mật khẩu không khớp.";

    if (!acceptedTerms) e.acceptedTerms = "Bạn cần đồng ý với điều khoản sử dụng.";
    return e;
  }

  async function handleSubmit(ev) {
    ev.preventDefault();
    setError("");
    setSuccess("");

    const errs = validate();
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) {
      setError("Vui lòng kiểm tra lại thông tin đã nhập.");
      return;
    }

    setLoading(true);
    try {
      const data = await registerAccount({
        fullname: fullName.trim(),
        email: email.trim().toLowerCase(),
        password,
        role,
      });
      setSuccess(data?.message || "Tạo tài khoản thành công. Đang chuyển tới trang đăng nhập...");
      setTimeout(() => {
        navigate("/login");
      }, 1200);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Không kết nối được máy chủ. Vui lòng thử lại.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="xds-register">
      <div className="xds-register-bg" aria-hidden="true" />

      <div className="xds-register-shell">
        {/* ================= LEFT ================= */}
        <div className="xds-register-left">
          <div className="xds-register-tagline">
            <span className="xds-register-tagline-item is-active">Số hoá công trường</span>
            <span className="xds-register-tagline-sep">•</span>
            <span className="xds-register-tagline-item">Kết nối con người</span>
            <span className="xds-register-tagline-sep">•</span>
            <span className="xds-register-tagline-item">Kiến tạo tương lai</span>
          </div>

          <Link to="/home" className="xds-register-brand">
            <svg className="xds-register-logo-mark" width="44" height="44" viewBox="0 0 48 48" fill="none">
              <rect x="3" y="14" width="18" height="10" rx="3" transform="rotate(-38 3 14)" fill="#1368ce" />
              <rect x="14" y="8" width="20" height="10" rx="3" transform="rotate(38 14 8)" fill="#ff7a00" />
              <rect x="10" y="30" width="20" height="10" rx="3" transform="rotate(-38 10 30)" fill="#ff9a20" />
              <rect x="27" y="24" width="18" height="10" rx="3" transform="rotate(38 27 24)" fill="#062c5c" />
            </svg>
            <span className="xds-register-logo-text">XÂY DỰNG SỐ</span>
            <span className="xds-register-brand-divider" />
            <span className="xds-register-brand-sub">
              Nền tảng điều hành
              <br />
              Thi công công trình
            </span>
          </Link>

          <div className="xds-register-hero">
            <h1>
              <span className="xds-register-hero-line1">Đăng ký để</span>
              <span className="xds-register-hero-line2">quản lý thi công chuyên nghiệp</span>
            </h1>
            <p>
              Quản lý toàn diện dự án, tiến độ, nhân sự, vật tư, an toàn và báo cáo trên
              một nền tảng duy nhất. Giúp doanh nghiệp xây dựng vận hành hiệu quả, tiết
              kiệm thời gian và tối ưu chi phí.
            </p>
          </div>

          <div className="xds-register-features">
            {FEATURES.map((f) => (
              <div className="xds-register-feature" key={f.title}>
                <div className={`xds-register-feature-icon is-${f.tone}`}>{f.icon}</div>
                <div>
                  <h3>{f.title}</h3>
                  <p>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="xds-register-partners">
            <div className="xds-register-partners-head">
              <div className="xds-register-partners-icon">{Ico.people}</div>
              <div>
                <div className="xds-register-partners-title">Được tin dùng bởi</div>
                <div className="xds-register-partners-sub">doanh nghiệp xây dựng hiện đại</div>
              </div>
            </div>
            <div className="xds-register-partners-logos">
              {PARTNERS.map((p) => (
                <span className="xds-register-partner-logo" key={p}>
                  {p}
                </span>
              ))}
            </div>
          </div>

          {/* ---- dashboard mockup ---- */}
          <div className="xds-register-dash-wrap">
            <div className="xds-register-dash">
              <aside className="xds-register-dash-side">
                <div className="xds-register-dash-brand">
                  <svg width="16" height="16" viewBox="0 0 48 48" fill="none">
                    <rect x="4" y="14" width="16" height="9" rx="3" transform="rotate(-38 4 14)" fill="#4b9bff" />
                    <rect x="15" y="9" width="18" height="9" rx="3" transform="rotate(38 15 9)" fill="#ff9a20" />
                  </svg>
                  XÂY DỰNG SỐ
                </div>
                <nav className="xds-register-dash-nav">
                  {NAV.map((n, i) => (
                    <span
                      key={n}
                      className={`xds-register-dash-nav-item${i === 0 ? " is-active" : ""}`}
                    >
                      <span className="xds-register-dash-dot" />
                      {n}
                    </span>
                  ))}
                </nav>
              </aside>

              <div className="xds-register-dash-main">
                <div className="xds-register-dash-top">
                  <div className="xds-register-dash-search">Tìm kiếm dự án, tài liệu...</div>
                  <div className="xds-register-dash-user">
                    <span className="xds-register-dash-avatar">NB</span>
                    <span>
                      Nguyễn Văn Bình
                      <br />
                      <span style={{ fontWeight: 400, color: "#7c8aa0" }}>
                        Công ty Xây dựng ABC
                      </span>
                    </span>
                  </div>
                </div>

                <h4 className="xds-register-dash-title">Tổng quan dự án</h4>

                <div className="xds-register-kpis">
                  {KPIS.map((k) => (
                    <div className="xds-register-kpi" key={k.label}>
                      <div className="xds-register-kpi-value">{k.value}</div>
                      <div className="xds-register-kpi-label">{k.label}</div>
                      <div className="xds-register-kpi-delta">{k.delta}</div>
                    </div>
                  ))}
                </div>

                <div className="xds-register-dash-grid">
                  <div className="xds-register-panel">
                    <div className="xds-register-panel-head">
                      <span className="xds-register-panel-title">Tiến độ thi công theo tháng</span>
                      <span className="xds-register-panel-legend">
                        <span>
                          <i className="xds-register-legend-dot" style={{ background: "#b9d4f7" }} />
                          Kế hoạch
                        </span>
                        <span>
                          <i className="xds-register-legend-dot" style={{ background: "#1368ce" }} />
                          Thực tế
                        </span>
                      </span>
                    </div>
                    <div className="xds-register-chart">
                      {CHART.map(([plan, real], i) => (
                        <div className="xds-register-chart-col" key={i}>
                          <span className="xds-register-bar is-plan" style={{ height: `${plan}%` }} />
                          <span className="xds-register-bar is-real" style={{ height: `${real}%` }} />
                        </div>
                      ))}
                    </div>
                    <div className="xds-register-chart-labels">
                      {CHART.map((_, i) => (
                        <span key={i}>T{i + 1}</span>
                      ))}
                    </div>
                  </div>

                  <div className="xds-register-panel">
                    <div className="xds-register-panel-head">
                      <span className="xds-register-panel-title">Dự án đang triển khai</span>
                      <span className="xds-register-panel-legend">Xem tất cả →</span>
                    </div>
                    {PROJECTS.map((p) => (
                      <div className="xds-register-project" key={p.name}>
                        <span className="xds-register-project-name">{p.name}</span>
                        <span className="xds-register-project-track">
                          <span className="xds-register-project-fill" style={{ width: `${p.pct}%` }} />
                        </span>
                        <span className="xds-register-project-pct">{p.pct}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="xds-register-floating">
              <span className="xds-register-floating-icon">{Ico.trend}</span>
              <span>
                <span className="xds-register-floating-title">Vận hành hiệu quả</span>
                <br />
                <span className="xds-register-floating-sub">Kiến tạo những công trình giá trị</span>
              </span>
            </div>
          </div>
        </div>

        {/* ================= RIGHT ================= */}
        <div className="xds-register-right">
          <div className="xds-register-card">
            <div className="xds-register-lang-row">
              <button type="button" className="xds-register-lang">
                <span className="xds-register-flag">★</span>
                Tiếng Việt
                {Ico.caret}
              </button>
            </div>

            <h2>Đăng ký tài khoản</h2>
            <p className="xds-register-card-desc">
              Tạo tài khoản để bắt đầu sử dụng nền tảng Xây Dựng Số và quản lý thi công
              công trình hiệu quả.
            </p>

            {error && (
              <div className="xds-register-alert is-error" role="alert">
                {error}
              </div>
            )}
            {success && (
              <div className="xds-register-alert is-success" role="status">
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              <div className="xds-register-field">
                <label className="xds-register-label" htmlFor="xds-fullname">
                  Họ và tên<span className="xds-register-req">*</span>
                </label>
                <div className="xds-register-input-wrap">
                  <span className="xds-register-input-icon">{Ico.user}</span>
                  <input
                    id="xds-fullname"
                    type="text"
                    autoComplete="name"
                    placeholder="Nhập họ và tên của bạn"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className={fieldErrors.fullName ? "has-error" : ""}
                  />
                </div>
                {fieldErrors.fullName && (
                  <span className="xds-register-error">{fieldErrors.fullName}</span>
                )}
              </div>

              <div className="xds-register-field">
                <label className="xds-register-label" htmlFor="xds-email">
                  Email công việc<span className="xds-register-req">*</span>
                </label>
                <div className="xds-register-input-wrap">
                  <span className="xds-register-input-icon">{Ico.mail}</span>
                  <input
                    id="xds-email"
                    type="email"
                    autoComplete="email"
                    placeholder="Nhập email công việc (vd: ten@congty.com)"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={fieldErrors.email ? "has-error" : ""}
                  />
                </div>
                {fieldErrors.email && (
                  <span className="xds-register-error">{fieldErrors.email}</span>
                )}
              </div>

              <div className="xds-register-field">
                <label className="xds-register-label" htmlFor="xds-phone">
                  Số điện thoại<span className="xds-register-req">*</span>
                </label>
                <div className="xds-register-input-wrap">
                  <span className="xds-register-input-icon">{Ico.phone}</span>
                  <input
                    id="xds-phone"
                    type="tel"
                    autoComplete="tel"
                    placeholder="Nhập số điện thoại của bạn"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={fieldErrors.phone ? "has-error" : ""}
                  />
                </div>
                {fieldErrors.phone && (
                  <span className="xds-register-error">{fieldErrors.phone}</span>
                )}
              </div>

              <div className="xds-register-field">
                <label className="xds-register-label" htmlFor="xds-company">
                  Tên công ty / đơn vị<span className="xds-register-req">*</span>
                </label>
                <div className="xds-register-input-wrap">
                  <span className="xds-register-input-icon">{Ico.building}</span>
                  <input
                    id="xds-company"
                    type="text"
                    autoComplete="organization"
                    placeholder="Nhập tên công ty hoặc đơn vị"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className={fieldErrors.company ? "has-error" : ""}
                  />
                </div>
                {fieldErrors.company && (
                  <span className="xds-register-error">{fieldErrors.company}</span>
                )}
              </div>

              <div className="xds-register-field">
                <label className="xds-register-label" htmlFor="xds-role">
                  Vai trò<span className="xds-register-req">*</span>
                </label>
                <div className="xds-register-input-wrap">
                  <span className="xds-register-input-icon">{Ico.lock}</span>
                  <select
                    id="xds-role"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className={`${role ? "" : "is-placeholder"} ${fieldErrors.role ? "has-error" : ""}`}
                  >
                    <option value="">Chọn vai trò của bạn</option>
                    {ROLES.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                  <span className="xds-register-input-caret">{Ico.caret}</span>
                </div>
                {fieldErrors.role && (
                  <span className="xds-register-error">{fieldErrors.role}</span>
                )}
              </div>

              <div className="xds-register-row2">
                <div className="xds-register-field">
                  <label className="xds-register-label" htmlFor="xds-password">
                    Mật khẩu<span className="xds-register-req">*</span>
                  </label>
                  <div className="xds-register-input-wrap">
                    <span className="xds-register-input-icon">{Ico.lock}</span>
                    <input
                      id="xds-password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="Nhập mật khẩu"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={fieldErrors.password ? "has-error" : ""}
                      style={{ paddingRight: 42 }}
                    />
                    <button
                      type="button"
                      className="xds-register-eye"
                      aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                      onClick={() => setShowPassword((v) => !v)}
                    >
                      {showPassword ? Ico.eyeOff : Ico.eye}
                    </button>
                  </div>
                  {fieldErrors.password && (
                    <span className="xds-register-error">{fieldErrors.password}</span>
                  )}
                </div>

                <div className="xds-register-field">
                  <label className="xds-register-label" htmlFor="xds-confirm">
                    Xác nhận mật khẩu<span className="xds-register-req">*</span>
                  </label>
                  <div className="xds-register-input-wrap">
                    <span className="xds-register-input-icon">{Ico.lock}</span>
                    <input
                      id="xds-confirm"
                      type={showConfirmPassword ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="Nhập lại mật khẩu"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={fieldErrors.confirmPassword ? "has-error" : ""}
                      style={{ paddingRight: 42 }}
                    />
                    <button
                      type="button"
                      className="xds-register-eye"
                      aria-label={showConfirmPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                      onClick={() => setShowConfirmPassword((v) => !v)}
                    >
                      {showConfirmPassword ? Ico.eyeOff : Ico.eye}
                    </button>
                  </div>
                  {fieldErrors.confirmPassword && (
                    <span className="xds-register-error">{fieldErrors.confirmPassword}</span>
                  )}
                </div>
              </div>

              <div className="xds-register-hint">
                {Ico.info}
                Tối thiểu 8 ký tự, gồm chữ hoa, chữ thường và số.
              </div>

              <label className="xds-register-terms">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                />
                <span>
                  Tôi đồng ý với{" "}
                  <span className="xds-register-link">Điều khoản sử dụng</span> và{" "}
                  <span className="xds-register-link">Chính sách bảo mật</span> của Xây
                  Dựng Số.
                  {fieldErrors.acceptedTerms && (
                    <span className="xds-register-error">{fieldErrors.acceptedTerms}</span>
                  )}
                </span>
              </label>

              <button type="submit" className="xds-register-submit" disabled={loading}>
                {loading ? (
                  <>
                    <span className="xds-register-spinner" />
                    Đang tạo tài khoản...
                  </>
                ) : (
                  <>
                    Tạo tài khoản
                    {Ico.arrow}
                  </>
                )}
              </button>
            </form>

            <div className="xds-register-have">
              Đã có tài khoản? <Link to="/login">Đăng nhập ngay</Link>
            </div>

            <div className="xds-register-divider">Hoặc đăng ký bằng</div>

            <div className="xds-register-alt">
              <button type="button" className="xds-register-alt-card">
                <span className="xds-register-alt-icon is-blue">{Ico.badge}</span>
                <span>
                  <span className="xds-register-alt-title">SSO Doanh nghiệp</span>
                  <br />
                  <span className="xds-register-alt-sub">Tài khoản nội bộ công ty</span>
                </span>
              </button>
              <button type="button" className="xds-register-alt-card">
                <span className="xds-register-alt-icon is-green">{Ico.shieldSmall}</span>
                <span>
                  <span className="xds-register-alt-title">Email OTP</span>
                  <br />
                  <span className="xds-register-alt-sub">Đăng ký bằng mã xác thực</span>
                </span>
              </button>
            </div>

            <div className="xds-register-trial">
              <span style={{ color: "#1368ce", display: "flex" }}>{Ico.gift}</span>
              <span>
                <span className="xds-register-trial-title">Dùng thử miễn phí 14 ngày</span>
                <br />
                <span className="xds-register-trial-sub">
                  Trải nghiệm đầy đủ tính năng. Đội ngũ chuyên gia hỗ trợ triển khai.
                </span>
              </span>
            </div>

            <div className="xds-register-chips-title">Chọn vai trò phổ biến (tùy chọn)</div>
            <div className="xds-register-chips">
              {ROLES.map((r) => (
                <button
                  type="button"
                  key={r.value}
                  className={`xds-register-chip${role === r.value ? " is-selected" : ""}`}
                  onClick={() => {
                    setRole(r.value);
                    setFieldErrors((prev) => {
                      const next = { ...prev };
                      delete next.role;
                      return next;
                    });
                  }}
                >
                  {Ico.chipUser}
                  {r.label}
                </button>
              ))}
            </div>

            <div className="xds-register-foot">
              <span className="xds-register-foot-links">
                <a href="#privacy">Chính sách bảo mật</a>
                <span className="xds-register-foot-sep">|</span>
                <a href="#terms">Điều khoản sử dụng</a>
                <span className="xds-register-foot-sep">|</span>
                <a href="#support">Hỗ trợ</a>
              </span>
              <span>Phiên bản 1.0.0</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;
