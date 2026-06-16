#!/bin/bash

# =============================================
#  ShootMatch – Khởi động toàn bộ hệ thống
#  Backend | Mobile Web | Cloudflare Tunnel
# =============================================

echo ""
echo "🚀  ShootMatch – Đang khởi động hệ thống..."
echo ""

if command -v gnome-terminal &> /dev/null; then

  # Mở 3 cửa sổ terminal riêng biệt
  gnome-terminal --title="🟢 Backend API" \
    -- bash -c "cd /data/EXE201/ShootMatch.Api && dotnet run --launch-profile production; exec bash" &

  sleep 0.5

  gnome-terminal --title="🌐 Mobile Web" \
    -- bash -c "cd /data/EXE201/ShootMatch.Mobile && npm run web; exec bash" &

  sleep 0.5

  gnome-terminal --title="☁️ Cloudflare Tunnel" \
    -- bash -c "cloudflared tunnel run PicKic; exec bash" &

  echo "✅  Đã mở 3 cửa sổ terminal riêng biệt:"
  echo "   🟢 Backend API      → http://localhost:5062"
  echo "   🌐 Mobile Web       → http://localhost:8081"
  echo "   ☁️  Cloudflare       → tunnel: shootmatch"
  echo ""
  echo "   (Nhìn Taskbar để thấy 3 cửa sổ)"

elif command -v tmux &> /dev/null; then

  SESSION="shootmatch"
  tmux has-session -t $SESSION 2>/dev/null && tmux kill-session -t $SESSION

  tmux new-session  -d -s $SESSION -n "Backend"   "cd /data/EXE201/ShootMatch.Api && dotnet run --launch-profile production"
  tmux new-window      -t $SESSION -n "Web"        "cd /data/EXE201/ShootMatch.Mobile && npm run web"
  tmux new-window      -t $SESSION -n "Cloudflare" "cloudflared tunnel run PicKic"
  tmux select-window   -t $SESSION:Backend

  echo "✅  Đã tạo tmux session '$SESSION' với 3 windows:"
  echo "   Ctrl+B + 0  → Backend"
  echo "   Ctrl+B + 1  → Mobile Web"
  echo "   Ctrl+B + 2  → Cloudflare"
  echo ""
  tmux attach -t $SESSION

else

  echo "⚠️  Không tìm thấy gnome-terminal hay tmux. Chạy nền..."
  LOG_DIR="/tmp"

  (cd /data/EXE201/ShootMatch.Api    && dotnet run --launch-profile production) > "$LOG_DIR/sm-backend.log"    2>&1 &
  (cd /data/EXE201/ShootMatch.Mobile && npm run web)                            > "$LOG_DIR/sm-web.log"         2>&1 &
  cloudflared tunnel run Pickic		                                        > "$LOG_DIR/sm-cloudflare.log"  2>&1 &

  PIDS="$! "
  echo "✅  Đang chạy nền. Log tại /tmp/sm-*.log"
  trap "kill $(jobs -p) 2>/dev/null; exit" INT
  wait

fi
