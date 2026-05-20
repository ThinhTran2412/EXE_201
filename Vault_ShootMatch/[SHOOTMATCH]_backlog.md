# SHOOTMATCH — Backlog & Technical Debt

> Cập nhật lần cuối: **2026-05-20**

---

## 🔜 Ưu tiên gần (2026-05)

| # | Hạng mục | Ghi chú |
|---|----------|---------|
| 1 | EF `SearchSession` + `SwipeAction` | Thay in-memory, persist swipe history |
| 2 | SigLIP + pgvector | Thay `StubSiglipEncoder` |
| 3 | Customer Home — bỏ fallback local khi API đủ data | `local-featured-*` ids |
| 4 | Thống nhất `formatImageUrl` / `formatPhotoUrl` | Một helper shared mobile |
| 5 | `.gitignore` bin/obj, `.env` không commit | Repo hygiene |
| 6 | FCM notifications | Push booking/chat |
| 7 | Payment + escrow thật | Sau booking confirm |
| 8 | Admin UI | Duyệt verification |

---

## ✅ Đã hoàn thành — Customer Profile & Personalized Experience Overhaul (2026-05-20)

### Hạng mục mới và bổ sung
- **Mở rộng Schema Khách hàng:** Cấu trúc thành công 9 trường thông tin mới cho `Customer` / `CustomerRecord` (`CoverPhotoUrl`, 3 ảnh `HighlightPhotoUrl`, `RollPreviewPhotos` dưới dạng comma-separated, `PreferredStyles` dạng gu ảnh, `IsVerified`, ngân sách).
- **EF Core Migrations:** Áp dụng liên tục 4 EF migrations (`AddCustomerCoverPhoto`, `AddCustomerHighlightPhotos`, `AddCustomerHighlightPhoto1`, `AddCustomerPreferredStyles`).
- **Python DB Hotfix Scripts:** Viết các script vá nóng PostgreSQL cục bộ (`add_roll_preview_column.py`, `apply_highlight_columns.py`) để đồng bộ schema nhanh mà không cần build lại migrations.
- **REST Endpoints:** Triển khai API lấy profile hiện tại (`GET /api/customers/me`), lưu profile hỗ trợ merge/fallback thông minh khi cập nhật (`POST /api/customers/profile`), và 6 endpoint upload ảnh chuyên biệt hỗ trợ `multipart/form-data`.
- **Artistic Mobile UI:**
  - Redesign `ProfileScreen.tsx` & `EditProfileScreen.tsx` theo phong cách Darkroom Viewfinder (khung ngắm chụp ảnh chuyên nghiệp, collage 3D Polaroid `rotate` bất đối xứng `-6°`, `2°`, `6°`, cuộn phim nháp bản thảo Filmstrip Roll Preview 4-8 ảnh mượt mà).
  - Tích hợp nén và resize ảnh tuần tự qua `expo-image-manipulator` trước khi upload hàng loạt tránh xung đột.
  - Interactive Gu ảnh: 5 pill phong cách (`Portrait`, `Golden hour`, `Film look`, `Lifestyle`, `Editorial`) kèm card mô tả chi tiết trực quan khi chạm vào.
  - Masonry Portfolio Screen (`PhotographerPortfolioScreen.tsx`): 2 cột thác nước đo tỷ lệ ảnh thật kèm slide viewer toàn màn hình và cuộn thumbnail chân trang.
  - Schedule Grid (`PhotographerProfileScreen.tsx`): Lưới 4 cột lịch rảnh bận theo ngày trực quan của nhiếp ảnh gia.
  - ProgressBar & Stamp LIKE/NOPE, verified badge trên Discover Screen.
  - Thêm màn hình lưu trữ: `CustomerFavoritesScreen`, `CustomerSharedMediaScreen`.

---

## ✅ Đã hoàn thành — Full API + Role-Based Auth (2026-04-24)

### Files mới tạo
| Layer | File | Mục đích |
|---|---|---|
| Application/Services | `PhotographerAuthService.cs` | OTP login photographer, issue `photographer` JWT |
| API/Contracts | `PhotographerRequests.cs` | DTOs cho photographer management |
| API/Contracts | `PhotographerAuthRequests.cs` | DTOs cho photographer auth |
| API/Controllers | `PhotographerAuthController.cs` | `/api/photographer-auth/*` |
| API/Controllers | `PhotographersController.cs` | GET/PUT profile, PATCH availability, POST verify |
| API/Controllers | `AdminController.cs` | Admin: list, verify, revoke-premium |

### Files cập nhật chính
| File | Thay đổi quan trọng |
|---|---|
| `JwtTokenService.cs` | Bổ sung claim `role`, `user_id`, `photographer_id`/`customer_id` |
| `IAuthTokenService.cs` | Thêm `role` param vào GenerateAccessToken |
| `IPhotographerRepository.cs` | +GetByIdAsync, +GetByPhoneAsync, +UpsertAsync |
| `IMatchRepository.cs` | +GetByCustomerIdAsync, +GetByPhotographerIdAsync |
| `IBookingRepository.cs` | +GetByCustomerIdAsync, +GetByPhotographerIdAsync |
| `IReviewRepository.cs` | +GetByCustomerIdAsync, +GetByPhotographerIdAsync |
| `BookingsController.cs` | +confirm, +complete, +cancel (role-gated) |
| `MatchingQuery.cs` | 2 → 14 GraphQL queries |
| `Program.cs` | RoleClaimType, named policies, GraphQL auth |

### Build
```
Build succeeded. 0 Warning(s). 0 Error(s).
```

---

## ✅ Đã hoàn thành — Core Flow Completion: Swipe → Match → Booking → Review (2026-04-23)

### Files mới tạo
| Layer | File | Mục đích |
|---|---|---|
| Application/Abstractions | `IBookingRepository.cs` | Contract lưu/query BookingAggregate |
| Application/Abstractions | `IReviewRepository.cs` | Contract lưu/query Review |
| Application/Commands | `CreateBookingCommand.cs` | Command data |
| Application/Commands | `CreateBookingCommandHandler.cs` | Enforce Active match invariant, tạo Booking |
| Application/Commands | `SubmitReviewCommand.cs` | Command data |
| Application/Commands | `SubmitReviewCommandHandler.cs` | Enforce Completed booking invariant, dedup |
| Infrastructure/Persistence | `InMemoryMatchRepository.cs` | IMatchRepository impl (ConcurrentDictionary) |
| Infrastructure/Persistence | `InMemoryBookingRepository.cs` | IBookingRepository impl |
| Infrastructure/Persistence | `InMemoryReviewRepository.cs` | IReviewRepository impl |
| API/Contracts | `RecordSwipeRequest.cs` | DTO cho swipe endpoint |
| API/Contracts | `CreateBookingRequest.cs` | DTO cho booking endpoint |
| API/Contracts | `SubmitReviewRequest.cs` | DTO cho review endpoint |
| API/Controllers | `SwipesController.cs` | `POST /api/matching/swipes` |
| API/Controllers | `BookingsController.cs` | `POST /api/bookings` |
| API/Controllers | `ReviewsController.cs` | `POST /api/reviews` |

### Files cập nhật
| File | Thay đổi |
|---|---|
| `Application/DependencyInjection.cs` | +4 handlers mới |
| `Infrastructure/DependencyInjection.cs` | +4 repository registrations |
| `Infrastructure/.../InMemorySwipeActionRepository.cs` | Làm rõ MVP stub comment |

### Flow đã nối hoàn chỉnh
```
POST /api/matching/swipes
  → RecordSwipeCommandHandler
    → SwipeAction.Save()
    → [if Right] SwipeRightRecordedHandler
        → IMatchRepository.FindAsync() (dedup)
        → ISwipeActionRepository.HasPhotographerSwipedRightAsync() (mutual check, MVP stub = true)
        → MatchAggregate.Create() → Accept() → raises MatchCreated
        → IMatchRepository.SaveAsync()

POST /api/bookings
  → CreateBookingCommandHandler
    → IMatchRepository.GetByIdAsync()
    → MatchAggregate.MarkBookingCreated() [throws if not Active]
    → BookingAggregate.Create()
    → Save both

POST /api/reviews
  → SubmitReviewCommandHandler
    → IBookingRepository.GetByIdAsync()
    → BookingAggregate.EnsureCanBeReviewed() [throws if not Completed]
    → IReviewRepository.GetByBookingIdAsync() (dedup check)
    → Review.Save()
```

### Build
```
Build succeeded. 0 Warning(s). 0 Error(s).
```

---

## ✅ Đã hoàn thành — Swagger UI (2026-04-23)

### Package
- `Swashbuckle.AspNetCore 7.3.1` thêm vào `ShootMatch.Api.csproj`.

### Cấu hình (`Program.cs`)
- `AddSwaggerGen()` thay thế `AddOpenApi()` (minimal ASP.NET Core).
- `SwaggerDoc("v1")` với title, version, description hybrid API rule.
- `SecurityDefinition("Bearer")` → JWT Bearer scheme.
- `SecurityRequirement` global — Swagger hiển thị 🔒 cho tất cả endpoint.
- `UseSwagger()` + `UseSwaggerUI()` trong `app.Environment.IsDevelopment()` block.
- `DisplayRequestDuration()` + `EnableDeepLinking()` trên UI.

### Truy cập
- URL: `http://localhost:5062/swagger`
- Để test endpoint có `[Authorize]`: nhấn **Authorize** → nhập `Bearer {jwt_token}`.

### Build
```
Build succeeded. 0 Warning(s). 0 Error(s).
```

---

## ✅ Đã hoàn thành — DDD Restructure: Aggregates + Value Objects (2026-04-21)

### Value Objects tạo mới (`Domain/ValueObjects/`)
| File | Mục đích |
|---|---|
| `PriceRange.cs` | Min ≤ Max invariant, `Includes(budget)` predicate dùng cho matching filter |
| `ContactInfo.cs` | Phone + Email, normalize email lowercase, validate non-empty |
| `Location.cs` | Region code enum (HN/HCM/DN/HP/CT/OTHER), reject invalid codes tại construction |
| `StyleVector.cs` | Wraps `float[]`, `CosineSimilarity()`, `MeanPool()`, ToJson/FromJson cho persistence |

### Aggregates tạo mới (`Domain/Aggregates/`)
| File | State machine / Behaviour |
|---|---|
| `PhotographerAggregate.cs` | Register, UpdateProfile, SetAvailability, MarkVerified (→ `PhotographerVerified` event), UpdateRating, Delete, portfolio photo tracking |
| `CustomerAggregate.cs` | Register, UpdateProfile, RecordActivity, Verify, Deactivate |

### Migrations (VectorMath → StyleVector)
- `VectorMath.cs` đánh dấu `[Obsolete]`, delegate sang `StyleVector` (backward compat)
- `MatchingOrchestrator.cs` migrate hoàn toàn sang `StyleVector` — xóa dependency vào `VectorMath`
- `MatchingOrchestrator` giờ persist `ReferenceImageUrlsJson`, `StyleVectorJson`, `Status="Ready"`, `ExpiresAt` vào `SearchSession`

### Build kết quả
```
Build succeeded. 0 Warning(s). 0 Error(s).
```

---

## ✅ Đã hoàn thành — Domain Events Infrastructure (2026-04-21)

### Files tạo mới
| File | Mục đích |
|---|---|
| `Domain/Abstractions/IDomainEvent.cs` | Marker interface cho tất cả domain event |
| `Domain/Abstractions/IDomainEventHandler.cs` | Handler contract — DI resolves và invoke |
| `Domain/Common/AggregateRoot.cs` | Base class: `RaiseDomainEvent()`, `ClearDomainEvents()`, `DomainEvents` list |
| `Domain/Events/DomainEvents.cs` | 7 core events: `SwipeRightRecorded`, `MatchCreated`, `BookingConfirmed`, `BookingCompleted`, `BookingCancelled`, `PhotographerVerified`, `PremiumExpired` |
| `Domain/Exceptions/DomainException.cs` | Typed exception cho aggregate invariant violations |
| `Domain/Aggregates/MatchAggregate.cs` | State machine: Pending→Active→BookingCreated→Closed + raises `MatchCreated` |
| `Domain/Aggregates/BookingAggregate.cs` | State machine: Pending→Confirmed→Completed→Cancelled/Disputed + raises `BookingConfirmed/Completed/Cancelled` |
| `Infrastructure/Persistence/DomainEventDispatcher.cs` | Dispatch events sau SaveChanges, resolve handlers từ DI |

### Thay đổi existing
- `ShootMatchDbContext`: inject `DomainEventDispatcher`, override `SaveChangesAsync` để dispatch sau persistence
- `Infrastructure/DependencyInjection.cs`: register `DomainEventDispatcher` as scoped

### Pattern đã chốt
- **Separate persistence model** — `PhotographerRecord` ≠ `PhotographerAggregate`. EF map persistence records, domain aggregates contain behavior.
- Domain events dispatch **sau** `SaveChanges` — tránh partial state khi handler fail.
- `DomainEventDispatcher?` nullable trong DbContext ctor → compatible với design-time factory (migration tooling).

---

## ✅ Đã hoàn thành — Migration `AddAvailabilityAndOtp` (2026-04-21)

### Entities mới
- `PhotographerAvailability` — lịch trống photographer (recurring weekly + specific date override/block)
- `OtpRecord` — lưu OTP vào PostgreSQL, blocker của việc replace InMemoryOtpService

### Schema thiết kế
- `PhotographerAvailability`: `DayOfWeek` (0-6, nullable) + `SpecificDate` (nullable) → 2 mode dùng chung 1 table
- `OtpRecord`: `Phone`, `Code`, `AttemptCount`, `IsUsed`, `ExpiresAt`, `UsedAt` + index `(Phone, IsUsed)` và `ExpiresAt` cho cleanup job
- Migration applied thành công: `AddAvailabilityAndOtp`

---

## ✅ Đã hoàn thành — Migration `SchemaExpansionV2` (2026-04-21)

### Patch entities hiện có
| Entity | Fields bổ sung |
|---|---|
| `Customer` | `PreferredBudgetMin/Max`, `IsActive`, `LastSeenAt`, `DeletedAt` |
| `Photographer` | `Phone`, `Email`, `AvatarUrl`, `CoverPhotoUrl`, `Bio`, `InstagramUrl`, `VerificationStatus`, `AcceptsInstantBooking`, `CreatedAt`, `UpdatedAt`, `DeletedAt` |
| `SearchSession` | `ReferenceImageUrlsJson`, `StyleVectorJson`, `Status`, `ExpiresAt` |
| `SwipeAction` | `Direction` (Left/Right) — thay `IsLiked` |
| `AuthSession` | `UserAgent`, `IpAddress`, `RevokedAt` |

### Entities mới
- `PortfolioPhoto` — metadata ảnh gốc (URL, thumbnail, order, index status)
- `ServicePackage` — gói dịch vụ của photographer (title, price, duration)
- `Match` — trạng thái match (Pending → Active → Closed)
- `Booking` — core revenue entity (escrow, commission, status lifecycle)
- `Review` — đánh giá sau booking hoàn tất (1-5 sao)
- `VerificationRequest` — xác minh danh tính photographer (CCCD, selfie, audit trail)

### Migration
- `SchemaExpansionV2` — applied thành công lên Supabase `public` schema

---

## 🔍 Analysis — Gaps & Bugs (2026-05-03)

> Review toàn bộ 5 luồng nghiệp vụ từ codebase map. Verified bằng cách đọc trực tiếp code.

### Luồng 1 — Auth ✅ Ổn
- Customer + Photographer đều có OTP → JWT → refresh flow hoàn chỉnh.
- Role-based auth (`customer` / `photographer` / `admin`) hoạt động qua `ClaimTypes.Role`.
- **Thiếu duy nhất**: `InMemoryOtpService` chưa replace bằng Twilio/Stringee — infra concern, không phải business logic. Note để không bị bỏ khi production deploy.

---

### Luồng 2 — Tìm kiếm & Swipe ⚠️ BUG TIỀM ẨN
- Search → encode → rank → swipe feed → mutual match flow đủ.
- **BUG**: `InMemorySwipeActionRepository.HasPhotographerSwipedRightAsync` hardcode `return true`
  - Hệ quả: mọi swipe phải của khách đều tạo Match ngay lập tức, không cần photographer swipe lại.
  - SHOOTMATCH là mutual matching — flow này sai product spec.
  - **Sẽ tự fix khi replace sang PostgreSQL** (query thật), nhưng phải note rõ để không bỏ sót.
  - **Action**: Khi implement PostgreSQL repo, query: `SELECT 1 FROM swipe_actions WHERE photographer_id = @pid AND customer_id = @cid AND direction = 'Right'`

---

### Luồng 3 — Match → Chat → Booking ❌ BỊ ĐỨT
- Match tạo được (MatchAggregate.Accept() → raises MatchCreated).
- **Gap**: `MatchCreated` event raise xong, không có handler → Conversation chưa có entity, handler, endpoint.
- Hậu quả nghiêm trọng: khách và photographer match nhau nhưng **không có cách liên lạc trong app**.
- `CreateBookingCommand` tồn tại nhưng không ai booking ngay mà không chat trước → flow tồn tại trên giấy nhưng không dùng được thực tế.
- **Đây là gap lớn nhất về UX** — cần giải quyết trước mọi thứ khác.
- **Transport options**: SignalR vs Supabase Realtime (xem phần quyết định bên dưới).

---

### Luồng 4 — Booking Lifecycle ✅ Logic đủ, thiếu escrow thật + 1 security gap nhỏ
- State machine Pending → Confirmed → Completed → Cancelled/Disputed đầy đủ endpoint.
- Events `BookingConfirmed`, `BookingCompleted`, `BookingCancelled` raise nhưng handler chưa có (escrow chỉ là field `EscrowStatus`, không action thật). Chấp nhận được ở MVP.
- **Security gap**: `BookingParticipant` policy khai báo trong `Program.cs` nhưng KHÔNG được dùng trong `BookingsController`.
  - Cancel endpoint check `customer | photographer` role, SAU ĐÓ mới check `booking.CustomerId != callerId && booking.PhotographerId != callerId`.
  - ✅ Cancel đã đúng — có participant check ở line 143.
  - Confirm/Complete: check `booking.PhotographerId != photographerId` — đúng.
  - **Kết luận**: security gap không tồn tại trong thực tế, nhưng policy `BookingParticipant` vô dụng — có thể xóa hoặc dùng để thay thế logic check hiện tại.

---

### Luồng 5 — Review ⚠️ Thiếu DB constraint
- `SubmitReviewCommandHandler` gọi `EnsureCanBeReviewed()` đúng.
- Dedup check hiện tại: `GetByBookingIdAsync` → nếu đã có review thì throw.
- **Thiếu**: Khi migrate sang PostgreSQL, cần `UNIQUE (booking_id, author_customer_id)` trên table `reviews` để guard ở DB level, không chỉ application level.
- **Action khi làm migration PostgreSQL**: thêm unique constraint.

---

### Luồng 6 — Verification ⚠️ THIẾU VerificationRequest Repository
- **Admin approve flow hiện tại**: chỉ update `VerificationStatus` trên `Photographer` entity, **không load hay persist VerificationRequest record**.
- Không có `IVerificationRequestRepository` trong `Application/Abstractions/`.
- **Hậu quả**: Không có audit trail — không biết admin nào duyệt, duyệt khi nào, request nào được duyệt.
- **Action**: Tạo `IVerificationRequestRepository` + `InMemoryVerificationRequestRepository` + cập nhật `AdminController.ApproveVerification` để update cả `VerificationRequest.Status = Approved` + `ReviewedBy` + `ReviewedAt`.

---

## 🚀 Priority Queue (2026-05-03)

| # | Item | Blocker UX | Action cần làm |
|---|---|---|---|
| **P0** | `Conversation` + `Message` + real-time | Block toàn bộ UX sau match | Chốt stack → implement |
| **P1** | Fix `HasPhotographerSwipedRightAsync` stub | Bug ra production | Gắn comment `// TODO: implement real query`, fix khi làm PG repo |
| **P1** | `IVerificationRequestRepository` | Admin flow incomplete | Tạo interface + InMemory impl + update AdminController |
| **P2** | `BookingParticipant` policy cleanup | Policy vô dụng | Xóa hoặc refactor BookingsController dùng policy |
| **P2** | Unique constraint `reviews(booking_id, author_id)` | Data integrity | Thêm vào migration khi làm PostgreSQL repos |
| **P3** | Replace InMemory repos → PostgreSQL | Production readiness | Sau khi Conversation xong |
| **P3** | SigLIP thật + pgvector | Core AI | Cần GPU infra |
| **P4** | Payment gateway + escrow | Revenue | Chọn VNPay/Momo/Stripe |
| **P4** | `PremiumSubscription` + `ProfileBoost` | Revenue phụ | Phụ thuộc payment |
| **P5** | `Notification` + FCM | UX | Phụ thuộc mobile client |

---

## 💬 Quyết định Stack: SignalR vs Supabase Realtime

### SignalR (Microsoft) ✅ **RECOMMENDED**
**Pros:**
- Native trong .NET ecosystem — không cần thêm infra mới
- Hub-based: auth JWT tích hợp dễ với middleware đang có
- Transport fallback tự động: WebSocket → SSE → Long Polling
- Dễ control permission: chỉ cho phép user gửi tin nhắn vào conversation của chính họ
- Group management: mỗi Conversation = 1 SignalR Group
- Không expose DB trực tiếp ra client

**Cons:**
- Cần sticky sessions hoặc Redis backplane nếu scale horizontal
- Cần thêm package `Microsoft.AspNetCore.SignalR`

### Supabase Realtime
**Pros:**
- Zero code nếu đã dùng Supabase
- Client subscribe trực tiếp vào PostgreSQL LISTEN/NOTIFY

**Cons:**
- Client kết nối **trực tiếp tới Supabase**, không qua API layer → bypass domain logic
- Khó enforce business rules (ai được đọc tin nhắn conversation nào?)
- Phụ thuộc Supabase cụ thể — không portable
- Row Level Security phức tạp hơn là SignalR Hub auth

### **Kết luận: Chọn SignalR**

> Security + DDD consistency quan trọng hơn convenience ở đây. Với SignalR, mọi message đi qua Hub → qua domain layer → qua auth. Supabase Realtime bypass hoàn toàn API.

**Architecture dự kiến với SignalR:**
```
Client ──WebSocket──▶ /hubs/chat (ChatHub : Hub)
                          │
                          ├─ [Authorize] JWT validation
                          ├─ JoinConversation(conversationId) → AddToGroup
                          ├─ SendMessage(conversationId, content) → CommandHandler → DB → BroadcastToGroup
                          └─ LeaveConversation(conversationId) → RemoveFromGroup

Domain Events:
  MatchCreated → MatchCreatedHandler → tạo Conversation record → return conversationId
```
**Lý do chưa làm:** Cần thiết kế real-time architecture trước. Chat cần WebSocket/SignalR hoặc Supabase Realtime — chưa quyết định stack.

**Điều kiện tiên quyết:**
- [ ] Quyết định transport layer: SignalR (.NET) vs Supabase Realtime (Postgres LISTEN/NOTIFY)
- [ ] Design conversation state machine: Open → Active → Archived → Closed
- [ ] Xác định message retention policy (xóa sau bao lâu?)
- [ ] Thiết kế message schema: text-only trước hay hỗ trợ image ngay?

**Schema dự kiến (đã cập nhật):**
```csharp
// Conversation:
//   Id, MatchId, BookingId? (nullable — có trước booking, vẫn dùng sau booking),
//   CustomerId, PhotographerId,
//   Status (Open|Active|Archived|Closed),
//   CreatedAt, LastMessageAt

// Message:
//   Id, ConversationId, SenderId, SenderType (Customer|Photographer),
//   Content, ContentType (Text|Image), SentAt, ReadAt?
```

---

### 2. `Transaction` / `PaymentRecord` entity
**Lý do chưa làm:** Chưa chọn payment gateway.

**Điều kiện tiên quyết:**
- [ ] Chọn payment gateway: VNPay / Momo / Stripe
- [ ] Thiết kế escrow flow: tiền giữ lúc nào, release lúc nào, refund flow
- [ ] Xác định commission rate (% hoặc flat fee?)
- [ ] Onboarding payout cho photographer (bank account info)

**Schema dự kiến (đã cập nhật — dùng 1 bảng cho tất cả loại giao dịch):**
```csharp
// Transaction:
//   Id, BookingId?,
//   Type (BookingPayment|PremiumSubscription|ProfileBoost),  ← dùng chung 1 table
//   Amount, CommissionAmount, PhotographerPayout,
//   PaymentGateway (VNPay|Momo|Stripe),
//   GatewayReference,
//   Status (Pending|Captured|Released|Refunded|Failed),
//   CreatedAt, ProcessedAt
```

---

### 3. `PremiumSubscription` entity
**Lý do chưa làm:** `IsPremium` hiện chỉ là boolean — không biết hết hạn lúc nào, không có lịch sử gia hạn.

**Điều kiện tiên quyết:**
- [ ] Quyết định pricing plan: monthly/yearly/one-time
- [ ] Tích hợp payment gateway (cùng dependency với `Transaction`)
- [ ] Design auto-renewal vs manual renewal flow

**Schema dự kiến:**
```csharp
// PremiumSubscription: Id, PhotographerId, Plan (Monthly|Yearly),
//   StartDate, EndDate, Status (Active|Expired|Cancelled),
//   PaymentRef, CreatedAt
```

---

## 🟡 Chưa làm — Ưu tiên trung bình (sprint tiếp theo)

### 4. `ProfileBoost` entity
**Lý do chưa làm:** Revenue phụ, chưa urgent.

**Điều kiện tiên quyết:**
- [ ] Thiết kế boost algorithm: boost tăng rank như thế nào trong `MatchingOrchestrator`?
- [ ] Xác định giá và thời hạn boost (24h / 72h / 7 ngày?)
- [ ] Tích hợp payment gateway

**Schema dự kiến:**
```csharp
// ProfileBoost: Id, PhotographerId, StartAt, EndAt, IsActive, PaidAmount, PaymentRef
```

---

### 5. `Report` entity (Trust & Safety)
**Lý do chưa làm:** Moderation flow chưa thiết kế — chưa có admin dashboard.

**Điều kiện tiên quyết:**
- [ ] Thiết kế moderation workflow: ai review report? (manual vs auto)
- [ ] Xác định action khi report được approve: ban account, hide profile?
- [ ] Admin role + permission system chưa có

**Schema dự kiến:**
```csharp
// Report: Id, ReporterId, TargetId, TargetType (Customer|Photographer),
//   Reason, Description, Status (Open/Investigating/Resolved/Dismissed),
//   CreatedAt, ResolvedAt
```

---

## 🟢 Chưa làm — Ưu tiên thấp (để sau)

### 6. `Notification` entity
**Lý do chưa làm:** Push notification cần chọn provider (FCM / APNs) và setup mobile client trước.

**Điều kiện tiên quyết:**
- [ ] Mobile app setup với Firebase SDK
- [ ] FCM server key configuration
- [ ] Notification template design (match, booking confirm, review reminder...)

---

## 🔧 Technical Debt — Infrastructure

### 7. Replace InMemory repositories với PostgreSQL
**Lý do chưa làm:** Tất cả repository hiện tại là in-memory stub.

**Điều kiện tiên quyết:**
- [ ] Thiết kế repository pattern với EF Core (implement `ICustomerRepository`, `IPhotographerRepository`, `ISearchSessionRepository`, `IAuthSessionRepository`)
- [ ] Implement pagination cho swipe feed query
- [ ] Connection resiliency + retry policy

---

### 8. Replace StubSiglipEncoder với FastAPI SigLIP thật
**Lý do chưa làm:** Cần inference server riêng với GPU 6GB VRAM.

**Điều kiện tiên quyết:**
- [ ] Deploy FastAPI inference service (SigLIP-SO400M model)
- [ ] Expose `/encode` endpoint nhận base64 image → trả float[] vector
- [ ] Configure timeout, retry, circuit-breaker cho HTTP adapter
- [ ] Implement `IEmbeddingEncoder` thật thay `StubSiglipEncoder`

---

### 9. PostgreSQL pgvector cho vector search
**Lý do chưa làm:** Hiện tại cosine similarity tính in-memory — không scale.

**Điều kiện tiên quyết:**
- [ ] Enable pgvector extension trên Supabase: `CREATE EXTENSION IF NOT EXISTS vector`
- [ ] Migrate `PortfolioEmbeddingRecord.VectorJson` từ `jsonb` → `vector(768)` column type
- [ ] Implement top-K cosine search tại DB level (`<=>` operator)
- [ ] Benchmark query performance với pgvector index (IVFFlat hoặc HNSW)

---

### 10. Secret management
**Lý do chưa làm:** Connection string đang hardcode trong `appsettings.json`.

**Điều kiện tiên quyết:**
- [ ] Setup .NET User Secrets cho local dev
- [ ] Setup environment variables cho staging/production
- [ ] Xem xét Supabase Vault hoặc Azure Key Vault nếu scale lên

---

## 📋 Tóm tắt theo ưu tiên

| ✅ | Conversation + Message entities | ~~P0~~ | Done |
| ✅ | SignalR ChatHub (/hubs/chat) | ~~P0~~ | Done |
| ✅ | MatchCreatedHandler (auto-create Conversation) | ~~P0~~ | Done |
| ✅ | Fix MatchCreated event drop (in-memory path) | ~~P1~~ | Done |
| ✅ | IVerificationRequestRepository + audit trail | ~~P1~~ | Done |
| ✅ | HasPhotographerSwipedRightAsync TODO comment | ~~P1~~ | Done |
| 1 | BookingParticipant policy cleanup | P2 | Xóa hoặc refactor |
| 2 | Unique constraint `reviews(booking_id, author_id)` | P2 | Thêm vào PG migration |
| 3 | Replace InMemory repos → PostgreSQL | P3 | Core cho production |
| 4 | SigLIP thật + pgvector | P3 | GPU infra |
| 5 | Payment gateway + escrow | P4 | Chọn VNPay/Momo/Stripe |
| 6 | PremiumSubscription + ProfileBoost | P4 | Phụ thuộc payment |
| 7 | Admin login (issue admin JWT) | P2 | Cần admin user management |
| 8 | Notification (FCM) | P5 | Phụ thuộc mobile client |
| 2 | Transaction / Payment | 🔴 Cao | Chọn payment gateway |
| 3 | PremiumSubscription | 🟡 Trung bình | Phụ thuộc payment |
| 4 | ProfileBoost | 🟡 Trung bình | Phụ thuộc payment + ranking algo |
| 5 | Report | 🟡 Trung bình | Cần admin dashboard |
| 6 | Notification | 🟢 Thấp | Cần mobile client |
| 7 | PostgreSQL Repos | 🔴 Cao | Core cho production |
| 8 | SigLIP thật | 🔴 Cao | GPU infra |
| 9 | pgvector search | 🟡 Trung bình | Phụ thuộc SigLIP |
| 10 | Secret management | 🟡 Trung bình | Cần trước production |
