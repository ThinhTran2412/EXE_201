# \[SHOOTMATCH\] Plan: Deposit Payment, GPS Tracking & Shooting Session

## 1. Thanh Toán Tiền Cọc (Deposit Payment) với PayOS

**Giải pháp:** Sử dụng **PayOS** vì cổng này hỗ trợ tạo mã QR chuyển khoản ngân hàng (VietQR) và có API tự động check biến động số dư báo qua Webhook hoàn toàn **miễn phí**. Rất dễ tích hợp và trải nghiệm thanh toán của user rất nhanh (chỉ cần quét QR trên app ngân hàng).

**Thiết kế Database & API:**

- **SystemConfigs:** Thêm bảng/cột để lưu cấu hình: `DepositPercentage = 20` (hoặc 10).
- **Bookings:**
  - Thêm cột `DepositRate` (chỉ số phần trăm % được lấy ra tại thời điểm tạo đơn, việc lưu thẳng vào đơn giúp dự phòng sau này nếu admin đổi rate thì các đơn cũ không bị lệch số tiền).
  - Thêm cột `DepositAmount`, `TotalAmount`, `PaymentStatus` (Pending, DepositPaid, FullyPaid).
  - Mở rộng `BookingStatus`: thêm `AwaitingDeposit` (Chờ cọc) nằm sau `Accepted` và trước `Confirmed`.
- **Transactions:** Bảng lưu mã giao dịch để đối soát với hệ thống PayOS.
- **API Flow:**
  1. `GET /api/configs`: App gọi để biết rate.
  2. `POST /api/payments/create-payos-link`: Gửi `BookingId` lên, BE gọi API PayOS để sinh link checkout/Mã QR.
  3. `POST /api/payments/payos-webhook`: (Dành cho PayOS gọi vào). Khi user chuyển khoản thành công, PayOS gọi API này, BE cập nhật `PaymentStatus = DepositPaid` và `BookingStatus = Confirmed`, sau đó bắn **SignalR** cho Mobile App nhảy màn hình hoàn tất ngay lập tức.

**Mobile App:**

- Màn hình "Thanh toán cọc": Dùng `WebView` mở link checkout của PayOS hoặc show mã QR trực tiếp.
- Lắng nghe sự kiện từ SignalR để tự cập nhật trạng thái khi thanh toán báo về thành công.

---

## 2. Định Vị GPS & Theo Dõi (Location Tracking)

**Giải pháp:** Sử dụng thư viện `react-native-maps` kết hợp **SignalR** có sẵn của backend. `react-native-maps` gọi thẳng bản đồ gốc của hệ điều hành (Apple Maps trên iOS, Google Maps trên Android) nên hoàn toàn **miễn phí**.

**Các chức năng trên Map (Use-cases):**

1. **Tìm thợ ảnh (Fast Match):** Quét và hiển thị marker các Photographer đang rảnh xung quanh User để book khẩn cấp.
2. **Chọn điểm chụp (Location Picker):** Cho phép User kéo thả ghim trên bản đồ để chốt toạ độ điểm hẹn khi tạo Booking. (Thay cho việc gõ địa chỉ thủ công).
3. **Theo dõi thời gian thực (Live Tracking):** Khi tới giờ chụp, map hiển thị quá trình di chuyển của 2 bên. Toạ độ được truyền qua SignalR.
4. **Chuyển hướng (Nav handoff):** Nút "Chỉ đường" sẽ bắn toạ độ sang app Google Maps gốc của máy để Google tính toán đường đi, app mình không tự tính.
5. **Bonus - Tự động "Đã đến nơi" (Geofencing):** App tự tính khoảng cách đường chim bay giữa Vị trí hiện tại và Điểm hẹn bằng công thức toán học. Nếu &lt; 50m, hiện popup xác nhận đã tới nơi (0 đồng).

**Thiết kế Database & API:**

- KHÔNG lưu liên tục toạ độ vào Database (tránh phình DB). Chỉ trao đổi qua SignalR.
- Tạo `LocationHub` trên backend: Nhận `UpdateLocation(lat, lng)` từ 1 máy và forward `ReceiveLocation` sang máy còn lại.

**Mobile App:**

- Xin quyền Location (Foreground/Background).
- Cài đặt Timer/Task lấy toạ độ 5-10s/lần khi ở trạng thái "Đang di chuyển" và đẩy lên hub.

---

## 3. Quản Lý Phiên Chụp Ảnh (Shooting Session)

**Giải pháp:** Xây dựng màn hình "Live Session" đồng bộ cả 2 bên.

**Thiết kế Database & API:**

- Các trạng thái (States) cụ thể của buổi hẹn:
  1. `Moving` (Đang di chuyển đến điểm hẹn).
  2. `Arrived` (Đã đến nơi) -&gt; Cả 2 bên đều có thể bấm để bên kia biết mình đã tới.
  3. `InProgress` (Đang chụp) -&gt; Photographer bấm bắt đầu.
  4. `Completed` (Đã xong).
- API `PUT /api/bookings/{id}/session-status`: Khi có người thao tác, BE cập nhật trạng thái xuống DB và đồng thời bắn SignalR cho người kia.

**Mobile App:**

- Màn hình Session: Bản đồ thu nhỏ + Các nút hành động + Đồng hồ bấm giờ (Timer). 