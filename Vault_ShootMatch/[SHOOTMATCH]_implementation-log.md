# SHOOTMATCH — Implementation Log

## Snapshot
- **Ngày cập nhật**: 2026-06-15
- **Mục tiêu phiên này**: Tối ưu Live Map (Android/iOS), hoàn thiện UI Booking Detail, đồng bộ Vault.

## 1) Những gì đã triển khai (full list)

### A. Khởi tạo kiến trúc
- Tạo solution `ShootMatch.sln`.
- Tạo 4 project theo Clean Architecture:
  - `ShootMatch.Domain`
  - `ShootMatch.Application`
  - `ShootMatch.Infrastructure`
  - `ShootMatch.Api`
- Wiring DI extension theo style SmartService.

### B. API contract rule
- **POST (write/command)** qua REST:
  - `POST /api/matching/searches`
- **GET (read/query)** qua GraphQL:
  - `swipeFeed(searchId: UUID!)`

### C. AI matching pipeline (MVP runnable)
- Encode từng image URL qua `IEmbeddingEncoder` (hiện tại dùng stub deterministic).
- Mean pooling vectors để ra user-style vector.
- Tính cosine similarity với embeddings của từng photographer.
- Hard filter: `IsAvailable`, `Region`, `Budget`.
- Soft rerank: `PremiumBoost` + `RatingBoost`.
- Lưu kết quả vào `IMatchResultStore` và trả `searchId`.

### D. CQRS tách command/query
- **Command side**:
  - `CreateMatchSearchCommand`
  - `CreateMatchSearchCommandHandler`
  - REST controller gọi handler command.
- **Query side**:
  - `GetSwipeFeedQuery`
  - `GetSwipeFeedQueryHandler`
  - GraphQL resolver gọi handler query.

### E. PostgreSQL + EF Core Migration
- Thêm package:
  - `Microsoft.EntityFrameworkCore (9.0.10)`
  - `Npgsql.EntityFrameworkCore.PostgreSQL (9.0.4)`
  - `Microsoft.EntityFrameworkCore.Design (9.0.10)`
- Tạo `ShootMatchDbContext` với schema `shootmatch`.
- Tạo Migration:
  - `InitPostgres` (file migration + snapshot được tạo thành công).
- Chạy `database update`:
  - Kết quả: **chưa apply thành công** do lỗi network/DNS tới host Supabase (`No such host is known`).

## 2) Danh mục Entity & Model đã có

### Domain Entity
1. **Photographer**
   - `Id`
   - `DisplayName`
   - `Region`
   - `MinBudget`
   - `MaxBudget`
   - `Rating`
   - `IsPremium`
   - `IsAvailable`
   - `PortfolioEmbeddings: IReadOnlyList<float[]>`

### Persistence Entity (Infrastructure)
1. **PhotographerRecord** (table: `shootmatch.photographers`)
   - Core profile + pricing + rating + premium + availability
2. **PortfolioEmbeddingRecord** (table: `shootmatch.portfolio_embeddings`)
   - `Id`
   - `PhotographerId` (FK)
   - `VectorJson` (`jsonb`)

### API/Input Contract
1. `CreateMatchSearchRequest`
2. `MatchSearchRequest`
3. `MatchSearchResult`
4. `PhotographerMatchCard`

## 3) Nghiệp vụ (Business capabilities)
1. **Create Search Session**
   - Nhận 3-5 ảnh tham khảo.
   - Validate số lượng ảnh.
2. **Encode & Aggregate Style**
   - Encode ảnh -> vector 768d (stub hợp đồng SigLiP-ready).
   - Mean pooling cho vector đại diện user.
3. **Similarity Matching**
   - Cosine similarity theo từng embedding portfolio.
   - Lấy max similarity theo photographer.
4. **Hard Filtering**
   - Lọc theo vùng, ngân sách, trạng thái available.
5. **Ranking/Re-ranking**
   - Tính `FinalScore = Similarity + PremiumBoost + RatingBoost`.
   - Order theo final score và rating.
6. **Read Swipe Feed**
   - Truy xuất kết quả theo `searchId` qua GraphQL query.

## 4) Các file chính đã tạo/chỉnh
- `ShootMatch.Domain/Entities/Photographer.cs`
- `ShootMatch.Domain/Services/VectorMath.cs`
- `ShootMatch.Application/Services/MatchingOrchestrator.cs`
- `ShootMatch.Application/Commands/*`
- `ShootMatch.Application/Queries/*`
- `ShootMatch.Api/Controllers/MatchingController.cs`
- `ShootMatch.Api/GraphQL/MatchingQuery.cs`
- `ShootMatch.Infrastructure/Persistence/ShootMatchDbContext.cs`
- `ShootMatch.Infrastructure/Persistence/Entities/*`
- `ShootMatch.Infrastructure/Persistence/Migrations/*`

## 5) Vấn đề cần xử lý tiếp
1. Apply migration lên PostgreSQL thật (kiểm tra lại hostname/connection string hoặc DNS).
2. Thay `StubSiglipEncoder` bằng inference service SigLiP thật.
3. Chuyển repository từ in-memory sang PostgreSQL/pgvector query.
4. Di chuyển secret DB ra environment variable/user-secrets.

## 6) Auto-capture template (dùng cho các phiên sau)
> Khi có thay đổi mới, append vào note này theo format sau để AI có thể parse và tự tổng hợp lại:

```md
## Session 2026-04-20 10:35
- Goal: Bổ sung domain phía Customer + Auth OTP/JWT + gắn search theo user + CQRS query/command rõ hơn.
- Changes:
  - [Domain] Thêm Entities: `Customer`, `SearchSession`, `AuthSession`, `SwipeAction`.
  - [Application] Thêm abstractions: `ICustomerRepository`, `IAuthSessionRepository`, `IOtpService`, `IAuthTokenService`, `ISearchSessionRepository`.
  - [Application] Thêm services: `AuthService`, `CustomerService`.
  - [Application] Patch `CreateMatchSearchCommand` + `MatchSearchRequest/Result` để mang `CustomerId`.
  - [Application] `MatchingOrchestrator` lưu `SearchSession` theo `CustomerId`.
  - [API] Thêm REST endpoints:
    - `POST /api/auth/otp/send`
    - `POST /api/auth/otp/verify`
    - `POST /api/auth/refresh`
    - `POST /api/customers/profile`
  - [API] Thêm GraphQL query `me`.
  - [API] Bật JWT auth middleware và đọc claim `customer_id` cho search command.
  - [Infrastructure] Thêm in-memory adapters cho OTP, token, customer repo, auth session repo, search session repo.
  - [Infrastructure/Persistence] Thêm records: `CustomerRecord`, `SearchSessionRecord`, `AuthSessionRecord`, `SwipeActionRecord`.
- Migration:
  - Added: `AddCustomerAuthAndSession` (EF migration generated thành công).
  - Applied: no.
  - Error (if any): `password authentication failed for user "postgres"` khi chạy `database update` với design-time connection local.
- API Contracts:
  - REST:
    - `POST /api/auth/otp/send`
    - `POST /api/auth/otp/verify`
    - `POST /api/auth/refresh`
    - `POST /api/customers/profile`
    - `POST /api/matching/searches` (đã yêu cầu JWT và lấy `CustomerId` từ claim)
  - GraphQL:
    - `swipeFeed(searchId)`
    - `me`
- Risks/Next:
  - Cần thay `InMemoryOtpService` bằng Twilio/Stringee adapter thật.
  - Cần thay repositories in-memory bằng PostgreSQL implementation.
  - Cần bật pgvector cho embeddings.
  - Cần thêm endpoint ghi `SwipeAction` để thu implicit feedback.

## Session 2026-04-21 07:22
- Goal: Mở rộng Database Schema cho production, reset về `public` schema, triển khai hạ tầng DDD, Core Aggregates và Value Objects.
- Changes:
  - [Domain] Thêm Entities: `PortfolioPhoto`, `ServicePackage`, `Match`, `Booking`, `Review`, `VerificationRequest`, `PhotographerAvailability`, `OtpRecord`.
  - [Domain] Tái cấu trúc DDD:
    - Thêm AggregateRoots: `PhotographerAggregate`, `CustomerAggregate`, `MatchAggregate`, `BookingAggregate`.
    - Thêm Value Objects: `PriceRange`, `ContactInfo`, `Location`, `StyleVector`.
    - Cơ chế Domain Events: `IDomainEvent`, `IDomainEventHandler`, `AggregateRoot` base class.
    - Core Events: `SwipeRightRecorded`, `MatchCreated`, `BookingConfirmed`, `BookingCompleted`, `BookingCancelled`, `PhotographerVerified`, `PremiumExpired`.
  - [Application] `MatchingOrchestrator` chuyển sang dùng `StyleVector` và lưu thêm metadata (`ReferenceImageUrlsJson`, `StyleVectorJson`, `Status`, `ExpiresAt`).
  - [Infrastructure/Persistence] Cấu trúc lại `ShootMatchDbContext` cho `public` schema, hỗ trợ dispatch Domain Events sau khi save.
  - [Infrastructure/Persistence] Patch 5 records cũ và thêm 9 records mới đồng bộ với Domain.
- Migration:
  - Added: `InitialPublic`, `SchemaExpansionV2`, `AddAvailabilityAndOtp`.
  - Applied: Yes (Supabase Public Schema).
- Risks/Next:
  - Thiết kế Real-time Chat (SignalR/Supabase).
  - Tích hợp Payment Gateway (VNPay/Stripe).
  - Thay repository in-memory bằng PostgreSQL implementation.
  - Setup SigLiP inference service thật.

## Session 2026-05-03 01:31 — Conversation + SignalR + P1 Fixes
- Goal: implement Conversation/Message/real-time chat (SignalR), fix P1 gaps (VerificationRequest audit trail, MatchCreated event drop, HasPhotographerSwipedRightAsync TODO).
- Changes:
  - [Domain/Entities] `Conversation.cs` — NEW: `Id`, `MatchId`, `CustomerId`, `PhotographerId`, `Status` (Active/Archived/Closed), `CreatedAt`, `LastMessageAt?`
  - [Domain/Entities] `Message.cs` — NEW: `Id`, `ConversationId`, `SenderId`, `SenderRole` (customer/photographer), `Content`, `ContentType` (Text/Image), `SentAt`, `ReadAt?`
  - [Application/Abstractions] `IConversationRepository.cs` — NEW: SaveConversation, GetById, GetByMatchId, GetByCustomerId, GetByPhotographerId, SaveMessage, GetMessages, TouchLastMessageAt
  - [Application/Abstractions] `IVerificationRequestRepository.cs` — NEW: Save, GetById, GetPendingByPhotographerId, GetAllPending
  - [Application/Commands] `SendMessageCommand.cs` — NEW: record với ConversationId, SenderId, SenderRole, Content, ContentType
  - [Application/Commands] `SendMessageCommandHandler.cs` — NEW: validate conversation active + participant, persist message, touch LastMessageAt
  - [Application/Commands] `MatchCreatedHandler.cs` — NEW: `IDomainEventHandler<MatchCreated>` — tạo Conversation idempotently khi match confirmed
  - [Application/Commands] `SwipeRightRecordedHandler.cs` — FIX: inject MatchCreatedHandler, dispatch MatchCreated events thủ công để không bị dropped bởi in-memory path; thêm TODO comment cho HasPhotographerSwipedRightAsync stub
  - [Infrastructure/Persistence] `InMemoryConversationRepository.cs` — NEW: ConcurrentDictionary impl, inbox sorted by LastMessageAt
  - [Infrastructure/Persistence] `InMemoryVerificationRequestRepository.cs` — NEW: audit trail cho admin approval
  - [Application] `DependencyInjection.cs` — thêm MatchCreatedHandler, SendMessageCommandHandler, IDomainEventHandler<MatchCreated> registration
  - [Infrastructure] `DependencyInjection.cs` — thêm IConversationRepository, IVerificationRequestRepository
  - [API/Controllers] `AdminController.cs` — FIXED: inject IVerificationRequestRepository, persist VerificationRequest (Status=Approved, ReviewedBy, ReviewedAt) khi approve; thêm `GET /api/admin/verification-requests`
  - [API/GraphQL] `MatchingQuery.cs` — thêm 4 queries: `myConversations`, `myConversationsAsPhotographer`, `conversation(id)`, `conversationMessages(conversationId)`
  - [API/Hubs] `ChatHub.cs` — NEW: SignalR Hub với JWT auth, group per conversation, JoinConversation/SendMessage/SendImageMessage/LeaveConversation, participant enforcement
  - [API] `Program.cs` — thêm `AddSignalR()`, JWT WebSocket query-string event handler, `MapHub<ChatHub>("/hubs/chat")`
- Build: succeeded. 0 Warning(s). 0 Error(s).
- Flows mới hoàn chỉnh:
  ```
  MatchCreated event
    → MatchCreatedHandler
      → CREATE Conversation(matchId, customerId, photographerId, status=Active)

  Client → wss://host/hubs/chat?access_token=JWT
    → JoinConversation(conversationId) → verify participant → AddToGroup
    → SendMessage(conversationId, text)
        → SendMessageCommandHandler
          → validate Active + participant
          → persist Message
          → TouchLastMessageAt
        → BroadcastToGroup ReceiveMessage(message)

  GraphQL: myConversations / myConversationsAsPhotographer → inbox
  GraphQL: conversationMessages(id) → message history
  ```
- P1 fixes:
  - [x] MatchCreated event không còn bị dropped ở in-memory path
  - [x] HasPhotographerSwipedRightAsync: TODO comment rõ ràng với query SQL khi migrate PG
  - [x] AdminController.ApproveVerification: có audit trail (ReviewedBy, ReviewedAt)
  - [x] GET /api/admin/verification-requests: endpoint mới xem danh sách pending

## Session 2026-04-24 08:47 — Full API + Role-Based Auth
- Goal: Bổ sung toàn bộ REST API còn thiếu, mở rộng GraphQL, triển khai role-based authorization.
- Changes:
  - [Application/Abstractions] `IAuthTokenService.cs` — thêm `role` parameter vào `GenerateAccessToken`.
  - [Application/Abstractions] `IPhotographerRepository.cs` — thêm `GetByIdAsync`, `GetByPhoneAsync`, `UpsertAsync`.
  - [Application/Abstractions] `IMatchRepository.cs` — thêm `GetByCustomerIdAsync`, `GetByPhotographerIdAsync`.
  - [Application/Abstractions] `IBookingRepository.cs` — thêm `GetByCustomerIdAsync`, `GetByPhotographerIdAsync`.
  - [Application/Abstractions] `IReviewRepository.cs` — thêm `GetByCustomerIdAsync`, `GetByPhotographerIdAsync`.
  - [Application/Services] `AuthService.cs` — update GenerateAccessToken calls to pass `"customer"` role.
  - [Application/Services] `PhotographerAuthService.cs` — NEW: OTP login cho photographer, issue `"photographer"` token.
  - [Application] `DependencyInjection.cs` — thêm `PhotographerAuthService`.
  - [Infrastructure/Auth] `JwtTokenService.cs` — bổ sung `role` claim + `user_id` + `photographer_id`/`customer_id` claims.
  - [Infrastructure/Persistence] `InMemoryPhotographerRepository.cs` — implement `GetByIdAsync`, `GetByPhoneAsync`, `UpsertAsync`.
  - [Infrastructure/Persistence] `InMemoryMatchRepository.cs` — implement `GetByCustomerIdAsync`, `GetByPhotographerIdAsync`.
  - [Infrastructure/Persistence] `InMemoryBookingRepository.cs` — implement `GetByCustomerIdAsync`, `GetByPhotographerIdAsync`.
  - [Infrastructure/Persistence] `InMemoryReviewRepository.cs` — implement `GetByCustomerIdAsync`, `GetByPhotographerIdAsync`.
  - [API/Contracts] `PhotographerRequests.cs` — NEW: `RegisterPhotographerRequest`, `UpdatePhotographerProfileRequest`, `SetAvailabilityRequest`, `CancelBookingRequest`.
  - [API/Contracts] `PhotographerAuthRequests.cs` — NEW: `PhotographerSendOtpRequest`, `PhotographerVerifyOtpRequest`.
  - [API/Controllers] `PhotographerAuthController.cs` — NEW: `/api/photographer-auth/otp/*`, `/api/photographer-auth/refresh`.
  - [API/Controllers] `PhotographersController.cs` — NEW: GET me, PUT profile, PATCH availability, POST verify.
  - [API/Controllers] `BookingsController.cs` — UPDATED: thêm POST confirm, POST complete, POST cancel.
  - [API/Controllers] `AdminController.cs` — NEW: GET photographers, POST verify, POST revoke-premium.
  - [API/GraphQL] `MatchingQuery.cs` — UPDATED: 2 → 14 queries (photographer, photographers, myMatches, match, myMatchesAsPhotographer, myBookings, booking, myBookingsAsPhotographer, myReviews, myReviewsReceived, photographerReviews, photographerProfile).
  - [API] `Program.cs` — thêm `RoleClaimType`, named policies, `AddAuthorization()` vào GraphQL.
  - [API] NuGet: thêm `HotChocolate.AspNetCore.Authorization 15.1.14`.
- Migration: none (in-memory).
- Build: succeeded. 0 Warning(s). 0 Error(s).
- API Contracts (full):
  - Customer REST: send-otp, verify-otp, refresh, profile, searches, swipes, bookings (create/cancel), reviews
  - Photographer REST: send-otp, verify-otp, refresh, GET/PUT profile, PATCH availability, POST verify, confirm/complete/cancel booking
  - Admin REST: list photographers, approve verification, revoke premium
  - GraphQL: 14 queries (see architecture note)

## Session 2026-04-23 09:00 — Core Flow Completion (Gap 2–5 + Gap 7)
- Goal: Wiring swipe endpoint, mutual match handler, booking flow, review flow + tất cả repositories còn thiếu.
- Changes:
  - [Infrastructure] `InMemoryMatchRepository.cs` — NEW: implement `IMatchRepository` (ConcurrentDictionary).
  - [Infrastructure] `InMemoryBookingRepository.cs` — NEW: implement `IBookingRepository`.
  - [Infrastructure] `InMemoryReviewRepository.cs` — NEW: implement `IReviewRepository`.
  - [Infrastructure] `InMemorySwipeActionRepository.cs` — FIX: làm rõ MVP stub comment, giữ `HasPhotographerSwipedRightAsync` return true để test flow.
  - [Application/Abstractions] `IBookingRepository.cs` — NEW.
  - [Application/Abstractions] `IReviewRepository.cs` — NEW.
  - [Application/Commands] `CreateBookingCommand.cs` + `CreateBookingCommandHandler.cs` — NEW: tạo booking từ Active match, enforce domain invariant.
  - [Application/Commands] `SubmitReviewCommand.cs` + `SubmitReviewCommandHandler.cs` — NEW: submit review, enforce Completed booking invariant, dedup.
  - [Application] `DependencyInjection.cs` — UPDATED: thêm `RecordSwipeCommandHandler`, `SwipeRightRecordedHandler`, `CreateBookingCommandHandler`, `SubmitReviewCommandHandler`.
  - [Infrastructure] `DependencyInjection.cs` — UPDATED: thêm `ISwipeActionRepository`, `IMatchRepository`, `IBookingRepository`, `IReviewRepository`.
  - [API/Contracts] `RecordSwipeRequest.cs`, `CreateBookingRequest.cs`, `SubmitReviewRequest.cs` — NEW.
  - [API/Controllers] `SwipesController.cs` — NEW: `POST /api/matching/swipes`.
  - [API/Controllers] `BookingsController.cs` — NEW: `POST /api/bookings`.
  - [API/Controllers] `ReviewsController.cs` — NEW: `POST /api/reviews`.
- Migration:
  - Added: none (in-memory repos, no DB change)
  - Applied: N/A
- API Contracts (full list):
  - REST:
    - `POST /api/auth/otp/send`
    - `POST /api/auth/otp/verify`
    - `POST /api/auth/refresh`
    - `POST /api/customers/profile`
    - `POST /api/matching/searches`
    - `POST /api/matching/swipes` ← **NEW**
    - `POST /api/bookings` ← **NEW**
    - `POST /api/reviews` ← **NEW**
  - GraphQL: `swipeFeed(searchId)`, `me`
- Build: succeeded. 0 Warning(s). 0 Error(s).
- Flow đã nối:
  - `POST /swipes` → `RecordSwipeCommandHandler` → Save SwipeAction → if Right: `SwipeRightRecordedHandler` → check mutual → `MatchAggregate.Create()` + `Accept()` → raise `MatchCreated` → Save Match.
  - `POST /bookings` → `CreateBookingCommandHandler` → load Match → `MarkBookingCreated()` (invariant Active) → `BookingAggregate.Create()` → Save.
  - `POST /reviews` → `SubmitReviewCommandHandler` → load Booking → `EnsureCanBeReviewed()` (invariant Completed) → dedup → Save Review.
- Risks/Next:
  - Gap 1: Remaining Domain event handlers (BookingCompleted → escrow release, BookingCancelled → refund, PhotographerVerified, PremiumExpired).
  - Gap 6: Wire PhotographerAggregate + Value Objects vào MatchingOrchestrator.
  - Khi chuyển sang PostgreSQL, `HasPhotographerSwipedRightAsync` cần implement thật.

## Session 2026-04-23 08:50 — Swagger UI
- Changes:
  - [API] Thêm NuGet package `Swashbuckle.AspNetCore 7.3.1`.
  - [API] `Program.cs`: thay `AddOpenApi()` / `MapOpenApi()` bằng `AddSwaggerGen()` + `UseSwagger()` + `UseSwaggerUI()`.
  - [API] Cấu hình Swagger với:
    - `SwaggerDoc v1` — title, version, description ghi rõ hybrid API rule.
    - SecurityDefinition `Bearer` — JWT Bearer scheme.
    - SecurityRequirement global → tất cả endpoint đều cần auth (trừ OTP endpoints public).
    - `DisplayRequestDuration()` + `EnableDeepLinking()` trên SwaggerUI.
  - [Vault] Cập nhật `_architecture.md`, `_context.md`, `_implementation-log.md`, `_backlog.md`.
- Migration:
  - Added: none
  - Applied: N/A
- API Contracts:
  - REST (unchanged):
    - `POST /api/auth/otp/send`
    - `POST /api/auth/otp/verify`
    - `POST /api/auth/refresh`
    - `POST /api/customers/profile`
    - `POST /api/matching/searches`
  - GraphQL: `swipeFeed(searchId)`, `me`
- Swagger URL: `http://localhost:5062/swagger`
- Build: succeeded. 0 Warning(s). 0 Error(s).
- Risks/Next:
  - Cần thêm XML doc comments cho controllers để Swagger mô tả endpoint đầy đủ hơn.
  - Cân nhắc split SecurityRequirement: endpoint OTP public, endpoint khác require Bearer.

---

## 2026-05-09 — Photographer Mobile UX overhaul + bookings/calendar polish ✅
- Goal: nâng cấp toàn bộ luồng Photographer trên mobile, fix profile/cover/avatar upload, verified flow, và làm lại màn bookings/calendar cho đẹp, rõ và có điểm nhấn hơn.

### Mobile — Profile / Media / Verification
- [Mobile] `PProfileScreen.tsx`
  - Fix partial update profile basic info:
    - gửi `displayName`, `bio`, `quote` theo kiểu patch/merge.
    - log lỗi chi tiết khi update thất bại để dễ debug backend.
  - Avatar/Cover upload:
    - thêm `expo-image-manipulator` để resize/nén trước khi upload.
    - tách nút đổi ảnh avatar và ảnh bìa ra khỏi overlay dễ bị chặn touch.
    - cover button được đưa thành `Pressable` độc lập trên top layer để xử lý lỗi “nhấn không mở picker”.
  - Verified flow:
    - hiển thị badge `Đã xác minh / Đang chờ xác minh / Chưa xác minh`.
    - thêm CTA `Gửi yêu cầu xác minh` ngay trên profile.
    - handle case backend trả `Verification already in progress.` bằng UI thân thiện hơn.
  - UX polish:
    - reload profile khi focus lại screen.
    - cập nhật trạng thái save/upload ngay trong UI.

- [Mobile] `api.ts`
  - `uploadProfileImage()` dùng endpoint riêng cho avatar/cover (`/api/photographers/profile/avatar/upload`, `/profile/cover/upload`) trong giai đoạn đầu, sau đó đồng bộ lại theo endpoint storage chung tùy backend.
  - `submitVerification()` được tối giản về luồng gửi request verify từ profile.

### Mobile — Dashboard / Navigation / Tabs
- [Mobile] `DashboardScreen.tsx`
  - Dashboard không còn phụ thuộc cover photo của profile.
  - Hero background quay về ảnh mặc định trước đó để giữ consistency.
  - Quick actions đổi route phù hợp với flow mới.

- [Mobile] `PhotographerTabs.tsx`
  - Bổ sung/điều chỉnh navigation cho các màn Photographer liên quan:
    - `PBookings`
    - `PProfile`
    - `Portfolio`
    - các màn new/existing cho quản lý dịch vụ, lịch hẹn.

### Mobile — Bookings / Calendar / Service management
- [Mobile] `PBookingsScreen.tsx`
  - Gộp calendar view trực tiếp vào màn bookings.
  - Rework layout theo style premium:
    - header có điểm nhấn, hero stats, card trắng, spacing rõ.
    - calendar dạng lưới có màu trắng, nút chuyển tháng trái/phải.
    - tab lọc hiển thị đầy đủ chữ, không bị cắt.
  - Lịch theo ngày đã chọn:
    - block `Lịch cụ thể` hiển thị bookings của ngày đang chọn.
    - status badge tiếng Việt: `Chờ duyệt`, `Đã xác nhận`, `Hoàn thành`.
  - Tối ưu khả năng cuộn và tránh lịch bị “fixed cứng”.

- [Mobile] `ServiceManagementScreen.tsx`
  - NEW screen mock quản lý dịch vụ & giá.
  - CRUD UI cho service packages (thêm/sửa/xóa) theo style dark premium.

- [Mobile] `BookingCalendarScreen.tsx`
  - Tạo calendar screen standalone trong quá trình thử nghiệm trước khi tích hợp lại vào `PBookingsScreen`.

### Backend — Photographer profile & upload
- [API] `PhotographersController.cs`
  - `UpdateProfile()` chuyển sang merge partial update để mobile chỉ gửi một phần field vẫn hoạt động.
  - Thêm endpoints upload riêng cho profile media trong quá trình xử lý avatar/cover:
    - `POST /api/photographers/profile/avatar/upload`
    - `POST /api/photographers/profile/cover/upload`
  - Tích hợp verified flow API: `POST /api/photographers/verify`.

- [API] `PhotographerRequests.cs`
  - `UpdatePhotographerProfileRequest` được chỉnh lại để hỗ trợ nullable/partial update cho mobile.

- [Infrastructure] storage integration
  - Tận dụng storage upload sẵn có cho media, đồng thời chuẩn hoá luồng public URL từ backend.

### Bugs fixed from terminal logs
- Fix build fail do trùng class `UpdatePhotographerProfileRequest`.
- Fix validation error khi backend yêu cầu `AvatarUrl` / `CoverPhotoUrl` bắt buộc trong luồng update profile text-only.
- Fix lỗi upload avatar trả `404` do mobile gọi sai endpoint.
- Fix lỗi touch của nút đổi ảnh bìa bị overlay che.
- Fix lỗi verification bị báo `Verification already in progress.` bằng message thân thiện hơn.
- Fix lỗi UI hiển thị tab lọc/calendar bị cắt chữ và calendar quá cứng.

### Result
- Photographer profile flow hiện đã có:
  - cập nhật basic info
  - đổi avatar
  - đổi cover
  - verified badge + submit verification
- Bookings flow hiện đã có:
  - calendar theo tháng
  - lọc theo status
  - lịch cụ thể theo ngày
  - UI sáng hơn, có điểm nhấn hơn

### Next ideas
- Nối service management screen với backend thật.
- Nối calendar/booking UI với data real-time tốt hơn.
- Làm animation nhẹ khi đổi tháng / đổi filter / đổi profile media.

### Backend
- ✅ Tạo 8 EF Core repositories thay thế toàn bộ InMemory
- ✅ Thêm `Reconstitute()` factory vào `MatchAggregate`, `BookingAggregate`
- ✅ `DependencyInjection.cs`: Singleton InMemory → Scoped EF repos
- ✅ Migration `AddPasswordHashAndGoogleId` — applied to PostgreSQL
- ✅ `AuthService` + `PhotographerAuthService`: thêm `RegisterWithEmail`, `LoginWithEmail`, `LoginWithGoogle`
- ✅ 6 new endpoints: `/register`, `/login`, `/google` cho cả 2 roles
- ✅ `ShootMatchDbContext`: thêm indexes email/google_id/phone

### Mobile
- ✅ `AuthContext`: thêm `loginWithEmail`, `registerWithEmail`, `loginWithGoogle`
- ✅ `types.ts`: mở rộng `AuthStackParamList` với 4 screens mới
- ✅ `AuthNavigator.tsx`: register đầy đủ 7 screens
- ✅ `RoleSelectScreen`: navigate → `AuthMethod` thay `Login`
- ✅ 4 screens mới: `AuthMethodScreen`, `EmailLoginScreen`, `RegisterScreen`, `PhoneLoginScreen`

### Verification
- ✅ Backend: `0 errors`
- ✅ Mobile TypeScript: `0 errors`

## Session 2026-05-06 00:05 — Cập nhật UI Dashboard & Portfolio Photographer (Full Overhaul)
- Goal: Chuyển đổi toàn bộ giao diện quản lý của Photographer sang phong cách chuyên nghiệp, xử lý dữ liệu thật và tối ưu hiệu năng ảnh 4K.
- Changes:
  - [Mobile] DashboardScreen.tsx:
    - Thống kê real-time: Doanh thu tháng (AgreedPrice của Completed/Paid), số lượng booking.
    - Portfolio Mosaic: Fetch data từ GraphQL, fix lỗi render ảnh localhost.
    - Thêm chức năng Logout.
  - [Mobile] graphql.ts:
    - Thay fetch bằng apiClient.post để tận dụng Axios Interceptors (Auth token + Refresh logic).
  - [Mobile] UploadPortfolioScreen.tsx:
    - UI/UX: Chuyển sang Bento Box / Editorial Grid + Dark Theme.
    - Masonry Algorithm: Sử dụng Image.getSize đo tỷ lệ thật, chia 2 cột so le.
    - Gallery Viewer: Modal viewer với Swiper logic + Thumbnail ScrollView đồng bộ.
    - Absolute Positioning: Fix lỗi xám đen do React unmount component khi thay đổi thứ tự mảng.
    - Bulk Delete: Long-press activation, Multi-select mode, Header action bar.
    - Multiple Upload: Chọn nhiều ảnh cùng lúc, upload tuần tự với tiến độ real-time.
  - [Mobile] Performance:
    - expo-image-manipulator: Downscale ảnh 4K/2K > 1920px để tránh Out-of-Memory (OOM).
    - useSafeAreaInsets: Fix UI overlap trên notched devices.
- Migration: None
- API Contracts:
  - GraphQL: photographerProfile (portfolioPhotos, statistics)
  - REST: DELETE /api/photographers/portfolio/{url} (Batch support via loop)
- Risks/Next:
  - Cần tối ưu thêm tốc độ Image.getSize nếu portfolio có > 100 ảnh.
## Session 2026-05-14 — Photographer profile + service page polish
- Goal: làm rõ luồng cập nhật profile/service trên mobile, giữ `PasswordHash` an toàn, fix Swagger, và redesign màn dịch vụ/giá theo hướng nghệ thuật hơn.
- Changes:
  - [API] `PhotographersController.UpdateProfile()` giữ nguyên `PasswordHash`/`GoogleId` khi update profile.
  - [Infrastructure] `EfPhotographerRepository.UpsertAsync()` fallback về giá trị cũ nếu `PasswordHash`/`GoogleId` null để tránh ghi đè mất dữ liệu.
  - [Infrastructure] `EfPhotographerRepository` map đầy đủ `Quote` ở cả `ToEntity()` và `ToRecord()`.
  - [API] `Program.cs` bật Swagger luôn, redirect `/` → `/swagger`, giúp mở docs dễ hơn trong dev.
  - [API] Fix Swagger file upload endpoints bằng cách đổi `IFormFile` sang request wrapper `UploadPhotographerPhotoRequest` với `[FromForm]`.
  - [Mobile] `PProfileScreen.tsx` reload profile sau khi lưu quote/displayName/bio để UI đồng bộ với DB.
  - [Mobile] `PProfileScreen.tsx` chỉnh quote section để hiển thị rõ hơn và canh giữa tốt hơn.
  - [Mobile] `ServiceManagementScreen.tsx` redesign theo hướng catalogue nghệ thuật: hero, badge, stats, card, action buttons, số tiền hiển thị ổn định hơn không bị xuống dòng.
- Notes:
  - Lỗi Swagger trước đó đến từ `UploadAvatar/UploadCover` dùng `[FromForm] IFormFile` trực tiếp nên Swashbuckle không generate được operation.
  - Vấn đề quote “hiển thị thiếu” chủ yếu do layout wrapper text/icon và canh giữa chưa đúng, đã tinh lại theo hướng centered.
  - Nút `Chỉnh sửa gói` từng bị chìm màu trên nền tối, đã tách icon/text thành style sáng hơn.
- Next:
  - Nếu cần, tiếp tục thống nhất tone màu cho toàn bộ Photographer mobile screens để cùng một visual system.

## Session 2026-05-14/15 — Customer Home + Personal Info + Vault quét
- Goal: Customer Home PicKic; photographer personal info end-to-end; đồng bộ Vault toàn project.
- Changes:
  - [API] Migration `AddPhotographerPersonalInfo`; `PUT /api/photographers/personal-info`.
  - [API] `CustomerHomeFeed` contract + `GetCustomerHomeFeedAsync`; GraphQL `customerHomeFeed`.
  - [API] GraphQL `photographerProfile` expose `nationalId`, `personalAddress`, `portfolioPhotos`.
  - [Mobile] `HomeScreen`: Hero, Nổi Bật + `StoryViewer`, Editorial, Discovery, QuickActions, Khoảnh Khắc.
  - [Mobile] `localPictures.ts` (43 ảnh), `homeMedia.ts`, `PortfolioMasonry` (2 cột giống Upload Portfolio).
  - [Mobile] `PProfileScreen`: ẩn/hiện personal info; region badge; bỏ CCCD/địa chỉ trên card công khai.
  - [Mobile] `PersonalInfoScreen` + navigation stack.
  - [Vault] Quét project 15/05: INDEX.md, context, codebase-map, UI-progress, API-ref, manual 01/04, daily progress.
- Risks/Next:
  - EF cho SearchSession/SwipeAction; giảm phụ thuộc fallback `local-*` ids trên Home.

## Session 2026-05-20 — Đại Trùng Tu Customer Profile, API Upload & DB Migration
- Goal: Triển khai toàn bộ cấu trúc cá nhân hóa nâng cao cho khách hàng, bổ sung 4 DB migration mới, viết REST Upload API, và đồng bộ UI mobile cực kỳ nghệ thuật.
- Changes:
  - [Domain] Thêm cột/trường vào `Customer.cs` và `CustomerRecord.cs`: `CoverPhotoUrl`, `HighlightPhoto1Url`, `HighlightPhoto2Url`, `HighlightPhoto3Url`, `RollPreviewPhotos`, `PreferredStyles`, `IsVerified`, `PreferredBudgetMin`, `PreferredBudgetMax`.
  - [Infrastructure/Migrations] Thêm 4 EF core DB migration: `AddCustomerCoverPhoto`, `AddCustomerHighlightPhotos`, `AddCustomerHighlightPhoto1`, `AddCustomerPreferredStyles`.
  - [Infrastructure/Persistence] Đồng bộ mapping mapper trong `EfCustomerRepository.cs` cho toàn bộ 9 trường cá nhân hóa mới.
  - [API/Controllers] `CustomersController.cs` — bổ sung REST `POST /api/customers/profile` (merge partial upsert an toàn) + **6 endpoint upload ảnh chuyên dụng** hỗ trợ stream file lên Supabase/LocalDisk và lấy Public URL (`profile/avatar/upload`, `cover/upload`, `highlight-1/upload`, `highlight-2/upload`, `highlight-3/upload`, `roll-preview/upload`).
  - [API/Controllers] `PhotographersController.cs` — thêm endpoint PATCH `/api/photographers/availability` và sửa `/api/photographers/verify` giữ thông tin cá nhân.
  - [Mobile] `ProfileScreen.tsx` — Đại trùng tu theo theme PicKic: Viewfinder Hero với viền mỏng thanh lịch, Polaroid Asymmetric Highlights (3 khung ảnh xoay nhẹ góc 3D), Filmstrip Roll Preview, gu ảnh dạng tag, thay thế "Contact sheet" bằng "Thông tin cơ bản" dạng thu/phóng (toggle), xóa cài đặt "Thông báo".
  - [Mobile] `EditProfileScreen.tsx` — Chỉnh sửa buồng tối Darkroom: Viewfinder Header thông số máy ảnh, 3-frame collage editor tích hợp picker resize manipulation, minimal input fields, phim bản thảo nháp riêng (sequential upload progress bar), gu ảnh nghệ thuật có giải thích.
  - [Mobile] `DiscoverScreen.tsx` — Nâng cấp ProgressBar đếm thẻ, verified badge, stamp LIKE/NOPE khi swipe, tích hợp tự động lưu AsyncStorage khi quẹt phải (yêu thích).
  - [Mobile] `PhotographerProfileScreen.tsx` — Đổi mới bố cục báo chí thời trang: hero lớn, stats card, spec badges, equipment list, calendar schedule grid trực quan rảnh bận theo ngày dạng lưới 4 cột, heart favorite toggle liên kết AsyncStorage.
  - [Mobile] Màn hình mới: `PhotographerPortfolioScreen.tsx` (Masonry 2 cột thác nước so le tỉ lệ ảnh thật, Fullscreen slide viewer với thumbnail chân trang), `CustomerFavoritesScreen.tsx` (Hiển thị thẻ nhiếp ảnh gia dạng khung ảnh in matted chữ nhật dọc siêu mỏng tinh tế, load từ `favorites.ts` local storage), `CustomerSharedMediaScreen.tsx` (approved shared photos).
  - [Mobile] Component & Utils mới: `PortfolioImageCell.tsx`, `favorites.ts` (quản lý lưu trữ local nhiếp ảnh gia yêu thích bằng `@react-native-async-storage/async-storage`).
  - [Scripts] Thêm `add_roll_preview_column.py` và `apply_highlight_columns.py` vá nóng cơ sở dữ liệu dev/staging.
- Risks/Next:
  - pgvector thực tế cho PreferredStyles và portfolio embeddings.
  - Chuyển đổi các repo in-memory còn lại (`SearchSession`, `SwipeAction`, `Otp`).

## Session 2026-06-06 → 2026-06-08 — Web landing page, booking polish, discovery/search filters
- Goal: bám theo lịch sử commit thực tế trước 2026-06-10 để ghi lại các thay đổi đã diễn ra trong web, booking và discovery.
- Changes:
  - [Web] `0d5aade` — `feat(web): add WebExperience page with framer-motion and update LandingPage`
    - thêm trải nghiệm web landing/experience bằng Framer Motion.
    - cập nhật `LandingPage.tsx` theo hướng cinematic, scroll-driven.
  - [Web] `aaf0349` + `d6d1c08` — redesign landing page và tinh chỉnh spacing text.
    - làm lại hero và các section landing.
    - chỉnh spacing/typography để UI gọn và rõ hơn.
  - [Mobile] `71c3890` — `feat : Update booking Screen , detail booking and checkout Screen`
    - cập nhật Booking Screen, Booking Detail và Checkout Screen.
    - siết lại luồng đặt lịch và thanh toán trên mobile.
  - [Backend] `6894525` — `feat: normalize Style/Concept entities with approval workflow and advanced search filters`
    - chuẩn hóa `Style/Concept` entities.
    - thêm approval workflow và filter search nâng cao.
  - [Mobile] `7b90e6c` — `feat: complete discovery search feed with real data and lookbook styling`
    - hoàn thiện discovery/search feed với dữ liệu thật.
    - áp lookbook styling cho trải nghiệm tìm kiếm.
  - [Backend] `244dbdf`, `b3f3980`, `e0a9433` — fix upload/profile/service packages.
    - cover image swap, file extension upload, silent refresh profile.
    - giữ portfolio photos khi update photographer profile.
    - hoàn thiện mapping PostgreSQL cho `ServicePackageMediaRecord` và finalize service packages.
- Notes:
  - Đây là các mốc lịch sử trước hôm nay, ghi lại theo commit date thật thay vì dùng ngày hiện tại.
  - Nếu cần audit sâu hơn, nên tách tiếp từng ngày 2026-06-06 / 2026-06-07 / 2026-06-08.
- Risks/Next:
  - Cần cập nhật thêm các file Vault theo ngày tương ứng để không dồn toàn bộ lịch sử vào một mục.

## Session 2026-06-08 → 2026-06-10 — Web Landing Page Redesign & System Updates
- Goal: Thiết kế lại toàn bộ trang Landing Page Web, cập nhật Logo nhận diện mới và bổ sung hệ thống thông báo (Notifications).
- Changes:
  - [Web] Đại tu `LandingPage.tsx` theo hướng Cinematic scroll-driven, loại bỏ page `WebExperience.tsx` thừa.
  - [Web] Cập nhật bộ Logo PicKic (Original, Black, Cream, Orange) chất lượng cao.
  - [Web] Bổ sung cấu hình type-safe cho `social-links.ts` và gắn vào UI web.
  - [Mobile/Backend] Cập nhật các flow liên quan đến hệ thống Push Notifications (bao gồm `NotificationService`, `NotificationsScreen`, `SharedNotificationsScreen`).
  - [Vault] Thêm 3 tài liệu quy hoạch thông báo: `_notification-plan.md`, `_notification-flow-overview.md`, `_notification-backend-checklist.md`.
- Notes:
  - Có khá nhiều script hỗ trợ AI từ `.cursor/skills/impeccable` được đưa vào để tự động hóa kiểm tra UI/UX web.

## Session 2026-06-11 — Cập nhật Lịch & UI Màn hình Booking (Photographer)
- Goal: Thiết kế lại trải nghiệm xem lịch hẹn và quản lý booking cho Photographer theo chuẩn premium, đồng bộ UI bên Customer, thêm hỗ trợ GraphQL cho Booking.
- Changes:
  - [Mobile] `PBookingsScreen.tsx`: Đại tu toàn bộ UI/UX (Màu vàng gold/Charcoal đậm), gộp Lịch trực tiếp vào màn hình này để không phải chuyển trang. Thêm các widget thời tiết, tỷ lệ lấp đầy, bộ lọc trạng thái và hiển thị giá nổi bật.
  - [Mobile] `BookingCalendarScreen.tsx`: Đã xóa do tích hợp Lịch vào PBookingsScreen.
  - [Mobile] `BookingDetailScreen.tsx`: Cập nhật chi tiết UI để đồng bộ với phía Photographer.
  - [Mobile] `PhotographerTabs.tsx` & `types.ts`: Cập nhật cấu trúc điều hướng (xóa BookingCalendarScreen).
  - [Mobile] `api.ts`: Mở rộng query `myBookingsAsPhotographer` để gọi thêm các fields mới (`customerName`, `customerAvatarUrl`, `servicePackageName`, `servicePackageImageUrl`).
  - [API] `BookingExtensions.cs`: Thêm GraphQL Type Extension cho `BookingAggregate`, khai báo 4 resolvers mới dùng EF Core (`GetCustomerName`, `GetCustomerAvatarUrl`, `GetServicePackageName`, `GetServicePackageImageUrl`) giúp join và trả về thông tin chi tiết mà không làm nặng Booking table.
  - [API] `Program.cs`: Đăng ký `.AddTypeExtension<BookingExtensions>()` vào GraphQL pipeline.
- Risks/Next:
  - Kiểm tra lại các query GraphQL mới trên UI để đảm bảo load dữ liệu đúng cho bộ lịch hẹn và booking card.

## Session 2026-06-12 — Photographer Theme & Equipment Management
- Goal: Tích hợp Dark/Light Theme cá nhân hóa dành riêng cho Photographer, đồng thời phát triển tính năng Quản lý thiết bị nhiếp ảnh (Equipment Management).
- Changes:
  - [Domain/Entities] Thêm `EquipmentCategory.cs`, `PhotographerEquipment.cs` và `PhotographerEquipmentRecord.cs` (có thêm thuộc tính `IsHidden`).
  - [Infrastructure/Migrations] Thêm migration `20260612184723_AddPhotographerEquipment`.
  - [API/Controllers] Cập nhật `PhotographerRequests.cs` và `PhotographersController.cs` để hỗ trợ CRUD thiết bị nhiếp ảnh.
  - [Mobile] Thêm `PhotographerThemeContext.tsx` để quản lý Dark/Light Theme riêng biệt cho role Photographer (mặc định sáng).
  - [Mobile] Cập nhật giao diện Dark Theme cho hàng loạt các màn hình của Photographer:
    - `DashboardScreen.tsx` (Bảo lưu Hero background mặc định, sửa lỗi tệp màu nút, nút Đang nhận job/Đăng xuất rõ nét).
    - `PProfileScreen.tsx` (Chỉnh lại màu nền quote không bị đỏ, icon sáng be, fix các badge địa chỉ, số sao, xác minh bị tệp màu).
    - `PBookingsScreen.tsx` & `PBookingCalendarScreen.tsx` (Xử lý lỗi trắng bảng lịch tháng/ngày, chữ bị chìm trên ô lịch, đổi nút next tháng).
    - `BookingDetailScreen.tsx` (Sửa lỗi màu text, thêm border viền trắng cho khối Photographer detail card trên nền đen, badge xác nhận đồng bộ, layout trong suốt không lỗi).
    - `ServiceManagementScreen.tsx` (Chỉnh màu các nút Tác vụ, text tạo gói trắng trên trắng được đổi lại, fix chi tiết gói bị chìm màu).
    - Khung chat (`PChatScreen.tsx`, `ChatScreen.tsx`) (Chỉnh sửa bubble color, header name, status để phân tách rõ không giống hình chữ nhật liền mạch).
  - [Mobile] Thêm tính năng `ManageEquipmentScreen.tsx`: Cho phép thêm/sửa/xóa/ẩn thiết bị nhiếp ảnh gia với UI Modal cải tiến nghệ thuật, khắc phục triệt để lỗi màn hình bị mờ khi mở form.
- Notes:
  - Theme của Customer và Photographer được tách biệt độc lập để không ảnh hưởng lẫn nhau.

## Session 2026-06-14 — Live Map Performance & UX Optimizations (Customer Booking Detail)
- Goal: Fix performance issues (lag, stuttering) and UI bugs on the Customer's booking tracking map, and simplify the sonar wave effect for a premium feel.
- Changes:
  - [Mobile] `BookingDetailScreen.tsx`:
    - **Performance:** Removed continuous `requestAnimationFrame` loops for the map sonar wave which caused Android native render thread freezes.
    - **Platform Specific:**
      - Android: Implemented static concentric rings (10m, 18m, 26m) for stable layout without re-render stutter.
      - iOS: Implemented a simplified, ultra-slow pulsing outer ring (6m to 12m over 6 seconds) and a static 10m soft blue zone for a smooth, premium aesthetic.
    - **Data Flow:** Added dynamic "Preview Fallback" (3-second timeout) to draw markers even if SignalR location updates haven't arrived yet, preventing the map from appearing empty/broken.
    - **API Integration:** Integrated `getMyBookingsAsPhotographer` to handle data fetching when the current user is a Photographer.
    - **Type Safety:** Resolved TypeScript build errors (implicit `any` in array finders, missing imports).
- Notes:
  - Addressed user feedback regarding UI performance (lag/stuttering) specifically on the map screen when tracking the photographer.
  - Ensured the UI feels "nhỏ gọn" (compact) and "siêu chậm" (ultra-slow) per user preference.
