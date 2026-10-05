#!/usr/bin/env bash
# Đặt một giá trị trong /opt/huyenmy/.env một cách an toàn rồi khởi động lại dịch vụ.
# Tự làm sạch ký tự lạ do dán vào terminal (ví dụ ESC[200~ của chế độ dán), nguyên nhân hay gặp khiến .env hỏng.
#   bash deploy/set-env.sh ANTHROPIC_API_KEY       # nhập ẩn, rồi Enter
#   bash deploy/set-env.sh HUYENMY_ACCESS_CODE
#   bash deploy/set-env.sh --check                 # liệt kê dòng .env có ký tự lạ (chỉ in tên khóa, không in giá trị)
set -euo pipefail
ENV=/opt/huyenmy/.env
if [ "${1:-}" = "--check" ]; then
  if grep -naP '[^\x20-\x7E]' "$ENV" | cut -d= -f1 | grep .; then echo "^ Các dòng trên có ký tự lạ: đặt lại bằng set-env.sh <TÊN_KHÓA>."; else echo "Sạch: không có ký tự lạ."; fi
  exit 0
fi
KEY="${1:?Cách dùng: bash deploy/set-env.sh TÊN_KHÓA   (hoặc --check)}"
case "$KEY" in *[!A-Z0-9_]*) echo "Tên khóa không hợp lệ."; exit 1;; esac
IFS= read -r -s -p "Nhập giá trị cho $KEY (chữ không hiện), rồi Enter: " V; echo
V=$(printf '%s' "$V" | sed -E 's/\x1b\[[0-9;?]*[ -\/]*[@-~]//g' | tr -cd '\041-\176')
[ -n "$V" ] || { echo "Giá trị rỗng, không đổi gì."; exit 1; }
echo "Độ dài sau khi làm sạch: ${#V} ký tự"
sed -i "/$KEY=/d" "$ENV"
printf '%s=%s\n' "$KEY" "$V" >> "$ENV"
chown root:huyenmy "$ENV"; chmod 640 "$ENV"
node --env-file="$ENV" -e 'process.exit(0)' || { echo "!! .env vẫn có dòng sai định dạng."; exit 1; }
systemctl restart huyenmy && sleep 2 && systemctl is-active huyenmy && echo "Đã áp dụng."
