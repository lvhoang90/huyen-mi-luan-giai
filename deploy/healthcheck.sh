#!/usr/bin/env bash
# Giám sát đơn giản (cron chạy mỗi 5 phút, bằng root): app không trả lời thì tự khởi động lại và gửi email báo cho quản trị.
# Cũng báo khi ổ đĩa đầy trên 85%. Không gửi quá một thư mỗi 30 phút. Bản quyền © 2026 Lương Việt Hoàng. Bảo lưu mọi quyền.
ENV=/opt/huyenmy/.env; STATE=/var/lib/huyenmy/health.last; PORT=5173
val() { grep -E "^$1=" "$ENV" 2>/dev/null | head -1 | cut -d= -f2- | tr -d '"'; }
alert() {  # $1 = tiêu đề, $2 = nội dung (chỉ chữ không dấu nháy, để ghép JSON an toàn)
  local now last=0; now=$(date +%s); [ -f "$STATE" ] && last=$(cat "$STATE")
  logger -t huyenmy-health "$1"
  [ $((now - last)) -lt 1800 ] && return 0
  echo "$now" > "$STATE"
  local key to from; key=$(val RESEND_API_KEY); to=$(val ADMIN_EMAILS | cut -d, -f1); from=$(val MAIL_FROM)
  [ -n "$key" ] && [ -n "$to" ] && curl -fsS -m 15 https://api.resend.com/emails -H "Authorization: Bearer $key" -H 'Content-Type: application/json' \
    -d "{\"from\":\"${from:-onboarding@resend.dev}\",\"to\":[\"$to\"],\"subject\":\"$1\",\"text\":\"$2\"}" >/dev/null 2>&1
  return 0
}
up() { curl -fsS -m 10 "http://127.0.0.1:$PORT/api/status" >/dev/null 2>&1; }
if ! up; then
  systemctl restart huyenmy; sleep 6
  if up; then alert "Huyen My da tu khoi dong lai" "App khong tra loi nen da duoc khoi dong lai tu dong. Xem nhat ky: journalctl -u huyenmy -n 50"
  else alert "Huyen My KHONG chay duoc" "App van khong tra loi sau khi khoi dong lai. Hay SSH vao may chu va xem: journalctl -u huyenmy -n 50"; fi
fi
USE=$(df / --output=pcent 2>/dev/null | tail -1 | tr -dc 0-9)
[ -n "$USE" ] && [ "$USE" -ge 85 ] && alert "May chu Huyen My sap day o dia" "O dia da dung ${USE} phan tram. Hay don dep hoac nang cap."
exit 0
