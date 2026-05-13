# SHOOTMATCH

## Stack
- **Frontend**: Mobile Swipe App (planned)
- **Backend**: C# / ASP.NET Core (.NET 9)
- **Database**: PostgreSQL + pgvector (planned)
- **GraphQL/REST**: **GET = GraphQL**, **POST = REST** (implemented in MVP skeleton)
- **AI Inference**: SigLIP-SO400M (target), CLIP ViT-L/14 (fallback), FastAPI serving (planned)

## Mục tiêu
SHOOTMATCH kết nối khách hàng với photographer dựa trên phong cách ảnh tham khảo, không phụ thuộc chọn tag thủ công. Hệ thống encode 3-5 ảnh reference thành vector phong cách, sau đó tìm photographer có portfolio tương đồng nhất để đưa vào swipe feed.

## Constraints
- GPU mục tiêu 6GB VRAM.
- Ưu tiên time-to-market: MVP chạy với encoder stub/CLIP trước, giữ nguyên hợp đồng để thay SigLIP sau.
- Luồng API hybrid bắt buộc: Query/read qua GraphQL, command/write qua REST.

## Decisions đã chốt
- [x] Áp dụng Clean Architecture: Domain / Application / Infrastructure / API.
- [x] Áp dụng pattern [[skills/patterns#Architecture — Hybrid Fetching & Reliability Fallback|Hybrid Fetching]] ở backend contract level: GraphQL cho read feed, REST cho write/search command.
- [x] Áp dụng hướng [[skills/patterns#AI Architecture — Async Analysis & Real-time Safety Alerts|Async AI Analysis]] cho offline indexing pipeline (giai đoạn production).
- [x] Ưu tiên style triển khai tương thích Smart-Service (DI extension pattern, services orchestration, clear interfaces).

## Trạng thái triển khai hiện tại (2026-05-03)
- [x] Bootstrap solution 4 layer. Swagger UI `/swagger`.
- [x] Role-based Auth: JWT `customer` / `photographer` / `admin`.
- [x] **Auth flows**: Customer + Photographer OTP login, refresh token.
- [x] **REST API đầy đủ**: 22 endpoints (Customer, Photographer, Admin, Booking lifecycle, Review).
- [x] **GraphQL**: 18 queries (swipeFeed, me, photographers, matches, bookings, reviews, conversations, messages).
- [x] **Swipe → Mutual Match → Conversation**: end-to-end flow hoàn chỉnh.
- [x] **MatchCreatedHandler**: tạo Conversation tự động khi match confirmed.
- [x] **SignalR ChatHub** tại `/hubs/chat`: JoinConversation, SendMessage, SendImageMessage, participant enforcement.
- [x] **Booking lifecycle**: Pending → Confirmed → Completed → Cancelled, tất cả endpoints.
- [x] **Review flow**: enforce Completed booking invariant.
- [x] **Admin**: list photographers, GET pending verifications, approve (với audit trail), revoke premium.
- [x] IMatchRepository, IBookingRepository, IReviewRepository, IConversationRepository, IVerificationRequestRepository — tất cả in-memory.
- [ ] PostgreSQL repositories (production).
- [ ] SigLIP thật + pgvector.
- [ ] Payment gateway + escrow.
- [ ] Notification (FCM).
- [x] Bootstrap solution `ShootMatch.sln` với 4 layer chuẩn.
- [x] Implement use-case `MatchingOrchestrator`: encode -> mean pool -> cosine -> rerank.
- [x] Swagger UI (Swashbuckle 7.3.1) tại `/swagger`.
- [x] **Role-based Auth**: JWT claims `role` (customer/photographer/admin), `[Authorize(Roles = "...")]` trên tất cả endpoints.
- [x] **Customer Auth**: `POST /api/auth/otp/*`, `POST /api/auth/refresh`.
- [x] **Photographer Auth**: `POST /api/photographer-auth/otp/*`, `POST /api/photographer-auth/refresh`.
- [x] **Customer APIs**: profile, search, swipe, booking create, review.
- [x] **Photographer APIs**: GET/PUT profile, PATCH availability, POST verify, confirm/complete/cancel booking.
- [x] **Admin APIs**: list photographers, approve verification, revoke premium.
- [x] **Booking lifecycle**: Pending → Confirmed → Completed → Cancelled/Disputed — tất cả endpoint.
- [x] **GraphQL**: 15 queries (swipeFeed, me, photographer, photographers, photographerProfile, myMatches, match, myMatchesAsPhotographer, myBookings, booking, myBookingsAsPhotographer, myReviews, myReviewsReceived, photographerReviews).
- [x] `IMatchRepository`, `IBookingRepository`, `IReviewRepository` abstractions + in-memory implementations đầy đủ.
- [ ] Chưa nối inference SigLIP thật.
- [ ] Chưa tích hợp PostgreSQL/pgvector runtime repository.

## Retrospective
- [[projects/SHOOTMATCH/[SHOOTMATCH]_architecture|Chi tiết kiến trúc triển khai]]
- [[projects/SHOOTMATCH/[SHOOTMATCH]_implementation-log|Nhật ký triển khai chi tiết (Entity + nghiệp vụ + migration)]]

## Status
- 🚧 MVP skeleton implemented, ready for production hardening.
