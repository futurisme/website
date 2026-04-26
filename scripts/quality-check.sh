#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "[1/7] Regenerate crawl assets (robots + sitemap)"
cd "${ROOT_DIR}"
python3 scripts/generate-crawl-assets.py > /tmp/generate-crawl-assets.log
tail -n 3 /tmp/generate-crawl-assets.log || true

echo "[2/7] Validate vercel.json"
node -e "JSON.parse(require('fs').readFileSync('${ROOT_DIR}/vercel.json','utf8')); console.log('vercel.json valid')"

echo "[3/7] Build DreamBusiness engine bundle"
cd "${ROOT_DIR}"
npx --yes esbuild games/dreambusiness/dream-engine.ts \
  --bundle \
  --format=esm \
  --platform=browser \
  --tsconfig=website/mindmapmaker/tsconfig.json \
  --outfile=games/dreambusiness/dream-engine-bundle.js > /tmp/dreambusiness-esbuild.log
tail -n 2 /tmp/dreambusiness-esbuild.log || true

echo "[4/7] JS syntax check (DreamBusiness app)"
node --check games/dreambusiness/app.js

echo "[5/7] JS syntax check (DreamBusiness bundle)"
node --check games/dreambusiness/dream-engine-bundle.js

echo "[6/7] Lint mindmapmaker"
cd "${ROOT_DIR}/website/mindmapmaker"
npm run -s lint

echo "[7/7] Complete audit (domain + duplicates + static-unused)"
cd "${ROOT_DIR}"
python3 scripts/complete-audit.py > /tmp/complete-audit.log
tail -n 2 /tmp/complete-audit.log || true

echo "Quality check finished successfully."
