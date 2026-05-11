# Complete Audit — fadhil.dev

Generated: 2026-05-11T11:25:47Z

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
- Duplicate file groups (all): 35
- Total LOC (repository): 94095
- Code LOC (repository): 84460
- Potential unused static files: 0
- Deprecated pattern hits: 0
- Missing security headers (CSP/HSTS/XCTO/Referrer): 0
- Avg response time (ms): 100.7
- P95 response time (ms): 142.1
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
| `/` | 200 | — | 92.4 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/archives` | 200 | — | 87.2 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/books` | 200 | — | 114.2 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/books/editor` | 200 | — | 159.7 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/daily-streak` | 200 | — | 120.3 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/dreambusiness` | 200 | — | 142.1 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/home` | 200 | — | 123.4 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/hype` | 200 | — | 108.6 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/mindmapmaker` | 200 | — | 90.9 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/mindmapmaker/editor/1` | 200 | — | 68.2 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/rpg` | 200 | — | 94.9 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/shareideas` | 200 | — | 47.8 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/shareideas/page/1` | 200 | — | 60.0 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

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
| `/robots.txt` | 200 | 65.1 | `user-agent-ok,sitemap-ok` |
| `/sitemap.xml` | 200 | 70.5 | `url-count=12` |

## Local Crawl Asset Audit (Repository)

- robots.txt exists: yes
- sitemap.xml exists: yes
- robots user-agent wildcard: yes
- robots sitemap directive: yes
- local sitemap URL count: 12
- local sitemap coverage gap: 0

## Duplicate File Analysis (Top 30)

### Group 1 — files: 3, bytes: 29067, family: fadhilweblib-mirror
Recommended keep: `library/fadhilweblib/styles/theme.css`
| File | Refs (exact path) | Refs (basename) | Active Scope | Recommended Keep | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|:---:|
| `library/fadhilweblib/styles/theme.css` | 4 | 15 | ✅ | ✅ | ❌ |
| `website/home/theme.css` | 2 | 15 | ✅ | ❌ | ❌ |
| `website/website/mindmapmaker/theme.css` | 2 | 15 | ✅ | ❌ | ❌ |

### Group 2 — files: 2, bytes: 3974, family: fadhilweblib-mirror
Recommended keep: `library/fadhilweblib/components/layout/surface.tsx`
| File | Refs (exact path) | Refs (basename) | Active Scope | Recommended Keep | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|:---:|
| `library/fadhilweblib/components/layout/surface.tsx` | 4 | 6 | ✅ | ✅ | ❌ |
| `website/mindmapmaker/src/lib/fadhilweblib/components/layout/surface.tsx` | 2 | 6 | ✅ | ❌ | ❌ |

### Group 3 — files: 2, bytes: 3858, family: fadhilweblib-mirror
Recommended keep: `library/fadhilweblib/components/forms/range.tsx`
| File | Refs (exact path) | Refs (basename) | Active Scope | Recommended Keep | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|:---:|
| `library/fadhilweblib/components/forms/range.tsx` | 4 | 6 | ✅ | ✅ | ❌ |
| `website/mindmapmaker/src/lib/fadhilweblib/components/forms/range.tsx` | 2 | 6 | ✅ | ❌ | ❌ |

### Group 4 — files: 2, bytes: 3832, family: fadhilweblib-mirror
Recommended keep: `library/fadhilweblib/components/navigation/breadcrumbs.tsx`
| File | Refs (exact path) | Refs (basename) | Active Scope | Recommended Keep | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|:---:|
| `library/fadhilweblib/components/navigation/breadcrumbs.tsx` | 4 | 6 | ✅ | ✅ | ❌ |
| `website/mindmapmaker/src/lib/fadhilweblib/components/navigation/breadcrumbs.tsx` | 2 | 6 | ✅ | ❌ | ❌ |

### Group 5 — files: 2, bytes: 3612, family: fadhilweblib-mirror
Recommended keep: `library/fadhilweblib/core/use-stepper.ts`
| File | Refs (exact path) | Refs (basename) | Active Scope | Recommended Keep | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|:---:|
| `library/fadhilweblib/core/use-stepper.ts` | 4 | 6 | ✅ | ✅ | ❌ |
| `website/mindmapmaker/src/lib/fadhilweblib/core/use-stepper.ts` | 2 | 6 | ✅ | ❌ | ❌ |

### Group 6 — files: 2, bytes: 3604, family: fadhilweblib-mirror
Recommended keep: `library/fadhilweblib/core/state-syntax-test.ts`
| File | Refs (exact path) | Refs (basename) | Active Scope | Recommended Keep | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|:---:|
| `library/fadhilweblib/core/state-syntax-test.ts` | 4 | 6 | ✅ | ✅ | ❌ |
| `website/mindmapmaker/src/lib/fadhilweblib/core/state-syntax-test.ts` | 2 | 6 | ✅ | ❌ | ❌ |

### Group 7 — files: 2, bytes: 3286, family: fadhilweblib-mirror
Recommended keep: `library/fadhilweblib/components/forms/select.tsx`
| File | Refs (exact path) | Refs (basename) | Active Scope | Recommended Keep | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|:---:|
| `library/fadhilweblib/components/forms/select.tsx` | 4 | 6 | ✅ | ✅ | ❌ |
| `website/mindmapmaker/src/lib/fadhilweblib/components/forms/select.tsx` | 2 | 6 | ✅ | ❌ | ❌ |

### Group 8 — files: 2, bytes: 3264, family: fadhilweblib-mirror
Recommended keep: `library/fadhilweblib/components/action-group.tsx`
| File | Refs (exact path) | Refs (basename) | Active Scope | Recommended Keep | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|:---:|
| `library/fadhilweblib/components/action-group.tsx` | 4 | 6 | ✅ | ✅ | ❌ |
| `website/mindmapmaker/src/lib/fadhilweblib/components/action-group.tsx` | 2 | 6 | ✅ | ❌ | ❌ |

### Group 9 — files: 2, bytes: 3226, family: fadhilweblib-mirror
Recommended keep: `library/fadhilweblib/components/forms/textarea.tsx`
| File | Refs (exact path) | Refs (basename) | Active Scope | Recommended Keep | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|:---:|
| `library/fadhilweblib/components/forms/textarea.tsx` | 4 | 6 | ✅ | ✅ | ❌ |
| `website/mindmapmaker/src/lib/fadhilweblib/components/forms/textarea.tsx` | 2 | 6 | ✅ | ❌ | ❌ |

### Group 10 — files: 2, bytes: 3188, family: fadhilweblib-mirror
Recommended keep: `library/fadhilweblib/components/layout/container.tsx`
| File | Refs (exact path) | Refs (basename) | Active Scope | Recommended Keep | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|:---:|
| `library/fadhilweblib/components/layout/container.tsx` | 4 | 6 | ✅ | ✅ | ❌ |
| `website/mindmapmaker/src/lib/fadhilweblib/components/layout/container.tsx` | 2 | 6 | ✅ | ❌ | ❌ |

### Group 11 — files: 2, bytes: 3180, family: fadhilweblib-mirror
Recommended keep: `library/fadhilweblib/components/feedback/key-value-list.tsx`
| File | Refs (exact path) | Refs (basename) | Active Scope | Recommended Keep | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|:---:|
| `library/fadhilweblib/components/feedback/key-value-list.tsx` | 4 | 6 | ✅ | ✅ | ❌ |
| `website/mindmapmaker/src/lib/fadhilweblib/components/feedback/key-value-list.tsx` | 2 | 6 | ✅ | ❌ | ❌ |

### Group 12 — files: 2, bytes: 3162, family: fadhilweblib-mirror
Recommended keep: `library/fadhilweblib/components/forms/input.tsx`
| File | Refs (exact path) | Refs (basename) | Active Scope | Recommended Keep | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|:---:|
| `library/fadhilweblib/components/forms/input.tsx` | 4 | 6 | ✅ | ✅ | ❌ |
| `website/mindmapmaker/src/lib/fadhilweblib/components/forms/input.tsx` | 2 | 6 | ✅ | ❌ | ❌ |

### Group 13 — files: 2, bytes: 2958, family: fadhilweblib-mirror
Recommended keep: `library/fadhilweblib/core/dialog-test.ts`
| File | Refs (exact path) | Refs (basename) | Active Scope | Recommended Keep | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|:---:|
| `library/fadhilweblib/core/dialog-test.ts` | 4 | 6 | ✅ | ✅ | ❌ |
| `website/mindmapmaker/src/lib/fadhilweblib/core/dialog-test.ts` | 2 | 6 | ✅ | ❌ | ❌ |

### Group 14 — files: 2, bytes: 2892, family: fadhilweblib-mirror
Recommended keep: `library/fadhilweblib/components/inline.tsx`
| File | Refs (exact path) | Refs (basename) | Active Scope | Recommended Keep | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|:---:|
| `library/fadhilweblib/components/inline.tsx` | 4 | 6 | ✅ | ✅ | ❌ |
| `website/mindmapmaker/src/lib/fadhilweblib/components/inline.tsx` | 2 | 6 | ✅ | ❌ | ❌ |

### Group 15 — files: 2, bytes: 2804, family: fadhilweblib-mirror
Recommended keep: `library/fadhilweblib/core/roving-focus-test.ts`
| File | Refs (exact path) | Refs (basename) | Active Scope | Recommended Keep | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|:---:|
| `library/fadhilweblib/core/roving-focus-test.ts` | 4 | 6 | ✅ | ✅ | ❌ |
| `website/mindmapmaker/src/lib/fadhilweblib/core/roving-focus-test.ts` | 2 | 6 | ✅ | ❌ | ❌ |

### Group 16 — files: 2, bytes: 2634, family: fadhilweblib-mirror
Recommended keep: `library/fadhilweblib/core/disclosure-test.ts`
| File | Refs (exact path) | Refs (basename) | Active Scope | Recommended Keep | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|:---:|
| `library/fadhilweblib/core/disclosure-test.ts` | 4 | 6 | ✅ | ✅ | ❌ |
| `website/mindmapmaker/src/lib/fadhilweblib/core/disclosure-test.ts` | 2 | 6 | ✅ | ❌ | ❌ |

### Group 17 — files: 2, bytes: 2370, family: fadhilweblib-mirror
Recommended keep: `library/fadhilweblib/components/feedback/skeleton.tsx`
| File | Refs (exact path) | Refs (basename) | Active Scope | Recommended Keep | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|:---:|
| `library/fadhilweblib/components/feedback/skeleton.tsx` | 4 | 6 | ✅ | ✅ | ❌ |
| `website/mindmapmaker/src/lib/fadhilweblib/components/feedback/skeleton.tsx` | 2 | 6 | ✅ | ❌ | ❌ |

### Group 18 — files: 2, bytes: 2292, family: fadhilweblib-mirror
Recommended keep: `library/fadhilweblib/components/stack.tsx`
| File | Refs (exact path) | Refs (basename) | Active Scope | Recommended Keep | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|:---:|
| `library/fadhilweblib/components/stack.tsx` | 4 | 6 | ✅ | ✅ | ❌ |
| `website/mindmapmaker/src/lib/fadhilweblib/components/stack.tsx` | 2 | 6 | ✅ | ❌ | ❌ |

### Group 19 — files: 2, bytes: 2126, family: fadhilweblib-mirror
Recommended keep: `library/fadhilweblib/core/use-controllable-state.ts`
| File | Refs (exact path) | Refs (basename) | Active Scope | Recommended Keep | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|:---:|
| `library/fadhilweblib/core/use-controllable-state.ts` | 4 | 6 | ✅ | ✅ | ❌ |
| `website/mindmapmaker/src/lib/fadhilweblib/core/use-controllable-state.ts` | 2 | 6 | ✅ | ❌ | ❌ |

### Group 20 — files: 2, bytes: 2110, family: fadhilweblib-mirror
Recommended keep: `library/fadhilweblib/components/header-shell-module.css`
| File | Refs (exact path) | Refs (basename) | Active Scope | Recommended Keep | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|:---:|
| `library/fadhilweblib/components/header-shell-module.css` | 4 | 7 | ✅ | ✅ | ❌ |
| `website/mindmapmaker/src/lib/fadhilweblib/components/header-shell-module.css` | 2 | 7 | ✅ | ❌ | ❌ |

### Group 21 — files: 2, bytes: 2022, family: fadhilweblib-mirror
Recommended keep: `library/fadhilweblib/core/theme-scope-test.ts`
| File | Refs (exact path) | Refs (basename) | Active Scope | Recommended Keep | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|:---:|
| `library/fadhilweblib/core/theme-scope-test.ts` | 4 | 6 | ✅ | ✅ | ❌ |
| `website/mindmapmaker/src/lib/fadhilweblib/core/theme-scope-test.ts` | 2 | 6 | ✅ | ❌ | ❌ |

### Group 22 — files: 3, bytes: 1971, family: general
Recommended keep: `website/assets/public/music1-fadhil.mp3`
| File | Refs (exact path) | Refs (basename) | Active Scope | Recommended Keep | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|:---:|
| `assets/music1-fadhil.mp3` | 4 | 11 | ❌ | ❌ | ❌ |
| `assets/public/music1-fadhil.mp3` | 8 | 11 | ❌ | ❌ | ❌ |
| `website/assets/public/music1-fadhil.mp3` | 4 | 11 | ✅ | ✅ | ❌ |

### Group 23 — files: 2, bytes: 1934, family: fadhilweblib-mirror
Recommended keep: `library/fadhilweblib/components/layout/section-module.css`
| File | Refs (exact path) | Refs (basename) | Active Scope | Recommended Keep | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|:---:|
| `library/fadhilweblib/components/layout/section-module.css` | 4 | 7 | ✅ | ✅ | ❌ |
| `website/mindmapmaker/src/lib/fadhilweblib/components/layout/section-module.css` | 2 | 7 | ✅ | ❌ | ❌ |

### Group 24 — files: 2, bytes: 1772, family: fadhilweblib-mirror
Recommended keep: `library/fadhilweblib/components/layout-module.css`
| File | Refs (exact path) | Refs (basename) | Active Scope | Recommended Keep | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|:---:|
| `library/fadhilweblib/components/layout-module.css` | 4 | 10 | ✅ | ✅ | ❌ |
| `website/mindmapmaker/src/lib/fadhilweblib/components/layout-module.css` | 2 | 10 | ✅ | ❌ | ❌ |

### Group 25 — files: 2, bytes: 1708, family: fadhilweblib-mirror
Recommended keep: `library/fadhilweblib/core/selection-test.ts`
| File | Refs (exact path) | Refs (basename) | Active Scope | Recommended Keep | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|:---:|
| `library/fadhilweblib/core/selection-test.ts` | 4 | 6 | ✅ | ✅ | ❌ |
| `website/mindmapmaker/src/lib/fadhilweblib/core/selection-test.ts` | 2 | 6 | ✅ | ❌ | ❌ |

### Group 26 — files: 2, bytes: 1532, family: fadhilweblib-mirror
Recommended keep: `library/fadhilweblib/components/forms/field-module.css`
| File | Refs (exact path) | Refs (basename) | Active Scope | Recommended Keep | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|:---:|
| `library/fadhilweblib/components/forms/field-module.css` | 4 | 7 | ✅ | ✅ | ❌ |
| `website/mindmapmaker/src/lib/fadhilweblib/components/forms/field-module.css` | 2 | 7 | ✅ | ❌ | ❌ |

### Group 27 — files: 2, bytes: 1464, family: fadhilweblib-mirror
Recommended keep: `library/fadhilweblib/components/action-group-module.css`
| File | Refs (exact path) | Refs (basename) | Active Scope | Recommended Keep | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|:---:|
| `library/fadhilweblib/components/action-group-module.css` | 4 | 8 | ✅ | ✅ | ❌ |
| `website/mindmapmaker/src/lib/fadhilweblib/components/action-group-module.css` | 2 | 8 | ✅ | ❌ | ❌ |

### Group 28 — files: 2, bytes: 1348, family: fadhilweblib-mirror
Recommended keep: `library/fadhilweblib/core/stepper-test.ts`
| File | Refs (exact path) | Refs (basename) | Active Scope | Recommended Keep | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|:---:|
| `library/fadhilweblib/core/stepper-test.ts` | 4 | 6 | ✅ | ✅ | ❌ |
| `website/mindmapmaker/src/lib/fadhilweblib/core/stepper-test.ts` | 2 | 6 | ✅ | ❌ | ❌ |

### Group 29 — files: 2, bytes: 1240, family: fadhilweblib-mirror
Recommended keep: `library/fadhilweblib/core/types/layout.ts`
| File | Refs (exact path) | Refs (basename) | Active Scope | Recommended Keep | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|:---:|
| `library/fadhilweblib/core/types/layout.ts` | 4 | 6 | ✅ | ✅ | ❌ |
| `website/mindmapmaker/src/lib/fadhilweblib/core/types/layout.ts` | 2 | 6 | ✅ | ❌ | ❌ |

### Group 30 — files: 2, bytes: 520, family: fadhilweblib-mirror
Recommended keep: `library/fadhilweblib/core/cx-test.ts`
| File | Refs (exact path) | Refs (basename) | Active Scope | Recommended Keep | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|:---:|
| `library/fadhilweblib/core/cx-test.ts` | 4 | 6 | ✅ | ✅ | ❌ |
| `website/mindmapmaker/src/lib/fadhilweblib/core/cx-test.ts` | 2 | 6 | ✅ | ❌ | ❌ |

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
- Total lines: 94095
- Code lines: 84460
- Blank lines: 7786
- Comment lines: 1849

| Extension | Files | Total | Code | Blank | Comment |
|---|---:|---:|---:|---:|---:|
| `.css` | 60 | 10214 | 7517 | 1079 | 1618 |
| `.html` | 18 | 2257 | 2134 | 116 | 7 |
| `.js` | 33 | 19574 | 18174 | 1327 | 73 |
| `.json` | 10 | 9512 | 9512 | 0 | 0 |
| `.jsonc` | 1 | 17 | 17 | 0 | 0 |
| `.mjs` | 1 | 27 | 22 | 5 | 0 |
| `.py` | 2 | 1069 | 916 | 145 | 8 |
| `.sh` | 2 | 46 | 28 | 11 | 7 |
| `.sql` | 6 | 87 | 65 | 10 | 12 |
| `.svg` | 1 | 3 | 3 | 0 | 0 |
| `.toml` | 1 | 12 | 11 | 1 | 0 |
| `.ts` | 200 | 30230 | 26804 | 3352 | 74 |
| `.tsx` | 114 | 20901 | 19144 | 1727 | 30 |
| `.txt` | 1 | 20 | 14 | 5 | 1 |
| `.xml` | 1 | 63 | 63 | 0 | 0 |
| `[no-ext]` | 7 | 63 | 36 | 8 | 19 |

## Deprecated Code Audit

- Total pattern hits: 0
- Files with hits: 0

| Pattern | Hits |
|---|---:|
