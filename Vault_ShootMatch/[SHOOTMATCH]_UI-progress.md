# ShootMatch Mobile — UI Progress

> Bắt đầu: 2026-05-03
> Stack: React Native + Expo Go (SDK 54)
> Design: EXE_UI (PicKic Claymorphic system)
> Cấu trúc: OG_SWD/System_Smart-Service-master pattern

---

## Tài liệu tham khảo

| Nguồn | Đường dẫn | Mục đích |
|---|---|---|
| Cấu trúc project | `F:\OG_SWD\System_Smart-Service-master\Smart-Service\Service_FE\` | AppRoot, AuthContext, RoleNavigator pattern |
| UI/Design | `F:\EXE101\EXE_UI\` | Toàn bộ screens, design system, PicKic Claymorphic |
| Design CSS | `F:\EXE101\EXE_UI\css\pickic-design-system.css` | Color tokens, animations |
| Output | `F:\EXE101\ShootMatch\ShootMatch.Mobile\` | Project folder |

---

## Design System (PicKic → Mobile tokens)

| Token | Value |
|---|---|
| `colors.background` | `#fff7e1` (cream) |
| `colors.dark` | `#1a1a0f` |
| `colors.accent` | `#cf4028` (đỏ clay) |
| `colors.clayShadow` | `#d9d4b8` |
| `colors.surface` | `#fff7e1` |
| Typography display | Anton Round (bold headings) |
| Typography mono | JetBrains Mono (labels, metadata) |
| Effect | Clay/Neumorphic shadows, Film grain overlay (opacity 0.04), Glassmorphism backdrop |
| Animations | slideInRight, scaleIn, pulse, Tinder swipe (Reanimated) |

---

## Architecture

```
ShootMatch.Mobile/src/
├── app/
│   ├── AppRoot.tsx               ← GestureHandler + SafeArea + Auth + NavigationContainer
│   ├── navigation/
│   │   ├── AuthNavigator.tsx     ← native-stack: Splash → Login → OTP → RoleSelect
│   │   ├── RoleNavigator.tsx     ← switch customer | photographer
│   │   ├── CustomerTabs.tsx      ← bottom tabs: Home / Discover / Chat / Bookings / Profile
│   │   ├── PhotographerTabs.tsx  ← bottom tabs: Dashboard / Bookings / Chat / Portfolio / Profile
│   │   └── tabScreenOptions.tsx
│   └── theme/
│       ├── colors.ts
│       ├── typography.ts
│       └── spacing.ts
├── features/
│   ├── auth/                     ← AuthContext, JWT, screens (Splash/Login/OTP/RoleSelect)
│   ├── customer/                 ← api.ts + 14 screens
│   ├── photographer/             ← api.ts + 6 screens
│   └── chat/                     ← SignalR hub + AllChatScreen + ChatScreen
└── shared/
    ├── api/                      ← axios client (JWT interceptor), GraphQL helper
    ├── components/               ← ClayCard, ClayButton, FilmGrain, SwipeCard, BottomNav
    ├── hooks/                    ← useSignalR
    └── storage/                  ← tokenStorage (AsyncStorage)
```

---

## Screens List

### Auth (4)
| Screen | File | Status |
|---|---|---|
| Splash | `auth/screens/SplashScreen.tsx` | ⏳ |
| Login (OTP phone) | `auth/screens/LoginScreen.tsx` | ⏳ |
| OTP Verify | `auth/screens/OtpVerifyScreen.tsx` | ⏳ |
| Role Select | `auth/screens/RoleSelectScreen.tsx` | ⏳ |

### Customer (14)
| Screen | File | Status |
|---|---|---|
| Home | `customer/screens/HomeScreen.tsx` | ⏳ |
| Discover (Tinder swipe) | `customer/screens/DiscoverScreen.tsx` | ⏳ |
| Photographer Profile | `customer/screens/PhotographerProfileScreen.tsx` | ⏳ |
| All Chat (inbox) | `chat/screens/AllChatScreen.tsx" | ⏳ |
| Chat (real-time) | `chat/screens/ChatScreen.tsx` | ⏳ |
| Checkout | `customer/screens/CheckoutScreen.tsx` | ⏳ |
| Booking Success | `customer/screens/BookingSuccessScreen.tsx` | ⏳ |
| My Bookings | `customer/screens/MyBookingsScreen.tsx` | ⏳ |
| Booking Detail | `customer/screens/BookingDetailScreen.tsx` | ⏳ |
| Notifications | `customer/screens/NotificationsScreen.tsx` | ⏳ |
| Profile | `customer/screens/ProfileScreen.tsx` | ⏳ |
| Edit Profile | `customer/screens/EditProfileScreen.tsx` | ⏳ |
| Settings | `customer/screens/SettingsScreen.tsx` | ⏳ |
| Favorites | `customer/screens/FavoritesScreen.tsx` | ⏳ |

### Photographer (6)
| Screen | File | Status |
|---|---|---|
| Dashboard | `photographer/screens/DashboardScreen.tsx` | ✅ |
| Bookings | `photographer/screens/BookingsScreen.tsx` | ⏳ |
| Upload Portfolio | `photographer/screens/UploadPortfolioScreen.tsx` | ✅ |
| Edit Profile | `photographer/screens/EditProfileScreen.tsx` | ⏳ |
| Verify | `photographer/screens/VerifyScreen.tsx` | ⏳ |
| Reviews | `photographer/screens/ReviewsScreen.tsx` | ⏳ |

---

## Sprint Progress

### Sprint 1 — Foundation ✅ HOÀN THÀNH (2026-05-03)
- [x] Project init, dependencies, babel, .env (IP: 192.168.1.7)
- [x] Design tokens: colors, typography, spacing
- [x] ClayCard, ClayButton (spring animation, 4 variants)
- [x] tokenStorage, axios client (JWT interceptor + auto-refresh), GraphQL helper
- [x] AuthContext (sendOtp/verifyOtp/logout, AsyncStorage rehydrate)
- [x] SplashScreen (spring logo, pulse dot, auto-navigate 2.2s)
- [x] LoginScreen (OTP phone, +84 prefix, role badge, FadeInDown)
- [x] OtpVerifyScreen (6 boxes, auto-focus, filled highlight, resend)
- [x] RoleSelectScreen (2 LinearGradient cards: cream customer / dark photographer)
- [x] AuthNavigator, CustomerTabs (5 tabs, clay bar), PhotographerTabs (5 tabs, dark bar)
- [x] RoleNavigator, AppRoot, App.tsx
- [x] Expo LAN server chạy tại http://192.168.1.7:8081

### Sprint 2 — Discovery Flow ✅ HOÀN THÀNH (2026-05-03)
- [x] `customer/api.ts` — REST+GraphQL đầy đủ (search, swipe, photographers, matches, bookings, reviews, conversations)
- [x] `photographer/api.ts` — profile, availability, bookings, verification
- [x] `ChatHub.ts` — SignalR WebSocket (JWT via accessTokenFactory query string)
- [x] `chat/api.ts` — conversationMessages, myConversationsAsPhotographer
- [x] `HomeScreen.tsx` — greeting, quick actions, matches row, AI CTA, photographer grid (pull-to-refresh)
- [x] `DiscoverScreen.tsx` — Tinder swipe: GestureDetector+Reanimated, MATCH/PASS stamps, card stack 3, match toast
- [x] `PhotographerProfileScreen.tsx` — cover hero, floating avatar, stat pills, bio, budget, sticky CTA
- [x] `CheckoutScreen.tsx` — booking form, commission 10% calculator, price summary
- [x] `BookingSuccessScreen.tsx` — animated spring check circle, info box, navigate to Bookings/Chat

### Sprint 3 — Chat + Bookings ✅ HOÀN THÀNH (2026-05-03)
- [x] `AllChatScreen.tsx` — inbox sorted by lastMessageAt, online dot, relative time, empty state
- [x] `ChatScreen.tsx` — real-time SignalR, join/leave hub, message history, bubble UI dark/clay, auto-scroll, input bar
- [x] `MyBookingsScreen.tsx` — 3 tabs (Sắp tới/Hoàn thành/Đã hủy), booking cards, cancel alert, pull-to-refresh

### Sprint 4 — Profiles + Photographer ✅ HOÀN THÀNH (2026-05-03)
- [x] `ProfileScreen.tsx` — avatar hero, stats row (bookings/matches/reviews), menu sections, logout
- [x] `DashboardScreen.tsx` — dark hero, availability toggle switch, 4 stat cards, pending requests, upcoming bookings
- [x] `PBookingsScreen.tsx` — 4 horizontal tabs, booking cards, accept/reject/complete actions
- [x] `UploadPortfolioScreen.tsx` — profile editor (region picker, bio, budget, Instagram), identity verification
- [x] `PProfileScreen.tsx` — dark gradient hero, photographer menu, logout

### Sprint 5 — Polish + Missing Screens (COMPLETED 2026-05-06)
- [ ] `BookingDetailScreen.tsx` — booking detail + review submission
- [ ] `NotificationsScreen.tsx` — notification list
- [ ] `EditProfileScreen.tsx` — customer profile edit
- [ ] `PhotographerTabs` nested stack (ChatScreen giống CustomerTabs)
- [x] Verify compile clean + QR code test (iOS/Android Notch support)

### Sprint 6 — Advanced Photographer Features ✅ (2026-05-06)
- [x] **Masonry Portfolio**: True aspect-ratio grid without cropping.
- [x] **Pro Gallery Viewer**: Swipe-able fullscreen modal + synchronized thumbnail strip.
- [x] **Bulk Management**: Multi-select, Bulk Delete (Long-press), Multiple Upload.
- [x] **Memory Optimization**: Auto-downscaling 4K/2K images to prevent OOM errors.
- [x] **Auth Sync**: GraphQL auto-token injection & auto-refresh via Axios client.

---

## API Mapping

| Feature | Type | Endpoint |
|---|---|---|
| Customer Login | REST POST | `/api/auth/otp/send`, `/api/auth/otp/verify` |
| Photographer Login | REST POST | `/api/photographer-auth/otp/send`, `/api/photographer-auth/otp/verify` |
| Search (AI) | REST POST | `/api/matching/searches` |
| Swipe | REST POST | `/api/matching/swipes` |
| Swipe Feed | GraphQL | `swipeFeed(searchId)` |
| Matches | GraphQL | `myMatches` |
| Photographer Profile | GraphQL | `photographer(id)` |
| Conversations | GraphQL | `myConversations` |
| Messages | GraphQL | `conversationMessages(id)` |
| Send Message | SignalR | `/hubs/chat` — `SendMessage(convId, text)` |
| Create Booking | REST POST | `/api/bookings` |
| My Bookings | GraphQL | `myBookings` |
| Submit Review | REST POST | `/api/reviews` |

---

## Key Notes
- `DevFeatures:AllowAutoMatch=true` trong appsettings.Development.json → mọi swipe phải đều tạo Match (để test)
- SignalR JWT: gửi via `?access_token=<JWT>` query string (không phải header — WebSocket limitation)
- Target: Expo Go SDK 54 (react-native 0.81.x, react 19.x)
## Update 2026-05-14 — Service management & profile quote refinement
- [x] ServiceManagementScreen redesign theo phong cách catalogue nghệ thuật hơn.
- [x] Tăng tương phản cho badge/icon/button để không bị tệp màu trên nền tối.
- [x] Fix layout số tiền thống kê để không bị xuống dòng riêng chữ `đ`.
- [x] Profile quote section được tinh lại để hiển thị rõ và căn giữa hơn.
- [x] Swagger UI bật trực tiếp và redirect từ `/` → `/swagger` để dễ kiểm tra API.
