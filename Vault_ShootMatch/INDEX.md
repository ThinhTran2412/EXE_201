# Vault ShootMatch — Mục lục tổng

> **Cập nhật:** 2026-05-20  
> Vault nằm trong repo: `F:\EXE101\ShootMatch\Vault_ShootMatch\`  
> **Không** dùng Obsidian MCP — chỉ chỉnh sửa file trong thư mục này.

---

## Cấp 1 — Ghi chú gốc (root)

| File | Mục đích |
|------|----------|
| [INDEX.md](./INDEX.md) | Mục lục này |
| [[SHOOTMATCH]_context.md] | Stack, quyết định, trạng thái triển khai |
| [[SHOOTMATCH]_architecture.md] | Clean Architecture, REST/GraphQL, roles |
| [[SHOOTMATCH]_codebase-map.md] | Bản đồ file, entity, mobile tree |
| [[SHOOTMATCH]_API-reference.md] | REST + GraphQL + SignalR chi tiết |
| [[SHOOTMATCH]_implementation-log.md] | Nhật ký triển khai theo giai đoạn |
| [[SHOOTMATCH]_UI-progress.md] | Tiến độ UI mobile từng màn |
| [[SHOOTMATCH]_bug-log.md] | Lỗi đã gặp / đã sửa |
| [[SHOOTMATCH]_backlog.md] | Việc chưa làm / ưu tiên |
| [[SHOOTMATCH]_multi-auth-db-migration.md] | Auth đa phương thức + migration DB |

---

## Cấp 2 — Manual (`manual/`)

| File | Đối tượng đọc |
|------|----------------|
| [01_Project_Overview.md](./manual/01_Project_Overview.md) | Tổng quan sản phẩm |
| [02_Developer_Technical_Guide.md](./manual/02_Developer_Technical_Guide.md) | Dev setup, build, env |
| [03_Authentication_System_Architecture.md](./manual/03_Authentication_System_Architecture.md) | JWT, OTP, Google |
| [04_Mobile_App_Architecture.md](./manual/04_Mobile_App_Architecture.md) | RN/Expo, navigation, features |
| [05_End_User_Guides.md](./manual/05_End_User_Guides.md) | Hướng dẫn người dùng |
| [06_Full_API_and_Feature_Reference.md](./manual/06_Full_API_and_Feature_Reference.md) | API + tính năng đầy đủ |
| [API_Architecture_and_Endpoints.md](./manual/API_Architecture_and_Endpoints.md) | Kiến trúc API |
| [Detailed_Feature_Guide.md](./manual/Detailed_Feature_Guide.md) | Luồng nghiệp vụ chi tiết |
| [Roles_and_Permissions.md](./manual/Roles_and_Permissions.md) | Phân quyền |
| [Technical_Database_Reference.md](./manual/Technical_Database_Reference.md) | Schema PostgreSQL |
| [User_Functional_Guide.md](./manual/User_Functional_Guide.md) | Chức năng theo vai trò |

---

## Cấp 3 — Tiến độ hằng ngày (`daily progress/`)

| File | Nội dung |
|------|----------|
| [summary.md](./daily%20progress/summary.md) | Tóm tắt tích lũy |
| [14-05-2026.md](./daily%20progress/14-05-2026.md) | Ngày 14/05 |
| [15-05-2026.md](./daily%20progress/15-05-2026.md) | Ngày 15/05 — quét vault toàn project |
| [20-05-2026.md](./daily%20progress/20-05-2026.md) | Ngày 20/05 — Đại trùng tu Customer Profile & DB Migration |

---

## Solution (code)

```
ShootMatch/
├── ShootMatch.Domain/
├── ShootMatch.Application/
├── ShootMatch.Infrastructure/   ← EF Core + Npgsql + Storage
├── ShootMatch.Api/                ← REST + GraphQL + SignalR
├── ShootMatch.Mobile/             ← Expo / React Native
├── Vault_ShootMatch/              ← Tài liệu (thư mục này)
└── README.md
```

---

## Trạng thái nhanh (2026-05-20)

| Thành phần | Trạng thái |
|------------|------------|
| PostgreSQL + EF repositories | ✅ Customer, Photographer, Match, Booking, Review, Conversation, AuthSession |
| In-memory còn lại | SearchSession, SwipeAction, Otp, MatchResultStore |
| Storage | Supabase (nếu cấu hình) hoặc LocalDisk |
| Mobile Customer Home | ✅ PicKic UI, local `picture/`, Story viewer, masonry |
| Mobile Customer Profile & Edit | ✅ Viewfinder Hero, Asymmetric Polaroid Collage, Custom Roll Preview, Style description card |
| Mobile Photographer | ✅ PProfile, PersonalInfo, Portfolio masonry, Service catalogue |
| Mobile Photographer Portfolio | ✅ Masonry 2-column + Fullscreen viewer slide with synchronized thumbnail strip |
| AI matching (SigLIP) | ⏳ Stub encoder |

---

## Quy tắc cập nhật Vault

1. Sau mỗi feature lớn: cập nhật `implementation-log`, `UI-progress` hoặc `API-reference`.
2. Mỗi ngày làm việc: thêm file `daily progress/DD-MM-YYYY.md` + dòng trong `summary.md`.
3. Thay đổi schema: cập nhật `Technical_Database_Reference.md` + `codebase-map`.
4. Giữ tiếng Việt; link tương đối trong Vault.
