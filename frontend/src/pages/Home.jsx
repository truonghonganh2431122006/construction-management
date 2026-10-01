import { Link } from "react-router-dom";
import { useState } from "react";
import "../styles/Home.css";

const NAV = [
  { label: "Trang chủ", href: "#top" },
  { label: "Dự án", href: "#du-an" },
  { label: "Tiến độ", href: "#tien-do" },
  { label: "Nhân sự", href: "#nhan-su" },
  { label: "Vật tư", href: "#vat-tu" },
  { label: "An toàn", href: "#an-toan" },
  { label: "Báo cáo", href: "#bao-cao" },
  { label: "Liên hệ", href: "#lien-he" },
];

const BENEFITS = [
  "Triển khai nhanh",
  "Dễ sử dụng",
  "Bảo mật dữ liệu",
  "Phù hợp nhiều quy mô",
];

const DASH_MENU = [
  "Tổng quan",
  "Dự án",
  "Tiến độ",
  "Nhân sự",
  "Vật tư",
  "An toàn",
  "Báo cáo",
];

const DASH_KPIS = [
  {
    label: "Tiến độ dự án",
    value: "68%",
    delta: "↑ 12% so với tháng trước",
    icon: "📈",
    bg: "#eaf4ff",
    color: "#1368ce",
  },
  {
    label: "Tổng nhân sự",
    value: "342",
    delta: "↑ 8% so với tháng trước",
    icon: "👷",
    bg: "#e8f7f0",
    color: "#13a66b",
  },
  {
    label: "Tổng chi phí",
    value: "125,8 tỷ",
    delta: "↑ 5% so với tháng trước",
    icon: "💰",
    bg: "#fff2e3",
    color: "#ff7a00",
  },
  {
    label: "An toàn lao động",
    value: "98%",
    delta: "↑ 2% so với tháng trước",
    icon: "🛡️",
    bg: "#f0edff",
    color: "#7c5cff",
  },
];

const CHART = [
  [42, 55],
  [50, 48],
  [38, 62],
  [58, 52],
  [46, 70],
  [72, 60],
  [55, 78],
  [64, 58],
  [48, 66],
  [76, 70],
  [60, 82],
  [88, 74],
];

const DASH_TASKS = [
  { title: "Đổ bê tông sàn tầng 12 — Tháp A", meta: "Vinhomes Ocean Park 3 · 2 giờ trước" },
  { title: "Nghiệm thu cốt thép tầng 10", meta: "The Matrix One · 4 giờ trước" },
  { title: "Vận chuyển vật tư đợt 3", meta: "KCN Bắc Ninh · 6 giờ trước" },
  { title: "Kiểm tra an toàn định kỳ", meta: "Cầu Trần Hưng Đạo · 1 ngày trước" },
];

const STATS = [
  { value: "18", label: "Dự án đang triển khai", delta: "↑ 20% so với năm trước", icon: "🏗️", bg: "#eaf4ff", color: "#1368ce" },
  { value: "68%", label: "Tiến độ trung bình", delta: "↑ 12% so với tháng trước", icon: "📊", bg: "#e8f7f0", color: "#13a66b" },
  { value: "342", label: "Công nhân hiện trường", delta: "↑ 8% so với tháng trước", icon: "👥", bg: "#eaf4ff", color: "#1368ce" },
  { value: "125,8 tỷ", label: "Tổng chi phí dự án", delta: "↑ 5% so với tháng trước", icon: "💰", bg: "#fff2e3", color: "#ff7a00" },
  { value: "98%", label: "Chỉ số an toàn", delta: "↑ 2% so với tháng trước", icon: "🛡️", bg: "#f0edff", color: "#7c5cff" },
  { value: "27", label: "Công việc đang xử lý", delta: "↓ 10% so với tuần trước", icon: "📋", bg: "#ffeceb", color: "#e5484d", down: true },
];

const FEATURES = [
  { icon: "🏗️", title: "Quản lý dự án", desc: "Theo dõi thông tin, kế hoạch và các bên liên quan", bg: "#eaf4ff", color: "#1368ce" },
  { icon: "📈", title: "Quản lý tiến độ", desc: "Cập nhật tiến độ real-time và biểu đồ trực quan", bg: "#e8f7f0", color: "#13a66b" },
  { icon: "👥", title: "Quản lý nhân sự", desc: "Chấm công, phân công và quản lý đội thi công", bg: "#eef1ff", color: "#4459d9" },
  { icon: "📦", title: "Quản lý vật tư", desc: "Theo dõi nhập xuất kho, định mức và tồn kho", bg: "#fff2e3", color: "#ff7a00" },
  { icon: "📓", title: "Nhật ký công trình", desc: "Ghi chép hiện trường, hình ảnh và biên bản", bg: "#f5edff", color: "#8b5cf6" },
  { icon: "🚨", title: "Cảnh báo an toàn", desc: "Kiểm soát rủi ro và nhắc nhở cảnh báo sự cố", bg: "#ffeceb", color: "#e5484d" },
  { icon: "🗂️", title: "Quản lý hồ sơ", desc: "Lưu trữ tài liệu, bản vẽ và nghiệm thu", bg: "#fff6dd", color: "#c78a00" },
  { icon: "📊", title: "Báo cáo thời gian thực", desc: "Báo cáo đa dạng, trực quan, xuất file dễ dàng", bg: "#eaf4ff", color: "#1368ce" },
  { icon: "🔐", title: "Phân quyền người dùng", desc: "Quản lý vai trò và quyền theo từng dự án", bg: "#e9f6f5", color: "#0f9b9b" },
  { icon: "💹", title: "Theo dõi chi phí", desc: "Quản lý ngân sách, chi phí và hiệu quả đầu tư", bg: "#e8f7f0", color: "#13a66b" },
];

const PROJECTS = [
  {
    name: "Vinhomes Ocean Park 3",
    place: "Hưng Yên",
    pct: 75,
    status: "Đang thi công",
    badge: "xds-badge--green",
    type: "Khu đô thị",
    due: "12/2026",
    img: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=900&q=70",
  },
  {
    name: "The Matrix One",
    place: "Hà Nội",
    pct: 62,
    status: "Thi công",
    badge: "xds-badge--orange",
    type: "Chung cư cao cấp",
    due: "10/2026",
    img: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=900&q=70",
  },
  {
    name: "KCN Bắc Ninh mở rộng",
    place: "Bắc Ninh",
    pct: 35,
    status: "Thiết kế",
    badge: "",
    type: "Khu công nghiệp",
    due: "06/2027",
    img: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=900&q=70",
  },
  {
    name: "Cầu Trần Hưng Đạo",
    place: "Hà Nội",
    pct: 80,
    status: "Đang thi công",
    badge: "xds-badge--green",
    type: "Hạ tầng giao thông",
    due: "06/2027",
    img: "https://images.unsplash.com/photo-1477414348463-c0eb7f1359b6?auto=format&fit=crop&w=900&q=70",
  },
  {
    name: "Bệnh viện Đa khoa Tỉnh",
    place: "Hải Dương",
    pct: 80,
    status: "Thi công",
    badge: "xds-badge--orange",
    type: "Công trình y tế",
    due: "09/2026",
    img: "https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?auto=format&fit=crop&w=900&q=70",
  },
  {
    name: "Khu nghỉ dưỡng Sơn Trà",
    place: "Đà Nẵng",
    pct: 20,
    status: "Chuẩn bị",
    badge: "xds-badge--navy",
    type: "Du lịch nghỉ dưỡng",
    due: "12/2027",
    img: "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=900&q=70",
  },
];

const STEPS = [
  { num: "01", icon: "🧭", title: "Lập kế hoạch", desc: "Thiết lập dự án, mục tiêu và nguồn lực" },
  { num: "02", icon: "🧑‍🔧", title: "Phân công", desc: "Giao việc cho nhân sự và đội thi công" },
  { num: "03", icon: "🔍", title: "Giám sát", desc: "Theo dõi tiến độ, chất lượng và an toàn real-time" },
  { num: "04", icon: "📑", title: "Báo cáo", desc: "Tổng hợp số liệu và báo cáo tự động" },
  { num: "05", icon: "⚙️", title: "Tối ưu", desc: "Phân tích, đánh giá và cải tiến liên tục" },
];

const PARTNERS = ["VIN GROUP", "HÒA BÌNH", "COTECCONS", "DELTA", "RICONS", "PHỤC HƯNG"];

function Logo({ orange = false }) {
  return (
    <div className="xds-logo">
      <span className={"xds-logo__mark" + (orange ? " xds-logo__mark--orange" : "")}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 21h18M5 21V9l7-5 7 5v12M10 21v-6h4v6" strokeLinejoin="round" />
        </svg>
      </span>
      <span>
        <span className="xds-logo__name">XÂY DỰNG SỐ</span>
        <span className="xds-logo__sub">Nền tảng điều hành thi công công trình</span>
      </span>
    </div>
  );
}

function Home() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="xds" id="top">
      {/* ---------- Header ---------- */}
      <header className="xds-header">
        <div className="xds-wrap xds-header__inner">
          <Logo />
          <nav className="xds-nav">
            {NAV.map((item, i) => (
              <a key={item.label} href={item.href} className={i === 0 ? "is-active" : ""}>
                {item.label}
              </a>
            ))}
          </nav>
          <div className="xds-header__actions">
            <label className="xds-search">
              <span>🔍</span>
              <input type="search" placeholder="Tìm kiếm dự án, tài liệu..." aria-label="Tìm kiếm" />
            </label>
            <Link to="/login" className="xds-btn xds-btn--outline">
              Đăng nhập
            </Link>
            <Link to="/register" className="xds-btn xds-btn--orange">
              Dùng thử ngay →
            </Link>
            <button
              className="xds-burger"
              aria-label="Mở menu"
              onClick={() => setMenuOpen((v) => !v)}
            >
              ☰
            </button>
          </div>
        </div>
        <div className="xds-wrap">
          <nav className={"xds-mobile-nav" + (menuOpen ? " is-open" : "")}>
            {NAV.map((item) => (
              <a key={item.label} href={item.href} onClick={() => setMenuOpen(false)}>
                {item.label}
              </a>
            ))}
            <div className="xds-mobile-nav__cta">
              <Link to="/login" className="xds-btn xds-btn--outline">
                Đăng nhập
              </Link>
              <Link to="/register" className="xds-btn xds-btn--orange">
                Dùng thử
              </Link>
            </div>
          </nav>
        </div>
      </header>

      {/* ---------- Hero ---------- */}
      <section className="xds-hero">
        <div className="xds-hero__bg" />
        <div className="xds-hero__veil" />
        <div className="xds-wrap xds-hero__inner">
          <div>
            <p className="xds-eyebrow">Nền tảng điều hành thi công công trình</p>
            <h1>
              Điều hành thi công công trình
              <br />
              <span>thông minh, tập trung và hiệu quả</span>
            </h1>
            <p className="xds-hero__desc">
              Quản lý toàn diện dự án, tiến độ, nhân sự, vật tư, an toàn và báo cáo
              trên một nền tảng duy nhất. Giúp doanh nghiệp xây dựng vận hành hiệu
              quả, tiết kiệm thời gian và tối ưu chi phí.
            </p>
            <div className="xds-hero__cta">
              <Link to="/register" className="xds-btn xds-btn--orange xds-btn--lg">
                Bắt đầu ngay →
              </Link>
              <a href="#tien-do" className="xds-btn xds-btn--ghost xds-btn--lg">
                ▶ Xem demo
              </a>
            </div>
            <ul className="xds-benefits">
              {BENEFITS.map((b) => (
                <li key={b}>
                  <span className="xds-tick">✓</span>
                  {b}
                </li>
              ))}
            </ul>
          </div>

          {/* Dashboard mockup */}
          <div className="xds-dash" id="tien-do">
            <aside className="xds-dash__side">
              <div className="xds-dash__brand">
                <i />
                XÂY DỰNG SỐ
              </div>
              <ul>
                {DASH_MENU.map((m, i) => (
                  <li key={m} className={i === 0 ? "is-active" : ""}>
                    <i />
                    {m}
                  </li>
                ))}
              </ul>
            </aside>
            <div className="xds-dash__main">
              <div className="xds-dash__topbar">
                <h4>Tổng quan</h4>
                <div className="xds-dash__user">
                  <span>🔔</span>
                  <span className="xds-dash__avatar">NM</span>
                  <span>Nguyễn Văn Minh</span>
                </div>
              </div>

              <div className="xds-dash__kpis">
                {DASH_KPIS.map((k) => (
                  <div className="xds-kpi" key={k.label}>
                    <div className="xds-kpi__label">{k.label}</div>
                    <div className="xds-kpi__row">
                      <span className="xds-kpi__value">{k.value}</span>
                      <span
                        className="xds-kpi__ico"
                        style={{ background: k.bg, color: k.color }}
                      >
                        {k.icon}
                      </span>
                    </div>
                    <div className="xds-kpi__delta">{k.delta}</div>
                  </div>
                ))}
              </div>

              <div className="xds-dash__grid">
                <div className="xds-panel">
                  <div className="xds-panel__head">
                    Chi phí &amp; Tiến độ theo tháng<span>2026</span>
                  </div>
                  <div className="xds-chart">
                    {CHART.map((pair, i) => (
                      <div className="xds-chart__col" key={i}>
                        <span className="xds-chart__bar" style={{ height: pair[0] + "%" }} />
                        <span
                          className="xds-chart__bar xds-chart__bar--light"
                          style={{ height: pair[1] + "%" }}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="xds-chart__axis">
                    {CHART.map((_, i) => (
                      <span key={i}>T{i + 1}</span>
                    ))}
                  </div>
                </div>

                <div className="xds-panel">
                  <div className="xds-panel__head">
                    Công việc gần đây<span>Xem tất cả →</span>
                  </div>
                  <div className="xds-tasks">
                    {DASH_TASKS.map((t) => (
                      <div className="xds-task" key={t.title}>
                        <i />
                        <span>
                          <strong>{t.title}</strong>
                          <small>{t.meta}</small>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="xds-panel">
                  <div className="xds-panel__head">Camera công trường</div>
                  <div className="xds-cam">
                    <img
                      src="https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=600&q=60"
                      alt="Camera giám sát công trường"
                    />
                    <span className="xds-cam__live">● Trực tiếp</span>
                  </div>
                  <div className="xds-cam__meta">
                    <strong>Dự án The Matrix One</strong>
                    14:32 · Hôm nay
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Stats ---------- */}
      <section className="xds-stats" id="bao-cao">
        <div className="xds-wrap xds-stats__grid">
          {STATS.map((s) => (
            <article className="xds-stat" key={s.label}>
              <span className="xds-stat__ico" style={{ background: s.bg, color: s.color }}>
                {s.icon}
              </span>
              <div>
                <div className="xds-stat__value">{s.value}</div>
                <div className="xds-stat__label">{s.label}</div>
                <div className={"xds-stat__delta" + (s.down ? " is-down" : "")}>{s.delta}</div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ---------- Features ---------- */}
      <section className="xds-section" id="vat-tu">
        <div className="xds-wrap">
          <div className="xds-section__head">
            <div>
              <h2>Tính năng nổi bật</h2>
              <p>
                Đầy đủ công cụ để quản lý và điều hành thi công công trình hiệu quả
                trên một nền tảng duy nhất.
              </p>
            </div>
            <a className="xds-section__link" href="#lien-he">
              Xem tất cả tính năng →
            </a>
          </div>
          <div className="xds-features">
            {FEATURES.map((f) => (
              <article className="xds-feature" key={f.title}>
                <span className="xds-feature__ico" style={{ background: f.bg, color: f.color }}>
                  {f.icon}
                </span>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Projects ---------- */}
      <section className="xds-section xds-section--soft" id="du-an">
        <div className="xds-wrap">
          <div className="xds-section__head">
            <div>
              <h2>Dự án tiêu biểu</h2>
              <p>Đồng hành cùng nhiều doanh nghiệp xây dựng hàng đầu Việt Nam.</p>
            </div>
            <a className="xds-section__link" href="#lien-he">
              Xem tất cả dự án →
            </a>
          </div>
          <div className="xds-projects">
            {PROJECTS.map((p) => (
              <article className="xds-project" key={p.name}>
                <div className="xds-project__media">
                  <img src={p.img} alt={p.name} loading="lazy" />
                  <span className={"xds-badge " + p.badge}>{p.status}</span>
                </div>
                <div className="xds-project__body">
                  <h3>{p.name}</h3>
                  <p className="xds-project__loc">📍 {p.place}</p>
                  <div className="xds-progress">
                    <span className="xds-progress__track">
                      <span className="xds-progress__fill" style={{ width: p.pct + "%" }} />
                    </span>
                    <span className="xds-progress__pct">{p.pct}%</span>
                  </div>
                  <div className="xds-project__meta">
                    <span>🏢 {p.type}</span>
                    <span>🗓️ Hoàn thành: {p.due}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Process ---------- */}
      <section className="xds-section" id="nhan-su">
        <div className="xds-wrap">
          <div className="xds-section__head">
            <div>
              <h2>Quy trình hoạt động</h2>
              <p>5 bước đơn giản để triển khai và vận hành hiệu quả.</p>
            </div>
          </div>
          <div className="xds-process">
            {STEPS.map((s) => (
              <article className="xds-step" key={s.num}>
                <div className="xds-step__num">{s.num}</div>
                <span className="xds-step__ico">{s.icon}</span>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Trust ---------- */}
      <section className="xds-section xds-section--soft" id="an-toan">
        <div className="xds-wrap xds-trust">
          <div>
            <h2>
              Được tin tưởng bởi
              <br />
              nhiều doanh nghiệp hàng đầu
            </h2>
            <p>
              Hàng trăm nhà thầu, chủ đầu tư và ban quản lý dự án đã lựa chọn Xây
              Dựng Số để đồng hành trong hành trình chuyển đổi số ngành xây dựng.
            </p>
          </div>
          <div className="xds-logos">
            {PARTNERS.map((p) => (
              <div key={p}>{p}</div>
            ))}
          </div>
          <blockquote className="xds-quote">
            <p>
              “Nền tảng giúp chúng tôi kiểm soát tiến độ, chi phí và an toàn tốt hơn.
              Hệ thống dễ sử dụng, phù hợp với đặc thù ngành xây dựng tại Việt Nam.”
            </p>
            <div className="xds-quote__who">
              <span className="xds-quote__ava">QH</span>
              <span>
                <strong>Nguyễn Quốc Hùng</strong>
                <small>Giám đốc Ban Quản lý Dự án</small>
                <span className="xds-stars">★★★★★</span>
              </span>
            </div>
          </blockquote>
        </div>
      </section>

      {/* ---------- CTA ---------- */}
      <section className="xds-cta">
        <div className="xds-wrap xds-cta__inner">
          <div>
            <h2>Sẵn sàng số hóa công trường của bạn?</h2>
            <p>
              Dùng thử miễn phí, không cần thẻ tín dụng. Đội ngũ của chúng tôi sẽ
              đồng hành triển khai cho dự án đầu tiên.
            </p>
          </div>
          <div className="xds-cta__actions">
            <Link to="/register" className="xds-btn xds-btn--orange xds-btn--lg">
              Dùng thử ngay →
            </Link>
            <Link to="/login" className="xds-btn xds-btn--white xds-btn--lg">
              Đăng nhập
            </Link>
          </div>
        </div>
      </section>

      {/* ---------- Footer ---------- */}
      <footer className="xds-footer" id="lien-he">
        <div className="xds-wrap">
          <div className="xds-footer__grid">
            <div className="xds-footer__about">
              <Logo orange />
              <p>
                Nền tảng điều hành thi công công trình hàng đầu Việt Nam. Đồng hành
                cùng doanh nghiệp xây dựng trong kỷ nguyên số.
              </p>
              <div className="xds-socials">
                <a href="#lien-he" aria-label="Facebook">f</a>
                <a href="#lien-he" aria-label="YouTube">▶</a>
                <a href="#lien-he" aria-label="LinkedIn">in</a>
                <a href="#lien-he" aria-label="Zalo">Z</a>
              </div>
            </div>
            <div>
              <h4>Sản phẩm</h4>
              <ul>
                <li><a href="#tien-do">Tổng quan</a></li>
                <li><a href="#tien-do">Tiến độ</a></li>
                <li><a href="#du-an">Khách hàng</a></li>
                <li><a href="#vat-tu">Cập nhật mới</a></li>
              </ul>
            </div>
            <div>
              <h4>Hỗ trợ</h4>
              <ul>
                <li><a href="#lien-he">Trung tâm trợ giúp</a></li>
                <li><a href="#lien-he">Hướng dẫn sử dụng</a></li>
                <li><a href="#lien-he">Liên hệ hỗ trợ</a></li>
                <li><a href="#lien-he">Chính sách bảo mật</a></li>
              </ul>
            </div>
            <div>
              <h4>Liên hệ</h4>
              <ul>
                <li>📍 Hà Nội, Việt Nam</li>
                <li>📞 1900 0000</li>
                <li>✉️ info@xaydungso.vn</li>
              </ul>
            </div>
            <div className="xds-news">
              <h4>Đăng ký nhận tin</h4>
              <p style={{ fontSize: 13 }}>Cập nhật mới về thi công và quản lý dự án.</p>
              <form onSubmit={(e) => e.preventDefault()}>
                <input type="email" placeholder="Nhập email của bạn" aria-label="Email" />
                <button type="submit" className="xds-btn xds-btn--orange">Đăng ký</button>
              </form>
            </div>
          </div>
          <div className="xds-footer__bottom">
            <span>© 2026 Xây Dựng Số. Tất cả quyền được bảo lưu.</span>
            <ul>
              <li><a href="#lien-he">Điều khoản sử dụng</a></li>
              <li><a href="#lien-he">Chính sách bảo mật</a></li>
              <li><a href="#top">Sitemap</a></li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Home;
