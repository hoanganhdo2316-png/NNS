# Hướng dẫn test Admin Login

## 1. Chạy Backend

```bash
cd backend
python -m pip install -r requirements.txt
python main.py
```

Backend sẽ chạy ở **http://localhost:8000**

## 2. Chạy Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend sẽ chạy ở **http://localhost:5173** (hoặc port khác)

## 3. Test Admin Login

Mở browser:
- Truy cập **http://localhost:5173** (frontend)
- Frontend sẽ tự động detect API URL thành **http://localhost:8000** (local server)
- Đăng nhập với mật khẩu: **admin@nns2026**

## 4. Các endpoint admin

Sau khi login, các endpoint này sẽ có sẵn:

```
GET  /admin/agents        - Danh sách đại lý
POST /admin/agents        - Thêm đại lý
GET  /admin/users         - Danh sách người dùng
GET  /admin/logs          - Nhật ký server
GET  /admin/traffic       - Thống kê traffic
GET  /admin/notifications - Thông báo
PUT  /admin/agents/{id}/lock - Khóa/mở khóa đại lý
```

## 5. Xem thêm

- Backend API detail: `backend/main.py` (dòng ~520)
- Admin Frontend: `frontend/src/AdminPage.jsx`
- Mật khẩu admin: được hash SHA256 từ `admin@nns2026`

## ⚠️ Ghi chú

- **Nếu test local**: Frontend sẽ tự động dùng `http://localhost:8000`
- **Nếu deploy production**: Frontend sẽ dùng `https://api.nns.id.vn`
- Đảm bảo **MongoDB chạy** ở `mongodb://localhost:27017`
