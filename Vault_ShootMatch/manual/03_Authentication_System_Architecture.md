# SHOOTMATCH — Kiến trúc hệ thống Authentication

Hệ thống hỗ trợ 3 phương thức xác thực chính, trả về bộ `AuthTokens` (Access + Refresh).

## 1. Email & Password
- **Bảo mật**: Sử dụng `BCrypt` để hash mật khẩu. Tuyệt đối không lưu plaintext.
- **Phân tách**: Endpoint `/api/auth` (Customer) và `/api/photographer-auth` (Photographer) hoạt động trên hai bảng khác nhau nhưng cùng dùng chung logic hashing.

## 2. Google OAuth
- **Flow**: Mobile gửi `idToken` -> Backend verify với Google -> Upsert (Tạo mới nếu chưa có, hoặc Link tài khoản).
- **Dữ liệu**: Đồng bộ Email và GoogleId vào Profile người dùng.

## 3. Phone OTP (Xác thực qua SMS)
- **Flow**: Gửi mã 6 số -> Verify -> Cấp Token.
- **Mục đích**: Đăng nhập nhanh, cực kỳ phổ biến tại thị trường Việt Nam.

## 4. Quản lý Phiên (Session Management)
- **JWT**: Chứa các claims: `sub` (UserId), `role` (customer/photographer), `email`.
- **Refresh Token**: Lưu trữ trong bảng `auth_sessions`, hỗ trợ tính năng **Rotation** để ngăn chặn tấn công chiếm quyền điều khiển phiên.

---
*Liên kết kỹ thuật:*
- [[projects/SHOOTMATCH/manual/API_Architecture_and_Endpoints#1. Hệ thống Authentication API]]
