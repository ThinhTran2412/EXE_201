# Tóm tắt tiến độ

Tài liệu này ghi lại những phần đã triển khai trong dự án ShootMatch để tiện theo dõi khi làm việc tiếp theo.

## Các hạng mục đã hoàn thiện gần đây
- Thiết kế lại trang quản lý dịch vụ và giá theo hướng nghệ thuật hơn, rõ ràng hơn.
- Cải thiện phần hiển thị hồ sơ nhiếp ảnh gia trên mobile.
- Sửa luồng cập nhật hồ sơ để tránh ghi đè `PasswordHash` trong database.
- Đảm bảo `Quote` được lưu và tải lại từ backend sau khi chỉnh sửa.
- Bật Swagger để dễ kiểm tra API, đồng thời thêm redirect từ trang gốc sang `/swagger`.
- Tinh chỉnh giao diện `ServiceManagementScreen` để tránh chữ bị tệp màu và số tiền bị xuống dòng.
- Cập nhật `README.md` sang tiếng Việt và trỏ trực tiếp đến tài liệu trong `Vault_ShootMatch`.

## Ghi chú
- Các file nhật ký chi tiết và tài liệu kiến trúc vẫn nằm trong thư mục `manual` và các file log gốc của Vault.
- Mỗi ngày làm việc tiếp theo nên tạo một file riêng theo định dạng ngày tháng năm tiếng Việt.
