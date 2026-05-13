# SHOOTMATCH — Bug Log & Error Tracking

Tài liệu này ghi lại các lỗi đã phát sinh trong quá trình phát triển, bao gồm lỗi Logic, UI, Code, và các vấn đề về hệ thống/môi trường.

---

## 1. Lỗi UI (User Interface)

| Lỗi | Mô tả | Trạng thái | Giải pháp |
|---|---|---|---|
| **Masonry Misalignment** | Ảnh bị cắt thành hình vuông hoặc lệch hàng khi dùng Flexbox. | ✅ Fixed | Chuyển sang Absolute Positioning + tính toán tỷ lệ thật (`Image.getSize`). |
| **Thumbnail Desync** | Thanh điều hướng gallery không khớp với ảnh đang xem. | ✅ Fixed | Tính toán `scrollToOffset` dựa trên index và kích thước thumbnail. |
| **Notch/Safe Area Overlap** | Nút đóng Gallery bị che khuất bởi tai thỏ trên iOS/Android. | ✅ Fixed | Tích hợp `useSafeAreaInsets` để thêm padding-top động. |
| **Black/Grey Image Placeholder** | Ảnh bị hiện ô xám/đen khi cuộn nhanh hoặc tải nhiều ảnh. | ✅ Fixed | Tối ưu logic render, ngăn React unmount component Image khi mảng thay đổi. |

---

## 2. Lỗi Logic (Business Logic)

| Lỗi | Mô tả | Trạng thái | Giải pháp |
|---|---|---|---|
| **Localhost Image Loading** | Ảnh không hiện trên thiết bị thật do backend trả về `localhost`. | ✅ Fixed | Viết helper `formatPhotoUrl` để thay thế `localhost` bằng IP máy tính. |
| **GraphQL Auth Failure** | Token không được đính kèm vào request GraphQL dẫn đến lỗi 401. | ✅ Fixed | Chuyển từ `fetch` sang `apiClient` (Axios) để dùng chung interceptors. |
| **Bulk Selection State** | Xóa ảnh xong UI không cập nhật ngay hoặc mất trạng thái chọn. | ✅ Fixed | Cập nhật local state đồng bộ với kết quả trả về từ API. |

---

## 3. Lỗi Code & Hiệu năng (Performance/Crash)

| Lỗi | Mô tả | Trạng thái | Giải pháp |
|---|---|---|---|
| **Out-of-Memory (OOM)** | App crash hoặc không render được ảnh 4K/2K trên Android. | ✅ Fixed | Dùng `expo-image-manipulator` nén và scale ảnh xuống Full HD trước khi upload. |
| **HEIC/MimeType Error** | Upload ảnh từ iPhone bị lỗi định dạng file không hợp lệ. | ✅ Fixed | Tự động phát hiện extension và map đúng MimeType (`image/jpeg`, `image/png`). |
| **Memory Leak (Gallery)** | Mở gallery nhiều lần gây lag máy. | ✅ Fixed | Sử dụng `memo` cho các item ảnh và dọn dẹp listener khi Modal đóng. |

---

## 4. Lỗi Môi trường & Hệ thống (Vault/Dev tools)

| Lỗi | Mô tả | Trạng thái | Giải pháp |
|---|---|---|---|
| **Font Encoding (Garbled text)** | Tiếng Việt trong Vault biến thành ký tự lạ (giun dế). | ✅ Fixed | Ép định dạng UTF-8 (No BOM) khi ghi file bằng công cụ chuyên dụng. |
| **Regex Destruction** | Lệnh thay đổi hàng loạt làm hỏng nội dung file (`i` -> `mới`). | ✅ Fixed | Khôi phục thủ công và kiểm tra lại toàn bộ logic script thay thế. |

---

## 5. Danh sách Lint/Type Errors thường gặp
- **Type mismatch**: Thường gặp khi backend trả về `UUID` nhưng frontend xử lý là `string` chưa được normalize.
- **Optional Chaining**: Lỗi crash khi truy cập `profile.portfolioPhotos` lúc dữ liệu đang load (Đã sửa bằng `?.`).
- **Unused Imports**: Thường xuyên xuất hiện sau khi refactor giao diện cũ.

## Session 2026-05-14 — Photographer profile/service page issues
| Lỗi | Mô tả | Trạng thái | Giải pháp |
|---|---|---|---|
| Quote alignment | Quote trên profile chưa căn giữa đúng và có lúc nhìn như bị cắt thiếu. | ✅ Fixed | Chỉnh lại wrapper/text để canh giữa tốt hơn, đảm bảo text co giãn đúng. |
| Service action tint | Nút `Chỉnh sửa gói`/icon bị tệp màu vào nền tối. | ✅ Fixed | Tăng tương phản, thêm icon wrapper và đổi tone text sáng hơn. |
| Money wrap | Giá trung bình / mức thấp nhất bị xuống dòng, chữ `đ` rơi riêng. | ✅ Fixed | Dùng layout `moneyRow` để giữ số tiền + đơn vị cùng một dòng. |
| Swagger file upload | Swagger không mở vì `IFormFile` trực tiếp với `[FromForm]` gây lỗi generate operation. | ✅ Fixed | Đổi sang request wrapper `UploadPhotographerPhotoRequest`. |
| PasswordHash overwrite | Update profile có nguy cơ ghi đè `PasswordHash` null xuống DB. | ✅ Fixed | Giữ giá trị cũ trong controller và repository khi field mới null. |

## Session 2026-05-14 chiều — Migration & Personal Info

| Lỗi | Mô tả | Trạng thái | Giải pháp |
|---|---|---|---|
| **Migration chưa apply** | `AddPhotographerPersonalInfo` tạo rồi nhưng chưa chạy lên Supabase → `column NationalId does not exist`. | ✅ Fixed | `dotnet ef database update --connection <supabase-conn>`. |
| **GraphQL thiếu fields** | Query `photographerProfile` không include `nationalId`, `personalAddress`, `verificationDocument*` → data luôn null khi load. | ✅ Fixed | Thêm đủ fields vào GQL query và interface `PhotographerProfile`. |
| **Field name mismatch** | Mobile dùng `address` nhưng API/domain expose `personalAddress` → không bao giờ map đúng. | ✅ Fixed | Đổi toàn bộ sang `personalAddress` trong interface, state, display và API call. |
| **TS implicit any** | 4 `onChangeText` callback trong `PersonalInfoScreen` thiếu type → lỗi TS `implicitly has 'any' type`. | ✅ Fixed | Thêm `: string` vào từng tham số callback. |
| **Fields bị disabled** | `PersonalInfoScreen` default `locked = true` → user không nhập được gì khi mới vào trang. | ✅ Fixed | Đổi mặc định `locked = false`. |
