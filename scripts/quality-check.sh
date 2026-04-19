#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "[1/5] Validate vercel.json"
node -e "JSON.parse(require('fs').readFileSync('${ROOT_DIR}/vercel.json','utf8')); console.log('vercel.json valid')"

echo "[2/5] Build DreamBusiness engine bundle"
cd "${ROOT_DIR}"
npx --yes esbuild games/dreambusiness/dream-engine.ts \
  --bundle \
  --format=esm \
  --platform=browser \
  --tsconfig=website/mindmapmaker/tsconfig.json \
  --outfile=games/dreambusiness/dream-engine.bundle.js > /tmp/dreambusiness-esbuild.log
tail -n 2 /tmp/dreambusiness-esbuild.log || true

echo "[3/5] JS syntax check (DreamBusiness app)"
node --check games/dreambusiness/app.js

echo "[4/5] JS syntax check (DreamBusiness bundle)"
node --check games/dreambusiness/dream-engine.bundle.js

echo "[5/5] Lint mindmapmaker"
cd "${ROOT_DIR}/website/mindmapmaker"
npm run -s lint

echo "Quality check finished successfully."
