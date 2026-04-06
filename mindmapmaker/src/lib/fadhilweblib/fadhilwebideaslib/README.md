# fadhilwebideaslib

Sub-library di bawah `fadhilweblib` untuk host integrasi fitur `/shareideas`.

## Fokus

- Menjadi jembatan library ke folder utama `src/shareideas`.
- Menjaga kompatibilitas UI + logic dengan replikasi `game-ideas`.
- Berdiri mandiri tanpa impor langsung ke route `/game-ideas`.

## Isi

- `ShareIdeasReplicaPage.tsx`: wrapper runtime untuk memasang `ShareIdeasPage` dari `src/shareideas`.
- `index.ts`: export publik.
