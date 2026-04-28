# Deploy ke Cloudflare (tetap dukung Vercel)

Dokumen ini menyesuaikan migrasi frontend dari Vercel ke Cloudflare dan memperbaiki error build berikut pada 28 April 2026:

> Could not detect a directory containing static files (e.g. html, css and js) for the project

## Ringkasan arsitektur

- **Static frontend** dilayani Cloudflare (via static assets binding pada Worker).
- **Dynamic endpoint `/api/*`** bisa tetap memakai backend Vercel dengan mengatur `API_ORIGIN`.
- Konfigurasi Vercel lama tetap tersedia (`vercel.json`) agar rollback/multi-platform tetap aman.

## Kenapa build Cloudflare sebelumnya gagal

`npx wrangler deploy` butuh direktori static yang jelas. Repository ini sebelumnya belum memiliki konfigurasi `wrangler.toml` + assets directory, sehingga Wrangler gagal auto-detect.

## Perubahan yang sudah ditambahkan

- `wrangler.toml`
  - menambahkan `main` Worker entrypoint
  - menambahkan `[assets] directory = "."` agar static files terdeteksi jelas
  - menambahkan variabel `API_ORIGIN`
- `cloudflare/worker.mjs`
  - route non-API ke static assets
  - route `/api/*` diproxy ke `API_ORIGIN` (mis. domain Vercel)

## Setup Cloudflare

1. Pastikan project Cloudflare memakai repo ini.
2. Deploy command bisa tetap: `npx wrangler deploy`.
3. Set environment variable:
   - `API_ORIGIN=https://<deployment-vercel-anda>.vercel.app`
4. Jalankan deploy.

## Catatan kompatibilitas

- Untuk saat ini dynamic API tetap paling kompatibel di Vercel karena handler existing menggunakan pola `req/res` Node.js.
- Frontend tetap bisa dipindah ke Cloudflare tanpa memutus API lama.
