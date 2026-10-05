#!/usr/bin/env bash
# Cập nhật phiên bản mới: chạy bằng root.  bash /opt/huyenmy/deploy/update.sh [nhánh]
set -euo pipefail
cd /opt/huyenmy
BRANCH="${1:-$(git rev-parse --abbrev-ref HEAD)}"
git checkout -- src/engine/famous-wikidata.js 2>/dev/null || true   # bỏ bản dữ liệu Wikidata đã chép vào (sẽ chép lại sau khi cập nhật)
git fetch origin "$BRANCH" && git checkout "$BRANCH" && git pull --ff-only origin "$BRANCH"
[ -f /var/lib/huyenmy/famous-wikidata.js ] && cp /var/lib/huyenmy/famous-wikidata.js src/engine/famous-wikidata.js
npm ci --no-audit --no-fund && npm run build
systemctl restart huyenmy && sleep 2 && systemctl is-active huyenmy && curl -fsS http://127.0.0.1:5173/api/status && echo
