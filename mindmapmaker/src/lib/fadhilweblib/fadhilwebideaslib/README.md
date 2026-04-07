# fadhilwebideaslib

Sub-library di bawah `fadhilweblib` untuk fitur **Share Ideas Creator**.

## Tujuan

- Menjadikan `shareideas` sebagai creator ringan (folder + card + edit deskripsi).
- Menjaga arsitektur tetap mengikuti pola `game-ideas` yang sudah ada di repository.
- Menyimpan data ke PostgreSQL Railway melalui stack Prisma + `Map.snapshot` yang sudah dipakai fitur lain.

## Struktur yang dipakai

- `ShareIdeasReplicaPage.tsx`:
  - UI creator berbasis komponen `fadhilweblib` original.
  - Bisa add folder, add card di folder, edit deskripsi card.
  - Mendukung hirarki data terbaru: `Kategori > Folder > Card` dengan render fokus pada kategori aktif agar ringan.
  - Mendukung single-expanded terpisah: maksimal 1 folder expanded antar-folder, dan maksimal 1 card detail expanded antar-card.
  - Skema visual futuristik ringan: outline folder ultra-neon electric hack green + glow tipis, outline card ultra-neon light-blue electric + glow tipis, dan fill card marun gelap bergradasi.
  - Modal edit aman: klik di luar modal tidak menutup form; aksi hapus permanen tersedia via tombol **Delete** pada edit folder/card.
  - Auto-save debounce ringan ke endpoint server.
- `index.ts`: export publik komponen halaman.
- `@/features/shareideas/shared/schema.ts`:
  - Tipe data + sanitasi payload.
  - Default data kosong (`folders: []`) agar initial state benar-benar kosong.
- `@/features/shareideas/server/shareideas-service.ts`:
  - Service DB yang meniru pattern `game-ideas` (cache TTL, optimistic versioning, conflict handling).
  - Menyimpan ke record sistem `__SYSTEM__SHARE_IDEAS_V1` pada tabel `Map`.
- `@/app/api/shareideas/route.ts`:
  - API GET/PUT untuk load & save data creator.
- `@/app/shareideas/page.tsx`:
  - Route UI `shareideas`.

## Mekanika data (mengikuti reference game-ideas)

1. **GET `/api/shareideas`**
   - Jika record sistem belum ada, service membuat record baru dengan data kosong (`folders: []`).
   - Response mengembalikan `{ data, version, updatedAt }`.
2. **PUT `/api/shareideas`**
   - Client kirim `{ data, expectedVersion }`.
   - Service update dengan `updateMany` berbasis `version` untuk optimistic concurrency.
   - Jika bentrok versi, API return `409` dengan data terbaru server.
3. **Sanitasi ketat**
   - Folder/card tanpa nama valid dibuang.
   - Batas panjang id, nama, deskripsi diterapkan.

## Environment Railway PostgreSQL (tanpa mekanik DB baru)

Gunakan env yang sudah didukung di `src/lib/prisma.ts` (prioritas public host non-`railway.internal`):

- `DATABASE_PUBLIC_URL` (recommended di Vercel)
- `DATABASE_URL_PUBLIC`
- `POSTGRES_PRISMA_URL`
- `POSTGRES_URL_NON_POOLING`
- `POSTGRES_URL`
- `DATABASE_URL`

> Tidak ada tabel baru. Tetap memakai model Prisma `Map` yang sudah ada.

## Cara jalan lokal

Dari folder `mindmapmaker`:

```bash
npm install
npm run dev
```

Lalu buka:

- `http://localhost:3000/shareideas`

## Validasi cepat

- Saat database masih kosong: halaman menampilkan creator kosong (tanpa folder/card).
- Tambah folder → tambah card di dalam folder → edit deskripsi card.
- Reload halaman: data tetap tersimpan dari Railway PostgreSQL.
