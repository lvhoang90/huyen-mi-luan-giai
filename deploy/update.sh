#!/usr/bin/env bash
# Cập nhật phiên bản mới: chạy bằng root.  bash /opt/huyenmy/deploy/update.sh [nhánh]
set -euo pipefail
cd /opt/huyenmy
BRANCH="${1:-$(git rev-parse --abbrev-ref HEAD)}"
git fetch origin "$BRANCH" && git checkout "$BRANCH" && git pull --ff-only origin "$BRANCH"
npm ci --no-audit --no-fund && npm run build
systemctl restart huyenmy && sleep 2 && systemctl is-active huyenmy && curl -fsS http://127.0.0.1:5173/api/status && echo
