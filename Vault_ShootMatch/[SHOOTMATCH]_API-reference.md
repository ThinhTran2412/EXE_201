# ShootMatch — API Reference (Đầy đủ)

> Cập nhật: **2026-05-15**  
> Base URL Dev: `EXPO_PUBLIC_API_URL` hoặc `http://<LAN-IP>:5062`  
> Auth: JWT Bearer — `Authorization: Bearer <token>`

### Bổ sung gần đây (xem chi tiết bên dưới trong doc)

| Loại | Tên | Mô tả |
|------|-----|--------|
| GraphQL | `customerHomeFeed` | Featured photographers + latest portfolio photos |
| REST | `GET /api/customers/me` | Lấy profile cá nhân của khách hàng |
| REST | `POST /api/customers/profile` | Tạo hoặc cập nhật thông tin cá nhân khách hàng (hỗ trợ merge/fallback thông minh) |
| REST | `POST /api/customers/profile/*/upload` | 6 endpoint upload ảnh chuyên biệt cho khách hàng (avatar, cover, highlight-1/2/3, roll-preview) |
| REST | `PUT /api/photographers/personal-info` | Cập nhật CCCD, địa chỉ, region, SĐT, email và tài liệu xác minh của nhiếp ảnh gia |
| REST | `PATCH /api/photographers/availability` | Cập nhật trạng thái rảnh/bận (availability) của nhiếp ảnh gia |
| REST | `POST /api/photographers/profile/avatar/upload` | Upload avatar cho nhiếp ảnh gia |
| REST | `POST /api/photographers/profile/cover/upload` | Upload cover cho nhiếp ảnh gia |
| REST | `GET/POST/DELETE /api/photographers/portfolio` | Quản lý ảnh portfolio của nhiếp ảnh gia |
| GraphQL | `photographerProfile` | Trả thêm `nationalId`, `personalAddress`, `quote`, `portfolioPhotos` |

---

## Tổng quan transport

| Layer | URL | Mục đích |
|---|---|---|
| REST | `/api/**` | Commands — write (POST / PUT / PATCH) |
| GraphQL | `/graphql` | Queries — read (GET data) |
| WebSocket | `/hubs/chat` | Real-time chat (SignalR) |
| Swagger | `/swagger` | Interactive docs (Dev only) |

---

## 🔐 Auth — Customer `/api/auth`

### POST `/api/auth/otp/send`
Gửi OTP SMS. Dev: code hiện trong **log API terminal**.

```json
// Request body
{ "phone": "+84900000000" }

// Response: 202 Accepted
{}
```

---

### POST `/api/auth/otp/verify`
Xác minh OTP → trả JWT. Tự tạo Customer record nếu lần đầu.

```json
// Request
{ "phone": "+84900000000", "otpCode": "123456" }

// Response 200
{
  "accessToken": "eyJ...",
  "refreshToken": "uuid-refresh-token",
  "expiresIn": 3600
}
```

**JWT Claims:** `customer_id` (Guid), `role: "customer"`

---

### POST `/api/auth/refresh`
```json
// Request
{ "refreshToken": "uuid-refresh-token" }

// Response 200: cùng format với verify
```

---

## 🔐 Auth — Photographer `/api/photographer-auth`

### POST `/api/photographer-auth/otp/send`
```json
{ "phone": "+84900000000" }
// Response: 202 Accepted
```

### POST `/api/photographer-auth/otp/verify`
Tự tạo Photographer record nếu lần đầu.
```json
// Request
{ "phone": "+84900000000", "otpCode": "123456" }

// Response 200
{ "accessToken": "eyJ...", "refreshToken": "uuid", "expiresIn": 3600 }
```

**JWT Claims:** `photographer_id` (Guid), `role: "photographer"`

### POST `/api/photographer-auth/refresh`
```json
{ "refreshToken": "uuid" }
// Response 200: cùng format
```

---

## 🔍 Matching

### POST `/api/matching/searches`  🔒 customer

AI search session — encode ảnh tham chiếu, xếp hạng photographers theo cosine similarity.

```json
// Request
{
  "referenceImageUrls": ["https://img1.jpg", "https://img2.jpg", "https://img3.jpg"],
  "region": "Hà Nội",
  "budget": 2000000,
  "topK": 20
}
// Validation: referenceImageUrls phải có 3–5 phần tử

// Response 201
{
  "searchId": "uuid-search-session",
  "candidateCount": 15,
  "region": "Hà Nội"
}
```

→ Dùng `searchId` để query GraphQL `swipeFeed(searchId)`.

---

### POST `/api/matching/swipes`  🔒 customer

Ghi nhận swipe Left hoặc Right trên một photographer.

```json
// Request
{
  "searchSessionId": "uuid-search-session",
  "photographerId": "uuid-photographer",
  "direction": "Right"
}
// direction: "Left" | "Right"

// Response: 202 Accepted
```

**Business logic:** Nếu cả 2 swipe Right → tự động tạo `Match` → tạo `Conversation`.

---

## 📅 Bookings `/api/bookings`  🔒 customer / photographer

### POST `/api/bookings`  🔒 customer

```json
// Request
{
  "matchId": "uuid-match",
  "scheduledAt": "2026-06-15T09:00:00Z",
  "agreedPrice": 2500000
}

// Response 201
{
  "id": "uuid-booking",
  "matchId": "uuid-match",
  "customerId": "uuid",
  "photographerId": "uuid",
  "status": "Pending",
  "scheduledAt": "2026-06-15T09:00:00Z",
  "agreedPrice": 2500000,
  "createdAt": "..."
}
```

### POST `/api/bookings/{id}/cancel`  🔒 customer | photographer

```json
{ "reason": "Khách hàng hủy" }
// Response: 204 No Content
```

### POST `/api/bookings/{id}/confirm`  🔒 photographer
`204 No Content`

### POST `/api/bookings/{id}/complete`  🔒 photographer
`204 No Content`

**Booking status flow:**
```
Pending ──► Confirmed ──► Completed
        │               │
        └───────────────┴──► Cancelled
```

---

## ⭐ Reviews `/api/reviews`

### POST `/api/reviews`  🔒 customer

Booking phải `Completed`. Không được review lại lần 2.

```json
// Request
{
  "bookingId": "uuid-booking",
  "rating": 5,
  "comment": "Rất chuyên nghiệp và đúng giờ!"
}
// Response: 201 Created
```

---

## 👤 Customers Self-manage `/api/customers`  🔒 customer

### GET `/api/customers/me`
Lấy chi tiết thông tin hồ sơ của khách hàng hiện tại (dựa trên token).

```json
// Response: 200 OK
{
  "id": "uuid-customer",
  "displayName": "Thịnh Trần",
  "phone": "+84900000000",
  "email": "customer@gmail.com",
  "region": "HCM",
  "avatarUrl": "https://...",
  "coverPhotoUrl": "https://...",
  "highlightPhoto1Url": "https://...",
  "highlightPhoto2Url": "https://...",
  "highlightPhoto3Url": "https://...",
  "rollPreviewPhotos": "url1.jpg,url2.jpg,url3.jpg",
  "preferredStyles": "Portrait, Film look",
  "isVerified": true,
  "createdAt": "2026-05-20T13:33:53Z"
}
```

---

### POST `/api/customers/profile`
Tạo mới hoặc cập nhật toàn bộ profile của khách hàng.
> [!IMPORTANT]
> **Quy tắc Merge/Fallback thông minh:** Khi gọi cập nhật, nếu các trường thông tin chữ (`DisplayName`, `Phone`, `Email`, `Region`, `AvatarUrl`, `CoverPhotoUrl`, `HighlightPhoto1Url`, `HighlightPhoto2Url`, `HighlightPhoto3Url`, `RollPreviewPhotos`, `PreferredStyles`) được gửi lên trống (null hoặc khoảng trắng), backend sẽ giữ nguyên (fallback) giá trị hiện tại có trong cơ sở dữ liệu thay vì ghi đè bằng giá trị trống.

```json
// Request Body (UpsertCustomerProfileRequest)
{
  "displayName": "Thịnh Trần",
  "phone": "+84900000000",
  "email": "customer@gmail.com",
  "region": "HCM",
  "avatarUrl": "https://...",
  "coverPhotoUrl": "https://...",
  "highlightPhoto1Url": "https://...",
  "highlightPhoto2Url": "https://...",
  "highlightPhoto3Url": "https://...",
  "rollPreviewPhotos": "url1.jpg,url2.jpg",
  "preferredStyles": "Portrait, Editorial"
}

// Response: 200 OK (CustomerProfile)
{
  "id": "uuid-customer",
  "displayName": "Thịnh Trần",
  "phone": "+84900000000",
  "email": "customer@gmail.com",
  "region": "HCM",
  "avatarUrl": "https://...",
  "coverPhotoUrl": "https://...",
  "highlightPhoto1Url": "https://...",
  "highlightPhoto2Url": "https://...",
  "highlightPhoto3Url": "https://...",
  "rollPreviewPhotos": "url1.jpg,url2.jpg",
  "preferredStyles": "Portrait, Editorial",
  "isVerified": true,
  "createdAt": "2026-05-20T13:33:53Z"
}
```

---

### POST `/api/customers/profile/*/upload`
Các endpoint tải lên hình ảnh dạng `multipart/form-data`.
- `/api/customers/profile/avatar/upload` (Upload avatar)
- `/api/customers/profile/cover/upload` (Upload ảnh bìa)
- `/api/customers/profile/highlight-1/upload` (Upload ảnh nổi bật 1)
- `/api/customers/profile/highlight-2/upload` (Upload ảnh nổi bật 2)
- `/api/customers/profile/highlight-3/upload` (Upload ảnh nổi bật 3)
- `/api/customers/profile/roll-preview/upload` (Upload ảnh cuộn phim nháp bản thảo)

> [!NOTE]
> **Quy định Validate:** Định dạng ảnh bắt buộc phải thuộc một trong các loại `image/jpeg`, `image/png`, `image/webp`, `image/heic`. Kích thước tệp lớn hơn 0.
> **Quy tắc Lưu Trữ:** File ảnh được lưu trữ tại `customers/{kind}/{customerId}/{uuid}{ext}` trên Supabase Storage hoặc đĩa cứng cục bộ.

```json
// Request: Form data
// File: image.jpg (nhập vào field 'File')

// Response: 200 OK
{
  "photoUrl": "https://supabase.co/storage/v1/object/public/shootmatch/customers/avatar/uuid/abc.jpg"
}

// Response: 400 Bad Request (Nếu sai định dạng ảnh hoặc tệp trống)
{
  "error": "Only JPEG, PNG, WebP or HEIC files are allowed."
}
```

---

## 📸 Photographers Self-manage `/api/photographers`  🔒 photographer

### GET `/api/photographers/me`
Lấy chi tiết hồ sơ nhiếp ảnh gia hiện tại.

---

### PUT `/api/photographers/profile`
Cập nhật thông tin profile cơ bản.

```json
// Request body (UpdatePhotographerProfileRequest)
{
  "displayName": "Nguyễn Minh Khoa",
  "bio": "10 năm kinh nghiệm chụp cưới và sự kiện",
  "quote": "Bắt trọn khoảnh khắc vàng",
  "avatarUrl": "https://...",
  "coverPhotoUrl": "https://...",
  "instagramUrl": "https://instagram.com/...",
  "minBudget": 1000000,
  "maxBudget": 5000000,
  "acceptsInstantBooking": true
}
// Response: 200 OK (Trả về Photographer entity đầy đủ đã cập nhật)
```

---

### PUT `/api/photographers/personal-info`
Cập nhật thông tin định danh và tài liệu xác minh danh tính.

```json
// Request body (UpdatePhotographerPersonalInfoRequest)
{
  "nationalId": "012345678901",
  "phone": "+84911111111",
  "email": "khoanm@gmail.com",
  "region": "HN",
  "personalAddress": "123 Đường Láng, Đống Đa, Hà Nội",
  "verificationDocumentFrontUrl": "https://...",
  "verificationDocumentBackUrl": "https://...",
  "verificationPortraitUrl": "https://..."
}
// Response: 200 OK (Trả về Photographer entity đầy đủ đã cập nhật)
```

---

### PATCH `/api/photographers/availability`
Cập nhật nhanh trạng thái rảnh/bận để cho phép/hoặc không cho phép khách hàng vuốt thấy trong Discover Feed.

```json
// Request body (SetAvailabilityRequest)
{ "isAvailable": true }

// Response: 200 OK (Trả về Photographer entity đầy đủ)
```

---

### POST `/api/photographers/verify`
Gửi yêu cầu xác minh hồ sơ lên Admin.
> [!NOTE]
> **Business Logic:** Trạng thái xác minh (`VerificationStatus`) chuyển thành `"Pending"`. Logic API bảo toàn các thông tin cá nhân và tài liệu xác minh đã có trước đó của photographer thay vì xóa trống. Admin sẽ phê duyệt yêu cầu này thông qua endpoint của Admin.

```json
// Response: 202 Accepted
```

---

## 🛡️ Admin `/api/admin`  🔒 admin

| Method | Endpoint | Status codes | Mô tả |
|---|---|---|---|
| GET | `/api/admin/photographers` | 200 | Tất cả photographers (kể cả unverified) |
| GET | `/api/admin/verification-requests` | 200 | Pending verifications |
| POST | `/api/admin/photographers/{id}/verify` | 204 / 404 / 400 | Duyệt xác minh |
| POST | `/api/admin/photographers/{id}/revoke-premium` | 204 / 404 | Thu hồi Premium |

**`verify` side effects:**
1. `VerificationRequest.Status` → `"Approved"`, lưu `ReviewedBy` + `ReviewedAt` (audit trail)
2. `Photographer.VerificationStatus` → `"Verified"`

---

## 📊 GraphQL — Read Operations

**Endpoint:** `POST /graphql`  
**Content-Type:** `application/json`  
**Auth header:** `Authorization: Bearer <token>` (bắt buộc cho query có 🔒)

```json
// Generic request format
{
  "query": "query OperationName($var: Type!) { field(arg: $var) { ... } }",
  "variables": { "var": "value" }
}
```

---

### Public (không cần auth)

```graphql
# Profile công khai của một photographer
query GetPhotographer($id: UUID!) {
  photographer(id: $id) {
    id displayName bio avatarUrl coverPhotoUrl
    region minBudget maxBudget rating
    isAvailable isPremium verificationStatus instagramUrl
    acceptsInstantBooking createdAt
  }
}

# Tất cả photographers (cho trang browse)
query {
  photographers {
    id displayName region rating isAvailable
    minBudget maxBudget avatarUrl verificationStatus
  }
}

# Đánh giá của photographer
query GetReviews($id: UUID!) {
  photographerReviews(photographerId: $id) {
    id rating comment createdAt
  }
}
```

---

### Customer Queries  🔒 role: `customer`

```graphql
# Profile bản thân
query { me { id phone displayName avatarUrl createdAt } }

# Swipe feed — gọi sau POST /api/matching/searches
query GetFeed($searchId: UUID!) {
  swipeFeed(searchId: $searchId) {
    photographerId displayName region
    avatarUrl rating minBudget maxBudget
    verificationStatus similarityScore
  }
}

# Tất cả matches
query {
  myMatches {
    id customerId photographerId status conversationId createdAt
  }
}

# Chi tiết match
query GetMatch($id: UUID!) {
  match(id: $id) {
    id customerId photographerId status createdAt
  }
}

# Tất cả bookings
query {
  myBookings {
    id matchId status scheduledAt agreedPrice cancellationReason createdAt
  }
}

# Chi tiết booking
query GetBooking($id: UUID!) {
  booking(id: $id) {
    id matchId status scheduledAt agreedPrice cancellationReason createdAt
  }
}

# Đánh giá đã gửi
query { myReviews { id bookingId rating comment createdAt } }

# Hộp thư chat
query {
  myConversations {
    id matchId photographerId status lastMessageAt
  }
}

# Chi tiết conversation
query GetConversation($id: UUID!) {
  conversation(id: $id) {
    id matchId photographerId status lastMessageAt
  }
}

# Tin nhắn trong conversation
query GetMessages($id: UUID!) {
  conversationMessages(conversationId: $id) {
    id senderId senderRole content contentType sentAt readAt
  }
}
```

---

### Photographer Queries  🔒 role: `photographer`

```graphql
# Profile bản thân (photographer)
query {
  photographerProfile {
    id displayName bio region rating isAvailable
    isPremium verificationStatus minBudget maxBudget
    instagramUrl acceptsInstantBooking
  }
}

# Matches của photographer
query { myMatchesAsPhotographer { id customerId status createdAt } }

# Bookings của photographer
query {
  myBookingsAsPhotographer {
    id matchId status scheduledAt agreedPrice createdAt
  }
}

# Đánh giá nhận được
query { myReviewsReceived { id bookingId rating comment createdAt } }

# Conversations của photographer
query {
  myConversationsAsPhotographer {
    id matchId customerId status lastMessageAt
  }
}
```

---

## 💬 SignalR — Real-time Chat

**WebSocket URL:** `ws://192.168.1.7:5062/hubs/chat?access_token=<JWT>`

> ⚠️ JWT phải gửi qua **query string** — không gửi được qua header vì WebSocket không hỗ trợ.

### Client → Server (invoke)

| Method | Parameters | Mô tả |
|---|---|---|
| `JoinConversation` | `conversationId: string` | Tham gia phòng chat |
| `LeaveConversation` | `conversationId: string` | Rời phòng chat |
| `SendMessage` | `conversationId: string, content: string` | Gửi tin nhắn |

### Server → Client (on)

| Event | Payload | Mô tả |
|---|---|---|
| `ReceiveMessage` | `{ id, senderId, senderRole, content, sentAt }` | Nhận tin nhắn mới real-time |

### TypeScript usage (ChatHub.ts)

```typescript
import { HubConnectionBuilder } from "@microsoft/signalr";

const connection = new HubConnectionBuilder()
  .withUrl(`${SIGNALR_URL}?access_token=${jwt}`)
  .withAutomaticReconnect([0, 2000, 5000, 10000])
  .build();

connection.on("ReceiveMessage", (msg) => {
  // msg: { id, senderId, senderRole, content, contentType, sentAt }
});

await connection.start();
await connection.invoke("JoinConversation", conversationId);
await connection.invoke("SendMessage", conversationId, "Hello!");
await connection.invoke("LeaveConversation", conversationId);
await connection.stop();
```

---

## 📦 Data Models (TypeScript)

```typescript
interface CustomerProfile {
  id: string;
  displayName: string;
  phone: string;
  email: string;
  region: string;
  avatarUrl: string;
  coverPhotoUrl: string;
  highlightPhoto1Url: string;
  highlightPhoto2Url: string;
  highlightPhoto3Url: string;
  rollPreviewPhotos: string;         // Comma-separated list of photo URLs
  preferredStyles: string;
  isVerified: boolean;
  createdAt: string;                 // ISO 8601
}

interface Photographer {
  id: string;
  phone: string;
  displayName: string;
  bio?: string;
  avatarUrl?: string;
  coverPhotoUrl?: string;
  instagramUrl?: string;
  region?: string;
  minBudget?: number;
  maxBudget?: number;
  rating: number;                     // 0.0–5.0
  isAvailable: boolean;
  isPremium: boolean;
  verificationStatus: "None" | "Pending" | "Verified";
  acceptsInstantBooking: boolean;
  createdAt: string;                  // ISO 8601
  updatedAt: string;
}

interface Booking {
  id: string;
  matchId: string;
  customerId: string;
  photographerId: string;
  status: "Pending" | "Confirmed" | "Completed" | "Cancelled" | "Disputed";
  scheduledAt: string;
  agreedPrice?: number;
  cancellationReason?: string;
  createdAt: string;
}

interface MatchAggregate {
  id: string;
  customerId: string;
  photographerId: string;
  status: "Active" | "Closed";
  conversationId?: string;
  createdAt: string;
}

interface Conversation {
  id: string;
  matchId: string;
  customerId: string;
  photographerId: string;
  status: "Active" | "Closed";
  lastMessageAt?: string;
}

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderRole: "customer" | "photographer";
  content: string;
  contentType: "Text" | "Image";
  sentAt: string;
  readAt?: string;
}

interface Review {
  id: string;
  bookingId: string;
  customerId: string;
  photographerId: string;
  rating: number;                     // 1–5
  comment: string;
  createdAt: string;
}

interface PhotographerMatchCard {    // swipeFeed response
  photographerId: string;
  displayName: string;
  region?: string;
  avatarUrl?: string;
  rating: number;
  minBudget?: number;
  maxBudget?: number;
  verificationStatus: string;
  similarityScore: number;           // AI cosine similarity (0–1)
}

interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;                  // seconds (3600)
}
```

---

## 🔧 Config Development

| Key | Value |
|---|---|
| API Base URL | `http://192.168.1.7:5062` |
| SignalR Hub | `http://192.168.1.7:5062/hubs/chat` |
| Expo Metro | `http://192.168.1.7:8081` |
| Swagger UI | `http://192.168.1.7:5062/swagger` |
| OTP Service | `InMemoryOtpService` → code in log |
| Database | PostgreSQL (appsettings.json) |
| CORS | AllowAnyOrigin (dev mode) |
| API binding | `0.0.0.0:5062` (LAN accessible) |

**Mobile `.env`:**
```
EXPO_PUBLIC_API_URL=http://192.168.1.7:5062
EXPO_PUBLIC_SIGNALR_URL=http://192.168.1.7:5062/hubs/chat
```

**`launchSettings.json`:**
```json
{ "applicationUrl": "http://0.0.0.0:5062" }
```

**`Program.cs` key middleware order:**
```
UseCors("MobileDevPolicy")        ← trước Auth
UseAuthentication()
UseAuthorization()
MapControllers()
MapGraphQL("/graphql")
MapHub<ChatHub>("/hubs/chat")
```

---

## ⚠️ Known Limitations

| Vấn đề | Dev workaround | Production fix |
|---|---|---|
| OTP thật | In-memory, code in log | Twilio / Stringee SDK |
| Image upload | URL string thủ công | S3 / Cloudflare R2 + `expo-image-picker` |
| AI Embedding | Random vector nếu thiếu key | `OpenAI:ApiKey` trong appsettings |
| Push notification | Chưa có | Expo Notifications + FCM/APNs |
| Refresh token storage | AsyncStorage (plain) | SecureStore (expo-secure-store) |
