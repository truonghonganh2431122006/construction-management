# Construction Management

Hệ thống quản lý xây dựng.

## Công nghệ sử dụng

### Backend
- Node.js 24
- Express.js
- PostgreSQL
- Jest
- ESLint
- GitHub Actions CI

---

# Backend Setup

## 1. Cài đặt thư viện

```bash
cd backend
npm install
```

## 2. Chạy backend và kiểm tra code

Chạy trong thư mục `backend`:

```bash
npm start
npm run lint
npm test -- --ci
```

`npm start` chạy server cho đến khi nhấn `Ctrl+C`. Chạy lint và test ở terminal
khác hoặc sau khi dừng server. Khi phát triển, có thể dùng `npm run dev`.

## 3. Chạy backend bằng Docker tại máy local

Cần Docker Engine/Docker Desktop đang chạy ở chế độ Linux containers và Docker
Compose v2 trở lên. Các lệnh Docker dưới đây chạy từ thư mục gốc repository.

```bash
docker compose -f docker-compose.yml config --quiet
docker compose -f docker-compose.yml up --build -d --wait
docker compose -f docker-compose.yml ps
```

API có tại `http://localhost:3001/`. Project Docker có tên
`construction-management-docker`, dùng cổng khác với server Node.js chạy trực
tiếp trên cổng mặc định `3000`. Có thể đổi cổng Docker qua biến môi trường
`BACKEND_DOCKER_PORT`.

Compose đọc các biến database từ `backend/.env` và ghi đè `DB_HOST` trong
container thành `host.docker.internal` để truy cập PostgreSQL trên máy host.
Nếu database ở máy khác, đặt biến môi trường `DOCKER_DB_HOST` trước khi chạy
Compose. File `backend/.env` không bị sửa. `localhost` bên trong container là
chính container đó; PostgreSQL cần cho phép kết nối từ mạng Docker.

Image dùng Node.js 24, chỉ cài dependencies chạy ứng dụng và chạy dưới user
`node`. File `.env` và `node_modules` của máy local không đi vào build context.
Healthcheck gọi `GET /`; đây là kiểm tra HTTP của backend, không kiểm tra database.

Xem log hoặc dừng riêng project Docker local:

```bash
docker compose -f docker-compose.yml logs -f backend
docker compose -f docker-compose.yml down
```

## 4. Chuẩn bị staging

Hiện chưa có máy chủ staging. `docker-compose.staging.yml` là cấu hình độc lập,
chạy bằng một tùy chọn `-f`, không ghép với `docker-compose.yml`. Nó dùng project
`construction-management-staging`, cổng mặc định `3002` và file môi trường riêng.
Không có PostgreSQL container hay lệnh migration tự động trong hai cấu hình.

Khi có máy chủ, lấy source code tại commit cần triển khai, cài Docker/Compose
và tạo file `backend/.env.staging` từ `backend/.env.staging.example`. Ví dụ trên
Linux, chỉ thực hiện lần đầu để không ghi đè cấu hình staging đã có:

```bash
cp -n backend/.env.staging.example backend/.env.staging
```

Trên PowerShell, chỉ sao chép khi file đích chưa tồn tại:

```powershell
if (-not (Test-Path backend/.env.staging)) {
    Copy-Item backend/.env.staging.example backend/.env.staging
}
```

Điền thông tin PostgreSQL dành riêng cho staging vào file mới trước khi deploy.
File mẫu chỉ chứa giá trị minh họa; database và tài khoản staging cần được chuẩn
bị riêng. Nếu PostgreSQL cùng máy host, có thể dùng `host.docker.internal`; nếu
ở máy khác, dùng địa chỉ máy database. `.env.staging` được Git bỏ qua và không
được đóng gói vào image.

Sau khi cấu hình xong, chạy trên máy staging từ thư mục gốc repository:

```bash
docker compose -f docker-compose.staging.yml config --quiet
docker compose -f docker-compose.staging.yml up --build -d --wait
docker compose -f docker-compose.staging.yml ps
```

API mặc định chỉ mở trên `http://127.0.0.1:3002/` của máy staging, phù hợp để
đặt reverse proxy cùng máy phía trước. Truy cập từ máy khác cần cấu hình reverse
proxy hoặc chủ động đặt `STAGING_BIND_ADDRESS` cùng firewall phù hợp.

Các biến tùy chọn được đặt trong môi trường shell chạy Compose:

| Biến | Mặc định | Mục đích |
| --- | --- | --- |
| `STAGING_ENV_FILE` | `./backend/.env.staging` | Đường dẫn file môi trường staging |
| `STAGING_IMAGE_TAG` | `staging` | Tag image; nên dùng commit SHA khi triển khai |
| `STAGING_PORT` | `3002` | Cổng trên máy host |
| `STAGING_BIND_ADDRESS` | `127.0.0.1` | Địa chỉ host nhận kết nối |

Các biến này điều khiển Compose, không được lấy từ file `env_file` của service.
Luôn dùng file staging khi xem log hoặc dừng staging để chọn đúng project:

```bash
docker compose -f docker-compose.staging.yml logs -f backend
docker compose -f docker-compose.staging.yml down
```

## 5. CI và chuẩn bị deploy staging

Workflow `.github/workflows/ci.yml` chạy khi push hoặc pull request vào `main`:

1. Checkout code và setup Node.js 24.
2. Chạy `npm ci`, lint và Jest như trước.
3. Khi test đạt, build Docker image với tag là commit SHA.
4. Kiểm tra cấu hình staging bằng `docker compose config --quiet`, sử dụng file
   mẫu không chứa thông tin bí mật.

Bước staging hiện chỉ kiểm tra cấu hình: không chạy container, không kết nối
database, không push image lên registry và không deploy lên máy chủ. Image được
build trong CI chỉ nằm trên runner của lần chạy đó. Khi có máy staging, sẽ cần
chọn cách chuyển image/source tới máy chủ, cấu hình credentials, GitHub
Environment `staging` và cơ chế kích hoạt deploy trước khi thêm job triển khai.

Tham khảo [cấu hình môi trường của Docker Compose](https://docs.docker.com/compose/how-tos/environment-variables/set-environment-variables/)
và [lệnh kiểm tra cấu hình Compose](https://docs.docker.com/reference/cli/docker/compose/config/).
