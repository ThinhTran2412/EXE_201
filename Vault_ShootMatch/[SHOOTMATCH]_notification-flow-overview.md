# ShootMatch Notification Flow Overview

> Mục tiêu: ghi lại trạng thái hiện tại của toàn bộ luồng thông báo, những gì đã có, những gì còn thiếu, và hướng chỉnh sửa ưu tiên.
>
> Cập nhật: 2026-06-10

## 1. Hiện tại đã có gì

### 1.1 Data model và API
- `ShootMatch.Mobile/src/shared/notifications/types.ts`
  - Có `AppNotification`, `NotificationCategory`, `NotificationPayload`.
- `ShootMatch.Mobile/src/shared/notifications/api.ts`
  - Có API lấy danh sách thông báo.
  - Có API lấy unread count.
  - Có API mark 1 thông báo là đã đọc.
  - Có API mark all là đã đọc.
- `ShootMatch.Mobile/src/shared/notifications/parsePayload.ts`
  - Parse `payloadJson` an toàn.
- `ShootMatch.Mobile/src/shared/notifications/formatRelativeTime.ts`
  - Format thời gian hiển thị theo relative time.

### 1.2 Realtime flow
- `ShootMatch.Mobile/src/features/chat/ChatHub.ts`
  - Hub đã có event nhận thông báo realtime.
- `ShootMatch.Mobile/src/shared/notifications/NotificationContext.tsx`
  - Có provider quản lý `items`, `unreadCount`, `loading`.
  - Có `refresh`, `markRead`, `markAllRead`, `prepend`.
  - Có xử lý khi nhận notification realtime từ hub.
  - Có polling unread count định kỳ.

### 1.3 UI hiện có
- `ShootMatch.Mobile/src/shared/notifications/NotificationsList.tsx`
  - Có UI list dùng chung.
  - Có banner unread.
  - Có empty state.
  - Có icon mapping theo category.
- `ShootMatch.Mobile/src/shared/notifications/SharedNotificationsScreen.tsx`
  - Có screen dùng chung từ context.
  - Có header và action đọc tất cả.
  - Có handle khi bấm item.
- `ShootMatch.Mobile/src/features/customer/screens/NotificationsScreen.tsx`
  - Hiện vẫn đang dùng mock data.
  - Đây là phần cần thay sớm nhất.
- `ShootMatch.Mobile/src/app/navigation/CustomerTabs.tsx`
  - Đã có route `Notifications`.

## 2. Luồng hiện tại đang chạy như thế nào

1. Backend đẩy notification qua SignalR.
2. `NotificationContext` bắt event realtime.
3. Item mới được prepend vào list và unread count tăng.
4. UI render danh sách từ context/API.
5. Người dùng bấm notification.
6. App mark read và điều hướng theo payload/action.
7. Badge unread được đồng bộ lại theo context và polling.

## 3. Những gì đang ổn

- Có tách lớp rõ: types, api, context, UI.
- Có realtime lẫn fallback API.
- Có component list dùng chung.
- Có khả năng mở rộng cho nhiều role.
- Có badge/unread count riêng, dễ gắn vào tab hoặc header.

## 4. Những điểm còn thiếu

### Ưu tiên cao
- Screen thông báo của customer vẫn là mock.
- Chưa chắc `NotificationProvider` đã được mount ở root app.
- Mới xử lý tốt một phần action type, chưa đủ cho booking/match/review/call.
- Chưa thấy loading/error/retry flow rõ ràng cho screen.

### Ưu tiên trung bình
- Chưa chuẩn hóa full payload schema cho mọi loại notification.
- Chưa có pagination/infinite scroll.
- Chưa có route handling riêng theo role nếu cần.
- Chưa có fallback UX khi payload lỗi hoặc thiếu data.

### Ưu tiên thấp
- Cần polish icon, affordance, và animation nhẹ cho item unread.
- Có thể thêm logging/analytics cho open/read/mark-all.

## 5. Nên sửa gì trước

### Bước 1: thay screen mock bằng data thật
- Đổi `Features/customer/screens/NotificationsScreen.tsx` sang dùng `useNotifications()` hoặc dùng trực tiếp `SharedNotificationsScreen`.
- Đây là việc quan trọng nhất để luồng không bị lệch.

### Bước 2: chuẩn hóa action routing
- Bổ sung xử lý cho:
  - `open_conversation`
  - `open_booking`
  - `open_match`
  - `open_call`
  - `open_review`
  - `open_system`
- Nếu chưa có màn đích, cần fallback an toàn.

### Bước 3: harden trải nghiệm
- Thêm loading state.
- Thêm error state và retry.
- Thêm empty state đúng ngữ cảnh.
- Kiểm tra mark read và mark all read đã sync server + local chưa.

### Bước 4: mở rộng cho nhiều role
- Kiểm tra customer, photographer, staff/admin có vào được màn thông báo không.
- Nếu có khác biệt về hành vi, tách handler theo role.

## 6. Checklist ngắn để hoàn thiện

- [ ] Mount `NotificationProvider` ở root app.
- [ ] Bỏ mock trong `NotificationsScreen.tsx`.
- [ ] Dùng source of truth chung cho notification UI.
- [ ] Map đầy đủ `actionType`.
- [ ] Kiểm tra unread badge ở tab/header.
- [ ] Thêm loading/error/retry.
- [ ] Test realtime nhận notification.
- [ ] Test mark read, mark all read.
- [ ] Test điều hướng từ notification.

## 7. Kết luận

Luồng thông báo của ShootMatch đã có nền khá tốt ở tầng API, realtime và context. Điểm yếu chính là màn hiển thị cuối vẫn còn mock và action routing chưa đầy đủ. Nếu làm tiếp, nên ưu tiên nối UI thật trước, sau đó mới mở rộng hành vi cho từng loại thông báo.
