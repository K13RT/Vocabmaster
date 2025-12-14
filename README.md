# Vocabulary Learning App (Ứng dụng Học Từ Vựng Tiếng Anh)

Một ứng dụng web toàn diện hỗ trợ học từ vựng tiếng Anh thông qua phương pháp Flashcards, Spaced Repetition (Lặp lại ngắt quãng) và các bài kiểm tra (Quiz).

## 🌟 Tính năng

### Người dùng (Học viên)
- **Học từ vựng**: Xem flashcard với từ vựng, định nghĩa, ví dụ và phát âm.
- **Spaced Repetition**: Hệ thống tự động gợi ý ôn tập các từ dựa trên mức độ ghi nhớ của bạn.
- **Quiz**: Kiểm tra kiến thức qua các bài trắc nghiệm và điền từ.
- **Thống kê**: Theo dõi tiến độ học tập qua biểu đồ trực quan.
- **Quản lý bộ từ**: Tạo và quản lý các bộ từ vựng cá nhân.

### Quản trị viên (Admin)
- **Dashboard**: Xem tổng quan thống kê người dùng và hệ thống.
- **Quản lý người dùng**: Xem danh sách và thông tin người dùng.
- **Quản lý nội dung**: Tạo và chia sẻ các bộ từ vựng chuẩn cho cộng đồng.
- **Giao bài tập**: Tạo và gán các bài kiểm tra cho học viên.

## 🛠️ Công nghệ sử dụng (Tech Stack)

### Frontend (Client)
- **Core**: Vanilla JavaScript (ES Modules)
- **Build Tool**: [Vite](https://vitejs.dev/) - Cho môi trường phát triển nhanh và build tối ưu.
- **Styling**: CSS3 (Variables, Flexbox, Grid) - Thiết kế responsive và hiện đại.
- **Charts**: Chart.js - Hiển thị biểu đồ thống kê.

### Backend (Server)
- **Runtime**: Node.js
- **Framework**: Express.js
- **Architecture**: Repository Pattern - Tách biệt logic xử lý dữ liệu để dễ dàng bảo trì và chuyển đổi database.
- **Authentication**: JWT (JSON Web Tokens) & Cookies.

### Database
Hỗ trợ linh hoạt 2 loại cơ sở dữ liệu (cấu hình qua biến môi trường):
1.  **SQLite** (Mặc định): Dễ dàng triển khai, không cần cài đặt server database riêng.
2.  **Supabase (PostgreSQL)**: Cho khả năng mở rộng và quản lý tập trung.

### Testing
- **E2E Testing**: [Playwright](https://playwright.dev/) - Kiểm thử tự động quy trình người dùng.

## 📂 Cấu trúc dự án

```
Hoctienganh/
├── client/                 # Mã nguồn Frontend
│   ├── css/                # Các file CSS (global, components, variables)
│   ├── js/                 # Logic JavaScript
│   │   ├── components/     # Các thành phần UI tái sử dụng (Flashcard, Modal, etc.)
│   │   ├── pages/          # Logic cho từng trang màn hình
│   │   ├── services/       # Gọi API (auth, data fetching)
│   │   ├── utils/          # Hàm tiện ích
│   │   ├── app.js          # Entry point của ứng dụng
│   │   └── router.js       # Xử lý điều hướng (Client-side routing)
│   ├── index.html          # File HTML chính
│   └── vite.config.js      # Cấu hình Vite
│
├── server/                 # Mã nguồn Backend
│   ├── config/             # Cấu hình database, constants
│   ├── middleware/         # Auth, validation middleware
│   ├── repositories/       # Lớp truy xuất dữ liệu (SQLite/Supabase impl)
│   ├── routes/             # Định nghĩa API endpoints
│   ├── services/           # Business logic (nếu có tách biệt)
│   ├── db/                 # File database SQLite (nếu dùng SQLite)
│   └── index.js            # Entry point của Server
│
├── tests/                  # Test scripts (Playwright)
└── package.json            # Quản lý dependencies và scripts
```

## 🚀 Cài đặt và Chạy ứng dụng

### Yêu cầu
- Node.js (v14 trở lên)
- NPM

### Các bước cài đặt

1.  **Cài đặt dependencies cho cả server và client:**
    ```bash
    npm run install-all
    ```

2.  **Chạy ứng dụng (Chế độ phát triển):**
    Lệnh này sẽ chạy đồng thời cả Server (port 3000) và Client (port 5173).
    ```bash
    npm run dev
    ```
    Truy cập ứng dụng tại: `http://localhost:5173`

### Tài khoản mặc định
- **Admin**:
    - Username: `admin`
    - Password: `admin123`

## 🔌 API Endpoints chính

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| **Auth** | `/api/auth/login` | Đăng nhập |
| **Auth** | `/api/auth/register` | Đăng ký tài khoản mới |
| **Sets** | `/api/sets` | Lấy danh sách hoặc tạo bộ từ |
| **Words** | `/api/words` | Quản lý từ vựng |
| **Quiz** | `/api/quiz/multiple-choice/:setId` | Lấy câu hỏi trắc nghiệm |
| **Progress**| `/api/progress/review` | Cập nhật kết quả học tập |

## ⚙️ Cấu hình nâng cao

Để chuyển đổi sang sử dụng Supabase, thiết lập biến môi trường trong `.env` (hoặc set trực tiếp):
```env
USE_SUPABASE=true
SUPABASE_URL=your_url
SUPABASE_KEY=your_key
```
Xem chi tiết tại `server/repositories/index.js`.
