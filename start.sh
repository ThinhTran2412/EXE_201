#!/bin/bash

# =============================================
#  ShootMatch – Khởi động hệ thống qua Docker Compose
# =============================================

echo ""
echo "🚀  ShootMatch – Đang khởi động hệ thống qua Docker Compose..."
echo ""

# Dừng các container cũ nếu có
docker compose down --remove-orphans

# Khởi động và build các dịch vụ
docker compose up -d --build

echo ""
echo "✅  Các dịch vụ đã được khởi chạy trong Docker:"
echo "   🟢 Backend API      → http://localhost:5062"
echo "   📱 PWA App          → http://localhost:8081"
echo "   🌐 Landing Page     → http://localhost:5173"
echo "   ☁️  Cloudflare Tunnel → tunnel: pickic (app.pickic.io.vn)"
echo ""
echo "👉 Bạn có thể quản lý các container trực quan bằng phần mềm Docker Desktop vừa cài đặt."
echo "👉 Theo dõi log hệ thống: docker compose logs -f"
echo "👉 Dừng hệ thống: docker compose down"
echo ""

# Tự động theo dõi logs
docker compose logs -f
