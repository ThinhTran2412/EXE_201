# SHOOTMATCH — Clean Architecture Blueprint

## 1) Layer structure
```text
ShootMatch/
├── ShootMatch.Domain
│   ├── Entities (Photographer)
│   └── Services (VectorMath: mean pool + cosine)
├── ShootMatch.Application
│   ├── Abstractions (IEmbeddingEncoder, IPhotographerRepository, IMatchResultStore)
│   ├── Contracts (MatchSearchRequest/Result, MatchCard)
│   └── Services (MatchingOrchestrator)
├── ShootMatch.Infrastructure
│   ├── Ai (StubSiglipEncoder -> thay bằng FastAPI SigLIP)
│   └── Persistence (EF PostgreSQL + một số InMemory: search/swipe/OTP)
└── ShootMatch.Api
    ├── Controllers (REST POST commands)
    └── GraphQL (GET queries for swipe feed)
```

## 2) API contract rule (hard requirement)
- **POST/PUT/PATCH/DELETE**: REST endpoint (command/write side).
- **GET/read**: GraphQL query (read side).

Current implementation:
- REST: `POST /api/matching/searches`
- REST: `POST /api/auth/otp/send`, `POST /api/auth/otp/verify`, `POST /api/auth/refresh`
- REST: `POST /api/customers/profile`
- GraphQL: `swipeFeed(searchId: UUID!): [PhotographerMatchCard!]!`

## 2b) API Documentation
- **Swagger UI**: `http://localhost:5062/swagger` (Development only).
- Package: `Swashbuckle.AspNetCore 7.3.1`.
- JWT Bearer: nhập token qua nút **Authorize** trên Swagger UI.

## 2c) Role System
| Role | JWT claim | Issued bởi |
|---|---|---|
| `customer` | `ClaimTypes.Role = "customer"`, `customer_id` | `POST /api/auth/otp/verify` |
| `photographer` | `ClaimTypes.Role = "photographer"`, `photographer_id` | `POST /api/photographer-auth/otp/verify` |
| `admin` | `ClaimTypes.Role = "admin"`, `user_id` | Manually issue (chưa có UI) |

## 2d) Full REST API (2026-05-20)

### Customer endpoints
| Method | Path | Auth |
|---|---|---|
| POST | `/api/auth/otp/send` | Public |
| POST | `/api/auth/otp/verify` | Public → returns `customer` token |
| POST | `/api/auth/refresh` | Public |
| GET | `/api/customers/me` | customer |
| POST | `/api/customers/profile` | customer |
| POST | `/api/customers/profile/avatar/upload` | customer |
| POST | `/api/customers/profile/cover/upload` | customer |
| POST | `/api/customers/profile/highlight-1/upload` | customer |
| POST | `/api/customers/profile/highlight-2/upload` | customer |
| POST | `/api/customers/profile/highlight-3/upload` | customer |
| POST | `/api/customers/profile/roll-preview/upload` | customer |
| POST | `/api/matching/searches` | customer |
| POST | `/api/matching/swipes` | customer |
| POST | `/api/bookings` | customer |
| POST | `/api/bookings/{id}/cancel` | customer ∣ photographer |
| POST | `/api/reviews` | customer |

### Photographer endpoints
| Method | Path | Auth |
|---|---|---|
| POST | `/api/photographer-auth/otp/send` | Public |
| POST | `/api/photographer-auth/otp/verify` | Public → returns `photographer` token |
| POST | `/api/photographer-auth/refresh` | Public |
| GET | `/api/photographers/me` | photographer |
| PUT | `/api/photographers/profile` | photographer |
| PUT | `/api/photographers/personal-info` | photographer |
| PATCH | `/api/photographers/availability` | photographer |
| POST | `/api/photographers/verify` | photographer |
| POST | `/api/bookings/{id}/confirm` | photographer |
| POST | `/api/bookings/{id}/complete` | photographer |

### Admin endpoints
| Method | Path | Auth |
|---|---|---|
| GET | `/api/admin/photographers` | admin |
| POST | `/api/admin/photographers/{id}/verify` | admin |
| POST | `/api/admin/photographers/{id}/revoke-premium` | admin |

## 2e) Full GraphQL API (2026-04-24)
| Query | Auth | Description |
|---|---|---|
| `swipeFeed(searchId)` | Any | Swipe feed cho search session |
| `me` | customer | Customer tự xem profile |
| `photographer(id)` | Public | Xem profile photographer |
| `photographers` | Public | Danh sách tất cả photographers |
| `photographerProfile` | photographer | Photographer tự xem profile |
| `myMatches` | customer | Matches của customer |
| `match(id)` | Any auth | Chi tiết match |
| `myMatchesAsPhotographer` | photographer | Matches của photographer |
| `myBookings` | customer | Bookings của customer |
| `booking(id)` | Any auth | Chi tiết booking |
| `myBookingsAsPhotographer` | photographer | Bookings của photographer |
| `myReviews` | customer | Reviews đã viết |
| `myReviewsReceived` | photographer | Reviews nhận được |
| `photographerReviews(photographerId)` | Public | Tất cả reviews của photographer |

## 3) Matching flow (online)
1. Client gửi 3-5 ảnh reference qua REST POST.
2. Application gọi `IEmbeddingEncoder` để tạo vector từng ảnh.
3. `VectorMath.MeanPool` tạo user-style vector.
4. So khớp cosine với toàn bộ portfolio embeddings.
5. Hard filter: availability, region, budget.
6. Soft rerank: premium boost + rating boost.
7. Lưu result vào `IMatchResultStore` với `searchId`.
8. Client đọc swipe feed qua GraphQL bằng `searchId`.

## 4) Offline indexing flow (production target)
1. Photographer upload portfolio.
2. Đẩy job vào Redis queue / pgqueuer.
3. Worker gọi SigLIP encode async.
4. Lưu vectors vào PostgreSQL + pgvector.
5. Cập nhật trạng thái index hoàn tất.

## 5) Production roadmap
### Phase A — Replace stubs
- Thay `StubSiglipEncoder` bằng adapter gọi FastAPI inference.
- Chuẩn hóa timeout, retry, circuit-breaker.

### Phase B — Persistent vector search
- Dùng PostgreSQL + pgvector table cho embeddings.
- Query top-K bằng cosine distance tại DB level.

### Phase C — Ranking intelligence
- Group score theo photographer từ nhiều ảnh portfolio.
- A/B test weights: similarity vs rating vs premium.
- Thu thập swipe feedback làm implicit signals.

## 6) SmartService-aligned conventions used
- DI Extension Pattern cho từng layer.
- Orchestrator service ở Application.
- CQRS-lite: Command handler cho REST write, Query handler cho GraphQL read.
- Domain thuần logic toán/vector, không phụ thuộc infra.
- Adapter hóa AI encoder và data stores để dễ thay thế.

## 7) Migration status
- Toàn bộ các migration cơ sở từ `InitPostgres` đến `AddPhotographerPersonalInfo` đã đồng bộ hoàn chỉnh trên cơ sở dữ liệu PostgreSQL.
- Bổ sung **4 migration liên tiếp mở rộng trường thông tin cá nhân hóa của Khách hàng (Customer)**:
  1. `20260518093044_AddCustomerCoverPhoto.cs` (Cột `CoverPhotoUrl`).
  2. `20260518165816_AddCustomerHighlightPhotos.cs` (Cột `HighlightPhoto2Url`, `HighlightPhoto3Url`, `PreferredBudgetMin`, `PreferredBudgetMax`, `IsVerified`, `IsActive`, `PasswordHash`, `GoogleId`).
  3. `20260519190108_AddCustomerHighlightPhoto1.cs` (Cột `HighlightPhoto1Url`).
  4. `20260519195021_AddCustomerPreferredStyles.cs` (Cột `PreferredStyles`).
- Tích hợp công cụ vá nóng database cục bộ tại `scripts/` (`add_roll_preview_column.py`, `apply_highlight_columns.py`) dùng Python `psycopg2` để tự động đọc cấu hình connection string và cập nhật schema cơ sở dữ liệu trực tiếp trong môi trường phát triển nhanh.

---

## 8) Upload ảnh đa nhiệm & Design System
### Cơ chế Upload ảnh tuần tự (Sequential Multi-Image Upload)
- Trên mobile client (`EditProfileScreen.tsx`), 3 khung ảnh featured (collage) và các ảnh cuộn phim nháp bản thảo (roll preview, từ 4-8 ảnh) được xử lý tải lên tuần tự (sequential) thay vì đồng thời (parallel) nhằm kiểm soát băng thông thiết bị di động tốt hơn, theo dõi trạng thái tải lên thời gian thực của từng tệp và tránh ghi đè lỗi/xung đột dữ liệu.
- Trước khi tải lên, hình ảnh được nén dung lượng và định cỡ (resize) thông qua `expo-image-manipulator` nhằm tối ưu hóa dung lượng truyền tải.
- Mỗi ảnh được gửi tới các endpoint upload chuyên biệt (`POST /api/customers/profile/*/upload`) dưới dạng `multipart/form-data`.
- Backend nhận file, validate định dạng nghiêm ngặt (JPEG, PNG, WebP, HEIC), kết xuất tên file an toàn theo định dạng `customers/{kind}/{customerId}/{guid}{ext}` lưu trữ lên Supabase Storage/LocalDisk và trả về Public URL của ảnh.

### Hệ thống thiết kế Buồng tối & Khung ngắm (Darkroom Viewfinder Design System)
- **Viewfinder Header/Frame:** Sử dụng concept kỹ thuật buồng tối nghệ thuật. Phần header của profile mô phỏng thanh thông số máy ảnh chuyên nghiệp (RAW, ISO 100, F/2.8, [•] REC) kết hợp với các đường cắt góc (Viewfinder corner lines) tạo cảm giác như đang chụp ảnh trực tiếp.
- **Rotating Polaroid Collage:** Thiết kế collage 3 ảnh bất đối xứng xoay các góc ngẫu nhiên (`-6°`, `2°`, `6°`) sử dụng CSS Transform `rotate` trong React Native, đem lại hiệu ứng chiều sâu 3D và hơi hướng biên tập nghệ thuật (Editorial Layout).
- **Filmstrip Roll Preview:** Danh sách ảnh nháp bản thảo được đặt bên trong khung mô phỏng cuộn phim nhựa (Film strip) màu đen mờ nhám, hỗ trợ cuộn ngang mượt mà.
- **Pill & Description Gu Ảnh:** Các tag gu ảnh dạng hạt viên nhộng phát sáng nhẹ khi kích hoạt, đi kèm một thẻ card chú giải chi tiết nghệ thuật mô tả trực quan phong cách ảnh chụp (chẳng hạn như Film look, Portrait, Golden hour...) khi bấm vào.
