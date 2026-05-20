# SHOOTMATCH — Cấu trúc Mobile (Expo / React Native)

> Cập nhật: **2026-05-15**

## 1. Tổng quan

- **Thư mục:** `ShootMatch.Mobile/`
- **Entry:** `App.tsx` → `src/app/AppRoot.tsx`
- **Ngôn ngữ:** TypeScript
- **Navigation:** React Navigation (native-stack + bottom-tabs)
- **API:** Axios (`shared/api/client.ts`) + GraphQL helper (`shared/api/graphql.ts`)
- **Auth:** `AuthContext` + `tokenStorage` (SecureStore/AsyncStorage)

## 2. Cây thư mục `src/`

```
src/
├── app/
│   ├── AppRoot.tsx
│   ├── navigation/
│   │   ├── AuthNavigator.tsx
│   │   ├── RoleNavigator.tsx
│   │   ├── CustomerTabs.tsx
│   │   ├── PhotographerTabs.tsx
│   │   └── types.ts
│   └── theme/          colors.ts, typography.ts, spacing.ts
├── features/
│   ├── auth/           screens + AuthContext.tsx
│   ├── customer/       api.ts, screens/, components/, utils/
│   ├── photographer/   api.ts, screens/
│   └── chat/           api.ts, ChatHub.ts, screens/
└── shared/
    ├── api/            client.ts, graphql.ts
    ├── assets/         localPictures.ts (43 ảnh demo)
    ├── components/     ClayCard, ClayButton
    ├── constants/      regions.ts
    ├── storage/        tokenStorage.ts
    └── utils/          formatImageUrl, resolveImageSource
```

## 3. Điều hướng

### AuthNavigator
`Splash` → `RoleSelect` → `AuthMethod` → `PhoneLogin` / `EmailLogin` / `Register` / `OtpVerify`

### CustomerTabs (stack bọc tabs)
| Tab | Screen | Ghi chú |
|-----|--------|---------|
| Home | `HomeScreen` | Feed PicKic, GraphQL `customerHomeFeed` |
| Discover | `DiscoverScreen` | Swipe matching |
| Chat | `AllChatScreen` | Danh sách hội thoại |
| Bookings | `MyBookingsScreen` | |
| Profile | `ProfileScreen` | |

**Stack push:** `PhotographerProfile`, `PhotographerPortfolio`, `Checkout`, `BookingSuccess`, `BookingDetail`, `Notifications`, `EditProfile`, `Chat`

### PhotographerTabs
| Tab | Screen | Ghi chú |
|-----|--------|---------|
| Dashboard | `DashboardScreen` | |
| PBookings | `PBookingsScreen` | |
| PChat | `PAllChatScreen` | |
| Portfolio | `UploadPortfolioScreen` | Masonry 2 cột absolute layout |
| PProfile | `PProfileScreen` | |

**Stack push:** `Chat`, `ServiceManagement`, `BookingCalendar`, `PersonalInfo`

## 4. Customer Home — cấu trúc UI

`HomeScreen.tsx` + `components/home/`:

| Section | Component | Dữ liệu |
|---------|-----------|--------|
| Top bar | `HomeTopBar` | — |
| Hero | `HomeHero` | `coverSource` (API hoặc `localPicture`) |
| Nổi Bật | `FeaturedStrip` + `StoryViewer` | `buildFeaturedDisplay` / fallback local |
| Portfolio Mới | `EditorialPortfolio` | `moments` (editorial layout) |
| Banner | `DiscoveryBanner` | → tab Discover |
| Dành cho bạn | `QuickActionsGrid` | 4 tile + `localPictureSlice` |
| Khoảnh Khắc | `PortfolioMasonry` | 2 cột masonry, `buildMomentDisplay` |

**Utils:** `utils/homeMedia.ts`, `utils/masonryLayout.ts`  
**Ảnh local:** `ShootMatch.Mobile/picture/*.jpg` → `shared/assets/localPictures.ts`

## 5. Photographer — điểm chính

- **PProfile:** cover, avatar, quote, bio, stats, portfolio grid 3×2 preview, personal info (ẩn/hiện).
- **PersonalInfoScreen:** CCCD, SĐT, email, tỉnh/thành (`region`), địa chỉ — `PUT personal-info`.
- **UploadPortfolioScreen:** masonry giống web portfolio; upload multi; viewer fullscreen.
- **ServiceManagementScreen:** gói dịch vụ & giá.

## 6. Design system (PicKic)

| Token | Giá trị |
|-------|---------|
| background | `#fff7e1` |
| dark | `#1a1a0f` |
| accentOrange | `#ff4200` |
| accent | `#cf4028` |

## 7. Chạy dev

```bash
cd ShootMatch.Mobile
npm install
npm start
# hoặc scripts/run-expo.js (ANDROID_HOME)
```

`.env`: `EXPO_PUBLIC_API_URL=http://<LAN-IP>:5062`

## 8. Liên quan

- [[../[SHOOTMATCH]_UI-progress.md]]
- [[06_Full_API_and_Feature_Reference.md]]
- [[02_Developer_Technical_Guide.md]]
