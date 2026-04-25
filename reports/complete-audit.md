# Complete Audit — fadhil.dev

Generated: 2026-04-25T23:56:47Z

## Executive Summary

- Base URL: `https://fadhil.dev`
- Paths checked: 16
- HTTP 200: 15
- Errors (non-200/redirect): 1
- Missing meta description: 2
- Missing canonical: 3
- Missing H1: 1
- Duplicate file groups (all): 65
- Potential unused static files: 0
- Missing security headers (CSP/HSTS/XCTO/Referrer): 45
- Avg response time (ms): 139.8
- P95 response time (ms): 205.4
- Vercel route target issues: 0
- Vercel build glob issues: 0
- robots.txt status: 404
- sitemap.xml status: 404
- Sitemap URL count: 0
- Sitemap coverage gap (audited routes not in sitemap): 13

## Domain Route Audit

| Path | Status | Redirect | Time (ms) | Meta Desc | Canonical | H1 | HTTPS | SecHdr | Deprecated |
|---|---:|:---:|---:|:---:|:---:|:---:|:---:|:---:|:---:|
| `/` | 200 | — | 247.3 | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| `/animeindustry` | 200 | — | 205.4 | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| `/archives` | 200 | — | 115.7 | ❌ | ❌ | ✅ | ✅ | ❌ | ✅ |
| `/archives/([^/.]+)` | 404 | — | 200.7 | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| `/books` | 200 | — | 142.6 | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| `/books/editor` | 200 | — | 100.9 | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| `/games/animeindustry` | 200 | — | 200.0 | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| `/games/dreambusiness` | 200 | — | 135.4 | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| `/games/rpg` | 200 | — | 60.3 | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| `/home` | 200 | — | 63.6 | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| `/mindmapmaker` | 200 | — | 97.7 | ✅ | ❌ | ✅ | ✅ | ❌ | ✅ |
| `/mindmapmaker/editor/1` | 200 | — | 163.6 | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ |
| `/portfolio` | 200 | — | 146.8 | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| `/rpg` | 200 | — | 123.1 | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| `/shareideas` | 200 | — | 130.3 | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| `/shareideas/page/1` | 200 | — | 102.6 | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |

### Route Errors

| Path | Status | Error |
|---|---:|---|
| `/archives/([^/.]+)` | 404 | `HTTP Error 404: Not Found` |

## Security Header Coverage (HTTP 200 pages)

| Header | Missing Count |
|---|---:|
| `content-security-policy` | 15 |
| `strict-transport-security` | 0 |
| `x-content-type-options` | 15 |
| `referrer-policy` | 15 |

## Vercel Target Integrity

- Route target issues: 0
- Build glob issues: 0

## Crawl Support Audit (robots + sitemap)

| Endpoint | Status | Time (ms) | Notes |
|---|---:|---:|---|
| `/robots.txt` | 404 | 47.0 | `user-agent-missing,sitemap-missing` |
| `/sitemap.xml` | 404 | 134.4 | `url-count=0` |

| Audited route missing in sitemap |
|---|
| `/` |
| `/animeindustry` |
| `/archives` |
| `/books` |
| `/books/editor` |
| `/games/animeindustry` |
| `/games/dreambusiness` |
| `/games/rpg` |
| `/home` |
| `/mindmapmaker` |
| `/portfolio` |
| `/rpg` |
| `/shareideas` |

## Duplicate File Analysis (Top 25)

### Group 1 — files: 2, bytes: 519876
| File | Refs (exact path) | Refs (basename) | Active Scope | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|
| `assets/public/images/shareideas-2.webp` | 4 | 4 | ✅ | ❌ |
| `assets/public/images/shareideas.webp` | 2 | 2 | ✅ | ❌ |

### Group 2 — files: 4, bytes: 238528
| File | Refs (exact path) | Refs (basename) | Active Scope | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|
| `assets/public/images/mindmapmaker.webp` | 2 | 5 | ✅ | ❌ |
| `website/portfolio/testing/images/mindmapmaker.webp` | 2 | 5 | ✅ | ❌ |
| `website/portfolio/testing/images/portfolio.webp` | 2 | 8 | ✅ | ❌ |
| `website/portfolio/testing/images/share-ideas.webp` | 2 | 2 | ✅ | ❌ |

### Group 3 — files: 3, bytes: 29067
| File | Refs (exact path) | Refs (basename) | Active Scope | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|
| `library/fadhilweblib/styles/theme.css` | 4 | 15 | ✅ | ❌ |
| `website/home/theme.css` | 2 | 15 | ✅ | ❌ |
| `website/website/mindmapmaker/theme.css` | 2 | 15 | ✅ | ❌ |

### Group 4 — files: 2, bytes: 12364
| File | Refs (exact path) | Refs (basename) | Active Scope | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|
| `library/fadhilweblib/core/types/hooks.ts` | 2 | 4 | ✅ | ❌ |
| `website/mindmapmaker/src/lib/fadhilweblib/core/types/hooks.ts` | 2 | 4 | ✅ | ❌ |

### Group 5 — files: 2, bytes: 10924
| File | Refs (exact path) | Refs (basename) | Active Scope | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|
| `library/fadhilweblib/core/use-dialog.ts` | 2 | 4 | ✅ | ❌ |
| `website/mindmapmaker/src/lib/fadhilweblib/core/use-dialog.ts` | 2 | 4 | ✅ | ❌ |

### Group 6 — files: 2, bytes: 9980
| File | Refs (exact path) | Refs (basename) | Active Scope | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|
| `library/fadhilweblib/core/syntax/expression.ts` | 2 | 4 | ✅ | ❌ |
| `website/mindmapmaker/src/lib/fadhilweblib/core/syntax/expression.ts` | 2 | 4 | ✅ | ❌ |

### Group 7 — files: 2, bytes: 9740
| File | Refs (exact path) | Refs (basename) | Active Scope | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|
| `library/fadhilweblib/components/collapsible-panel.tsx` | 2 | 4 | ✅ | ❌ |
| `website/mindmapmaker/src/lib/fadhilweblib/components/collapsible-panel.tsx` | 2 | 4 | ✅ | ❌ |

### Group 8 — files: 2, bytes: 9532
| File | Refs (exact path) | Refs (basename) | Active Scope | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|
| `library/fadhilweblib/core/state-syntax.ts` | 2 | 4 | ✅ | ❌ |
| `website/mindmapmaker/src/lib/fadhilweblib/core/state-syntax.ts` | 2 | 4 | ✅ | ❌ |

### Group 9 — files: 2, bytes: 9166
| File | Refs (exact path) | Refs (basename) | Active Scope | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|
| `library/fadhilweblib/components/overlay/drawer.tsx` | 2 | 4 | ✅ | ❌ |
| `website/mindmapmaker/src/lib/fadhilweblib/components/overlay/drawer.tsx` | 2 | 4 | ✅ | ❌ |

### Group 10 — files: 2, bytes: 8828
| File | Refs (exact path) | Refs (basename) | Active Scope | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|
| `library/fadhilweblib/components/overlay/dialog.tsx` | 2 | 4 | ✅ | ❌ |
| `website/mindmapmaker/src/lib/fadhilweblib/components/overlay/dialog.tsx` | 2 | 4 | ✅ | ❌ |

### Group 11 — files: 2, bytes: 8142
| File | Refs (exact path) | Refs (basename) | Active Scope | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|
| `library/fadhilweblib/core/use-roving-focus.ts` | 2 | 4 | ✅ | ❌ |
| `website/mindmapmaker/src/lib/fadhilweblib/core/use-roving-focus.ts` | 2 | 4 | ✅ | ❌ |

### Group 12 — files: 2, bytes: 7236
| File | Refs (exact path) | Refs (basename) | Active Scope | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|
| `library/fadhilweblib/components/layout/section.tsx` | 2 | 4 | ✅ | ❌ |
| `website/mindmapmaker/src/lib/fadhilweblib/components/layout/section.tsx` | 2 | 4 | ✅ | ❌ |

### Group 13 — files: 2, bytes: 6900
| File | Refs (exact path) | Refs (basename) | Active Scope | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|
| `library/fadhilweblib/components/button.tsx` | 2 | 8 | ✅ | ❌ |
| `website/mindmapmaker/src/lib/fadhilweblib/components/button.tsx` | 2 | 8 | ✅ | ❌ |

### Group 14 — files: 2, bytes: 6406
| File | Refs (exact path) | Refs (basename) | Active Scope | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|
| `library/fadhilweblib/components/navigation/tabs.tsx` | 2 | 4 | ✅ | ❌ |
| `website/mindmapmaker/src/lib/fadhilweblib/components/navigation/tabs.tsx` | 2 | 4 | ✅ | ❌ |

### Group 15 — files: 2, bytes: 6388
| File | Refs (exact path) | Refs (basename) | Active Scope | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|
| `library/fadhilweblib/components/forms/field.tsx` | 2 | 4 | ✅ | ❌ |
| `website/mindmapmaker/src/lib/fadhilweblib/components/forms/field.tsx` | 2 | 4 | ✅ | ❌ |

### Group 16 — files: 2, bytes: 5970
| File | Refs (exact path) | Refs (basename) | Active Scope | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|
| `library/fadhilweblib/core/use-tabs.ts` | 2 | 4 | ✅ | ❌ |
| `website/mindmapmaker/src/lib/fadhilweblib/core/use-tabs.ts` | 2 | 4 | ✅ | ❌ |

### Group 17 — files: 2, bytes: 5828
| File | Refs (exact path) | Refs (basename) | Active Scope | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|
| `library/fadhilweblib/core/recipe.ts` | 2 | 4 | ✅ | ❌ |
| `website/mindmapmaker/src/lib/fadhilweblib/core/recipe.ts` | 2 | 4 | ✅ | ❌ |

### Group 18 — files: 2, bytes: 5662
| File | Refs (exact path) | Refs (basename) | Active Scope | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|
| `library/fadhilweblib/core/use-disclosure.ts` | 2 | 4 | ✅ | ❌ |
| `website/mindmapmaker/src/lib/fadhilweblib/core/use-disclosure.ts` | 2 | 4 | ✅ | ❌ |

### Group 19 — files: 2, bytes: 5488
| File | Refs (exact path) | Refs (basename) | Active Scope | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|
| `library/fadhilweblib/presets/index.ts` | 2 | 4 | ✅ | ❌ |
| `website/mindmapmaker/src/lib/fadhilweblib/presets/index.ts` | 2 | 4 | ✅ | ❌ |

### Group 20 — files: 2, bytes: 5472
| File | Refs (exact path) | Refs (basename) | Active Scope | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|
| `library/fadhilweblib/components/header-shell.tsx` | 2 | 4 | ✅ | ❌ |
| `website/mindmapmaker/src/lib/fadhilweblib/components/header-shell.tsx` | 2 | 4 | ✅ | ❌ |

### Group 21 — files: 2, bytes: 5434
| File | Refs (exact path) | Refs (basename) | Active Scope | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|
| `library/fadhilweblib/components/forms/switch.tsx` | 2 | 4 | ✅ | ❌ |
| `website/mindmapmaker/src/lib/fadhilweblib/components/forms/switch.tsx` | 2 | 4 | ✅ | ❌ |

### Group 22 — files: 2, bytes: 5012
| File | Refs (exact path) | Refs (basename) | Active Scope | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|
| `library/fadhilweblib/components/forms/checkbox.tsx` | 2 | 4 | ✅ | ❌ |
| `website/mindmapmaker/src/lib/fadhilweblib/components/forms/checkbox.tsx` | 2 | 4 | ✅ | ❌ |

### Group 23 — files: 2, bytes: 4966
| File | Refs (exact path) | Refs (basename) | Active Scope | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|
| `library/fadhilweblib/components/navigation/segmented-control.tsx` | 2 | 4 | ✅ | ❌ |
| `website/mindmapmaker/src/lib/fadhilweblib/components/navigation/segmented-control.tsx` | 2 | 4 | ✅ | ❌ |

### Group 24 — files: 2, bytes: 4888
| File | Refs (exact path) | Refs (basename) | Active Scope | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|
| `library/fadhilweblib/components/icon-button.tsx` | 2 | 4 | ✅ | ❌ |
| `website/mindmapmaker/src/lib/fadhilweblib/components/icon-button.tsx` | 2 | 4 | ✅ | ❌ |

### Group 25 — files: 2, bytes: 4368
| File | Refs (exact path) | Refs (basename) | Active Scope | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|
| `library/fadhilweblib/components/feedback/progress-bar.tsx` | 2 | 4 | ✅ | ❌ |
| `website/mindmapmaker/src/lib/fadhilweblib/components/feedback/progress-bar.tsx` | 2 | 4 | ✅ | ❌ |

## Static Unused File Audit (High Confidence)

- Candidate files scanned: 69
- Used via vercel config: 69
- Used via exact references: 0
- Potential unused files: 0

| Extension | Count |
|---|---:|

| Potential unused file | Exact path refs |
|---|---:|

### Notes

- Audit scope is intentionally limited to static delivery folders to minimize false positives.
- A file is considered used when matched by vercel routes/builds or referenced by exact repository path.
- Dynamic runtime fetches may not be detected; validate before deletion.
