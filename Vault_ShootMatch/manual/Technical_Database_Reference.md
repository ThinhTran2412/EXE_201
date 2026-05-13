# SHOOTMATCH — Technical & DB Reference (Dev Only)

Tài liệu kỹ thuật tập trung vào cấu trúc dữ liệu và logic hệ thống. Ngắn gọn, trực diện.

## 1. Hệ thống Phân quyền (Role Mapping)

Hệ thống sử dụng Enum kỹ thuật để định danh quyền (dùng trong code và mapping):

| Role ID | Role Name | Database Table | Mô tả |
|---------|-----------|----------------|-------|
| **0** | `admin` | *N/A* | Quyền tối cao, check qua JWT Claim. |
| **1** | `customer` | `customers` | Người dùng tìm kiếm thợ. |
| **2** | `photographer` | `photographers` | Người cung cấp dịch vụ. |

---

## 2. Cấu trúc Database (Tables & Key Cells)

### 2.1. Danh tính & Auth
- **Table `customers`**:
    - `id`: Primary Key (UUID).
    - `email`: Duy nhất (Unique Index).
    - `password_hash`: Lưu chuỗi BCrypt (Varchar 100).
    - `google_id`: Định danh Google (Varchar 128, Indexed).
- **Table `photographers`**:
    - `id`: Primary Key (UUID).
    - Các trường `email`, `password_hash`, `google_id` tương tự khách hàng.
- **Table `auth_sessions`**:
    - `customer_id`: Khóa ngoại trỏ đến ID người dùng (dùng chung cho cả 2 role).
    - `refresh_token`: Chuỗi token (Varchar 512, Unique Index).

### 2.2. Nghiệp vụ Matching & Booking
- **Table `matches`**:
    - `status`: Trạng thái (Varchar 20 - `Pending`, `Established`, `Rejected`).
    - `customer_id` & `photographer_id`: FK liên kết 2 bên.
- **Table `bookings`**:
    - `agreed_price`: Số tiền (Numeric 18,2).
    - `status`: (`Pending`, `Confirmed`, `Completed`, `Cancelled`).
- **Table `service_packages`**:
    - `price`: Giá gói (Numeric 18,2).
    - `photographer_id`: Liên kết chủ gói.

### 2.3. Chat & Messaging
- **Table `conversations`**:
    - `match_id`: Liên kết 1-1 với Match (Unique Index).
- **Table `messages`**:
    - `sender_role`: Phân biệt bubble chat (`customer` / `photographer`).

---

## 3. Quy trình API ➔ Database
1. **Register**: `POST /api/auth/register` ➔ Insert row vào `customers` (cell `password_hash` được băm).
2. **Swipe**: `POST /api/matches/swipe` ➔ Insert `swipe_actions`. Nếu Double Like ➔ Insert `matches`.
3. **Match Trigger**: Khi `matches` được tạo ➔ Trigger logic tạo `conversations`.
4. **Accept Booking**: `PUT /api/bookings/{id}/accept` ➔ Update cell `status` thành `Confirmed`.

## 4. SignalR & WebSocket
- Hub: `/hubs/chat`
- Mapping: ConnectionId được map với `UserId` (từ JWT) trong memory để route message.
