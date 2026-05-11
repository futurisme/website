# Complete Audit — fadhil.dev

Generated: 2026-05-11T11:29:36Z

## Executive Summary

- Base URL: `https://fadhil.dev`
- Paths checked: 13
- HTTP 200: 13
- Errors (non-200/redirect): 0
- Missing meta description: 0
- Missing canonical: 0
- Missing H1: 0
- Missing HTML lang: 0
- Missing OG title: 0
- Missing OG description: 0
- Missing twitter:card: 0
- Missing JSON-LD: 0
- Duplicate file groups (all): 0
- Total LOC (repository): 91857
- Code LOC (repository): 82741
- Potential unused static files: 0
- Deprecated pattern hits: 0
- Missing security headers (CSP/HSTS/XCTO/Referrer): 0
- Avg response time (ms): 226.4
- P95 response time (ms): 431.9
- Vercel route target issues: 0
- Vercel build glob issues: 0
- robots.txt status: 200
- sitemap.xml status: 200
- Sitemap URL count: 12
- Sitemap coverage gap (audited routes not in sitemap): 0
- Local robots/sitemap ready: yes
- Local sitemap coverage gap: 0

## Domain Route Audit

| Path | Status | Redirect | Time (ms) | Meta Desc | Canonical | H1 | OG | Tw | JSON-LD | HTTPS | SecHdr | Deprecated |
|---|---:|:---:|---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| `/` | 200 | — | 224.5 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/archives` | 200 | — | 220.1 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/books` | 200 | — | 218.5 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/books/editor` | 200 | — | 492.5 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/daily-streak` | 200 | — | 431.9 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/dreambusiness` | 200 | — | 95.8 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/home` | 200 | — | 391.0 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/hype` | 200 | — | 215.6 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/mindmapmaker` | 200 | — | 81.5 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/mindmapmaker/editor/1` | 200 | — | 108.7 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/rpg` | 200 | — | 119.8 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/shareideas` | 200 | — | 90.9 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/shareideas/page/1` | 200 | — | 252.7 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

## Security Header Coverage (HTTP 200 pages)

| Header | Missing Count |
|---|---:|
| `content-security-policy` | 0 |
| `strict-transport-security` | 0 |
| `x-content-type-options` | 0 |
| `referrer-policy` | 0 |

## Vercel Target Integrity

- Route target issues: 0
- Build glob issues: 0

## Crawl Support Audit (robots + sitemap)

| Endpoint | Status | Time (ms) | Notes |
|---|---:|---:|---|
| `/robots.txt` | 200 | 117.7 | `user-agent-ok,sitemap-ok` |
| `/sitemap.xml` | 200 | 65.1 | `url-count=12` |

## Local Crawl Asset Audit (Repository)

- robots.txt exists: yes
- sitemap.xml exists: yes
- robots user-agent wildcard: yes
- robots sitemap directive: yes
- local sitemap URL count: 12
- local sitemap coverage gap: 0

## Duplicate File Analysis (Top 30)

## Static Unused File Audit (High Confidence)

- Candidate files scanned: 0
- Used via vercel config: 0
- Used via exact references: 0
- Potential unused files: 0

| Extension | Count |
|---|---:|

| Potential unused file | Exact path refs |
|---|---:|

### Notes

- Static-unused audit skipped because vercel.json routes/builds are unavailable in current repository topology.
- Worker-based routing should be audited from src/index.js mapping instead.

## LOC Audit (Whole Repository)

- Tracked files scanned: 458
- Total lines: 91857
- Code lines: 82741
- Blank lines: 7616
- Comment lines: 1500

| Extension | Files | Total | Code | Blank | Comment |
|---|---:|---:|---:|---:|---:|
| `.css` | 60 | 9487 | 7239 | 983 | 1265 |
| `.html` | 18 | 2257 | 2134 | 116 | 7 |
| `.js` | 33 | 19574 | 18174 | 1327 | 73 |
| `.json` | 10 | 8852 | 8852 | 0 | 0 |
| `.jsonc` | 1 | 17 | 17 | 0 | 0 |
| `.mjs` | 1 | 27 | 22 | 5 | 0 |
| `.py` | 2 | 1069 | 916 | 145 | 8 |
| `.sh` | 2 | 46 | 28 | 11 | 7 |
| `.sql` | 6 | 87 | 65 | 10 | 12 |
| `.svg` | 1 | 3 | 3 | 0 | 0 |
| `.toml` | 1 | 12 | 11 | 1 | 0 |
| `.ts` | 200 | 29907 | 26526 | 3304 | 77 |
| `.tsx` | 114 | 20373 | 18641 | 1701 | 31 |
| `.txt` | 1 | 20 | 14 | 5 | 1 |
| `.xml` | 1 | 63 | 63 | 0 | 0 |
| `[no-ext]` | 7 | 63 | 36 | 8 | 19 |

## Deprecated Code Audit

- Total pattern hits: 0
- Files with hits: 0

| Pattern | Hits |
|---|---:|
