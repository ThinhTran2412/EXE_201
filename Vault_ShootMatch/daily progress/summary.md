# Tóm tắt tiến độ

Tài liệu tích lũy các hạng mục đã triển khai trong ShootMatch.

**Vault index:** [INDEX.md](../INDEX.md)  
**Cập nhật lần cuối:** 2026-06-10

---

## 2026-06-10

- Cập nhật ghi nhận cho `ShootMatch.Web`: landing page, social dock cạnh phải, social links config type-safe.
- Bổ sung mốc mới vào `implementation-log.md` và `UI-progress.md`.
- Đồng bộ lại README để phản ánh phần web hiện có.

---

## Đã hoàn thiện (tích lũy)

### Frontend web
- `ShootMatch.Web` đã có landing page dùng React + Vite + Tailwind + Framer Motion.
- Landing page có CTA chính và cụm social/support ở cạnh màn hình, link được tách cấu hình sang `src/config/social-links.ts`.
- UI web đã được chỉnh lại nhiều vòng trước đó, nhưng Vault chưa ghi nhận đầy đủ theo mốc ngày nên mục này được bổ sung lại vào bản tổng hợp.

### Backend
- Clean Architecture 4 layer (.NET 9).
- PostgreSQL + EF Core cho Customer, Photographer, Match, Booking, Review, Conversation, AuthSession.
- REST (write) + GraphQL HotChocolate (read) + SignalR `/hubs/chat`.
- JWT roles: `customer`, `photographer`, `admin`.
- Auth: OTP, email/password, Google (customer + photographer).
- Storage: Supabase hoặc `LocalDiskStorageService`.
- Swagger `/swagger`, health `/health`.
- GraphQL `customerHomeFeed` cho trang chủ khách hàng.
- Photographer: Quote, personal info (CCCD, địa chỉ), portfolio upload/delete.
- Customer: CoverPhoto, 3 Highlight Photos, RollPreviewPhotos list, PreferredStyles.
- REST endpoint upload ảnh: avatar, cover, highlight-1, highlight-2, highlight-3, roll-preview cho cả Customer và Photographer.

### Mobile (Expo / React Native)
- Auth flow đầy đủ + `RoleNavigator` (Customer / Photographer tabs).
- Customer: Home (PicKic), Discover swipe (ProgressBar + verified badge), Chat list & room (SignalR), Bookings calendar, checkout flow.
- Customer Profile: Viewfinder Hero, Polaroid Asymmetric Highlights, Filmstrip Roll Preview, contact sheet, style tags.
- Customer Edit Profile: Viewfinder Header, 3-frame collage editor, minimal identity form, custom roll preview manager (multi-select upload, sequential progress), interactive style pills with description card.
- Photographer Portfolio Screen: Masonry 2-column gallery, Fullscreen viewer with swipe navigation and synchronized thumbnail strip.
- Photographer: Dashboard (Mosaic portfolio), Bookings (Calendar + Specific day list), Chat, Portfolio masonry upload, PProfile, PersonalInfo (CCCD, address), ServiceManagement (editorial catalogue).
- Design tokens: cream `#fff7e1`, dark `#1a1a0f`, orange `#ff4200`.
- Local assets `picture/` cho demo khi API chưa có dữ liệu.

### Vault & quy trình
- README tiếng Việt + link Vault.
- Quét project 20/05/2026 — cập nhật toàn bộ tài liệu Vault phản ánh đúng thực tế.

---

## Gần đây (18–20/05/2026)

- **Đại trùng tu Customer Profile & Edit Suite:** Thiết kế Viewfinder Hero, Polaroid Asymmetric Collage (3-frame), Filmstrip Roll Preview (4-8 ảnh) đồng bộ database.
- **Mở rộng schema & 4 migration mới:** Bổ sung `CoverPhotoUrl`, 3 ảnh `HighlightPhotoUrl`, `RollPreviewPhotos`, `PreferredStyles` cho bảng `customers` của PostgreSQL.
- **Bổ sung API Upload Ảnh Khách hàng:** 6 REST endpoints upload ảnh chuyên biệt hỗ trợ merge profile an toàn.
- **Nâng cấp UI Discover & Photographer Profile:** Thêm ProgressBar, Verified Badge, Schedule Grid (lịch rảnh bận trực quan theo ngày) cho Photographer Profile, và heart favorite button.
- **Bổ sung Photographer Portfolio Screen:** Trang xem ảnh Masonry 2 cột thác nước + Lightbox trượt mượt mà có thumbnail chân trang.
- **Chi tiết:** [14-05-2026.md](./14-05-2026.md), [15-05-2026.md](./15-05-2026.md), [20-05-2026.md](./20-05-2026.md)

---

## Đang mở / chưa làm

- SigLIP + pgvector production matching (matching bằng vector gu ảnh thực tế).
- EF repositories cho SearchSession / SwipeAction (chuyển đổi in-memory còn lại).
- Payment / escrow thật.
- FCM push notifications.
- Admin UI.

---

## Ghi chú

- Nhật ký chi tiết: `manual/`, `[SHOOTMATCH]_implementation-log.md`, `[SHOOTMATCH]_bug-log.md`.
- Mỗi ngày làm việc: tạo `daily progress/DD-MM-YYYY.md`.
