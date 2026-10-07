# Sprint 3 handoff

## T-29 — 2026-10-02

Đã tạo benchmark độc lập tại `experiments/gantt-benchmark/` gồm `index.html`, `benchmark.js` và `README.md`. Benchmark dùng cùng một bộ 500 thanh, cùng kích thước khung nhìn và vùng cuộn cho SVG và Canvas. Phép đo dùng `performance.now()` cho thời gian dựng/vẽ và `requestAnimationFrame()` cho FPS khi cuộn. Trang ghi user agent, kích thước viewport, số lần chạy và số liệu vừa đo; không điền số liệu giả.

Chưa có thiết bị điện thoại thật trong môi trường này nên chưa có số đo mobile và chưa thể kết luận hiệu năng SVG/Canvas. T-31 hiện dùng DOM `div`/`button` để hỗ trợ focus, tooltip và chọn thanh; cần xác nhận lựa chọn renderer sau khi chạy benchmark trên thiết bị mục tiêu.

## T-30 — 2026-10-02

Đã tạo `frontend/src/features/gantt/timeScale.js`.

- `createTimeScale({ start, end, startDate, endDate, width, unit })` tạo scale bất biến cho `day` hoặc `week`.
- Scale trả về `timeToX(value)`, `position(value)`, `durationToWidth(days)`, `widthFor(days)` và `ticks`.
- Giá trị số được hiểu là ngày tương đối; `Date`/chuỗi ngày được quy đổi theo `startDate`.
- Khoảng thời gian hữu hạn phải có `end > start`; width phải dương.

Đây là nguồn chuyển đổi thời gian duy nhất mà Gantt sử dụng. T-31 trở đi không viết lại công thức chuyển đổi.

## T-31 — 2026-10-02

Đã tạo module trong `frontend/src/features/gantt/`:

- `barModel.js`: `toBarModel(task)` và `adaptScheduleToBars(tasks)` chuyển dữ liệu T-27/T-28 sang model chung gồm `id`, `name`, `es`, `ef`, `ls`, `lf`, `totalFloat`, `isCritical`, `actualStart`, `actualEnd`, `percentComplete`. Adapter không sửa dữ liệu nguồn.
- `Gantt.jsx`: cột tên cố định, vùng thanh cuộn ngang độc lập, hiển thị dữ liệu rỗng, thanh ngoài khoảng vẫn được kẹp trong vùng nhìn, ID phân biệt các tên trùng.
- `gantt.css`: bố cục responsive, thanh và trạng thái focus.
- `index.js`: export contract dùng chung.

`Gantt` nhận props chính: `tasks`, `start`, `end`, `startDate`, `endDate`, `unit`, `width`, `rowHeight`, `onBarHover`, `onBarSelect`, `cycleMessage`. Component được nối vào `frontend/src/pages/Schedule.jsx`; mỗi dòng bảng và mỗi thanh đều có thể chọn để mở form tiến độ.

## T-32 — 2026-10-02

Thanh có `isCritical = true` dùng class `gantt-bar-critical`, viền dày, màu phụ trợ và ký hiệu `◆` ở đầu thanh. Viền/ký hiệu là tín hiệu chính nên vẫn phân biệt được khi bỏ màu hoặc in đen trắng. Không thay đổi dữ liệu hay thuật toán CPM.

## T-33 — 2026-10-02

`GanttTooltip.jsx` hiển thị trực tiếp `ES`, `EF`, `LS`, `LF` và `Total Float` từ bar model. Gantt hỗ trợ hover, focus bàn phím, chạm/click, đóng khi bấm nút, chạm vùng khác hoặc Escape; vị trí tooltip được kẹp trong vùng cuộn. Giá trị null hiển thị `—`, không tự tạo dữ liệu.

## T-34 — 2026-10-02

Đã tạo một migration mới:

- `backend/src/migrations/016_add_actual_progress.sql`
- `backend/src/migrations/016_add_actual_progress.down.sql`

Migration dùng version 016 để giữ `015_add_task_actuals.sql` từ `main`. Runner
nhận diện lịch sử T-34 cũ ở version 012 hoặc 015 bằng checksum và xác minh
columns/constraints trước khi đổi tên bản ghi trong cùng transaction.

Migration thêm `tasks.actual_start_date DATE`, `tasks.actual_end_date DATE` và
`tasks.percent_complete INTEGER NOT NULL DEFAULT 0`. Constraint phần trăm là
0–100; constraint ngày chỉ kiểm tra `actual_end_date >= actual_start_date` khi
cả hai ngày có giá trị. API đồng bộ các giá trị này với các cột canonical từ
upstream (`actual_start`, `actual_finish`, `progress_percent`) để giữ CPM và
form tiến độ nhất quán.

Không chạy migration lên database trong quá trình tích hợp Git. Database người
dùng có thể đang ghi nhận T-34 ở version 015; sau khi lấy bản cập nhật, kiểm tra
`npm run migrate:status` trước rồi chạy `npm run migrate` để runner nhận diện
lịch sử cũ và áp dụng migration upstream còn thiếu. Không rollback database
đang chứa dữ liệu tiến độ.

## T-35 — 2026-10-02

Đã tạo `frontend/src/features/gantt/ActualProgressForm.jsx` với ba trường ngày bắt đầu, ngày kết thúc và phần trăm hoàn thành. Client chặn ngày sai, thứ tự ngày sai và phần trăm ngoài 0–100; khi công việc đang 100% và người dùng giảm phần trăm, form yêu cầu xác nhận mở lại trước khi gửi.

Đã tạo `frontend/src/services/progressApi.js` với:

`updateTaskProgress(projectId, taskId, { actualStart, actualEnd, percentComplete })`

Endpoint mới:

`PATCH /projects/:projectId/tasks/:taskId/progress`

Handler dùng session/auth và project membership hiện có. Server đọc task trong project, cho phép ngày null, kiểm tra ngày hợp lệ/thứ tự và phần trăm 0–100 trước khi gọi model. Model cập nhật đúng ba cột thực tế trong transaction và trả task đã lưu. Không tự đổi status công việc hoặc gọi API mới khác.

`Schedule.jsx` nối form từ thanh Gantt và từ dòng bảng; chỉ cập nhật giao diện sau khi server trả thành công.

## Kiểm tra

- `backend`: `npm.cmd test -- --runInBand` → 119 test pass, 28 test skip.
- `backend`: `npm.cmd run lint` → pass.
- `frontend`: `npm.cmd run build` → pass.
- `frontend`: `npm.cmd run lint` → pass.
- Frontend Playwright chưa chạy được vì máy chưa có Chromium tại đường dẫn Playwright yêu cầu; chưa cài browser/dependency mới.
- Đã kiểm tra cú pháp benchmark bằng `node --check`.

## File tích hợp và việc còn lại

Các file cũ được sửa: `frontend/src/pages/Schedule.jsx`, `frontend/src/styles/Schedule.css`, `backend/src/models/taskModel.js`, `backend/src/models/scheduleModel.js`, `backend/src/services/taskService.js`, `backend/src/controllers/taskController.js`, `backend/src/routes/taskRoutes.js`.

Việc cần thực hiện thủ công: áp dụng migration 015, chạy benchmark trên điện thoại thật và ghi số đo vào kết luận benchmark nếu muốn chốt SVG/Canvas theo dữ liệu thực tế. Không commit/push trong task này.

## Sprint 3 fix & verify — 2026-10-02

Đã đối chiếu các nhận xét nghiệm thu với code thực tế và sửa trong phạm vi Sprint 3:

| Task | Nhận xét | Sửa/kiểm chứng | Trạng thái |
| --- | --- | --- | --- |
| T-29 | Chưa có số đo thiết bị thật | Giữ benchmark đo lặp lại, FPS trung bình/thấp, user agent và viewport; môi trường không có Chromium/Chrome nên không ghi số liệu giả | CHƯA XÁC MINH mobile |
| T-30 | Date-only có thể lệch ngày do `Date.parse` | Parser date-only hợp lệ theo UTC calendar, reject ngày không tồn tại, nhãn dùng `getUTC*`; thêm test leap day, tuần, range sai | PASS unit |
| T-31 | Gridline cố định 80px lệch tick | Gridline header và từng track dùng chính `scale.ticks[].x`; thanh được kẹp trong range, cột tên vẫn sticky | PASS build/static; browser CHƯA XÁC MINH |
| T-31 | Handoff ghi SVG nhưng component dùng DOM | Đã xác minh và ghi rõ: benchmark có SVG/Canvas độc lập; Gantt ứng dụng dùng DOM `div`/`button` để giữ keyboard/tooltip/select, không đổi renderer khi chưa có số đo mobile | PASS quyết định kiến trúc |
| T-32 | Marker thanh ngắn có thể bị cắt | Critical bar cho phép marker overflow, marker không nhận pointer và vẫn có viền/ký hiệu riêng | PASS build/static; visual CHƯA XÁC MINH |
| T-33 | Click ngoài chưa đóng tooltip | Thêm listener `pointerdown` ngoài vùng Gantt; click trong vùng không phải bar và Escape vẫn đóng; không stop event của nút khác | PASS build/static; browser CHƯA XÁC MINH |
| T-34 | Cần kiểm chứng migration an toàn | Thêm test tĩnh kiểm tra cột, constraint và rollback; không chạy migration/rollback/database | PASS static; DB CHƯA XÁC MINH |
| T-35 | Quyền `member` chưa có quyết định mới | Giữ nguyên project membership policy hiện có (admin/manager/engineer/member/project_manager), thêm test các role được phép và viewer bị từ chối; tài liệu chưa quy định thu hẹp quyền | PASS policy hiện có; cần quyết định nghiệp vụ nếu muốn đổi |

Đã thêm `frontend/tests/gantt-unit.test.mjs`, `frontend/tests/gantt.spec.js`, `backend/tests/progressMigration.test.js` và mở rộng `backend/tests/progress.test.js`.

Đã lazy-load các route trong `frontend/src/App.jsx`. Build trước đó tạo bundle chính khoảng 1,173 kB và cảnh báo vượt ngưỡng; build sau tạo chunk lớn nhất `axios` khoảng 487 kB, chunk `index` khoảng 261 kB và không còn cảnh báo bundle.

Kết quả kiểm tra sau sửa:

- `node --test frontend/tests/gantt-unit.test.mjs`: 3 pass.
- Backend Jest: 126 pass, 28 skipped, 0 fail.
- Backend lint: pass.
- Frontend lint: pass.
- Frontend build: pass, không còn cảnh báo bundle.
- Benchmark `node --check`: pass.
- Playwright chưa chạy được vì executable Chromium của Playwright chưa có; không cài browser/dependency mới. Các test browser mới ở trạng thái CHƯA XÁC MINH.
- `SPRINT2_TEST_DATABASE_URL` không được thiết lập; các test PostgreSQL vẫn skipped. Migration 012 chưa chạy.

### Bổ sung xác minh T-29

Sau khi kiểm tra lại, Chromium headless khả dụng trong phiên này. Đã chạy benchmark thật qua web server cục bộ, 5 lần mỗi renderer, Windows viewport 1280 × 720, DPR 1, user agent `HeadlessChrome/153.0.8010.12`. SVG đo 12.04 ms dựng/vẽ trung bình, FPS trung bình 60.1 và thấp 59.5; Canvas đo 51.28 ms, FPS trung bình 60.9 và thấp 30.0. Đây chỉ là desktop headless, chưa xác minh thiết bị điện thoại tầm trung. Số đo lịch sử này dùng phương pháp cũ; phiên sửa T-29 ngày 2026-10-06 bên dưới thay thế tài liệu benchmark hiện tại. Gantt sản phẩm vẫn dùng DOM `div`/`button`.

### Kết quả regression cuối

- Gridline đã chuyển thành một lớp dùng chung theo `scale.ticks`, tránh tạo hàng trăm gridline lặp cho mỗi task. Test 500 task đã pass.
- Tooltip đã bù offset vùng cuộn và đóng khi `pointerdown` bên ngoài Gantt; test viewport mô phỏng 390 × 844 đã pass. Đây vẫn là mô phỏng browser, không thay thế kiểm tra điện thoại thật.
- `npm.cmd test -- --reporter=line` của frontend: 14 pass.
- `npm.cmd test -- --runInBand` của backend: 126 pass, 28 skipped, 0 fail.
- `node --test tests/gantt-unit.test.mjs`: 3 pass; backend migration/permission tests nằm trong 126 test pass.
- Frontend/backend lint và frontend build pass; build sau lazy-loading không còn cảnh báo bundle (chunk lớn nhất `axios` 486.74 kB).
- Time-scale unit suite đã chạy thêm với `TZ=America/Los_Angeles` và `TZ=Asia/Tokyo`: mỗi môi trường 3 pass, không lệch nhãn date-only.

## T-29 sửa lỗi và hoàn thiện benchmark — 2026-10-06

- Đổi ES module thành script thường để mở `index.html` trực tiếp bằng `file://`. Thêm `server.mjs` dùng Node có sẵn, phục vụ riêng asset benchmark và in URL LAN để chạy trên điện thoại cùng Wi-Fi.
- Khóa các nút/ô nhập trong khi đo, kiểm tra số lượt nguyên 1–20, thêm dừng đo và hủy khi tab bị ẩn hoặc viewport thay đổi. Lỗi Canvas 2D được xử lý để có thể chạy lại.
- Dùng cùng 500 hình chữ nhật cho cả hai renderer. Canvas chuyển sang bitmap theo vùng nhìn, vẽ lại đủ 500 lệnh khi cuộn, giới hạn DPR ở 4 và giải phóng bitmap giữa các lượt. Không còn cấp bitmap 12.000 px nhân DPR.
- Mỗi lượt đo dựng/vẽ và cuộn hai chiều 2 giây từ đầu đến cuối rồi trở lại. Thêm warmup, đảo thứ tự renderer, thời gian đồng bộ và thời gian đến sau hai rAF, FPS trung bình/thấp nhất, frame p95.
- Thêm tên/model và loại môi trường do người chạy khai báo, tải JSON gồm thông tin thiết bị và từng khoảng frame. Kết quả có metadata của phiên đã đo.
- `verify.mjs`: PASS trên headless Chromium 153.0.8010.12, gồm desktop 1280 × 720 / DPR 1 / 5 lượt mỗi renderer, mô phỏng dọc 390 × 844 và ngang 844 × 390 / DPR 3 / 3 lượt mỗi renderer. Đã kiểm tra cả pixel hàng đầu/cuối của canvas, hành trình cuộn, JSON và các đường lỗi/hủy. Lint benchmark PASS.
- Số đo đầy đủ: [results/automated.json](../../experiments/gantt-benchmark/results/automated.json). Bảng tóm tắt và phương pháp: [README benchmark](../../experiments/gantt-benchmark/README.md).
- Quyết định: chọn SVG cho renderer thanh Gantt 500 công việc vì cả hai cách gần 60 FPS trong môi trường đã kiểm tra và SVG thuận tiện cho tương tác/truy cập. Không kết luận SVG nhanh hơn trên điện thoại thật. Đã ghi quyết định trong README gốc và benchmark; chưa thay DOM renderer của T-31.

**Trạng thái nghiệm thu T-29:** mã thử nghiệm và kiểm chứng tự động hoàn tất; số đo điện thoại tầm trung thật ở hướng dọc/ngang còn chờ thiết bị. Mô phỏng không thay thế tiêu chí đó. Không commit, push hoặc merge mã thử nghiệm vào nhánh chính.

## Kiểm tra lại T-30 — 2026-10-06

Review T-30 ban đầu phát hiện ngày kết thúc sai bị fallback âm thầm, origin Date có thể bị thay đổi sau khi tạo scale, trang Schedule chưa có điều khiển đổi đơn vị, và trục dài chồng nhãn. Follow-up đã sửa các lỗi này: Schedule có nút Ngày/Tuần, mật độ nhãn tự giảm nhưng giữ nguyên gridline/toạ độ thanh, scale reject ngày không hợp lệ và snapshot origin; đồng thời thêm unit/browser regressions và test ba mốc tính tay. Xem [báo cáo T-30](T30_REVIEW.md). Chưa xác nhận được kết quả test sau sửa vì môi trường từ chối khởi chạy Node/npm với `Access is denied. (os error 5)`; cần chạy lại các lệnh kiểm chứng khi quyền thực thi khả dụng.

## Refactor UX/UI Gantt — 2026-10-06

Theo yêu cầu mới, đã refactor frontend Schedule/Gantt với KPI dữ liệu thật, filter, nhóm hạng mục, timeline ngày/tuần/tháng, dependency arrow, milestone, drawer và update progress trong drawer. Bảng CPM đủ trường, mặc định thu gọn. Tái sử dụng API và TaskForm; không thay đổi backend/database, đã đối chiếu checksum trước/sau. Mốc lịch do người dùng chọn cho chế độ xem, không bịa ngày khởi công. Unit 12 pass, browser regression 23 pass, production UX 7 pass, lint/build pass; backend 126 pass/28 skip. Bằng chứng, file/API và giới hạn kiểm thử trong [GANTT_UX_UI.md](GANTT_UX_UI.md), ảnh trong `gantt-ui/`.

## Kiểm tra và hoàn thiện T-31 — 2026-10-06

Đã sửa cycleMessage bị mất khi không có kết quả, vạch 4 px giả cho task thiếu/sai/ngoài range; thêm helper clipping theo scale T-30. Lịch >100 hàng render theo viewport, giữ chiều cao/ID/index đầy đủ; cache trục, giới hạn phần vẽ grid/dependency và chỉ dựng bảng CPM khi mở. Unit 13 pass; 5 test T-31 production pass; trang thử điện thoại không mock API 1 pass; regression frontend 29 pass/12 skip/0 fail; lint/build pass. Mô phỏng mobile DPR 3/CPU slowdown 4: cuộn ngang 60 FPS, cuộn dọc thông thường 55,45 FPS. Phép kéo rất nhanh đồng thời toàn bộ 500 hàng vẫn giảm FPS; điện thoại tầm trung vật lý chưa xác minh. Có server thử độc lập 500 task cho LAN, không dùng dữ liệu dự án. Xem [T31_REVIEW.md](T31_REVIEW.md) và dữ liệu/ảnh trong `t31/`.
