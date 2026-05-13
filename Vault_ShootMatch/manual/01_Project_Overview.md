# SHOOTMATCH — Tổng quan dự án (Project Overview)

## 1. Giới thiệu
ShootMatch là một nền tảng kết nối (matching) chuyên nghiệp giữa **Khách hàng** (người có nhu cầu chụp ảnh) và **Nhiếp ảnh gia** (người cung cấp dịch vụ). 
Dự án được xây dựng với mục tiêu tối ưu hóa quy trình tìm kiếm, đặt lịch, và thanh toán cho các dịch vụ nhiếp ảnh thông qua cơ chế "quẹt" (swipe), kết hợp với các bộ lọc thông minh.

## 2. Các tính năng cốt lõi
- **Hệ thống Đăng nhập Đa phương thức (Multi-Auth):** Hỗ trợ Email/Password, Google OAuth, và Số điện thoại (OTP). 
- **Matching System:** Khách hàng có thể lướt xem portfolio của nhiếp ảnh gia và "quẹt" để thả tim hoặc bỏ qua. Nếu cả hai bên đồng ý, một "Match" sẽ được tạo ra.
- **Booking & Scheduling:** Hệ thống cho phép khách hàng đặt lịch trực tiếp dựa trên các gói dịch vụ (Service Packages) và lịch rảnh (Availability) của nhiếp ảnh gia.
- **Chat & Messaging:** Sau khi Match hoặc Booking được tạo, hai bên có thể trao đổi trực tiếp qua hệ thống tin nhắn thời gian thực (SignalR).
- **Reviews & Rating:** Khách hàng có thể đánh giá và để lại nhận xét sau khi hoàn thành buổi chụp.

## 3. Các thực thể chính (Key Entities)
- [[projects/SHOOTMATCH/manual/Roles_and_Permissions#Khách hàng|Customer]]
- [[projects/SHOOTMATCH/manual/Roles_and_Permissions#Nhiếp ảnh gia|Photographer]]
- [[projects/SHOOTMATCH/manual/Detailed_Feature_Guide#Booking Lifecycle|Booking]]
- [[projects/SHOOTMATCH/manual/API_Architecture_and_Endpoints#Match|Match]]

---
*Xem thêm:*
- [[projects/SHOOTMATCH/manual/02_Developer_Technical_Guide]]
- [[projects/SHOOTMATCH/manual/Detailed_Feature_Guide]]
