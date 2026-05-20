# SHOOTMATCH — Context

> Cập nhật: **2026-05-20**

## Stack

| Layer | Công nghệ |
|-------|-----------|
| Mobile | React Native, Expo SDK 54, TypeScript |
| API | ASP.NET Core .NET 9 |
| DB | PostgreSQL (Npgsql + EF Core) |
| Realtime | SignalR (`/hubs/chat`) |
| Read API | GraphQL (HotChocolate) |
| Write API | REST |
| Storage | Supabase Storage hoặc local disk |
| AI (kế hoạch) | SigLIP / CLIP + pgvector |

## Mục tiêu sản phẩm

Kết nối khách hàng với nhiếp ảnh gia theo phong cách ảnh (matching), đặt lịch, chat, đánh giá — không phụ thuộc chọn tag thủ công.

## Quyết định đã chốt

- Clean Architecture: Domain / Application / Infrastructure / Api.
- Hybrid API: **GET/read → GraphQL**, **POST/write → REST**.
- JWT role-based: `customer`, `photographer`, `admin`.
- Mobile feature-based: `auth`, `customer`, `photographer`, `chat`, `shared`.

## Trạng thái triển khai (2026-05-20)

### Backend ✅
- [x] Solution 4 project + Swagger.
- [x] EF PostgreSQL: Customer, Photographer, Match, Booking, Review, Conversation, AuthSession, Portfolio photos.
- [x] 4 Migration mở rộng trường cá nhân hóa cho Khách hàng đến `20260519195021_AddCustomerPreferredStyles`.
- [x] Script vá nóng đồng bộ database cục bộ (`scripts/add_roll_preview_column.py` và `apply_highlight_columns.py`).
- [x] CustomersController: profile (merge/fallback thông minh), 6 endpoint upload ảnh (avatar, cover, highlight 1/2/3, roll-preview).
- [x] PhotographersController: profile, avatar/cover upload, personal-info, availability PATCH, verify (giữ nguyên thông tin cũ khi Pending).
- [x] PortfolioController: list / upload / delete.
- [x] GraphQL: swipeFeed, me, photographers, photographerProfile, **customerHomeFeed**, matches, bookings, reviews, conversations, messages.
- [x] SignalR ChatHub.
- [x] Domain events + MatchCreated → Conversation handler.

### Backend ⏳
- [ ] EF cho SearchSession, SwipeAction (hiện in-memory).
- [ ] SigLIP encoder thật (đang `StubSiglipEncoder`).
- [ ] pgvector similarity search thực tế cho gu ảnh & portfolio.
- [ ] Payment gateway + escrow production.

### Mobile ✅
- [x] Auth: Splash, RoleSelect, OTP, Email login, Register, Google.
- [x] Customer tabs + stack (Home, Discover, Chat, Bookings, Profile + detail screens).
- [x] Photographer tabs + stack (Dashboard, Bookings, Chat, Portfolio, PProfile + PersonalInfo, ServiceManagement, Calendar).
- [x] Customer Home PicKic: Hero, Nổi Bật + StoryViewer, Portfolio Mới, Discovery, Quick actions, Khoảnh Khắc masonry.
- [x] Local images `ShootMatch.Mobile/picture/` + API fallback.
- [x] Màn hình Hồ Sơ Khách Hàng (`ProfileScreen.tsx`): Viewfinder Frame, 3D HeroPolaroid Collage xoay góc bất đối xứng, Filmstrip Roll Preview chạy ngang mượt mà.
- [x] Màn hình Buồng Tối Chỉnh Sửa (`EditProfileScreen.tsx`): Viewfinder Header thông số máy ảnh, 3 khung ảnh featured frame upload tuần tự nén qua `expo-image-manipulator`, identity form gạch dưới phát sáng, gu ảnh interactive pills.
- [x] Màn hình Khám Phá Discover: ProgressBar đếm card, verified badge, LIKE/NOPE stamps.
- [x] Màn hình Hồ Sơ Photographer: Spec Badges gu ảnh, Stats Card, Schedule Grid hiển thị lịch rảnh bận theo ngày trực quan dạng Grid 4 cột.
- [x] Trang Portfolio chuyên sâu (`PhotographerPortfolioScreen.tsx`): Bố cục Masonry 2 cột tính tỷ lệ ảnh thực tế, Slide viewer toàn màn hình kèm thanh cuộn thumbnail chân trang.
- [x] Màn hình phụ: `CustomerFavoritesScreen`, `CustomerSharedMediaScreen`.

### Mobile ⏳
- [ ] Notifications thật (FCM).
- [ ] Thanh toán production.

## Liên kết Vault

- Kiến trúc: [[SHOOTMATCH]_architecture]]
- Code map: [[SHOOTMATCH]_codebase-map]]
- API: [[SHOOTMATCH]_API-reference]]
- UI: [[SHOOTMATCH]_UI-progress]]
- Index: [INDEX.md](./INDEX.md)

## Status

🚧 **MVP nâng cao** — DB + mobile UI chính đã chạy; cần hardening matching AI, search persistence, thanh toán.
