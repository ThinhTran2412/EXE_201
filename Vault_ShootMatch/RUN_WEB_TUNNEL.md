# Hướng Dẫn Chạy Toàn Bộ Hệ Thống (Web + Tunnel)

Để khởi chạy toàn bộ hệ thống ShootMatch (Frontend + Backend) và public ra ngoài internet thông qua Cloudflare Tunnel, bạn cần mở **4 tab Terminal riêng biệt** và chạy các lệnh dưới đây theo thứ tự:

---

### 🟢 Terminal 1: Chạy Backend API (Cổng 5062)
Mở tab terminal đầu tiên và chạy lệnh:
```bash
cd /data/EXE201/ShootMatch.Api
dotnet run --launch-profile production
```
*(Giữ nguyên tab này để API luôn chạy ngầm)*

---

### 🟢 Terminal 2: Chạy Cloudflare Tunnel cho Backend API
Mở tab terminal thứ hai và chạy lệnh:
```bash
cloudflared tunnel --url http://localhost:5062
```
⚠️ **Rất Quan Trọng:** 
- Đợi 1 chút để màn hình hiện ra cái link có dạng `https://xxxxxx.trycloudflare.com`.
- Copy link đó.
- Dán link đó đè vào cấu hình `PublicBaseUrl` trong file `/data/EXE201/ShootMatch.Api/appsettings.Production.json`.
- Dán link đó đè vào `EXPO_PUBLIC_API_URL` trong file `/data/EXE201/ShootMatch.Mobile/.env`.
*(Mỗi lần bạn tắt Terminal 2 đi bật lại, bạn đều phải làm lại bước copy-paste này nhé)*

---

### 🟢 Terminal 3: Chạy Frontend (Web App - Cổng 8081)
Mở tab terminal thứ ba. Phải chắc chắn bạn **đã cập nhật link API mới vào file `.env`** ở bước 2 rồi mới chạy lệnh này nhé:
```bash
cd /data/EXE201/ShootMatch.Mobile
npm run web
```
*(Lệnh này sẽ lấy code React Native, dịch sang Web và chạy trên cổng 8081)*

---

### 🟢 Terminal 4: Chạy Cloudflare Tunnel cho Frontend
Mở tab terminal cuối cùng và chạy lệnh:
```bash
cloudflared tunnel --url http://localhost:8081
```
- Đợi nó cấp cho bạn một đường link mới (ví dụ: `https://yyyyyy.trycloudflare.com`).
- **Đây chính là đường link xịn nhất!** Bạn dùng link này mở trên điện thoại, gửi cho bạn bè, hoặc dùng để test ứng dụng với tư cách là người dùng thực tế.

---

### 💡 Mẹo xử lý lỗi (Troubleshooting)
- **Lỗi `DNS_PROBE_FINISHED_NXDOMAIN`:** Nếu lấy được link ở bước 4 rồi mà mở lên bị lỗi này, đừng hoảng. Cloudflare cần khoảng 1 phút để đăng ký tên miền lên mạng lưới toàn cầu. Cứ đợi xíu rồi F5 lại là được. Nếu đợi 3 phút vẫn không được, hãy qua Terminal 4 bấm `Ctrl + C` để tắt và chạy lại lệnh ở Terminal 4 để lấy link khác.
- **Sửa API URL:** Nếu bạn sửa file `.env` ở bước 2 khi Terminal 3 ĐANG CHẠY, bạn bắt buộc phải qua Terminal 3 bấm `Ctrl + C` và chạy lại lệnh `npm run web` thì app nó mới nhận link mới.
