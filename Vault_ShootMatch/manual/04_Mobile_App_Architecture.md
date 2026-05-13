# SHOOTMATCH — Cấu trúc ứng dụng Mobile (Frontend)

Ứng dụng được phát triển bằng **React Native (Expo)** với ngôn ngữ **TypeScript**.

## 1. Cấu trúc thư mục (Feature-based)
Dự án chia theo Features để dễ quản lý:
- `src/features/auth`: Toàn bộ logic login, register, OTP.
- `src/features/customer`: Màn hình tìm kiếm, đặt lịch cho khách.
- `src/features/photographer`: Màn hình portfolio, quản lý booking cho thợ ảnh.

## 2. Quản lý Trạng thái (State Management)
- **AuthContext**: Quản lý session toàn cục (UserId, Role, Token).
- **SecureStore**: Lưu trữ token bảo mật trên thiết bị.

## 3. Điều hướng (Navigation)
- **AuthNavigator**: Splash -> RoleSelect -> AuthMethod -> Login/Register.
- **RoleNavigator**: Điều hướng vào `CustomerTabs` hoặc `PhotographerTabs` tùy theo vai trò sau khi đăng nhập.

## 4. Thiết kế & Hiệu ứng (UI/UX)
- **Design System**: Sử dụng token màu (Cream, Dark, Accent Red) trong `colors.ts`.
- **Animations**: Sử dụng `react-native-reanimated` cho các hiệu ứng chuyển cảnh mượt mà.
- **Claymorphism**: Áp dụng cho các nút bấm (`ClayButton`) tạo cảm giác 3D hiện đại.

---
*Xem thêm:*
- [[projects/SHOOTMATCH/manual/05_End_User_Guides]]
