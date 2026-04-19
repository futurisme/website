# DreamBusiness

Folder ini adalah proyek game standalone di level root repository.

## Struktur

- `index.html`, `styles.css`, `app.js`: halaman standalone untuk `https://fadhil.dev/games/dreambusiness`.
- `dream-engine.ts`: entry rebranding engine yang **mengimpor mekanisme asli** dari:
  - `mindmapmaker/src/features/gameplay/simulation-engine.ts`
- `dream-engine.bundle.js`: hasil bundle browser dari `dream-engine.ts`.
- `games/dreambusiness/*`: source UI React DreamBusiness existing.

## Catatan

Mekanisme simulasi tetap memakai engine existing (tanpa membuat mekanisme baru),
sekarang berada rapi di `games/dreambusiness` sebagai proyek game tersendiri.

## Quality Check

Untuk validasi cepat repository + DreamBusiness runtime, jalankan:

```bash
./scripts/quality-check.sh
```
