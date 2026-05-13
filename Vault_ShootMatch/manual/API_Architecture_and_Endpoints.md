# SHOOTMATCH — Tài liệu Kỹ thuật API & Liên kết Chức năng

Tài liệu này chi tiết cách các API vận hành, phân quyền truy cập và sự liên kết giữa các module trong hệ thống ShootMatch.

## 1. Hệ thống Authentication API

Hệ thống tách biệt hai luồng đăng nhập để tối ưu hóa quản lý và bảo mật.

### 1.1. Khách hàng (`/api/auth`)
- `POST /register`: Công khai. Tạo mới User role `customer`.
- `POST /login`: Công khai. Trả về JWT + Refresh Token.
- `POST /google`: Công khai. Verify Google ID Token và map với User.
- `POST /otp/send` & `/otp/verify`: Công khai. Xác thực số điện thoại.

### 1.2. Nhiếp ảnh gia (`/api/photographer-auth`)
- Các endpoint tương tự nhưng thao tác trên bảng `photographers`. 
- Khi đăng ký, hệ thống sẽ mặc định khởi tạo một Profile trống để nhiếp ảnh gia cập nhật sau.

---

## 2. Luồng liên kết API & Chức năng (Feature Linking)

### 2.1. Từ "Swipe" đến "Match"
1. **API**: `POST /api/matches/swipe`
2. **Logic**: Lưu hành động quẹt vào `SwipeActionRepository`.
3. **Trigger**: Nếu hệ thống phát hiện "Double Like" (Cả 2 cùng thích nhau), một `MatchAggregate` sẽ được tạo ra.
4. **Liên kết**: Sau khi tạo Match, một **Domain Event** `MatchEstablishedEvent` được phát ra. Hệ thống sẽ tự động khởi tạo một `Conversation` trong module Chat để hai người có thể bắt đầu nói chuyện.

### 2.2. Từ "Booking" đến "Review"
1. **API**: `POST /api/bookings` (Yêu cầu `customer` role).
2. **Liên kết**: Booking phải tham chiếu đến một `ServicePackageId` hợp lệ của nhiếp ảnh gia.
3. **Trạng thái**: Khi thợ ảnh gọi `PUT /api/bookings/{id}/accept`, trạng thái chuyển thành `Confirmed`.
4. **Review**: Chỉ sau khi trạng thái Booking là `Completed`, API `POST /api/reviews` mới cho phép khách hàng gửi đánh giá.

---

## 3. Bản đồ Quyền hạn API (API Access Map)

| Endpoint | Method | Role bắt buộc | Ghi chú |
|----------|--------|---------------|---------|
| `/api/photographers/profile` | GET | `any` | Công khai để khách xem. |
| `/api/photographers/profile` | PUT | `photographer` | Chỉ chủ sở hữu mới được sửa. |
| `/api/photographers/packages`| POST | `photographer` | Tạo gói dịch vụ mới. |
| `/api/bookings` | POST | `customer` | Khách đặt lịch. |
| `/api/bookings/{id}/accept` | PUT | `photographer` | Thợ ảnh duyệt lịch. |
| `/api/reviews` | POST | `customer` | Khách đánh giá sau khi xong. |
| `/graphql` (Queries) | POST | `any` | Lấy dữ liệu hiển thị (Profile, List). |

---

## 4. Yêu cầu Hệ thống (Requirements)

- **Định danh**: Mọi API (trừ Auth) yêu cầu header `Authorization: Bearer {token}`.
- **Dữ liệu**: 
    - Để tạo Booking, khách hàng phải cung cấp `Location` (Value Object) và thời gian hợp lệ.
    - Để đăng ký Photographer, yêu cầu Email chưa tồn tại trong hệ thống.
- **Thời gian thực**: Chat API sử dụng SignalR tại `/hubs/chat`, yêu cầu kết nối liên tục (WebSocket).

---

## 5. Kiến trúc Dữ liệu Persistence
Toàn bộ API trên hiện đã được kết nối với **PostgreSQL** thông qua **EF Core**.
- Các bảng quan trọng: `customers`, `photographers`, `auth_sessions`, `matches`, `bookings`, `conversations`, `messages`, `reviews`.
- Mối quan hệ: `1 Photographer` có nhiều `ServicePackages`, `1 Booking` thuộc về `1 Customer` và `1 Photographer`.
