# SHOOTMATCH — Hệ tham chiếu toàn diện (API & Features)

Tài liệu này là bản tham chiếu cuối cùng về mối liên kết giữa API và các tính năng thực tế.

## 1. Bản đồ Vai trò & API (Access Map)
| Tính năng | API Endpoint | Role bắt buộc |
|-----------|--------------|---------------|
| Đăng ký Khách | `/api/auth/register` | Public |
| Đăng ký Thợ | `/api/photographer-auth/register` | Public |
| Tạo Booking | `/api/bookings` (POST) | `customer` |
| Duyệt Booking | `/api/bookings/{id}/accept` | `photographer` |
| Tạo Gói chụp | `/api/photographers/packages` | `photographer` |
| Review | `/api/reviews` | `customer` |

## 2. Liên kết các Module (System Integration)
- **Auth ➔ Profile**: Khi đăng ký thành công, một bản ghi Profile mặc định sẽ được tạo.
- **Swipe ➔ Match**: Hệ thống so sánh các lượt Swipe. Nếu trùng khớp -> Tạo `Match`.
- **Match ➔ Chat**: Event `MatchEstablished` tự động gọi service tạo `Conversation`.
- **Booking ➔ Chat**: Khi có Booking, Photographer và Customer có thể nhắn tin ngay cả khi chưa Match.

## 3. Quy trình Nghiệp vụ (Business Flow)
1. **Khám phá**: Khách hàng tìm kiếm thợ qua GraphQL Queries.
2. **Kết nối**: Thông qua Swipe (Match) hoặc Booking trực tiếp.
3. **Thực hiện**: Thợ ảnh xác nhận lịch -> Hai bên chat -> Chụp ảnh.
4. **Kết thúc**: Thợ đánh dấu hoàn thành -> Khách Review -> Ghi nhận kết quả vào hệ thống.

---
*Chi tiết tính năng:*
- [[projects/SHOOTMATCH/manual/Detailed_Feature_Guide]]
