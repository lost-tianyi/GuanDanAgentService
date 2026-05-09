#!/usr/bin/env bash
# 运行 Playwright 诊断用例（需前后端已启动、client 已 npm install）
# 用法：在项目根目录: bash scripts/e2e-diagnose-click.sh
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/client"

if ! curl -sS --connect-timeout 2 "http://127.0.0.1:5173/" -o /dev/null; then
  echo "请先启动前端: cd client && npm run dev  (http://127.0.0.1:5173)"
  exit 1
fi
if ! curl -sS --connect-timeout 2 "http://127.0.0.1:3001/" -o /dev/null; then
  echo "请先启动后端: cd server && npm run dev  (http://127.0.0.1:3001)"
  exit 1
fi

if [[ ! -d node_modules/@playwright ]]; then
  echo "未找到 @playwright/test，请先: cd client && npm install"
  exit 1
fi

npx playwright install chromium 2>/dev/null || true
npx playwright test e2e/diagnose-play-button.spec.ts "$@"
