# SHOOTMATCH — Codebase Map (File & Entity Index)

> Cập nhật lần cuối: **2026-05-20** — quét toàn project + mobile tree
> Mục đích: Bản đồ đầy đủ tất cả file, entity, aggregate, contract trong solution.

---

## 📁 Solution Structure

```
ShootMatch/
├── ShootMatch.Domain          ← Pure domain logic, không phụ thuộc gì ngoài
├── ShootMatch.Application     ← Use cases, commands, queries, abstractions
├── ShootMatch.Infrastructure  ← EF Core, JWT, AI stub, in-memory repos
└── ShootMatch.Api             ← ASP.NET Core Web API + GraphQL + SignalR
```

---

## 🔵 ShootMatch.Domain

### `Abstractions/`
| File | Nội dung |
|---|---|
| `IDomainEvent.cs` | Marker interface cho tất cả domain event |
| `IDomainEventHandler<TEvent>.cs` | Contract handler — DI resolve và invoke |

### `Common/`
| File | Nội dung |
|---|---|
| `AggregateRoot.cs` | Base class: `RaiseDomainEvent()`, `ClearDomainEvents()`, `DomainEvents` list |

### `Exceptions/`
| File | Nội dung |
|---|---|
| `DomainException.cs` | Typed exception cho aggregate invariant violations |

### `Services/`
| File | Nội dung |
|---|---|
| `VectorMath.cs` | `[Obsolete]` — đã delegate sang `StyleVector`. Backward-compat wrapper. |

---

### `Entities/` — 15 entities

| Entity | Table (PostgreSQL) | Fields chính |
|---|---|---|
| **Photographer** | `photographers` | Trên + `Quote`, `NationalId?`, `PersonalAddress?`, `PasswordHash?`, `GoogleId?`, `PortfolioPhotos[]`, verification doc URLs |
| **Customer** | `customers` | `Id`, `DisplayName`, `Phone`, `Email`, `Region`, `AvatarUrl`, `CoverPhotoUrl`, `HighlightPhoto1Url`, `HighlightPhoto2Url`, `HighlightPhoto3Url`, `RollPreviewPhotos` (phim bản thảo nháp), `PreferredStyles` (gu ảnh ưa thích), `IsVerified`, `PreferredBudgetMin?`, `PreferredBudgetMax?`, `IsActive`, `PasswordHash?`, `GoogleId?`, `CreatedAt`, `LastSeenAt?`, `DeletedAt?` |
| **Match** | `matches` | `Id`, `CustomerId`, `PhotographerId`, `SearchSessionId`, `Status` (Pending/Active/Closed), `MatchedAt`, `ClosedAt?` |
| **Booking** | `bookings` | `Id`, `CustomerId`, `PhotographerId`, `MatchId`, `ServicePackageId?`, `Status` (Pending/Confirmed/Completed/Cancelled/Disputed), `AgreedPrice`, `Commission`, `EscrowStatus` (Held/Released/Refunded), `ScheduledAt`, `CreatedAt`, `CompletedAt?`, `CancelledAt?`, `CancellationReason?` |
| **Review** | `reviews` | `Id`, `BookingId`, `AuthorCustomerId`, `TargetPhotographerId`, `Rating` (1-5), `Comment`, `CreatedAt` |
| **Conversation** | `conversations` | `Id`, `MatchId`, `CustomerId`, `PhotographerId`, `Status` (Active/Archived/Closed), `CreatedAt`, `LastMessageAt?` |
| **Message** | `messages` | `Id`, `ConversationId`, `SenderId`, `SenderRole` (customer/photographer), `Content`, `ContentType` (Text/Image), `SentAt`, `ReadAt?` |
| **SearchSession** | `search_sessions` | `Id`, `CustomerId`, `InputImageCount`, `Region?`, `Budget?`, `ReferenceImageUrlsJson?`, `StyleVectorJson?`, `Status` (Pending/Ready/Expired), `CreatedAt`, `ExpiresAt?` |
| **SwipeAction** | `swipe_actions` | `Id`, `CustomerId`, `SearchSessionId`, `PhotographerId`, `Direction` (Left/Right), `CreatedAt` |
| **AuthSession** | `auth_sessions` | `Id`, `CustomerId`, `RefreshToken`, `ExpiresAt`, `IsRevoked`, `UserAgent?`, `IpAddress?`, `CreatedAt`, `RevokedAt?` |
| **OtpRecord** | `otp_records` | `Id`, `Phone`, `Code`, `AttemptCount`, `IsUsed`, `ExpiresAt`, `CreatedAt`, `UsedAt?` |
| **PortfolioPhoto** | `portfolio_photos` | `Id`, `PhotographerId`, `ImageUrl`, `ThumbnailUrl`, `DisplayOrder`, `IsIndexed`, `CreatedAt` |
| **ServicePackage** | `service_packages` | `Id`, `PhotographerId`, `Title`, `Description`, `Price`, `DurationHours`, `IsActive`, `CreatedAt` |
| **PhotographerAvailability** | `photographer_availability` | `Id`, `PhotographerId`, `DayOfWeek?` (0-6), `SpecificDate?`, `StartTime`, `EndTime`, `SlotType` (Available/Blocked), `CreatedAt` |
| **VerificationRequest** | `verification_requests` | `Id`, `PhotographerId`, `DocumentType`, `DocumentImageUrl`, `SelfieUrl`, `Status` (Pending/Approved/Rejected), `ReviewedBy?`, `CreatedAt`, `ReviewedAt?` |

---

### `Aggregates/` — 4 Aggregate Roots

| Aggregate | State Machine | Domain Events raised | Invariants |
|---|---|---|---|
| **PhotographerAggregate** | — | `PhotographerVerified` | DisplayName required |
| **CustomerAggregate** | — | — | Không update nếu IsDeleted |
| **MatchAggregate** | `Pending → Active → BookingCreated → Closed` | `MatchCreated` (khi `Accept()`) | Chỉ `Active` mới `MarkBookingCreated()` |
| **BookingAggregate** | `Pending → Confirmed → Completed → Cancelled/Disputed` | `BookingConfirmed`, `BookingCompleted`, `BookingCancelled` | `EnsureCanBeReviewed()` chỉ khi `Completed` |

### `ValueObjects/` — 4 Value Objects

| Value Object | Fields | Logic |
|---|---|---|
| **StyleVector** | `float[] Values` | `CosineSimilarity(other)`, `MeanPool(list)`, `ToJson()`, `FromJson()` |
| **PriceRange** | `decimal Min`, `decimal Max` | Invariant `Min ≤ Max`, `Includes(budget)` |
| **ContactInfo** | `string Phone`, `string Email` | Normalize email, validate non-empty |
| **Location** | `RegionCode Region` | Enum: HN/HCM/DN/HP/CT/OTHER |

### `Events/` — 7 Domain Events (`DomainEvents.cs`)

| Event | Payload | Handler |
|---|---|---|
| `SwipeRightRecorded` | SwipeActionId, CustomerId, PhotographerId, SearchSessionId | `SwipeRightRecordedHandler` → mutual check → create Match |
| `MatchCreated` | MatchId, CustomerId, PhotographerId | ✅ `MatchCreatedHandler` → CREATE Conversation |
| `BookingConfirmed` | BookingId, CustomerId, PhotographerId, AgreedPrice, Commission | ⏳ hold escrow (chưa implement) |
| `BookingCompleted` | BookingId, CustomerId, PhotographerId | ⏳ release escrow (chưa implement) |
| `BookingCancelled` | BookingId, CancelledByCustomerId, Reason | ⏳ refund (chưa implement) |
| `PhotographerVerified` | PhotographerId, VerificationRequestId | ⏳ boost ranking (chưa implement) |
| `PremiumExpired` | PhotographerId, SubscriptionId | ⏳ flip IsPremium=false (chưa implement) |

---

## 🟡 ShootMatch.Application

### `Abstractions/` — 12 interfaces

| Interface | Methods chính |
|---|---|
| `IPhotographerRepository` | `GetAllAsync`, `GetByIdAsync`, `GetByPhoneAsync`, `UpsertAsync`, **`GetCustomerHomeFeedAsync`** |
| `ICustomerRepository` | `GetByIdAsync`, `GetByPhoneAsync`, `UpsertAsync` |
| `IMatchRepository` | `SaveAsync`, `GetByIdAsync`, `FindAsync`, `GetByCustomerIdAsync`, `GetByPhotographerIdAsync` |
| `IBookingRepository` | `SaveAsync`, `GetByIdAsync`, `GetByMatchIdAsync`, `GetByCustomerIdAsync`, `GetByPhotographerIdAsync` |
| `IReviewRepository` | `SaveAsync`, `GetByBookingIdAsync`, `GetByCustomerIdAsync`, `GetByPhotographerIdAsync` |
| `IConversationRepository` | `SaveConversationAsync`, `GetConversationByIdAsync`, `GetConversationByMatchIdAsync`, `GetConversationsByCustomerIdAsync`, `GetConversationsByPhotographerIdAsync`, `SaveMessageAsync`, `GetMessagesAsync`, `TouchLastMessageAtAsync` |
| `IVerificationRequestRepository` | `SaveAsync`, `GetByIdAsync`, `GetPendingByPhotographerIdAsync`, `GetAllPendingAsync` |
| `ISwipeActionRepository` | `SaveAsync`, `HasPhotographerSwipedRightAsync(photographerId, customerId)` |
| `IMatchResultStore` | `SaveAsync`, `GetAsync(searchId)` |
| `ISearchSessionRepository` | `SaveAsync` |
| `IAuthSessionRepository` | `SaveAsync`, `GetByRefreshTokenAsync`, `RevokeAsync` |
| `IAuthTokenService` | `GenerateAccessToken(userId, phone, role)`, `GenerateRefreshToken()` |
| `IOtpService` | `SendAsync(phone)`, `VerifyAsync(phone, code)` |
| `IEmbeddingEncoder` | `EncodeImageAsync(imageUrl)` → `float[]` |

### `Commands/` — 12 files

| File | Vai trò |
|---|---|
| `CreateMatchSearchCommand.cs` + Handler | Gọi `MatchingOrchestrator.SearchAsync()` |
| `RecordSwipeCommand.cs` + Handler | Lưu SwipeAction → nếu Right → gọi `SwipeRightRecordedHandler` |
| `SwipeRightRecordedHandler.cs` | `IDomainEventHandler<SwipeRightRecorded>`: mutual check → `MatchAggregate.Create().Accept()` → dispatch MatchCreated thủ công (in-memory path) |
| `MatchCreatedHandler.cs` | `IDomainEventHandler<MatchCreated>`: tạo Conversation idempotently |
| `SendMessageCommand.cs` + Handler | Validate Active+participant → persist Message → TouchLastMessageAt |
| `CreateBookingCommand.cs` + Handler | Load match → `MarkBookingCreated()` → `BookingAggregate.Create()` → persist |
| `SubmitReviewCommand.cs` + Handler | `EnsureCanBeReviewed()` → dedup → persist Review |

### `Queries/` — 2 files
`GetSwipeFeedQuery` + Handler → load `IMatchResultStore` → `[PhotographerMatchCard]`

### `Services/` — 4 files
`MatchingOrchestrator`, `AuthService` (customer), `PhotographerAuthService`, `CustomerService`

---

## 🔴 ShootMatch.Infrastructure

### `Auth/`
| File | Vai trò |
|---|---|
| `JwtTokenService.cs` | JWT với claims: `user_id`, `customer_id`/`photographer_id`, `ClaimTypes.Role` |
| `InMemoryOtpService.cs` | Stub: auto-verify bất kỳ 6-digit code |

### `Ai/`
| File | Vai trò |
|---|---|
| `StubSiglipEncoder.cs` | `float[768]` ngẫu nhiên deterministic theo URL hash |

### `Persistence/` — EF Core repositories (production path)

| File | Entity |
|---|---|
| `EfCustomerRepository.cs` | Customer |
| `EfPhotographerRepository.cs` | Photographer + **CustomerHomeFeed** |
| `EfMatchRepository.cs` | Match |
| `EfBookingRepository.cs` | Booking |
| `EfReviewRepository.cs` | Review |
| `EfConversationRepository.cs` | Conversation, Message |
| `EfAuthSessionRepository.cs` | AuthSession |
| `EfVerificationRequestRepository.cs` | VerificationRequest |

### `Persistence/` — In-memory (còn lại)

| File | Ghi chú |
|---|---|
| `InMemorySearchSessionRepository.cs` | Search session |
| `InMemorySwipeActionRepository.cs` | Swipe actions |
| `InMemoryMatchResultStore.cs` | Kết quả ranking feed |
| `InMemoryOtpService.cs` | OTP dev stub |

> Các `InMemory*Repository` cũ (Photographer, Match, …) vẫn trong repo nhưng **không đăng ký DI** — `DependencyInjection.cs` dùng EF.

### `Persistence/` — EF Core

| File | Vai trò |
|---|---|
| `ShootMatchDbContext.cs` | **16 DbSets** (14 cũ + Conversations + Messages), dispatch Domain Events sau SaveChangesAsync |
| `ShootMatchDbContextFactory.cs` | Design-time factory cho `dotnet ef migrations` |
| `DomainEventDispatcher.cs` | Resolve `IDomainEventHandler<T>` từ DI |

### `Persistence/Entities/` — 16 EF record classes (→ tables)

`PhotographerRecord`, `CustomerRecord`, `MatchRecord`, `BookingRecord`, `ReviewRecord`, `ConversationRecord`, `MessageRecord`, `SearchSessionRecord`, `SwipeActionRecord`, `AuthSessionRecord`, `OtpRecordEntry`, `PortfolioPhotoRecord`, `PortfolioEmbeddingRecord`, `ServicePackageRecord`, `PhotographerAvailabilityRecord`, `VerificationRequestRecord`

---

## 🟢 ShootMatch.Api

### `Hubs/` — 1 file

| File | Vai trò |
|---|---|
| `ChatHub.cs` | SignalR Hub: JWT auth, group per conversation, `JoinConversation`, `SendMessage`, `SendImageMessage`, `LeaveConversation`, participant enforcement, broadcast `ReceiveMessage` |

> **SignalR**: dùng built-in ASP.NET Core (không cần NuGet riêng từ .NET 3+). `AddSignalR()` từ `Microsoft.AspNetCore.Builder`.

### `Controllers/` — 9 controllers

| Controller | Route prefix | Auth | Endpoints |
|---|---|---|---|
| `AuthController` | `/api/auth` | Public | POST otp/send, otp/verify, refresh |
| `PhotographerAuthController` | `/api/photographer-auth` | Public | POST otp/send, otp/verify, refresh |
| `CustomersController` | `/api/customers` | `customer` | POST profile |
| `PhotographersController` | `/api/photographers` | `photographer` | GET me, PUT profile, **PUT personal-info**, POST avatar/cover upload, PATCH availability, POST verify |
| `PortfolioController` | `/api/photographers/portfolio` | `photographer` | GET, POST upload, DELETE |
| `MatchingController` | `/api/matching` | `customer` | POST searches |
| `SwipesController` | `/api/matching` | `customer` | POST swipes |
| `BookingsController` | `/api/bookings` | mixed | POST (customer), POST {id}/confirm, {id}/complete (photographer), {id}/cancel (both) |
| `ReviewsController` | `/api/reviews` | `customer` | POST |
| `AdminController` | `/api/admin` | `admin` | GET photographers, GET verification-requests, POST {id}/verify (audit trail), POST {id}/revoke-premium |

### `GraphQL/` — 19 queries (`MatchingQuery.cs`)

| Query | Auth | Returns |
|---|---|---|
| `swipeFeed(searchId)` | Any | `[PhotographerMatchCard]` |
| `me` | `customer` | `CustomerProfile?` |
| `photographer(id)` | Public | `Photographer?` |
| `photographers` | Public | `[Photographer]` |
| **`customerHomeFeed`** | Public | `CustomerHomeFeed` (featured + latestPhotos) |
| `photographerProfile` | `photographer` | `Photographer?` (+ nationalId, personalAddress, portfolioPhotos) |
| `myMatches` | `customer` | `[MatchAggregate]` |
| `match(id)` | Authenticated | `MatchAggregate?` |
| `myMatchesAsPhotographer` | `photographer` | `[MatchAggregate]` |
| `myBookings` | `customer` | `[BookingAggregate]` |
| `booking(id)` | Authenticated | `BookingAggregate?` |
| `myBookingsAsPhotographer` | `photographer` | `[BookingAggregate]` |
| `myReviews` | `customer` | `[Review]` |
| `myReviewsReceived` | `photographer` | `[Review]` |
| `photographerReviews(photographerId)` | Public | `[Review]` |
| `myConversations` | `customer` | `[Conversation]` — inbox sorted by LastMessageAt |
| `myConversationsAsPhotographer` | `photographer` | `[Conversation]` |
| `conversation(id)` | Authenticated | `Conversation?` |
| `conversationMessages(conversationId)` | Authenticated | `[Message]` — oldest first |

### `Program.cs`

| Concern | Config |
|---|---|
| Auth | JWT Bearer, `RoleClaimType = ClaimTypes.Role` |
| Auth WebSocket | JWT via `?access_token=` query string cho `/hubs/*` |
| Authorization | Named policies: `CustomerOnly`, `PhotographerOnly`, `AdminOnly`, `BookingParticipant` |
| Swagger | Swashbuckle 7.3.1, JWT Bearer, UI tại `/swagger` |
| GraphQL | HotChocolate 15.1.14 + Authorization, route `/graphql` |
| SignalR | Built-in ASP.NET Core, `AddSignalR()`, `/hubs/chat` → `ChatHub` |

---

## 🗄️ Database (PostgreSQL — Supabase)

### Migrations (7+)

| Migration | Nội dung |
|---|---|
| `InitialPublic` | Schema ban đầu |
| `SchemaExpansionV2` | Core entities |
| `AddAvailabilityAndOtp` | availability + otp |
| `AddConversationAndMessage` | chat tables |
| `AddPasswordHashAndGoogleId` | auth mở rộng |
| `AddPhotographerQuote` | Quote |
| `AddPhotographerPersonalInfo` | NationalId, PersonalAddress |
| `AddCustomerCoverPhoto` | Thêm cột ảnh bìa `CoverPhotoUrl` |
| `AddCustomerHighlightPhotos` | Thêm cột `HighlightPhoto2Url`, `HighlightPhoto3Url`, ngân sách và kích hoạt |
| `AddCustomerHighlightPhoto1` | Thêm cột `HighlightPhoto1Url` |
| `AddCustomerPreferredStyles` | Thêm cột `PreferredStyles` |

### Tables (16 tổng)

`photographers`, `customers`, `matches`, `bookings`, `reviews`, `conversations`, `messages`, `search_sessions`, `swipe_actions`, `auth_sessions`, `otp_records`, `portfolio_photos`, `portfolio_embeddings`, `service_packages`, `photographer_availability`, `verification_requests`

---

## 📦 NuGet Packages

### ShootMatch.Api
| Package | Version | Vai trò |
|---|---|---|
| `HotChocolate.AspNetCore` | 15.1.14 | GraphQL server |
| `HotChocolate.AspNetCore.Authorization` | 15.1.14 | GraphQL `[Authorize]` |
| `Microsoft.AspNetCore.Authentication.JwtBearer` | 9.0.10 | JWT middleware |
| `Swashbuckle.AspNetCore` | 7.3.1 | Swagger UI |
| `Microsoft.EntityFrameworkCore.Design` | 9.0.10 | EF migrations tooling |
| SignalR | Built-in ASP.NET Core | Real-time WebSocket hub |

### ShootMatch.Infrastructure
| Package | Version | Vai trò |
|---|---|---|
| `Microsoft.EntityFrameworkCore` | 9.0.10 | ORM |
| `Npgsql.EntityFrameworkCore.PostgreSQL` | 9.0.4 | PostgreSQL provider |
| `System.IdentityModel.Tokens.Jwt` | — | JWT generation |

### `Storage/`
| File | Vai trò |
|---|---|
| `SupabaseStorageService.cs` | Upload public URL (khi config Supabase) |
| `LocalDiskStorageService.cs` | Fallback lưu disk + serve static |

---

## 📱 ShootMatch.Mobile (`src/` — 64+ files)

### Navigation
| File | Vai trò |
|---|---|
| `AuthNavigator.tsx` | Splash → login/register/OTP |
| `RoleNavigator.tsx` | customer \| photographer |
| `CustomerTabs.tsx` | 5 tabs + stack (Profile, Checkout, Chat, …) |
| `PhotographerTabs.tsx` | 5 tabs + PersonalInfo, ServiceManagement, … |

### Customer feature
| Path | Ghi chú |
|---|---|
| `screens/HomeScreen.tsx` | Feed PicKic, GraphQL home feed |
| `screens/DiscoverScreen.tsx` | Swipe, ProgressBar đếm thẻ, verified badge, stamp LIKE/NOPE |
| `screens/ProfileScreen.tsx` | Hồ sơ cá nhân: Viewfinder cover hero, Polaroid Asymmetric Highlights, Filmstrip Roll Preview |
| `screens/EditProfileScreen.tsx` | Chỉnh sửa buồng tối Darkroom: Viewfinder header, 3-frame collage editor, minimal input, sequential upload roll preview, style description |
| `screens/CustomerFavoritesScreen.tsx` | Trang lưu các photographer/mood yêu thích |
| `screens/CustomerSharedMediaScreen.tsx` | Trang lưu ảnh cá nhân được share có sự đồng ý của khách hàng |
| `screens/PhotographerPortfolioScreen.tsx` | Xem ảnh Masonry 2 cột thác nước, slide viewer toàn màn hình + cuộn thumbnail chân trang |
| `shared/components/PortfolioImageCell.tsx` | Component hiển thị ảnh portfolio chống ô xám lỗi tải |
| `components/home/*` | Hero, FeaturedStrip, StoryViewer, Editorial, Discovery, QuickActions |
| `components/PortfolioMasonry.tsx` | Khoảnh Khắc — 2 cột masonry |
| `utils/homeMedia.ts` | buildFeaturedDisplay, buildMomentDisplay + local fallback |
| `utils/masonryLayout.ts` | buildTwoColumnMasonry |
| `api.ts` | gql + REST customer |

### Photographer feature
| Screen | Ghi chú |
|---|---|
| `PProfileScreen.tsx` | Hồ sơ + portfolio preview grid |
| `PersonalInfoScreen.tsx` | CCCD, địa chỉ, region |
| `UploadPortfolioScreen.tsx` | Masonry gallery + upload |
| `ServiceManagementScreen.tsx` | Gói dịch vụ |
| `DashboardScreen.tsx` | Mosaic portfolio preview |

### Shared
| File | Vai trò |
|---|---|
| `shared/assets/localPictures.ts` | 43 ảnh `picture/*.jpg` |
| `shared/utils/resolveImageSource.ts` | URI \| require() |
| `shared/api/client.ts` | Axios + JWT |
| `features/chat/ChatHub.ts` | SignalR client |

### Assets ngoài `src/`
- `ShootMatch.Mobile/picture/` — ảnh demo local
- `ShootMatch.Mobile/.env` — `EXPO_PUBLIC_API_URL`
- `ShootMatch.Mobile/scripts/run-expo.js` — ANDROID_HOME wrapper
