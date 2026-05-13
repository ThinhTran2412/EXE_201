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
│   └── Persistence (InMemory repositories -> thay bằng Postgres/pgvector)
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

## 2d) Full REST API (2026-04-24)

### Customer endpoints
| Method | Path | Auth |
|---|---|---|
| POST | `/api/auth/otp/send` | Public |
| POST | `/api/auth/otp/verify` | Public → returns `customer` token |
| POST | `/api/auth/refresh` | Public |
| POST | `/api/customers/profile` | customer |
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
- Migration `InitPostgres` đã generate thành công trong `ShootMatch.Infrastructure/Persistence/Migrations`.
- `database update` lên Supabase hiện chưa thành công do lỗi resolve host (DNS/network), cần xác nhận lại endpoint kết nối.
