# SHOOTMATCH — Hướng dẫn Kỹ thuật cho Developer

## 1. Triết lý Kiến trúc (Clean Architecture & DDD)
Dự án áp dụng mô hình **Clean Architecture** chia làm 4 lớp để đảm bảo tính dễ bảo trì và mở rộng.

### 1.1. Domain Layer (`ShootMatch.Domain`)
Lớp trung tâm chứa logic nghiệp vụ thuần túy.
- **Aggregates:** Photographer, Match, Booking, Customer. Đóng gói logic và đảm bảo Invariants.
- **Value Objects:** Money, Location, DateRange.
- **Domain Events:** Trigger các hành động liên module (VD: `MatchEstablishedEvent` tạo Conversation).

### 1.2. Application Layer (`ShootMatch.Application`)
Chứa các Use Cases của hệ thống.
- **Services:** `AuthService`, `PhotographerAuthService`.
- **Abstractions:** Định nghĩa Interface cho Repositories và external services (IPasswordHasher, IGoogleAuthService).

### 1.3. Infrastructure Layer (`ShootMatch.Infrastructure`)
Triển khai kỹ thuật cho các abstraction.
- **Persistence:** Entity Framework Core (PostgreSQL).
- **Security:** Triển khai BCrypt, JWT.

### 1.4. API Layer (`ShootMatch.Api`)
- **Controllers**: REST command endpoints.
- **GraphQL**: Query dữ liệu (HotChocolate).
- **SignalR**: Real-time chat hubs.

## 2. Quy trình Persistence (EF Core)
Mọi Aggregate Root đều được ánh xạ xuống DB thông qua `ShootMatchDbContext`.
- Sử dụng `Reconstitute()` factory method để khôi phục trạng thái Aggregate mà không gây ra side-effects không mong muốn.
- Tự động dispatch Domain Events sau khi `SaveChangesAsync()`.

---
*Liên kết:*
- [[projects/SHOOTMATCH/manual/API_Architecture_and_Endpoints]]
- [[projects/SHOOTMATCH/manual/03_Authentication_System_Architecture]]
