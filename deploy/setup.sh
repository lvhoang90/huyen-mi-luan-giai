#!/usr/bin/env bash
# Cài đặt Huyền My trên Ubuntu 24.04 (chạy bằng root, trong thư mục mã nguồn đã clone vào /opt/huyenmy).
#   bash deploy/setup.sh ten-mien.com     # có tên miền đã trỏ A về IP máy chủ: tự lấy HTTPS
#   bash deploy/setup.sh                  # chưa có tên miền: chạy thử qua http://IP (chưa có HTTPS)
# Chạy lại nhiều lần được (không ghi đè .env đã có). Bản quyền © 2026 Lương Việt Hoàng. Bảo lưu mọi quyền.
set -euo pipefail

DOMAIN="${1:-}"
APP_USER=huyenmy
APP_DIR=/opt/huyenmy
DATA_DIR=/var/lib/huyenmy
PORT=5173

[ "$(id -u)" -eq 0 ] || { echo "Hãy chạy bằng root."; exit 1; }
[ -f "$APP_DIR/server/index.js" ] || { echo "Không thấy mã nguồn ở $APP_DIR. Hãy clone kho mã vào đó trước."; exit 1; }
cd "$APP_DIR"
export DEBIAN_FRONTEND=noninteractive

echo "==> 1/9 Gói hệ thống"
apt-get update -y
apt-get install -y nginx git ufw fail2ban sqlite3 curl ca-certificates openssl unattended-upgrades
[ -n "$DOMAIN" ] && apt-get install -y certbot python3-certbot-nginx
dpkg-reconfigure -f noninteractive unattended-upgrades || true

echo "==> 2/9 Swap (máy ít RAM)"
MEM_MB=$(awk '/MemTotal/ {print int($2/1024)}' /proc/meminfo)
if [ "$MEM_MB" -lt 3000 ] && ! swapon --show | grep -q .; then
  fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
  grep -q '^/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
  echo 'vm.swappiness=20' > /etc/sysctl.d/99-swap.conf && sysctl -p /etc/sysctl.d/99-swap.conf >/dev/null
fi

echo "==> 3/9 Tường lửa (giữ SSH, mở 80/443)"
SSH_PORT=$(ss -tlnp 2>/dev/null | awk '/sshd/ {n=split($4,a,":"); print a[n]; exit}')
ufw allow "${SSH_PORT:-22}/tcp" >/dev/null; ufw allow 'Nginx Full' >/dev/null; ufw --force enable   # mở đúng cổng SSH đang dùng để không tự khóa mình

echo "==> 4/9 Node.js 22"
NODE_MAJOR=0; command -v node >/dev/null && NODE_MAJOR=$(node -p 'process.versions.node.split(".")[0]')
if [ "$NODE_MAJOR" -lt 22 ]; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
fi
node -e 'const [a,b]=process.versions.node.split(".").map(Number); if(a<22||(a===22&&b<13)){console.error("Cần Node >= 22.13, đang là "+process.version);process.exit(1)}'
echo "Node $(node -v)"

echo "==> 5/9 Người dùng chạy ứng dụng và thư mục dữ liệu"
id "$APP_USER" >/dev/null 2>&1 || adduser --system --group --home "$DATA_DIR" --no-create-home "$APP_USER"
mkdir -p "$DATA_DIR" && chown "$APP_USER:$APP_USER" "$DATA_DIR" && chmod 750 "$DATA_DIR"

echo "==> 6/9 Dựng ứng dụng"
npm ci --no-audit --no-fund
npm run build

clean() { sed -E 's/\x1b\[[0-9;?]*[ -\/]*[@-~]//g' | tr -cd '\041-\176'; }  # bỏ ký tự điều khiển do dán vào terminal
echo "==> 7/9 Cấu hình bí mật (.env)"
if [ ! -f "$APP_DIR/.env" ]; then
  umask 077
  read -r -s -p "Dán ANTHROPIC_API_KEY (gõ vào không hiện chữ, Enter để bỏ qua = chế độ demo): " AK; echo
  read -r -p "Email quản trị (vào được /admin, cũng dùng để nhận thông báo của Let's Encrypt): " ADMIN
  read -r -p "Mã truy cập thử nghiệm (Enter = không đặt, ai cũng vào được): " CODE
  read -r -s -p "RESEND_API_KEY (Enter = bỏ qua; khi đó mã đăng nhập chỉ hiện trong nhật ký máy chủ): " RK; echo
  AK=$(printf '%s' "$AK" | clean); ADMIN=$(printf '%s' "$ADMIN" | clean); CODE=$(printf '%s' "$CODE" | clean); RK=$(printf '%s' "$RK" | clean)
  MAILFROM=""; [ -n "$DOMAIN" ] && MAILFROM="Huyền My <no-reply@$DOMAIN>"
  {
    echo "PORT=$PORT"; echo "TRUST_PROXY=1"; echo "DATA_DIR=$DATA_DIR"
    echo "ANTHROPIC_API_KEY=$AK"; echo "ADMIN_EMAILS=$ADMIN"
    [ -n "$CODE" ] && echo "HUYENMY_ACCESS_CODE=$CODE"
    [ -n "$RK" ] && echo "RESEND_API_KEY=$RK"; [ -n "$MAILFROM" ] && echo "MAIL_FROM=\"$MAILFROM\""
    echo "HUYENMY_DATA_KEY=$(openssl rand -hex 32)"; echo "HUYENMY_PEPPER=$(openssl rand -hex 32)"
    echo "HUYENMY_DAILY_TURNS=100"
  } > "$APP_DIR/.env"
  echo "Đã tạo $APP_DIR/.env (chỉ root đọc được). HÃY SAO LƯU HUYENMY_DATA_KEY ở nơi an toàn: mất khóa này thì dữ liệu mã hóa không đọc lại được."
else
  echo "Giữ nguyên .env đã có."
fi
# Dịch vụ chạy bằng người dùng riêng nên cần đọc được .env; người khác thì không.
chown root:"$APP_USER" "$APP_DIR/.env" && chmod 640 "$APP_DIR/.env"
# Kiểm tra .env đọc được bằng chính trình đọc của Node (sẽ dùng khi chạy dịch vụ)
node --env-file="$APP_DIR/.env" -e 'process.exit(0)' || { echo "!! Tệp .env có dòng sai định dạng. Mở bằng: nano $APP_DIR/.env"; exit 1; }
ADMIN_MAIL=$(grep -E '^ADMIN_EMAILS=' "$APP_DIR/.env" | head -1 | cut -d= -f2 | cut -d, -f1 || true)

echo "==> 8/9 Dịch vụ systemd và nginx"
write_unit() {  # $1 = 1: có cô lập hệ thống (an toàn hơn); 0: bỏ cô lập (một số máy ảo dạng container không hỗ trợ)
  cat > /etc/systemd/system/huyenmy.service <<UNIT
[Unit]
Description=Huyen My Luan Giai
After=network.target
[Service]
User=$APP_USER
Group=$APP_USER
WorkingDirectory=$APP_DIR
Environment=NODE_ENV=production
ExecStart=/usr/bin/node --max-old-space-size=384 --env-file=$APP_DIR/.env server/index.js
Restart=always
RestartSec=3
NoNewPrivileges=true
$([ "$1" = 1 ] && printf 'PrivateTmp=true\nProtectSystem=full\nProtectHome=true')
[Install]
WantedBy=multi-user.target
UNIT
  systemctl daemon-reload && systemctl enable huyenmy >/dev/null 2>&1 && systemctl restart huyenmy
}
if ! write_unit 1; then
  echo "!! Máy này không cho dịch vụ chạy kiểu cô lập, thử lại ở chế độ thường..."
  systemctl reset-failed huyenmy 2>/dev/null || true
  if ! write_unit 0; then
    echo "!! Dịch vụ vẫn không chạy được. Nhật ký lỗi:"; journalctl -u huyenmy -n 30 --no-pager; exit 1
  fi
fi
sleep 2
systemctl is-active --quiet huyenmy || { echo "!! Dịch vụ dừng ngay sau khi chạy. Nhật ký lỗi:"; journalctl -u huyenmy -n 30 --no-pager; exit 1; }

SERVER_NAME="${DOMAIN:-_}"
[ -n "$DOMAIN" ] && getent hosts "www.$DOMAIN" >/dev/null 2>&1 && SERVER_NAME="$DOMAIN www.$DOMAIN"
cat > /etc/nginx/sites-available/huyenmy <<NGX
server {
  listen 80 default_server;
  listen [::]:80 default_server;
  server_name $SERVER_NAME;
  client_max_body_size 1m;
  gzip on; gzip_types text/css application/javascript application/json image/svg+xml;
  add_header X-Content-Type-Options nosniff always;
  add_header Referrer-Policy strict-origin-when-cross-origin always;
  location / {
    proxy_pass http://127.0.0.1:$PORT;
    proxy_http_version 1.1;
    proxy_set_header Host \$host;
    proxy_set_header X-Forwarded-For \$remote_addr;
    proxy_set_header X-Forwarded-Proto \$scheme;
    proxy_buffering off;
    proxy_read_timeout 300s;
  }
}
NGX
ln -sf /etc/nginx/sites-available/huyenmy /etc/nginx/sites-enabled/huyenmy
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

echo "==> 9/9 Sao lưu hằng ngày và HTTPS"
cat > /etc/cron.d/huyenmy-backup <<CRON
15 3 * * * $APP_USER sqlite3 $DATA_DIR/huyenmy.db ".backup '$DATA_DIR/backup-\$(date +\%a).db'"
CRON
if [ -n "$DOMAIN" ]; then
  DOMAINS="-d $DOMAIN"; getent hosts "www.$DOMAIN" >/dev/null 2>&1 && DOMAINS="$DOMAINS -d www.$DOMAIN"
  certbot --nginx $DOMAINS --non-interactive --agree-tos --redirect ${ADMIN_MAIL:+-m "$ADMIN_MAIL"} \
    || echo "!! certbot chưa lấy được chứng chỉ: kiểm tra bản ghi A của $DOMAIN đã trỏ về IP máy chủ chưa, rồi chạy lại script."
fi

sleep 2
echo; echo "=== Kiểm tra ==="
systemctl is-active huyenmy && curl -fsS "http://127.0.0.1:$PORT/api/status" && echo
if [ -n "$DOMAIN" ]; then URL="https://$DOMAIN"; else URL="http://$(hostname -I | awk '{print $1}')"; fi
echo "Xong. Truy cập: $URL"
echo "Xem nhật ký: journalctl -u huyenmy -f"
