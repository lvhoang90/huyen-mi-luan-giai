#!/usr/bin/env bash
# Lấy người nổi tiếng từ Wikidata (CC0), đối chiếu bộ tự soạn, dựng bộ mới, build lại và khởi động lại. Chạy bằng root.
#   nohup bash /opt/huyenmy/deploy/refresh-famous.sh > /var/lib/huyenmy/famous.log 2>&1 &     (chạy nền, khoảng 10-15 phút)
#   tail -f /var/lib/huyenmy/famous.log
# Kết quả lưu ở /var/lib/huyenmy/famous-wikidata.js; update.sh sẽ tự áp dụng lại bộ này sau mỗi lần cập nhật mã.
set -euo pipefail
APP=/opt/huyenmy; DATA=/var/lib/huyenmy; RAW=$DATA/wikidata-raw.json; OUT=$DATA/famous-wikidata.js
cd "$APP"
echo "==> 1/4 Lấy dữ liệu từ Wikidata (có thể tiếp tục nếu bị ngắt: chạy lại lệnh này)"
node tools/fetch-famous.mjs --out "$RAW" --resume
echo "==> 2/4 Đối chiếu ngày sinh của bộ tự soạn với Wikidata"
node tools/merge-famous.mjs "$RAW" --audit || echo "(Có mục lệch ở trên: hãy xem lại; việc dựng bộ mới vẫn tiếp tục)"
echo "==> 3/4 Dựng bộ mới"
node tools/merge-famous.mjs "$RAW" --out "$OUT"
cp "$OUT" src/engine/famous-wikidata.js
echo "==> 4/4 Build và khởi động lại"
npx vite build --envDir "$(mktemp -d)"
systemctl restart huyenmy && sleep 2 && systemctl is-active huyenmy
echo "Xong."
