# Đưa Huyền My lên web (Cloud Server Linux)

Huyền My là một ứng dụng Node.js chạy liên tục (phát chữ trực tiếp qua SSE, lưu SQLite). Vì vậy cần **máy chủ riêng ảo (VPS/Cloud Server) chạy Linux**, không dùng hosting PHP/cPanel thông thường.

## Cách nhanh (khuyên dùng): dùng script
Sau khi có máy Ubuntu 24.04 và SSH được bằng root:
```bash
apt update && apt install -y git
ssh-keygen -t ed25519 -N "" -f ~/.ssh/huyenmy_deploy && cat ~/.ssh/huyenmy_deploy.pub   # dán vào GitHub: repo > Settings > Deploy keys (chỉ đọc)
GIT_SSH_COMMAND="ssh -i ~/.ssh/huyenmy_deploy -o IdentitiesOnly=yes -o StrictHostKeyChecking=accept-new" \
  git clone -b <nhánh> git@github.com:lvhoang90/huyen-mi-luan-giai.git /opt/huyenmy
cd /opt/huyenmy && git config core.sshCommand "ssh -i /root/.ssh/huyenmy_deploy -o IdentitiesOnly=yes"
bash deploy/setup.sh ten-mien-cua-ban.com      # hoặc không đối số để thử qua http://IP
```
Cập nhật sau này: `bash /opt/huyenmy/deploy/update.sh`. Các mục bên dưới là bản làm tay giải thích từng bước.

## 1. Cần mua
| Mục | Ghi chú |
|---|---|
| Tên miền (.com hoặc .vn) | .vn cần giấy tờ xác minh chủ thể; .com đơn giản hơn. Chọn nơi cho tự sửa bản ghi DNS (A, TXT, CNAME). |
| Cloud Server Linux | Ubuntu 22.04 hoặc 24.04, tối thiểu 1-2 vCPU, 1,5 GB RAM (đủ, nếu bật swap ở bước 2), 40 GB. Cần quyền root/SSH. SSD tốt hơn HDD; ổ HDD vẫn chạy được ở giai đoạn đầu vì ứng dụng đã ghi cơ sở dữ liệu theo lô (WAL, synchronous=NORMAL). |
| SSL | Không cần mua: dùng Let's Encrypt miễn phí (bước 6). |
| Email gửi mã đăng nhập | Dùng Resend (có gói miễn phí) với tên miền của bạn. Không cần mua Mail Server. |
| Khóa Anthropic API | Tạo ở console của Anthropic, nạp tiền trả trước, **đặt hạn mức chi tiêu tối đa**. |

Không cần: hosting thường, Mail Server, server riêng, tổng đài ảo, SMS Brandname.

Kiểm tra trước khi mua: máy chủ đặt tại Việt Nam có gọi được API của Anthropic không (xem danh sách quốc gia được hỗ trợ của Anthropic). Nếu bị chặn, chọn máy chủ ở Singapore hoặc nơi khác.

## 2. Chuẩn bị máy chủ (SSH vào bằng root)
```bash
adduser --disabled-password --gecos "" huyenmy
apt update && apt install -y nginx git ufw certbot python3-certbot-nginx sqlite3
ufw allow OpenSSH && ufw allow 'Nginx Full' && ufw --force enable
curl -fsSL https://deb.nodesource.com/setup_22.x | bash - && apt install -y nodejs
node -v   # phải >= 22.5 (cần node:sqlite)
# Máy ít RAM (1,5 GB): bật 2 GB swap để lúc build web không bị tràn bộ nhớ
fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab && sysctl vm.swappiness=20 && echo 'vm.swappiness=20' > /etc/sysctl.d/99-swap.conf
```

## 3. Lấy mã nguồn và dựng
```bash
mkdir -p /opt/huyenmy /var/lib/huyenmy && chown huyenmy:huyenmy /opt/huyenmy /var/lib/huyenmy
sudo -u huyenmy git clone <địa chỉ kho mã> /opt/huyenmy     # kho riêng tư: dùng deploy key hoặc token chỉ đọc
cd /opt/huyenmy && sudo -u huyenmy npm ci && sudo -u huyenmy npm run build
```

## 4. Cấu hình bí mật
Tạo `/opt/huyenmy/.env` (quyền 600, chủ huyenmy), **không đưa lên git**:
```
NODE_ENV=production
PORT=5173
TRUST_PROXY=1
DATA_DIR=/var/lib/huyenmy
ANTHROPIC_API_KEY=...
ADMIN_EMAILS=email-cua-ban@...
RESEND_API_KEY=...
MAIL_FROM="Huyền My <no-reply@ten-mien-cua-ban>"
HUYENMY_DATA_KEY=<openssl rand -hex 32>
HUYENMY_PEPPER=<openssl rand -hex 32>
HUYENMY_DAILY_TURNS=100
# Giai đoạn thử nghiệm: bật dòng dưới để chỉ người có mã mới vào được
# HUYENMY_ACCESS_CODE=...
```
Lưu `HUYENMY_DATA_KEY` ở nơi an toàn khác: mất khóa này thì dữ liệu đã mã hóa không đọc lại được.

## 5. Chạy thường trực bằng systemd
`/etc/systemd/system/huyenmy.service`:
```
[Unit]
Description=Huyen My
After=network.target
[Service]
User=huyenmy
WorkingDirectory=/opt/huyenmy
ExecStart=/usr/bin/node --max-old-space-size=384 --env-file=/opt/huyenmy/.env server/index.js
Restart=always
RestartSec=3
[Install]
WantedBy=multi-user.target
```
```bash
systemctl daemon-reload && systemctl enable --now huyenmy && systemctl status huyenmy
```

## 6. nginx và HTTPS
`/etc/nginx/sites-available/huyenmy`:
```
server {
  server_name ten-mien-cua-ban.com www.ten-mien-cua-ban.com;
  location / {
    proxy_pass http://127.0.0.1:5173;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $remote_addr;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_buffering off;          # bắt buộc: để chữ của My hiện dần (SSE)
    proxy_read_timeout 300s;
  }
}
```
```bash
ln -s /etc/nginx/sites-available/huyenmy /etc/nginx/sites-enabled/ && nginx -t && systemctl reload nginx
certbot --nginx -d ten-mien-cua-ban.com -d www.ten-mien-cua-ban.com
```
Trước đó trỏ bản ghi **A** của tên miền (và www) về địa chỉ IP của máy chủ ở trang quản lý DNS.
`TRUST_PROXY=1` chỉ an toàn khi cổng 5173 không mở ra Internet (ufw ở bước 2 chỉ mở SSH, 80, 443).

## 7. Email (Resend)
Thêm tên miền trong Resend, rồi tạo đúng các bản ghi DNS (SPF, DKIM) mà Resend yêu cầu ở trang quản lý DNS của tên miền. Khi trạng thái là Verified thì mã đăng nhập mới gửi được.

## 8. Sao lưu hằng ngày
```bash
# crontab -e (user huyenmy)
15 3 * * * sqlite3 /var/lib/huyenmy/huyenmy.db ".backup '/var/lib/huyenmy/backup-$(date +\%a).db'"
```
(Đổi tên tệp `.db` đúng với tệp trong `DATA_DIR`.) Hãy chép bản sao ra ngoài máy chủ (rclone, scp…) và bật tính năng snapshot của nhà cung cấp.

## 9. Cập nhật phiên bản
```bash
cd /opt/huyenmy && sudo -u huyenmy git pull && sudo -u huyenmy npm ci && sudo -u huyenmy npm run build && systemctl restart huyenmy
```

## 10. Kiểm tra sau khi chạy
1. `https://ten-mien/api/status` trả về JSON, không báo DEMO.
2. Trò chuyện thử: chữ hiện dần chứ không hiện một lần cuối (nếu một lần là nginx còn buffer).
3. Đăng ký bằng email, nhận được mã, vào được `/admin` bằng email trong `ADMIN_EMAILS`.
4. Đặt hạn mức chi tiêu ở Anthropic và theo dõi chi phí vài ngày đầu.

## 11. Pháp lý và dữ liệu cá nhân (không phải tư vấn pháp lý)
App thu thập email, ngày giờ sinh, nội dung trò chuyện (khi người dùng đồng ý). Ở Việt Nam, việc xử lý dữ liệu cá nhân chịu Nghị định 13/2023/NĐ-CP (đồng ý rõ ràng, thông báo mục đích, quyền xóa). Hãy có trang chính sách quyền riêng tư và điều khoản, và hỏi luật sư về các thủ tục cần làm khi vận hành công khai.
