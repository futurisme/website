# Complete Audit — fadhil.dev

Generated: 2026-05-11T11:05:54Z

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
- Duplicate file groups (all): 64
- Total LOC (repository): 96635
- Code LOC (repository): 86733
- Potential unused static files: 0
- Deprecated pattern hits: 0
- Missing security headers (CSP/HSTS/XCTO/Referrer): 0
- Avg response time (ms): 184.3
- P95 response time (ms): 256.9
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
| `/` | 200 | — | 326.2 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/archives` | 200 | — | 256.9 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/books` | 200 | — | 216.8 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/books/editor` | 200 | — | 185.4 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/daily-streak` | 200 | — | 230.2 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/dreambusiness` | 200 | — | 157.9 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/home` | 200 | — | 229.3 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/hype` | 200 | — | 141.0 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/mindmapmaker` | 200 | — | 154.6 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/mindmapmaker/editor/1` | 200 | — | 95.5 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/rpg` | 200 | — | 85.8 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/shareideas` | 200 | — | 165.3 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/shareideas/page/1` | 200 | — | 151.4 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

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
| `/robots.txt` | 200 | 124.5 | `user-agent-ok,sitemap-ok` |
| `/sitemap.xml` | 200 | 53.0 | `url-count=12` |

## Local Crawl Asset Audit (Repository)

- robots.txt exists: yes
- sitemap.xml exists: yes
- robots user-agent wildcard: yes
- robots sitemap directive: yes
- local sitemap URL count: 12
- local sitemap coverage gap: 0

## Duplicate File Analysis (Top 25)

### Group 1 — files: 3, bytes: 29067
| File | Refs (exact path) | Refs (basename) | Active Scope | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|
| `library/fadhilweblib/styles/theme.css` | 2 | 13 | ✅ | ❌ |
| `website/home/theme.css` | 2 | 13 | ✅ | ❌ |
| `website/website/mindmapmaker/theme.css` | 2 | 13 | ✅ | ❌ |

### Group 2 — files: 2, bytes: 12364
| File | Refs (exact path) | Refs (basename) | Active Scope | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|
| `library/fadhilweblib/core/types/hooks.ts` | 2 | 4 | ✅ | ❌ |
| `website/mindmapmaker/src/lib/fadhilweblib/core/types/hooks.ts` | 2 | 4 | ✅ | ❌ |

### Group 3 — files: 2, bytes: 10924
| File | Refs (exact path) | Refs (basename) | Active Scope | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|
| `library/fadhilweblib/core/use-dialog.ts` | 2 | 4 | ✅ | ❌ |
| `website/mindmapmaker/src/lib/fadhilweblib/core/use-dialog.ts` | 2 | 4 | ✅ | ❌ |

### Group 4 — files: 2, bytes: 9980
| File | Refs (exact path) | Refs (basename) | Active Scope | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|
| `library/fadhilweblib/core/syntax/expression.ts` | 2 | 4 | ✅ | ❌ |
| `website/mindmapmaker/src/lib/fadhilweblib/core/syntax/expression.ts` | 2 | 4 | ✅ | ❌ |

### Group 5 — files: 2, bytes: 9740
| File | Refs (exact path) | Refs (basename) | Active Scope | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|
| `library/fadhilweblib/components/collapsible-panel.tsx` | 2 | 4 | ✅ | ❌ |
| `website/mindmapmaker/src/lib/fadhilweblib/components/collapsible-panel.tsx` | 2 | 4 | ✅ | ❌ |

### Group 6 — files: 2, bytes: 9532
| File | Refs (exact path) | Refs (basename) | Active Scope | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|
| `library/fadhilweblib/core/state-syntax.ts` | 2 | 4 | ✅ | ❌ |
| `website/mindmapmaker/src/lib/fadhilweblib/core/state-syntax.ts` | 2 | 4 | ✅ | ❌ |

### Group 7 — files: 2, bytes: 9166
| File | Refs (exact path) | Refs (basename) | Active Scope | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|
| `library/fadhilweblib/components/overlay/drawer.tsx` | 2 | 4 | ✅ | ❌ |
| `website/mindmapmaker/src/lib/fadhilweblib/components/overlay/drawer.tsx` | 2 | 4 | ✅ | ❌ |

### Group 8 — files: 2, bytes: 8828
| File | Refs (exact path) | Refs (basename) | Active Scope | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|
| `library/fadhilweblib/components/overlay/dialog.tsx` | 2 | 4 | ✅ | ❌ |
| `website/mindmapmaker/src/lib/fadhilweblib/components/overlay/dialog.tsx` | 2 | 4 | ✅ | ❌ |

### Group 9 — files: 2, bytes: 8142
| File | Refs (exact path) | Refs (basename) | Active Scope | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|
| `library/fadhilweblib/core/use-roving-focus.ts` | 2 | 4 | ✅ | ❌ |
| `website/mindmapmaker/src/lib/fadhilweblib/core/use-roving-focus.ts` | 2 | 4 | ✅ | ❌ |

### Group 10 — files: 2, bytes: 7236
| File | Refs (exact path) | Refs (basename) | Active Scope | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|
| `library/fadhilweblib/components/layout/section.tsx` | 2 | 4 | ✅ | ❌ |
| `website/mindmapmaker/src/lib/fadhilweblib/components/layout/section.tsx` | 2 | 4 | ✅ | ❌ |

### Group 11 — files: 2, bytes: 6900
| File | Refs (exact path) | Refs (basename) | Active Scope | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|
| `library/fadhilweblib/components/button.tsx` | 2 | 4 | ✅ | ❌ |
| `website/mindmapmaker/src/lib/fadhilweblib/components/button.tsx` | 2 | 4 | ✅ | ❌ |

### Group 12 — files: 2, bytes: 6406
| File | Refs (exact path) | Refs (basename) | Active Scope | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|
| `library/fadhilweblib/components/navigation/tabs.tsx` | 2 | 4 | ✅ | ❌ |
| `website/mindmapmaker/src/lib/fadhilweblib/components/navigation/tabs.tsx` | 2 | 4 | ✅ | ❌ |

### Group 13 — files: 2, bytes: 6388
| File | Refs (exact path) | Refs (basename) | Active Scope | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|
| `library/fadhilweblib/components/forms/field.tsx` | 2 | 4 | ✅ | ❌ |
| `website/mindmapmaker/src/lib/fadhilweblib/components/forms/field.tsx` | 2 | 4 | ✅ | ❌ |

### Group 14 — files: 2, bytes: 5970
| File | Refs (exact path) | Refs (basename) | Active Scope | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|
| `library/fadhilweblib/core/use-tabs.ts` | 2 | 4 | ✅ | ❌ |
| `website/mindmapmaker/src/lib/fadhilweblib/core/use-tabs.ts` | 2 | 4 | ✅ | ❌ |

### Group 15 — files: 2, bytes: 5828
| File | Refs (exact path) | Refs (basename) | Active Scope | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|
| `library/fadhilweblib/core/recipe.ts` | 2 | 4 | ✅ | ❌ |
| `website/mindmapmaker/src/lib/fadhilweblib/core/recipe.ts` | 2 | 4 | ✅ | ❌ |

### Group 16 — files: 2, bytes: 5662
| File | Refs (exact path) | Refs (basename) | Active Scope | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|
| `library/fadhilweblib/core/use-disclosure.ts` | 2 | 4 | ✅ | ❌ |
| `website/mindmapmaker/src/lib/fadhilweblib/core/use-disclosure.ts` | 2 | 4 | ✅ | ❌ |

### Group 17 — files: 2, bytes: 5488
| File | Refs (exact path) | Refs (basename) | Active Scope | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|
| `library/fadhilweblib/presets/index.ts` | 2 | 4 | ✅ | ❌ |
| `website/mindmapmaker/src/lib/fadhilweblib/presets/index.ts` | 2 | 4 | ✅ | ❌ |

### Group 18 — files: 2, bytes: 5472
| File | Refs (exact path) | Refs (basename) | Active Scope | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|
| `library/fadhilweblib/components/header-shell.tsx` | 2 | 4 | ✅ | ❌ |
| `website/mindmapmaker/src/lib/fadhilweblib/components/header-shell.tsx` | 2 | 4 | ✅ | ❌ |

### Group 19 — files: 2, bytes: 5434
| File | Refs (exact path) | Refs (basename) | Active Scope | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|
| `library/fadhilweblib/components/forms/switch.tsx` | 2 | 4 | ✅ | ❌ |
| `website/mindmapmaker/src/lib/fadhilweblib/components/forms/switch.tsx` | 2 | 4 | ✅ | ❌ |

### Group 20 — files: 2, bytes: 5012
| File | Refs (exact path) | Refs (basename) | Active Scope | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|
| `library/fadhilweblib/components/forms/checkbox.tsx` | 2 | 4 | ✅ | ❌ |
| `website/mindmapmaker/src/lib/fadhilweblib/components/forms/checkbox.tsx` | 2 | 4 | ✅ | ❌ |

### Group 21 — files: 2, bytes: 4966
| File | Refs (exact path) | Refs (basename) | Active Scope | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|
| `library/fadhilweblib/components/navigation/segmented-control.tsx` | 2 | 4 | ✅ | ❌ |
| `website/mindmapmaker/src/lib/fadhilweblib/components/navigation/segmented-control.tsx` | 2 | 4 | ✅ | ❌ |

### Group 22 — files: 2, bytes: 4888
| File | Refs (exact path) | Refs (basename) | Active Scope | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|
| `library/fadhilweblib/components/icon-button.tsx` | 0 | 0 | ✅ | ❌ |
| `website/mindmapmaker/src/lib/fadhilweblib/components/icon-button.tsx` | 0 | 0 | ✅ | ❌ |

### Group 23 — files: 2, bytes: 4368
| File | Refs (exact path) | Refs (basename) | Active Scope | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|
| `library/fadhilweblib/components/feedback/progress-bar.tsx` | 0 | 0 | ✅ | ❌ |
| `website/mindmapmaker/src/lib/fadhilweblib/components/feedback/progress-bar.tsx` | 0 | 0 | ✅ | ❌ |

### Group 24 — files: 2, bytes: 4322
| File | Refs (exact path) | Refs (basename) | Active Scope | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|
| `library/fadhilweblib/components/feedback/notice.tsx` | 0 | 0 | ✅ | ❌ |
| `website/mindmapmaker/src/lib/fadhilweblib/components/feedback/notice.tsx` | 0 | 0 | ✅ | ❌ |

### Group 25 — files: 2, bytes: 4318
| File | Refs (exact path) | Refs (basename) | Active Scope | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|
| `library/fadhilweblib/core/space.ts` | 0 | 0 | ✅ | ❌ |
| `website/mindmapmaker/src/lib/fadhilweblib/core/space.ts` | 0 | 0 | ✅ | ❌ |

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
- Total lines: 96635
- Code lines: 86733
- Blank lines: 8054
- Comment lines: 1848

| Extension | Files | Total | Code | Blank | Comment |
|---|---:|---:|---:|---:|---:|
| `.css` | 60 | 10214 | 7517 | 1079 | 1618 |
| `.html` | 18 | 2257 | 2134 | 116 | 7 |
| `.js` | 33 | 19574 | 18174 | 1327 | 73 |
| `.json` | 10 | 9280 | 9280 | 0 | 0 |
| `.jsonc` | 1 | 17 | 17 | 0 | 0 |
| `.mjs` | 1 | 27 | 22 | 5 | 0 |
| `.py` | 2 | 1033 | 883 | 143 | 7 |
| `.sh` | 2 | 46 | 28 | 11 | 7 |
| `.sql` | 6 | 87 | 65 | 10 | 12 |
| `.svg` | 1 | 3 | 3 | 0 | 0 |
| `.toml` | 1 | 12 | 11 | 1 | 0 |
| `.ts` | 200 | 31819 | 28175 | 3570 | 74 |
| `.tsx` | 114 | 22120 | 20311 | 1779 | 30 |
| `.txt` | 1 | 20 | 14 | 5 | 1 |
| `.xml` | 1 | 63 | 63 | 0 | 0 |
| `[no-ext]` | 7 | 63 | 36 | 8 | 19 |

## Deprecated Code Audit

- Total pattern hits: 0
- Files with hits: 0

| Pattern | Hits |
|---|---:|
