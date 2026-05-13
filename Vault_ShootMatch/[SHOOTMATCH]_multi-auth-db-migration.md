---
status: complete
tags:
  - shootmatch
  - auth
  - database
  - ef-core
  - migration
---
# SHOOTMATCH — Multi-Auth & Database Migration

> **Status**: ✅ Complete  
> **Date**: 2026-05-04  
> **Session**: Multi-Auth ShootMatch System

---

## Mục tiêu

Migrate toàn bộ data access layer từ **InMemory → PostgreSQL/EF Core** và triển khai **3 phương thức xác thực**: Email/Password, Google OAuth, Phone OTP.

---

## API Endpoints

### Customer Auth — `/api/auth`

| Method | Endpoint | Body | Response |
|--------|----------|------|----------|
| POST | `/register` | `{ email, password, displayName }` | `AuthTokens` (201) |
| POST | `/login` | `{ email, password }` | `AuthTokens` |
| POST | `/google` | `{ idToken }` | `AuthTokens` |
| POST | `/otp/send` | `{ phone }` | 202 |
| POST | `/otp/verify` | `{ phone, otpCode }` | `AuthTokens` |
| POST | `/refresh` | `{ refreshToken }` | `AuthTokens` |

### Photographer Auth — `/api/photographer-auth`

| Method | Endpoint | Body | Response |
|--------|----------|------|----------|
| POST | `/register` | `{ email, password, displayName }` | `AuthTokens` (201) |
| POST | `/login` | `{ email, password }` | `AuthTokens` |
| POST | `/google` | `{ idToken }` | `AuthTokens` |
| POST | `/otp/send` | `{ phone }` | 202 |
| POST | `/otp/verify` | `{ phone, otpCode }` | `AuthTokens` |
| POST | `/refresh` | `{ refreshToken }` | `AuthTokens` |

### AuthTokens Response Shape

```json
{
  "accessToken": "eyJ...",
  "refreshToken": "base64-random-string",
  "refreshTokenExpiresAt": "2026-05-18T13:00:00Z"
}
```

---

## EF Core Repositories

Tất cả repositories được migrate từ `InMemory` → `EF Core` (`Scoped`):

| EF Class | Interface | Table |
|----------|-----------|-------|
| `EfCustomerRepository` | `ICustomerRepository` | `customers` |
| `EfPhotographerRepository` | `IPhotographerRepository` | `photographers` |
| `EfAuthSessionRepository` | `IAuthSessionRepository` | `auth_sessions` |
| `EfMatchRepository` | `IMatchRepository` | `matches` |
| `EfBookingRepository` | `IBookingRepository` | `bookings` |
| `EfReviewRepository` | `IReviewRepository` | `reviews` |
| `EfConversationRepository` | `IConversationRepository` | `conversations` + `messages` |
| `EfVerificationRequestRepository` | `IVerificationRequestRepository` | `verification_requests` |

**Còn InMemory** (chưa có EF model):
- `InMemoryMatchResultStore`
- `InMemorySearchSessionRepository`
- `InMemorySwipeActionRepository`
- `InMemoryOtpService` (chờ Stringee)

---

## Database Migration

```
Migration name: AddPasswordHashAndGoogleId
Applied: 2026-05-04 ✅
```

### Schema Changes

**Table `customers`**
```sql
ALTER TABLE customers ADD COLUMN password_hash VARCHAR(100);
ALTER TABLE customers ADD COLUMN google_id VARCHAR(128);
CREATE INDEX IX_customers_email ON customers (email);
CREATE INDEX IX_customers_google_id ON customers (google_id);
CREATE INDEX IX_customers_phone ON customers (phone);
```

**Table `photographers`**
```sql
ALTER TABLE photographers ADD COLUMN password_hash VARCHAR(100);
ALTER TABLE photographers ADD COLUMN google_id VARCHAR(128);
CREATE INDEX IX_photographers_email ON photographers (email);
CREATE INDEX IX_photographers_google_id ON photographers (google_id);
```

---

## Domain Changes

```csharp
// Customer.cs / Photographer.cs
public string? PasswordHash { get; set; }
public string? GoogleId { get; set; }

// MatchAggregate.cs
public static MatchAggregate Reconstitute(Guid id, ...) => new() { ... };

// BookingAggregate.cs
public static BookingAggregate Reconstitute(Guid id, ...) => new() { ... };
```

---

## Auth Flow Logic

### Email/Password
```
Register:  validate email unique → BCrypt.Hash(password) → UpsertCustomer → issue JWT
Login:     load by email → BCrypt.Verify(password, hash) → issue JWT
```

### Google OAuth
```
Google:    VerifyIdToken(idToken) → GetByGoogleId OR GetByEmail → link GoogleId → issue JWT
           (dev mode: token structure validation only, no ClientId check)
```

### Phone OTP
```
Send:      InMemoryOtpService.Send(phone) → saves 6-digit code (5min TTL)
Verify:    OtpService.Verify(phone, code) → GetByPhone OR create new → issue JWT
```

---

## Mobile Navigation Flow

```
RoleSelect
    → AuthMethod (chọn phương thức)
          → EmailLogin   (email + password)
          → Register     (tên + email + password)
          → PhoneLogin → OtpVerify
```

### New Files
- `AuthMethodScreen.tsx` — màn hình chọn phương thức
- `EmailLoginScreen.tsx` — đăng nhập email
- `RegisterScreen.tsx` — đăng ký mới (validation password match)
- `PhoneLoginScreen.tsx` — OTP phone flow

---

## Configuration

**appsettings.json** (cần thêm client ID thật cho production):
```json
{
  "Google": {
    "ClientId": "PLACEHOLDER.apps.googleusercontent.com"
  }
}
```

**Google dev mode**: Khi `ClientId` là PLACEHOLDER, `GoogleAuthService` chỉ verify cấu trúc token (structural validation), không check audience. Thay bằng client ID thật để production.

---

## Known Limitations

1. **Stringee**: `InMemoryOtpService` chỉ lưu OTP trong memory → mất sau restart. Thay bằng `StringeeOtpService` khi tích hợp.
2. **Refresh token cho Photographer**: Dùng `auth_sessions.customer_id` field cho cả customer lẫn photographer ID (design decision).
3. **Google mobile flow**: Chưa tích hợp `expo-auth-session` — Google login từ mobile cần backend nhận idToken từ client.

---

## Related Notes

- [[SHOOTMATCH]_architecture]
- [[SHOOTMATCH]_implementation-log]
- [[SHOOTMATCH]_codebase-map]
