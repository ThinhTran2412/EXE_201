# ShootMatch Notification Flow Audit & Plan

> Scope: Mobile notification system, from data source, realtime push, unread badge, list screen, to navigation actions.
> Status: audit + implementation plan
> Updated: 2026-06-10

## 1) What already exists

### Core notification data layer
- `ShootMatch.Mobile/src/shared/notifications/types.ts`
  - Có `AppNotification`, `NotificationCategory`, `NotificationPayload`.
- `ShootMatch.Mobile/src/shared/notifications/api.ts`
  - Có API đọc danh sách thông báo, unread count, mark read, mark all read.
- `ShootMatch.Mobile/src/shared/notifications/parsePayload.ts`
  - Parse `payloadJson` an toàn.
- `ShootMatch.Mobile/src/shared/notifications/formatRelativeTime.ts`
  - Format thời gian hiển thị.

### Realtime ingestion
- `ShootMatch.Mobile/src/features/chat/ChatHub.ts`
  - SignalR hub đã có event `ReceiveNotification`.
- `ShootMatch.Mobile/src/shared/notifications/NotificationContext.tsx`
  - Có provider giữ state `items`, `unreadCount`, `loading`.
  - Có `refresh`, `markRead`, `markAllRead`, `prepend`.
  - Có sync realtime qua `ChatHub.onReceiveNotification(...)`.
  - Có polling unread count mỗi 60 giây.

### UI hiển thị
- `ShootMatch.Mobile/src/shared/notifications/NotificationsList.tsx`
  - Có list UI, banner unread, empty state, icon theo category.
- `ShootMatch.Mobile/src/shared/notifications/SharedNotificationsScreen.tsx`
  - Có screen dùng list chung, header, mark all read.
- `ShootMatch.Mobile/src/features/customer/screens/NotificationsScreen.tsx`
  - Hiện vẫn là mock data, chưa nối API/context.
- `ShootMatch.Mobile/src/app/navigation/CustomerTabs.tsx`
  - Đã có route `Notifications`.
- `ShootMatch.Mobile/src/app/navigation/RoleNavigator.tsx`
  - Cần kiểm tra xem route thông báo đã được gắn cho photographer/admin/staff hay chưa.

### Trạng thái hiện tại theo UI progress
- `Vault_ShootMatch/[SHOOTMATCH]_UI-progress.md` đã đánh dấu screen `NotificationsScreen.tsx` là `⏳`.
- Nghĩa là phần nền tảng đã bắt đầu, nhưng chưa hoàn tất end-to-end.

## 2) Luồng hiện có, đọc theo end-to-end

1. Backend đẩy notification qua SignalR `ReceiveNotification`.
2. `NotificationContext` bắt event, prepend item vào list và tăng unread count.
3. UI screen dùng `useNotifications()` để render list và badge.
4. Người dùng bấm item thì screen parse `payloadJson` và điều hướng.
5. Khi đọc từng item hoặc đọc tất cả, context gọi API cập nhật server và sync local state.

## 3) Những gì đã ổn

- Có data model riêng cho notification, không hardcode toàn bộ ở screen.
- Có API layer đầy đủ cho list, unread count, mark read.
- Có realtime event bridge từ SignalR.
- Có list component chung, reusable cho nhiều role.
- Có unread badge state trong context, phù hợp để gắn lên tab/header.

## 4) Các điểm còn thiếu hoặc nên chỉnh

### P0, nên làm trước
- `NotificationsScreen.tsx` vẫn dùng mock data, cần đổi sang `SharedNotificationsScreen` hoặc refactor để dùng `useNotifications()`.
- Cần verify `NotificationProvider` đã được bọc ở root app, nếu chưa thì unread count và realtime list sẽ không hoạt động ở mọi màn.
- Cần kiểm tra role navigation để bảo đảm cả customer, photographer, staff/admin đều có đường vào màn thông báo nếu sản phẩm yêu cầu chung.
- Hiện `SharedNotificationsScreen` chỉ handle `open_conversation`, các `actionType` khác chưa được route hóa, nên bấm notification ngoài chat có thể chưa phản hồi đúng.

### P1, nên làm tiếp
- Thêm loading / error / retry state cho màn thông báo.
- Đồng bộ empty state theo từng loại user hoặc theo ngữ cảnh thật, thay vì chỉ 1 câu chung.
- Chuẩn hóa payload schema cho các action type phổ biến như booking, match, review, call.
- Thêm fallback nếu payload thiếu hoặc JSON hỏng, tránh bấm item mà không có phản hồi.
- Nếu unread badge sẽ dùng ở tab bar hoặc header, nên expose hook rõ ràng và dùng thống nhất ở layout.

### P2, polish
- Cho item unread có affordance rõ hơn, ví dụ chevron hoặc secondary action nhẹ.
- Nếu danh sách dài, cân nhắc pagination / infinite scroll thay vì luôn load 50 item đầu.
- Tách icon mapping khỏi UI nếu sau này category/action tăng.
- Thêm analytics hoặc logging cho open, read, mark-all để đo hành vi.

## 5) Nên chỉnh kiến trúc nào

### Khuyến nghị chính
- Chọn một source of truth duy nhất cho UI screen thông báo.
- Tốt nhất là dùng `SharedNotificationsScreen` làm base, rồi nếu cần role-specific behavior thì inject route handler theo role.
- Tránh giữ song song mock screen và shared screen vì dễ lệch hành vi.

### Khuyến nghị dữ liệu
- Notification object nên giữ ổn định các field:
  - `id`
  - `category`
  - `title`
  - `body`
  - `createdAt`
  - `read`
  - `payloadJson`
  - `actionType`
- Các action nên map rõ:
  - `open_conversation`
  - `open_booking`
  - `open_match`
  - `open_call`
  - `open_review`
  - `open_system`

## 6) Plan chỉnh sửa đề xuất

### Phase 1, nối UI thật
- Thay `NotificationsScreen.tsx` bằng data thật từ context/API.
- Dùng `NotificationsList` để giữ UI thống nhất.
- Kiểm tra navigation khi bấm item với payload thật.

### Phase 2, hoàn thiện luồng đọc
- Verify `markRead` và `markAllRead` update server + local state đúng.
- Add loading, error, và empty states.
- Đồng bộ unread badge ở nơi cần hiển thị.

### Phase 3, mở rộng action
- Bổ sung mapping cho booking/match/call/review.
- Nếu có screen đích, điều hướng theo `actionType` + payload.
- Nếu chưa có screen đích, mở modal hoặc fallback message.

### Phase 4, polish và harden
- Pagination hoặc load more.
- Thêm test cho parse payload và reducer-like state transitions.
- Bảo đảm không crash khi hub disconnect hoặc API lỗi.

## 7) Checklist nhanh để dev thực thi

- [ ] Xác nhận `NotificationProvider` được mount ở root.
- [ ] Replace `NotificationsScreen.tsx` mock bằng shared data source.
- [ ] Map đầy đủ `actionType` và payload.
- [ ] Kiểm tra route thông báo cho từng role.
- [ ] Thêm loading/error/retry.
- [ ] Kiểm tra unread badge ở tab/header.
- [ ] Test realtime event nhận được khi app foreground/background.
- [ ] Test mark read, mark all read, and refresh.

## 8) Kết luận ngắn

Hiện tại phần notification đã có nền rất tốt ở layer dữ liệu, realtime, và UI list dùng chung. Điểm nghẽn lớn nhất là screen chính vẫn còn mock và luồng action chưa đủ đầy đủ cho mọi loại thông báo. Việc nên làm tiếp là nối `NotificationsScreen` vào shared context, sau đó mở rộng action routing và harden trạng thái lỗi/loading.
