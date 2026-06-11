# Notification Backend Checklist

> Mục tiêu: hoàn thiện notification cho customer/photographer ở các flow booking quan trọng.
> Cập nhật: 2026-06-10

## Checklist nhỏ

### Đã có
- [x] Tin nhắn mới
- [x] Booking mới
- [x] Review mới

### Cần làm ngay
- [ ] Booking được xác nhận
- [ ] Booking bị hủy
- [ ] Booking hoàn tất
- [ ] Match tạo mới
- [ ] Call đến / missed call

### Kiểm tra sau khi làm
- [ ] Customer nhận notification đúng khi booking confirmed
- [ ] Customer nhận notification đúng khi booking cancelled
- [ ] Customer nhận notification đúng khi booking completed
- [ ] Photographer nhận notification đúng khi customer review
- [ ] Không lẫn recipient giữa customer và photographer
- [ ] Nội dung title/body hiển thị đúng trên mobile
- [ ] ActionType điều hướng đúng màn đích

## Mẫu nội dung đề xuất

### Booking confirmed
- Title: `Booking đã được xác nhận`
- Body: `Photographer đã xác nhận lịch chụp của bạn.`
- Action: `open_booking_detail`

### Booking cancelled
- Title: `Booking đã bị hủy`
- Body: `Booking của bạn đã bị hủy. Vui lòng kiểm tra chi tiết.`
- Action: `open_booking_detail`

### Booking completed
- Title: `Buổi chụp đã hoàn tất`
- Body: `Bạn có thể để lại đánh giá cho buổi chụp này.`
- Action: `open_review`

### Match created
- Title: `Bạn đã match!`
- Body: `Hãy bắt đầu trò chuyện với photographer.`
- Action: `open_conversation`

### Call incoming / missed
- Title: `Cuộc gọi đến`
- Body: `Bạn có cuộc gọi mới từ photographer/customer.`
- Action: `open_call`
