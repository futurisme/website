# fadhilwebideaslib

Sub-library di bawah `fadhilweblib` untuk integrasi fitur **root** `/shareideas`.

## Fokus

- Menjaga `fadhilwebideaslib` tetap berada sebagai child dari `fadhilweblib`.
- Menyediakan komponen bridge ringan untuk menampilkan `/shareideas` dari root repository.
- Tidak bergantung ke route internal `game-ideas`.

## Isi

- `ShareIdeasReplicaPage.tsx`: wrapper iframe ke endpoint `/shareideas`.
- `index.ts`: export publik.
