# SHOOTMATCH — Tài liệu Hướng dẫn Chức năng & Vai trò (Cực kỳ chi tiết)

Chào mừng bạn đến với tài liệu hướng dẫn vận hành hệ thống ShootMatch. Tài liệu này được thiết kế để cung cấp mọi thông tin cần thiết cho cả người dùng cuối và các nhà phát triển.

---

## 1. PHÂN QUYỀN & VAI TRÒ (DETAILED ROLES)

### 1.1. Khách hàng (Customer) - "Phía Cầu"
- **Mục tiêu**: Tìm thợ chụp đẹp, giá tốt, uy tín.
- **Chức năng chi tiết**:
    - **Hồ sơ Cá nhân**: Quản lý avatar, tên, số điện thoại và lịch sử đặt lịch.
    - **Tìm kiếm Thông minh**: Lọc thợ chụp theo khu vực (Location), mức giá (Budget), và đánh giá (Rating).
    - **Cơ chế Swipe**:
        - `Like`: Thêm thợ ảnh vào danh sách tiềm năng.
        - `Dislike`: Bỏ qua thợ ảnh này khỏi danh sách đề xuất.
    - **Quy trình Booking**:
        - Xem các "Service Packages" của thợ ảnh.
        - Chọn gói -> Chọn thời gian -> Gửi yêu cầu.
    - **Giao tiếp & Phản hồi**:
        - Chat với thợ ảnh sau khi "Matched".
        - Viết Review (Nhận xét) và chấm điểm (1-5 sao).

### 1.2. Nhiếp ảnh gia (Photographer) - "Phía Cung"
- **Mục tiêu**: Xây dựng profile uy tín, nhận nhiều show, quản lý lịch trình hiệu quả.
- **Chức năng chi tiết**:
    - **Xây dựng Portfolio**: Tải lên các tác phẩm tiêu biểu theo từng chuyên mục (Cưới, Thời trang, Đường phố...).
    - **Quản lý Service Packages**:
        - Tạo gói chụp (Ví dụ: "Gói chụp Portrait 1h").
        - Quy định giá tiền và mô tả chi tiết những gì khách nhận được (VD: Số ảnh đã chỉnh sửa, phụ phí di chuyển).
    - **Quản lý Đặt lịch (Dashboard)**:
        - Nhận thông báo "Push" khi có khách đặt lịch.
        - Xem chi tiết yêu cầu khách hàng: Địa điểm, thời gian, lưu ý đặc biệt.
        - Nút `Accept` / `Decline` để chốt show.
    - **Tương tác khách hàng**: Phản hồi lại lượt quẹt từ khách hoặc chat trực tiếp.

---

## 2. KIẾN TRÚC API & LIÊN KẾT (TECHNICAL LINKING)

### 2.1. Authentication & Security
Hệ thống sử dụng **JWT (JSON Web Tokens)** để phân quyền. 
- Khi Login, Server trả về `AccessToken` chứa `RoleClaim`.
- Mọi API tiếp theo sẽ kiểm tra Claim này. 
- **Ví dụ**: API `/api/bookings` sẽ từ chối nếu User có Role là `photographer` (vì thợ ảnh không thể tự đặt lịch cho mình).

### 2.2. Luồng Dữ liệu (Workflow Integration)
- **Match ➔ Conversation**: 
    - Khi logic Matching phát hiện sự đồng thuận, `MatchAggregate` được lưu vào DB.
    - Một **Domain Event** được kích hoạt, gọi sang `ConversationRepository` để khởi tạo phòng chat với ID của Customer và Photographer.
- **Booking ➔ Notification**:
    - Khi Customer tạo Booking, một thông báo được gửi đến Dashboard của Photographer.
- **Booking ➔ Review**:
    - Trạng thái Booking được quản lý chặt chẽ: `Pending` -> `Confirmed` -> `Completed`.
    - Hệ thống chỉ cho phép viết Review nếu trạng thái là `Completed`.

---

## 3. CÁC TÍNH NĂNG ĐANG PHÁT TRIỂN (UPCOMING)
- **Hệ thống Verify**: Admin sẽ xem các giấy tờ/portfolio của Photographer để cấp tích xanh.
- **Thanh toán trực tuyến**: Tích hợp VNPay để đặt cọc (Deposit) ngay khi Booking được confirm.

---

*Xem thêm*:
- [[projects/SHOOTMATCH/manual/API_Architecture_and_Endpoints]]
- [[projects/SHOOTMATCH/manual/Roles_and_Permissions]]
