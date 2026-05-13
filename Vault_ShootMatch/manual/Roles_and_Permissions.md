# SHOOTMATCH — Hệ thống Phân quyền & Vai trò (Roles & Permissions)

Dự án ShootMatch sử dụng mô hình phân quyền dựa trên Role (Role-Based Access Control - RBAC) kết hợp với các chính sách (Policies) để đảm bảo an ninh dữ liệu.

## 1. Danh sách Vai trò (Roles)

Hệ thống hiện tại định nghĩa 3 vai trò chính:

| Vai trò | Định danh (Claim) | Mô tả |
|---------|------------------|-------|
| **Khách hàng** | `customer` | Người dùng tìm kiếm nhiếp ảnh gia, thực hiện quẹt (swipe) và đặt lịch (booking). |
| **Nhiếp ảnh gia** | `photographer` | Người cung cấp dịch vụ, quản lý hồ sơ, gói chụp và phản hồi yêu cầu đặt lịch. |
| **Quản trị viên** | `admin` | Người quản lý nền tảng, duyệt hồ sơ nhiếp ảnh gia và xử lý tranh chấp. |

---

## 2. Chi tiết Chức năng theo Vai trò

### 2.1. Khách hàng (Customer)
- **Quản lý Tài khoản**: Đăng ký/Đăng nhập (Email, Google, Phone), cập nhật thông tin cá nhân.
- **Khám phá**: 
    - Xem danh sách nhiếp ảnh gia dựa trên vị trí và mức giá.
    - Xem chi tiết hồ sơ (Bio, Portfolio, Packages, Reviews).
- **Tương tác (Matching)**:
    - Thực hiện hành động `Swipe` (Like/Dislike).
    - Nhận thông báo khi có `Match` mới.
- **Đặt lịch (Booking)**:
    - Tạo yêu cầu đặt lịch dựa trên các gói dịch vụ có sẵn.
    - Theo dõi trạng thái Booking (Chờ duyệt, Đã chấp nhận, Đã hoàn thành).
- **Giao tiếp**: Chat trực tiếp với nhiếp ảnh gia sau khi có Match hoặc Booking.
- **Đánh giá**: Gửi Review và Rating sau khi kết thúc buổi chụp.

### 2.2. Nhiếp ảnh gia (Photographer)
- **Quản lý Hồ sơ chuyên nghiệp**:
    - Thiết lập Portfolio (Tải ảnh lên Cloud/DB).
    - Quản lý **Service Packages** (Tên gói, mô tả, giá tiền, thời lượng).
- **Quản lý Đặt lịch**:
    - Nhận thông báo yêu cầu đặt lịch mới.
    - Phản hồi: **Chấp nhận** hoặc **Từ chối**.
    - Xem lịch trình (Dashboard).
- **Tương tác**: Quẹt để tìm kiếm khách hàng tiềm năng hoặc phản hồi các lượt "Like" từ khách.
- **Giao tiếp**: Chat với khách hàng để chốt concept và địa điểm.

### 2.3. Quản trị viên (Admin)
- **Duyệt hồ sơ**: Xác minh danh tính và năng lực của nhiếp ảnh gia trước khi cho phép hiển thị công khai.
- **Quản lý nội dung**: Xóa các đánh giá không phù hợp hoặc hồ sơ vi phạm tiêu chuẩn cộng đồng.
- **Báo cáo**: Xem thống kê về số lượng Match, Booking và doanh thu toàn hệ thống.

---

## 3. Chính sách Truy cập (Authorization Policies)

Trong mã nguồn Backend (`Program.cs`), các chính sách sau được áp dụng:

- `CustomerOnly`: Chỉ cho phép người dùng có claim `role: customer`.
- `PhotographerOnly`: Chỉ cho phép người dùng có claim `role: photographer`.
- `AdminOnly`: Chỉ dành cho quản trị viên.
- `BookingParticipant`: Cho phép cả khách hàng và nhiếp ảnh gia liên quan đến một Booking cụ thể được truy cập vào dữ liệu của Booking đó.

---

## 4. Bảo mật Token
Tất cả các quyền truy cập đều dựa trên **JWT (JSON Web Token)**. 
- Role được nhúng trực tiếp vào Payload của Token.
- Backend kiểm tra tính toàn vẹn của Token qua `SecretKey` trước khi cho phép thực thi bất kỳ API nào.
