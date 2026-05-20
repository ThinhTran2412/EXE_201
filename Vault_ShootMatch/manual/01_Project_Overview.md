# ShootMatch — Tổng quan dự án

> Cập nhật: **2026-05-15**

## Giới thiệu

**ShootMatch** là nền tảng kết nối **Khách hàng** và **Nhiếp ảnh gia**: khám phá theo phong cách ảnh, swipe/match, đặt lịch, chat realtime, đánh giá sau buổi chụp.

## Vai trò người dùng

| Vai trò | Ứng dụng | Chức năng chính |
|---------|----------|-----------------|
| Khách hàng | Mobile (tab Customer) | Home feed, Discover, match, booking, chat, review |
| Nhiếp ảnh gia | Mobile (tab Photographer) | Dashboard, portfolio, dịch vụ/giá, lịch, xác minh |
| Admin | API (chưa có app) | Duyệt verification, premium |

## Kiến trúc solution

```
ShootMatch.Domain          → Entities, Aggregates, ValueObjects, Domain events
ShootMatch.Application     → Services, Commands/Queries, Abstractions
ShootMatch.Infrastructure  → EF Core, Auth, Storage, AI stub
ShootMatch.Api             → REST + GraphQL + SignalR + Swagger
ShootMatch.Mobile          → Expo React Native (2 role)
Vault_ShootMatch/          → Tài liệu dự án (repo)
```

## Tính năng đã có (mức MVP+)

- Đăng nhập: OTP, email/password, Google.
- Matching: tạo search session, swipe, mutual match → conversation.
- Booking lifecycle: tạo → confirm → complete / cancel.
- Chat SignalR.
- Hồ sơ photographer: quote, bio, portfolio upload, thông tin cá nhân, availability.
- Customer home feed (GraphQL).
- Storage ảnh Supabase hoặc local disk.

## Chạy nhanh

**API**
```bash
dotnet run --project ShootMatch.Api/ShootMatch.Api.csproj
```

**Mobile**
```bash
cd ShootMatch.Mobile && npm install && npm start
```

## Tài liệu

- Mục lục Vault: [../INDEX.md](../INDEX.md)
- Dev: [02_Developer_Technical_Guide.md](./02_Developer_Technical_Guide.md)
- Mobile: [04_Mobile_App_Architecture.md](./04_Mobile_App_Architecture.md)
- API: [../[SHOOTMATCH]_API-reference.md](../[SHOOTMATCH]_API-reference.md)

## Trạng thái

Đang phát triển tích cực — backend PostgreSQL + mobile UI PicKic. AI matching vector và thanh toán chưa production.
