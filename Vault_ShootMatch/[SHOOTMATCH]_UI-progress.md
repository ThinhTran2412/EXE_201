# ShootMatch Mobile — UI Progress

> Cập nhật: **2026-05-20**  
> Stack: React Native + Expo (SDK 54), TypeScript  
> Design: PicKic (cream `#fff7e1`, dark `#1a1a0f`, orange `#ff4200`)

---

## Design tokens (`app/theme/`)

| Token | Value |
|-------|-------|
| `colors.background` | `#fff7e1` |
| `colors.dark` | `#1a1a0f` |
| `colors.accentOrange` | `#ff4200` |
| `colors.accent` | `#cf4028` |

---

## Customer Home (`HomeScreen`) — ✅ 2026-05-15

| Section | Component | Trạng thái |
|---------|-----------|------------|
| Top bar | `HomeTopBar` | ✅ |
| Hero + CTA | `HomeHero` | ✅ Nút không đè cover |
| Nổi Bật | `FeaturedStrip` + `StoryViewer` | ✅ 140×240, story 3–5 ảnh |
| Portfolio Mới | `EditorialPortfolio` | ✅ Layout editorial |
| SWIPE banner | `DiscoveryBanner` | ✅ |
| Dành cho bạn | `QuickActionsGrid` | ✅ |
| Khoảnh Khắc | `PortfolioMasonry` | ✅ 2 cột masonry (giống Upload Portfolio) |

**Data:** GraphQL `customerHomeFeed` + fallback `picture/` local.

## Web Landing Page (`ShootMatch.Web`) — ✅ 2026-06-10

| Area | Component / Behavior | Trạng thái |
|------|----------------------|------------|
| Hero landing | `LandingPage.tsx` | ✅ |
| CTA phụ | Social dock cạnh phải | ✅ mặc định ẩn, mở rộng khi cần |
| Social links | `src/config/social-links.ts` | ✅ type-safe config |
| UI polish | Glow viền, nháy nhẹ, không đè footer | ✅ |

**Data:** link social lấy từ config TS, không hardcode trực tiếp trong JSX.

---

## Screens — Customer

| Screen | File | Status |
|--------|------|--------|
| Home | `customer/screens/HomeScreen.tsx` | ✅ PicKic feed |
| Discover | `DiscoverScreen.tsx` | ✅ ProgressBar, Verified, stamps |
| Chat list | `chat/screens/AllChatScreen.tsx` | 🟡 |
| Chat room | `chat/screens/ChatScreen.tsx` | 🟡 SignalR |
| Bookings | `MyBookingsScreen.tsx` | 🟡 |
| Booking detail | `BookingDetailScreen.tsx` | 🟡 |
| Checkout | `CheckoutScreen.tsx` | 🟡 |
| Profile | `ProfileScreen.tsx` | ✅ Viewfinder Hero, Polaroid, Roll |
| Edit profile | `EditProfileScreen.tsx` | ✅ Darkroom view, 3-frame, style pills |
| Photographer profile | `PhotographerProfileScreen.tsx` | ✅ Editorial, Schedule grid, Fav heart |
| Photographer portfolio | `PhotographerPortfolioScreen.tsx` | ✅ Masonry 2-col, slider, thumbs strip |
| Customer favorites | `CustomerFavoritesScreen.tsx` | ✅ Placeholder |
| Customer shared media | `CustomerSharedMediaScreen.tsx` | ✅ Privacy warning note |
| Notifications | `NotificationsScreen.tsx` | ⏳ |

---

## Screens — Photographer

| Screen | File | Status |
|--------|------|--------|
| Dashboard | `DashboardScreen.tsx` | ✅ Mosaic portfolio |
| PProfile | `PProfileScreen.tsx` | ✅ Quote, ẩn/hiện personal info |
| Personal info | `PersonalInfoScreen.tsx` | ✅ API personal-info |
| Upload portfolio | `UploadPortfolioScreen.tsx` | ✅ Masonry + multi upload |
| Service management | `ServiceManagementScreen.tsx` | ✅ UI redesign |
| PBookings | `PBookingsScreen.tsx` | 🟡 |
| Booking calendar | `BookingCalendarScreen.tsx` | 🟡 |
| PChat / PAllChat | `PChatScreen`, `PAllChatScreen` | 🟡 |

---

## Screens — Auth

| Screen | Status |
|--------|--------|
| Splash, RoleSelect, AuthMethod | ✅ |
| PhoneLogin, OtpVerify | ✅ |
| EmailLogin, Register | 🟡 |
| Google | 🟡 |

**Chú thích:** ✅ hoàn thiện UI chính · 🟡 có màn, cần polish/API · ⏳ placeholder

---

## Components đáng chú ý

```
customer/components/home/
  HomeHero, HomeTopBar, SectionHeader
  FeaturedStrip, StoryViewer
  EditorialPortfolio, DiscoveryBanner, QuickActionsGrid

customer/components/
  PortfolioMasonry.tsx    ← dùng cho Khoảnh Khắc

shared/assets/
  localPictures.ts        ← 43 require() từ picture/
```

---

## Liên quan

- [04_Mobile_App_Architecture.md](./manual/04_Mobile_App_Architecture.md)
- [codebase-map](./[SHOOTMATCH]_codebase-map.md)
