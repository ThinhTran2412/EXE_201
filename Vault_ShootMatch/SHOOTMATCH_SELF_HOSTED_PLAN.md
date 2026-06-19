# SHOOTMATCH SELF-HOSTED DEPLOYMENT PLAN

## 1. Mục tiêu

Triển khai hệ thống ShootMatch với chi phí gần như bằng 0 bằng cách tận dụng laptop Ubuntu tại nhà thay vì thuê VPS.

Kiến trúc mục tiêu:

```text
Internet
↓
Cloudflare
↓
Cloudflare Tunnel
↓
Ubuntu Laptop
├── ASP.NET Core API
├── Database
└── Docker (tương lai)
```

Frontend:
- React Web (Render)
- React Native App

---

## 2. Cấu hình máy chủ hiện tại

- Ubuntu
- AMD Ryzen 3 3250U
- 12GB RAM
- SSD 256GB

Đánh giá:
- Đủ cho ASP.NET Core API
- Đủ cho PostgreSQL/SQL Server
- Đủ cho Docker
- Phù hợp đồ án, portfolio, MVP

---

## 3. Những gì đã thực hiện

### Clone project

```bash
git init
git remote add origin https://github.com/ThinhTran2412/EXE_201.git
git fetch origin
git checkout develop
git pull
```

### Chạy API

```bash
dotnet run
```

Port API:

```text
5062
```

### Tạo Quick Tunnel

```bash
cloudflared tunnel --url http://localhost:5062
```

Tunnel đã tạo:

```text
https://oclc-warehouse-tear-violin.trycloudflare.com
```

---

## 4. Cloudflare Tunnel là gì?

Cloudflare Tunnel tạo kết nối outbound từ máy Ubuntu tới Cloudflare.

```text
Ubuntu
↓
Cloudflare
↓
Internet
```

Không cần:

- Port Forwarding
- IP Public
- DDNS
- VPS

---

## 5. Ưu điểm

### Chi phí

| Thành phần | Chi phí |
|-----------|----------|
| Ubuntu | 0đ |
| Cloudflare Tunnel | 0đ |
| SSL | 0đ |
| DNS | 0đ |
| Domain | ~50k-300k/năm |

### Bảo mật

- Không lộ IP nhà
- HTTPS tự động
- Cloudflare đứng phía trước server

---

## 6. Nhược điểm

- Phụ thuộc mạng gia đình
- Mất điện lâu + hết pin => server dừng
- Không phù hợp tải cực lớn

---

## 7. Kiến trúc mục tiêu

```text
React Web (Render)
        ↓
React Native
        ↓
api.shootmatch.xyz
        ↓
Cloudflare Tunnel
        ↓
Ubuntu
├── ASP.NET Core
└── PostgreSQL
```

---

## 8. Các lệnh quan trọng

### Chạy API

```bash
dotnet run
```

### Kiểm tra cổng

```bash
ss -tulpn
```

### Test local

```bash
curl http://localhost:5062
```

### Tạo Quick Tunnel

```bash
cloudflared tunnel --url http://localhost:5062
```

### Kiểm tra cloudflared

```bash
cloudflared --version
```

### Xem process

```bash
ps aux | grep cloudflared
```

---

## 9. Điều cần biết

### Quick Tunnel

- URL thay đổi mỗi lần chạy
- Chỉ dùng test/demo

### Named Tunnel

- URL cố định
- Dùng production

### React Native

Không dùng:

```text
http://localhost:5062
```

Nên dùng:

```text
https://api.tenmien.com
```

---

## 10. Roadmap tiếp theo

### Phase 1

- Xác nhận API hoạt động qua Tunnel
- Test từ điện thoại 4G

### Phase 2

- Mua domain
- Thêm domain vào Cloudflare

### Phase 3

- Tạo Named Tunnel
- Map:

```text
api.tenmien.com
→ localhost:5062
```

### Phase 4

Docker hóa:

```text
Ubuntu
├── Backend Container
├── PostgreSQL Container
└── Cloudflared
```

### Phase 5

CI/CD

```text
GitHub
↓
Pull Source
↓
Docker Build
↓
Deploy
```

---

## 11. Backup cần có

- Database backup hằng ngày
- Backup source code trên GitHub
- Backup file upload nếu có

---

## 12. Khi nào cần VPS?

Chuyển sang VPS khi:

- Có nhiều user thật
- Cần uptime cao
- Cần demo chuyên nghiệp
- Mạng nhà không ổn định

Cho tới lúc đó, Ubuntu + Cloudflare Tunnel là phương án tiết kiệm và học được nhiều kiến thức DevOps thực tế.
