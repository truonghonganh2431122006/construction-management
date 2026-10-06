# T-29 — Benchmark 500 thanh SVG và Canvas

Mã thử nghiệm độc lập trong `experiments/gantt-benchmark/`, không được import vào frontend sản phẩm. Benchmark dùng cùng bộ dữ liệu xác định gồm 500 hình chữ nhật, cùng tọa độ, kích thước, màu và viền. Vùng nội dung rộng 1.000 px, cao 12.000 px; khung cuộn cao 360 px tính cả viền.

## Chạy trên máy tính hoặc điện thoại

Mở trực tiếp `index.html` bằng trình duyệt để đo trên máy tính. Script thường thay cho ES module nên không còn lỗi module bị chặn khi dùng `file://`.

Để đo trên điện thoại thật, chạy từ thư mục gốc dự án bằng Node đã có sẵn, không cần cài thêm package:

```powershell
node experiments/gantt-benchmark/server.mjs --host 0.0.0.0 --port 8080
```

Server in địa chỉ máy tính và địa chỉ IPv4 trong mạng LAN. Kết nối điện thoại cùng Wi-Fi, mở địa chỉ `http://<IP-máy-tính>:8080` được in trong terminal. Nếu không truy cập được, kiểm tra hai thiết bị cùng mạng và quyền truy cập Node trên mạng riêng trong Windows Firewall. Server chỉ phục vụ HTML và JavaScript của benchmark. Nhấn `Ctrl+C` để dừng. Đo riêng trên máy tính có thể bỏ `--host 0.0.0.0`, mặc định chỉ nghe tại `127.0.0.1`.

1. Điền tên/model thiết bị và chọn **Điện thoại thật**, **Máy tính** hoặc **Mô phỏng điện thoại**. Đây là thông tin người chạy khai báo, không phải xác minh tự động phần cứng.
2. Chọn số lượt nguyên từ 1 đến 20; dùng ít nhất 5 lượt cho mỗi renderer khi nghiệm thu.
3. Bấm **Đo cả hai**; giữ nguyên hướng màn hình, giữ trang ở phía trước, không cuộn bằng tay khi đang đo.
4. Bấm **Tải kết quả JSON** khi hoàn tất. JSON lưu thời điểm, thông tin thiết bị, user agent, viewport, DPR, thông số phép đo và từng khoảng frame của mỗi lượt.
5. Trên điện thoại tầm trung thật, đo riêng ở hướng dọc và ngang, tải hai JSON và ghi model/OS/trình duyệt vào bảng nghiệm thu bên dưới.

Nút chạy và ô nhập bị khóa khi đo. **Dừng đo**, ẩn tab hoặc thay đổi kích thước màn hình sẽ hủy phiên chưa xong; kết quả đã hoàn tất trước đó được giữ lại. Nếu không tạo được Canvas 2D, trang báo lỗi và mở lại các nút để thử SVG.

## Phương pháp đo

- Mỗi renderer được làm nóng một lượt; lượt này không tính vào kết quả. Khi đo cả hai, thứ tự SVG/Canvas đảo sau mỗi vòng để giảm ảnh hưởng thứ tự.
- Mỗi lượt đo cả dựng/vẽ và cuộn. Trang đưa biểu đồ vào vùng nhìn trước khi bắt đầu để tránh đo nội dung nằm ngoài màn hình. Trước khi dựng, renderer cũ được giải phóng và vùng cuộn về đầu. Trước mỗi lượt cuộn, cả hai trục về 0.
- **Dựng/vẽ (ms)** là thời gian đồng bộ từ tạo renderer đến hoàn tất lệnh dựng/vẽ và gắn vào trang, đo bằng `performance.now()`.
- **Đến sau frame (ms)** là thời gian đến callback `requestAnimationFrame` thứ hai sau khi dựng, cho trình duyệt một cơ hội paint giữa hai callback. Đây là ước lượng thời gian thực, không đo thời gian GPU hoàn tất.
- Mỗi lượt cuộn tự động kéo dài ít nhất 2 giây, đi từ đầu tới cuối rồi về đầu; màn hình hẹp cuộn cả ngang và dọc. JSON ghi khoảng cuộn tối đa và vị trí xa nhất thực tế để kiểm tra đủ hành trình.
- **FPS TB** = `1000 / trung bình khoảng cách callback rAF`, tổng hợp từ tất cả lượt. **FPS thấp nhất** = `1000 / khoảng frame dài nhất`; **Frame p95** là phân vị 95% của khoảng frame. FPS từ rAF phản ánh nhịp callback khi trang cuộn, không phải bộ đếm frame GPU. Một frame chậm riêng lẻ ảnh hưởng mạnh tới FPS thấp nhất.

SVG tạo đủ 500 node `rect` và dùng việc cuộn tự nhiên của trình duyệt. Canvas cũng gửi đủ 500 lệnh vẽ hình chữ nhật mỗi khi vị trí dọc thay đổi, nhưng bitmap chỉ cao bằng vùng nhìn; những hàng ngoài vùng nhìn được clip. Canvas được đặt lại vị trí và vẽ lại khi cuộn. Đây là so sánh hai cách triển khai có thể dùng trên mobile, gồm chi phí vẽ lại của canvas; không phải so sánh hai ảnh tĩnh cao 12.000 px.

Canvas dùng DPR của thiết bị, giới hạn ở 4 và lưu tỷ lệ thực tế trong JSON. Với DPR 3, bộ đệm khoảng 12,3 MiB (`3000 × 1074 × 4` byte), thay vì khoảng 412 MiB của bitmap toàn vùng (`3000 × 36000 × 4` byte). Đây là dung lượng bitmap RGBA tính toán, không phải số đo tổng bộ nhớ tiến trình; giá trị thực tế phụ thuộc kích thước vùng cuộn.

## Kết quả kiểm chứng — 2026-10-06

Đã chạy thật bằng Playwright headless Chromium **153.0.8010.12** trên **Windows**. Máy tính chạy 5 lượt mỗi renderer; hai profile điện thoại mô phỏng chạy 3 lượt mỗi renderer, DPR 3. Số liệu của phiên kiểm chứng được lưu đầy đủ trong [results/automated.json](results/automated.json).

| Môi trường | Renderer | Dựng/vẽ TB (ms) | Đến sau frame TB (ms) | FPS TB | FPS thấp nhất | Frame p95 (ms) |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| Desktop 1280 × 720, DPR 1 | SVG | 6.24 | 33.66 | 60.0 | 59.5 | 16.70 |
| Desktop 1280 × 720, DPR 1 | Canvas | 2.60 | 45.16 | 59.1 | 12.0 | 16.70 |
| Mô phỏng dọc 390 × 844, DPR 3 | SVG | 4.67 | 31.27 | 59.0 | 12.0 | 16.80 |
| Mô phỏng dọc 390 × 844, DPR 3 | Canvas | 7.83 | 35.60 | 60.0 | 59.5 | 16.80 |
| Mô phỏng ngang 844 × 390, DPR 3 | SVG | 3.03 | 36.20 | 59.2 | 10.0 | 16.80 |
| Mô phỏng ngang 844 × 390, DPR 3 | Canvas | 11.73 | 36.73 | 60.0 | 59.5 | 16.70 |

Các số đo headless dao động theo tải máy và lịch chạy browser. Ở phiên này canvas dựng nhanh hơn trên desktop, SVG dựng nhanh hơn ở DPR 3, và FPS thấp nhất có những frame chậm riêng lẻ ở cả hai cách. Không thể suy ra SVG cuộn mượt hơn trên điện thoại thật từ bảng này. Số đo desktop ngày 2026-10-02 dùng canvas toàn chiều cao và cách đo cũ nên không dùng để so sánh trực tiếp với phiên này.

## Quyết định kỹ thuật T-29

**Chọn SVG cho renderer thanh Gantt trong phạm vi 500 công việc.** Với số lượng này, cả hai cách đạt xấp xỉ 60 FPS trung bình trong các profile đã kiểm tra; chưa có bằng chứng về lợi ích hiệu năng đủ lớn để chịu thêm độ phức tạp của canvas. SVG có node cho từng thanh, thuận tiện cho chọn thanh, sự kiện con trỏ, tooltip, focus và nhãn truy cập. Canvas cần thêm hit-testing, ánh xạ tọa độ khi cuộn, bộ đệm/vẽ lại và lớp DOM để hỗ trợ bàn phím.

Đây là quyết định kỹ thuật để tiếp tục triển khai, **chưa phải nghiệm thu hiệu năng trên điện thoại tầm trung thật**. Nếu số đo thiết bị mục tiêu cho thấy SVG có frame p95 hoặc thao tác chọn/cuộn kém ổn định, cần xem lại quyết định bằng cùng bộ dữ liệu và điều kiện đo. Không đổi renderer của T-31 trong task thử nghiệm này: `frontend/src/features/gantt/Gantt.jsx` hiện dùng DOM `div`/`button`, chưa phải SVG. Benchmark chỉ đánh giá thanh, chưa bao gồm nhãn/gridline/tooltip của toàn màn hình sản phẩm.

## Nghiệm thu điện thoại thật còn lại

Môi trường kiểm chứng hiện tại không có điện thoại tầm trung thật được kết nối. **T-29 đã sửa xong mã thử nghiệm và có quyết định kỹ thuật; tiêu chí số đo trên điện thoại thật vẫn chưa hoàn tất.** Không ghi kết quả mô phỏng thành kết quả phần cứng thật.

| Model / OS / browser | Hướng | Lượt mỗi renderer | File số liệu | Trạng thái |
| --- | --- | --- | --- | --- |
| Chưa có thiết bị | Dọc | 5 trở lên | Chưa có | Chờ đo trên điện thoại thật |
| Chưa có thiết bị | Ngang | 5 trở lên | Chưa có | Chờ đo trên điện thoại thật |

Sau khi đo, thêm hai JSON vào `results/`, ghi các chỉ số như bảng kiểm chứng và cập nhật quyết định nếu dữ liệu yêu cầu.

## Kiểm tra tự động

Dùng Playwright/browser có sẵn của frontend; không cần backend hoặc database:

```powershell
node experiments/gantt-benchmark/verify.mjs
```

Script kiểm tra mở trực tiếp HTML; 500 node SVG; canvas DPR 3 có màu đúng ở hàng đầu và hàng cuối; cuộn đủ hành trình ở mọi lượt; khóa chạy chồng; số lượt không hợp lệ; dừng/ẩn tab/resize; lỗi thiếu Canvas 2D; JSON tải xuống; viewport dọc/ngang không làm tràn trang; server chỉ phục vụ asset benchmark. Chạy lại sẽ cập nhật `results/automated.json`; nếu lưu kết quả mới để review, cập nhật bảng tương ứng trong README.

Lint riêng benchmark, từ thư mục `experiments/gantt-benchmark/`:

```powershell
node ../../frontend/node_modules/eslint/bin/eslint.js . --max-warnings=0
```
