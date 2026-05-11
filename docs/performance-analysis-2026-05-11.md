# Analisa Pendalaman Performa Loading Subdirektori Website (2026-05-11)

## Ringkasan masalah utama
Dari konfigurasi worker saat ini, mayoritas subdirektori mengalami loading berulang lebih lambat karena:
1. **Aset non-fingerprinted dipaksa revalidasi setiap navigasi** (`max-age=0, must-revalidate`) sehingga browser selalu melakukan conditional request sebelum pakai cache lokal.
2. **Tidak ada `stale-if-error`** sehingga resilience saat origin/CDN error belum optimal.
3. **Kebijakan cache dokumen HTML terlalu pendek untuk edge** untuk pola trafik multi-page/subdirektori.

## Data & standar resmi yang dipakai
- MDN Cache-Control reference (last updated 2026):
  - `immutable` untuk aset hashed.
  - `stale-while-revalidate` dan `stale-if-error` untuk latensi + reliability.
  - https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Cache-Control
- MDN HTTP Caching guide:
  - `max-age=0` + `must-revalidate` menyebabkan reuse harus validasi.
  - https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching
- Cloudflare changelog (2026-02-26) tentang SWR asynchronous behavior:
  - SWR modern di edge meningkatkan hit ratio pada aset kadaluarsa.
  - https://developers.cloudflare.com/changelog/post/2026-02-26-async-stale-while-revalidate/
- web.dev LCP optimization (updated 2025-03-31):
  - TTFB, discovery resource kritikal, dan cache policy berpengaruh langsung ke LCP.
  - https://web.dev/optimize-lcp/

## Perbaikan yang diterapkan di codebase
1. **HTML policy di edge diperpanjang moderat + fault tolerance**
   - Dari: `s-maxage=60, stale-while-revalidate=300`
   - Menjadi: `s-maxage=120, stale-while-revalidate=600, stale-if-error=86400`
2. **Aset non-hashed kini bisa dipakai dari browser cache selama 1 jam**
   - Dari: `max-age=0, must-revalidate, s-maxage=86400, stale-while-revalidate=604800`
   - Menjadi: `max-age=3600, s-maxage=2592000, stale-while-revalidate=604800, stale-if-error=604800`
3. **Menetapkan `Vary: Accept-Encoding`** agar cache tersegmentasi benar antar varian kompresi.

## Dampak yang diharapkan
- Pengurangan request validasi berulang pada page-to-page navigation lintas subdirektori.
- TTFB efektif lebih rendah untuk repeat visits.
- Resiliensi lebih baik saat gangguan origin sementara.

## Next best steps (direkomendasikan)
1. Terapkan fingerprinting pada seluruh CSS/JS/image utama agar dapat `immutable` 1 tahun.
2. Tambahkan preload untuk LCP image/font per halaman utama.
3. Ukur Real User Monitoring (RUM): LCP p75, INP p75, CLS p75 per subdirektori.
4. Jalankan Lighthouse CI mobile throttling untuk `/`, `/home`, `/archives`, `/mindmapmaker`, `/daily-streak`, `/hype`, `/dreambusiness`, `/rpg`.
