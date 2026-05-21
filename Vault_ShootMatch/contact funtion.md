# Contact Function Plan

## Mục tiêu
Triển khai backend contact function toàn diện cho ShootMatch, gồm:
- Nhắn tin realtime
- Voice call realtime
- Video call realtime
- Báo trạng thái cuộc gọi và tín hiệu WebRTC
- Đồng bộ dữ liệu phiên gọi để reconnect / retry / audit
- Đọc / chưa đọc tin nhắn
- Inbox + lịch sử hội thoại
- Tự động xử lý cuộc gọi nhỡ
- Sẵn sàng cho notification và anti-spam

## Phạm vi backend
### 1. Realtime messaging
- SignalR hub cho conversation
- Join/leave room theo conversation
- Send / receive text, image, hệ thống
- Persist message vào database
- Broadcast ngay lập tức cho toàn bộ participant
- Cập nhật unread count realtime
- Cập nhật read receipt realtime

### 2. Voice / video call
- Start call, accept, reject, end call, cancel call
- Persist call session trong database
- Hỗ trợ audio/video mode
- Hỗ trợ trạng thái ring / active / ended / rejected / missed / cancelled
- Broadcast call events realtime theo conversation room
- Join call room riêng để relay signaling

### 3. WebRTC signaling
- Forward offer / answer / ICE candidates qua SignalR
- Validate participant trước khi relay signal
- Lưu metadata để phục hồi trạng thái session
- Support reconnect khi app/mobile bị rớt socket
- Support retry-safe signaling event flow

### 4. Data model backend
- Conversation
- Message
- CallSession
- CallSignal (ephemeral envelope)
- Inbox summary DTO
- Message read state

### 5. API / transport strategy
- REST: tạo command, query lịch sử, inbox, read receipts
- SignalR: realtime message/call/signaling
- DB: lưu trạng thái bền vững
- Background job: timeout cuộc gọi nhỡ

## Luồng đề xuất
### Messaging
1. Client join conversation room
2. Client gửi message qua hub
3. Backend validate participant
4. Backend lưu message
5. Backend broadcast ReceiveMessage
6. Backend cập nhật unread count khi chưa đọc
7. Khi mở conversation, client gọi mark read
8. Backend broadcast ConversationRead

### Call
1. Client start call
2. Backend tạo call session
3. Backend broadcast ReceiveCallEvent = ring
4. Callee accept/reject
5. Backend cập nhật trạng thái session
6. Backend broadcast trạng thái mới
7. Hai bên join call room để relay ICE/SDP
8. Kết thúc / hủy / nhỡ đều được ghi nhận rõ

### WebRTC signal
1. Client gửi offer/answer/ICE đến hub
2. Backend xác thực participant
3. Backend relay tới room của cuộc gọi
4. Client nhận signal và xử lý peer connection
5. Backend update LastSignalAt để audit

## Checklist triển khai tiếp
- [x] Add migration cho `call_sessions`
- [x] Add REST endpoints để query call history
- [x] Add message read receipts
- [ ] Add missed call auto-close job
- [ ] Add push notification hook
- [x] Add rate limit / anti spam cho messaging
- [ ] Add call timeout cleanup
- [ ] Add client UI cho audio/video call
- [ ] Add tests cho hub + repository + command handlers

## Đã triển khai chi tiết
### A. Call session persistence
- Bảng `call_sessions` lưu toàn bộ trạng thái cuộc gọi
- Trạng thái hỗ trợ: `ringing`, `active`, `ended`, `rejected`, `missed`, `cancelled`
- Lưu `StartedAt`, `AnsweredAt`, `EndedAt`, `EndReason`, `SessionToken`, `LastSignalAt`
- Quan hệ 1-n với `conversations`
- Backend chặn nhiều cuộc gọi active song song trong cùng conversation

### B. REST API cho call
- `POST /api/calls/start`
- `GET /api/calls/{id}`
- `GET /api/calls/conversation/{conversationId}`
- `POST /api/calls/{id}/status`
- Backend tự kiểm tra quyền participant trước khi thao tác
- Call status được normalize để client có thể gửi nhiều biến thể đầu vào

### C. REST API cho messaging
- `GET /api/conversations/inbox`
- `GET /api/conversations/{conversationId}/messages`
- `POST /api/conversations/{conversationId}/read`
- `GET /api/conversations/{conversationId}/unread-count`
- Inbox và messages đều có pagination cơ bản

### D. Realtime SignalR flow
- Join / leave conversation room
- Join / leave call room
- Send text / image message realtime
- Broadcast `ReceiveMessage`
- Broadcast `ReceiveCallEvent`
- Broadcast `ReceiveCallSignal`
- Broadcast `ConversationRead`

### E. Read receipt / unread count
- Message unread = message không phải do người đang xem gửi ra và `ReadAt == null`
- `MarkRead` update toàn bộ message chưa đọc trong conversation
- Inbox trả về `UnreadCount` theo conversation
- Đảm bảo participant validation trước khi đọc
- Backend hỗ trợ lấy unread count theo conversation

### F. Hardening đã chuẩn bị
- Validate conversation tồn tại trước mọi action
- Validate participant trước khi join room / call room / read / signal
- Chặn mở nhiều call active cùng lúc trong 1 conversation
- Chuẩn hóa trạng thái call input để tránh client gửi string lệch format
- Tách DTO / request contracts để client dễ consume
- Tách query service cho inbox/messages để dễ mở rộng

### G. Những edge cases backend đã cover
- Conversation không tồn tại
- Caller không phải participant
- Call session không tồn tại
- Call đang active rồi mà start thêm call mới
- Gửi signal khi call/conversation không hợp lệ
- Accept/reject/end/cancel từ actor không hợp lệ
- Mark read ở conversation không thuộc về user
- Get messages / inbox bằng user không liên quan conversation
- Pagination request vượt range sẽ được cắt an toàn ở controller

### H. Gợi ý bước tiếp theo cho production
- Background worker tự đổi `ringing` sang `missed` nếu quá timeout
- Push notification cho call/messaging khi user offline
- Pagination cursor-based cho inbox/messages
- Anti-spam/rate limit trên hub ở mức connection + user
- Unit/integration tests cho controller, repository, hub
- Audit log cho signaling events nếu cần compliance

## Hệ thống hiện tại đã có gì
- SignalR hub realtime cho chat/call
- REST API cho inbox/chat/call history
- Persistence cho message + call session
- Read receipt và unread count
- Plan sẵn cho missed-call job và notification

## Ưu tiên tiếp theo nếu triển khai production
1. Background service auto-close call ringing quá lâu
2. Push notification service khi người nhận offline
3. Retry / dedup cho signaling
4. Test coverage cho critical flow
5. Observability: logs / metrics / tracing

## Ghi chú kỹ thuật
- SignalR chỉ là transport realtime, không phải media server
- Audio/video media sẽ chạy qua WebRTC trên client
- Backend chịu trách nhiệm signaling, auth, routing, persistence, và audit
- Nếu sau này cần call group / recording / screen share, nên tách thêm CallRoom service
