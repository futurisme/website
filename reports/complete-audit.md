# Complete Audit — fadhil.dev

Generated: 2026-05-11T11:10:59Z

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
- Total LOC (repository): 96655
- Code LOC (repository): 86750
- Potential unused static files: 0
- Deprecated pattern hits: 0
- Missing security headers (CSP/HSTS/XCTO/Referrer): 0
- Avg response time (ms): 163.5
- P95 response time (ms): 243.4
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
| `/` | 200 | — | 246.1 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/archives` | 200 | — | 243.4 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/books` | 200 | — | 130.4 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/books/editor` | 200 | — | 150.0 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/daily-streak` | 200 | — | 209.8 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/dreambusiness` | 200 | — | 185.0 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/home` | 200 | — | 138.8 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/hype` | 200 | — | 111.8 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/mindmapmaker` | 200 | — | 201.3 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/mindmapmaker/editor/1` | 200 | — | 194.2 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/rpg` | 200 | — | 97.6 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/shareideas` | 200 | — | 128.1 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/shareideas/page/1` | 200 | — | 89.2 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

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
| `/robots.txt` | 200 | 181.2 | `user-agent-ok,sitemap-ok` |
| `/sitemap.xml` | 200 | 152.1 | `url-count=12` |

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
| `library/fadhilweblib/styles/theme.css` | 2 | 13 | ✅ | ✅ | ❌ |
| `website/home/theme.css` | 2 | 13 | ✅ | ❌ | ❌ |
| `website/website/mindmapmaker/theme.css` | 2 | 13 | ✅ | ❌ | ❌ |

### Group 2 — files: 2, bytes: 12364, family: fadhilweblib-mirror
Recommended keep: `library/fadhilweblib/core/types/hooks.ts`
| File | Refs (exact path) | Refs (basename) | Active Scope | Recommended Keep | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|:---:|
| `library/fadhilweblib/core/types/hooks.ts` | 2 | 4 | ✅ | ✅ | ❌ |
| `website/mindmapmaker/src/lib/fadhilweblib/core/types/hooks.ts` | 2 | 4 | ✅ | ❌ | ❌ |

### Group 3 — files: 2, bytes: 10924, family: fadhilweblib-mirror
Recommended keep: `library/fadhilweblib/core/use-dialog.ts`
| File | Refs (exact path) | Refs (basename) | Active Scope | Recommended Keep | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|:---:|
| `library/fadhilweblib/core/use-dialog.ts` | 2 | 4 | ✅ | ✅ | ❌ |
| `website/mindmapmaker/src/lib/fadhilweblib/core/use-dialog.ts` | 2 | 4 | ✅ | ❌ | ❌ |

### Group 4 — files: 2, bytes: 9980, family: fadhilweblib-mirror
Recommended keep: `library/fadhilweblib/core/syntax/expression.ts`
| File | Refs (exact path) | Refs (basename) | Active Scope | Recommended Keep | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|:---:|
| `library/fadhilweblib/core/syntax/expression.ts` | 2 | 4 | ✅ | ✅ | ❌ |
| `website/mindmapmaker/src/lib/fadhilweblib/core/syntax/expression.ts` | 2 | 4 | ✅ | ❌ | ❌ |

### Group 5 — files: 2, bytes: 9740, family: fadhilweblib-mirror
Recommended keep: `library/fadhilweblib/components/collapsible-panel.tsx`
| File | Refs (exact path) | Refs (basename) | Active Scope | Recommended Keep | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|:---:|
| `library/fadhilweblib/components/collapsible-panel.tsx` | 2 | 4 | ✅ | ✅ | ❌ |
| `website/mindmapmaker/src/lib/fadhilweblib/components/collapsible-panel.tsx` | 2 | 4 | ✅ | ❌ | ❌ |

### Group 6 — files: 2, bytes: 9532, family: fadhilweblib-mirror
Recommended keep: `library/fadhilweblib/core/state-syntax.ts`
| File | Refs (exact path) | Refs (basename) | Active Scope | Recommended Keep | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|:---:|
| `library/fadhilweblib/core/state-syntax.ts` | 2 | 4 | ✅ | ✅ | ❌ |
| `website/mindmapmaker/src/lib/fadhilweblib/core/state-syntax.ts` | 2 | 4 | ✅ | ❌ | ❌ |

### Group 7 — files: 2, bytes: 9166, family: fadhilweblib-mirror
Recommended keep: `library/fadhilweblib/components/overlay/drawer.tsx`
| File | Refs (exact path) | Refs (basename) | Active Scope | Recommended Keep | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|:---:|
| `library/fadhilweblib/components/overlay/drawer.tsx` | 2 | 4 | ✅ | ✅ | ❌ |
| `website/mindmapmaker/src/lib/fadhilweblib/components/overlay/drawer.tsx` | 2 | 4 | ✅ | ❌ | ❌ |

### Group 8 — files: 2, bytes: 8828, family: fadhilweblib-mirror
Recommended keep: `library/fadhilweblib/components/overlay/dialog.tsx`
| File | Refs (exact path) | Refs (basename) | Active Scope | Recommended Keep | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|:---:|
| `library/fadhilweblib/components/overlay/dialog.tsx` | 2 | 4 | ✅ | ✅ | ❌ |
| `website/mindmapmaker/src/lib/fadhilweblib/components/overlay/dialog.tsx` | 2 | 4 | ✅ | ❌ | ❌ |

### Group 9 — files: 2, bytes: 8142, family: fadhilweblib-mirror
Recommended keep: `library/fadhilweblib/core/use-roving-focus.ts`
| File | Refs (exact path) | Refs (basename) | Active Scope | Recommended Keep | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|:---:|
| `library/fadhilweblib/core/use-roving-focus.ts` | 2 | 4 | ✅ | ✅ | ❌ |
| `website/mindmapmaker/src/lib/fadhilweblib/core/use-roving-focus.ts` | 2 | 4 | ✅ | ❌ | ❌ |

### Group 10 — files: 2, bytes: 7236, family: fadhilweblib-mirror
Recommended keep: `library/fadhilweblib/components/layout/section.tsx`
| File | Refs (exact path) | Refs (basename) | Active Scope | Recommended Keep | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|:---:|
| `library/fadhilweblib/components/layout/section.tsx` | 2 | 4 | ✅ | ✅ | ❌ |
| `website/mindmapmaker/src/lib/fadhilweblib/components/layout/section.tsx` | 2 | 4 | ✅ | ❌ | ❌ |

### Group 11 — files: 2, bytes: 6900, family: fadhilweblib-mirror
Recommended keep: `library/fadhilweblib/components/button.tsx`
| File | Refs (exact path) | Refs (basename) | Active Scope | Recommended Keep | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|:---:|
| `library/fadhilweblib/components/button.tsx` | 2 | 8 | ✅ | ✅ | ❌ |
| `website/mindmapmaker/src/lib/fadhilweblib/components/button.tsx` | 2 | 8 | ✅ | ❌ | ❌ |

### Group 12 — files: 2, bytes: 6406, family: fadhilweblib-mirror
Recommended keep: `library/fadhilweblib/components/navigation/tabs.tsx`
| File | Refs (exact path) | Refs (basename) | Active Scope | Recommended Keep | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|:---:|
| `library/fadhilweblib/components/navigation/tabs.tsx` | 2 | 4 | ✅ | ✅ | ❌ |
| `website/mindmapmaker/src/lib/fadhilweblib/components/navigation/tabs.tsx` | 2 | 4 | ✅ | ❌ | ❌ |

### Group 13 — files: 2, bytes: 6388, family: fadhilweblib-mirror
Recommended keep: `library/fadhilweblib/components/forms/field.tsx`
| File | Refs (exact path) | Refs (basename) | Active Scope | Recommended Keep | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|:---:|
| `library/fadhilweblib/components/forms/field.tsx` | 2 | 4 | ✅ | ✅ | ❌ |
| `website/mindmapmaker/src/lib/fadhilweblib/components/forms/field.tsx` | 2 | 4 | ✅ | ❌ | ❌ |

### Group 14 — files: 2, bytes: 5970, family: fadhilweblib-mirror
Recommended keep: `library/fadhilweblib/core/use-tabs.ts`
| File | Refs (exact path) | Refs (basename) | Active Scope | Recommended Keep | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|:---:|
| `library/fadhilweblib/core/use-tabs.ts` | 2 | 4 | ✅ | ✅ | ❌ |
| `website/mindmapmaker/src/lib/fadhilweblib/core/use-tabs.ts` | 2 | 4 | ✅ | ❌ | ❌ |

### Group 15 — files: 2, bytes: 5828, family: fadhilweblib-mirror
Recommended keep: `library/fadhilweblib/core/recipe.ts`
| File | Refs (exact path) | Refs (basename) | Active Scope | Recommended Keep | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|:---:|
| `library/fadhilweblib/core/recipe.ts` | 2 | 4 | ✅ | ✅ | ❌ |
| `website/mindmapmaker/src/lib/fadhilweblib/core/recipe.ts` | 2 | 4 | ✅ | ❌ | ❌ |

### Group 16 — files: 2, bytes: 5662, family: fadhilweblib-mirror
Recommended keep: `library/fadhilweblib/core/use-disclosure.ts`
| File | Refs (exact path) | Refs (basename) | Active Scope | Recommended Keep | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|:---:|
| `library/fadhilweblib/core/use-disclosure.ts` | 2 | 4 | ✅ | ✅ | ❌ |
| `website/mindmapmaker/src/lib/fadhilweblib/core/use-disclosure.ts` | 2 | 4 | ✅ | ❌ | ❌ |

### Group 17 — files: 2, bytes: 5488, family: fadhilweblib-mirror
Recommended keep: `library/fadhilweblib/presets/index.ts`
| File | Refs (exact path) | Refs (basename) | Active Scope | Recommended Keep | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|:---:|
| `library/fadhilweblib/presets/index.ts` | 2 | 4 | ✅ | ✅ | ❌ |
| `website/mindmapmaker/src/lib/fadhilweblib/presets/index.ts` | 2 | 4 | ✅ | ❌ | ❌ |

### Group 18 — files: 2, bytes: 5472, family: fadhilweblib-mirror
Recommended keep: `library/fadhilweblib/components/header-shell.tsx`
| File | Refs (exact path) | Refs (basename) | Active Scope | Recommended Keep | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|:---:|
| `library/fadhilweblib/components/header-shell.tsx` | 2 | 4 | ✅ | ✅ | ❌ |
| `website/mindmapmaker/src/lib/fadhilweblib/components/header-shell.tsx` | 2 | 4 | ✅ | ❌ | ❌ |

### Group 19 — files: 2, bytes: 5434, family: fadhilweblib-mirror
Recommended keep: `library/fadhilweblib/components/forms/switch.tsx`
| File | Refs (exact path) | Refs (basename) | Active Scope | Recommended Keep | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|:---:|
| `library/fadhilweblib/components/forms/switch.tsx` | 2 | 4 | ✅ | ✅ | ❌ |
| `website/mindmapmaker/src/lib/fadhilweblib/components/forms/switch.tsx` | 2 | 4 | ✅ | ❌ | ❌ |

### Group 20 — files: 2, bytes: 5012, family: fadhilweblib-mirror
Recommended keep: `library/fadhilweblib/components/forms/checkbox.tsx`
| File | Refs (exact path) | Refs (basename) | Active Scope | Recommended Keep | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|:---:|
| `library/fadhilweblib/components/forms/checkbox.tsx` | 2 | 4 | ✅ | ✅ | ❌ |
| `website/mindmapmaker/src/lib/fadhilweblib/components/forms/checkbox.tsx` | 2 | 4 | ✅ | ❌ | ❌ |

### Group 21 — files: 2, bytes: 4966, family: fadhilweblib-mirror
Recommended keep: `library/fadhilweblib/components/navigation/segmented-control.tsx`
| File | Refs (exact path) | Refs (basename) | Active Scope | Recommended Keep | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|:---:|
| `library/fadhilweblib/components/navigation/segmented-control.tsx` | 2 | 4 | ✅ | ✅ | ❌ |
| `website/mindmapmaker/src/lib/fadhilweblib/components/navigation/segmented-control.tsx` | 2 | 4 | ✅ | ❌ | ❌ |

### Group 22 — files: 2, bytes: 4888, family: fadhilweblib-mirror
Recommended keep: `library/fadhilweblib/components/icon-button.tsx`
| File | Refs (exact path) | Refs (basename) | Active Scope | Recommended Keep | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|:---:|
| `library/fadhilweblib/components/icon-button.tsx` | 2 | 4 | ✅ | ✅ | ❌ |
| `website/mindmapmaker/src/lib/fadhilweblib/components/icon-button.tsx` | 2 | 4 | ✅ | ❌ | ❌ |

### Group 23 — files: 2, bytes: 4368, family: fadhilweblib-mirror
Recommended keep: `library/fadhilweblib/components/feedback/progress-bar.tsx`
| File | Refs (exact path) | Refs (basename) | Active Scope | Recommended Keep | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|:---:|
| `library/fadhilweblib/components/feedback/progress-bar.tsx` | 2 | 4 | ✅ | ✅ | ❌ |
| `website/mindmapmaker/src/lib/fadhilweblib/components/feedback/progress-bar.tsx` | 2 | 4 | ✅ | ❌ | ❌ |

### Group 24 — files: 2, bytes: 4322, family: fadhilweblib-mirror
Recommended keep: `library/fadhilweblib/components/feedback/notice.tsx`
| File | Refs (exact path) | Refs (basename) | Active Scope | Recommended Keep | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|:---:|
| `library/fadhilweblib/components/feedback/notice.tsx` | 2 | 4 | ✅ | ✅ | ❌ |
| `website/mindmapmaker/src/lib/fadhilweblib/components/feedback/notice.tsx` | 2 | 4 | ✅ | ❌ | ❌ |

### Group 25 — files: 2, bytes: 4318, family: fadhilweblib-mirror
Recommended keep: `library/fadhilweblib/core/space.ts`
| File | Refs (exact path) | Refs (basename) | Active Scope | Recommended Keep | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|:---:|
| `library/fadhilweblib/core/space.ts` | 2 | 4 | ✅ | ✅ | ❌ |
| `website/mindmapmaker/src/lib/fadhilweblib/core/space.ts` | 2 | 4 | ✅ | ❌ | ❌ |

### Group 26 — files: 2, bytes: 4294, family: fadhilweblib-mirror
Recommended keep: `library/fadhilweblib/components/feedback/empty-state.tsx`
| File | Refs (exact path) | Refs (basename) | Active Scope | Recommended Keep | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|:---:|
| `library/fadhilweblib/components/feedback/empty-state.tsx` | 0 | 0 | ✅ | ✅ | ❌ |
| `website/mindmapmaker/src/lib/fadhilweblib/components/feedback/empty-state.tsx` | 0 | 0 | ✅ | ❌ | ❌ |

### Group 27 — files: 2, bytes: 4240, family: fadhilweblib-mirror
Recommended keep: `library/fadhilweblib/core/recipe-test.ts`
| File | Refs (exact path) | Refs (basename) | Active Scope | Recommended Keep | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|:---:|
| `library/fadhilweblib/core/recipe-test.ts` | 0 | 0 | ✅ | ✅ | ❌ |
| `website/mindmapmaker/src/lib/fadhilweblib/core/recipe-test.ts` | 0 | 0 | ✅ | ❌ | ❌ |

### Group 28 — files: 2, bytes: 4180, family: fadhilweblib-mirror
Recommended keep: `library/fadhilweblib/core/use-selection-state.ts`
| File | Refs (exact path) | Refs (basename) | Active Scope | Recommended Keep | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|:---:|
| `library/fadhilweblib/core/use-selection-state.ts` | 0 | 0 | ✅ | ✅ | ❌ |
| `website/mindmapmaker/src/lib/fadhilweblib/core/use-selection-state.ts` | 0 | 0 | ✅ | ❌ | ❌ |

### Group 29 — files: 2, bytes: 4110, family: fadhilweblib-mirror
Recommended keep: `library/fadhilweblib/core/use-async-action.ts`
| File | Refs (exact path) | Refs (basename) | Active Scope | Recommended Keep | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|:---:|
| `library/fadhilweblib/core/use-async-action.ts` | 0 | 0 | ✅ | ✅ | ❌ |
| `website/mindmapmaker/src/lib/fadhilweblib/core/use-async-action.ts` | 0 | 0 | ✅ | ❌ | ❌ |

### Group 30 — files: 2, bytes: 4088, family: fadhilweblib-mirror
Recommended keep: `library/fadhilweblib/components/status-chip.tsx`
| File | Refs (exact path) | Refs (basename) | Active Scope | Recommended Keep | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|:---:|
| `library/fadhilweblib/components/status-chip.tsx` | 0 | 0 | ✅ | ✅ | ❌ |
| `website/mindmapmaker/src/lib/fadhilweblib/components/status-chip.tsx` | 0 | 0 | ✅ | ❌ | ❌ |

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
- Total lines: 96655
- Code lines: 86750
- Blank lines: 8056
- Comment lines: 1849

| Extension | Files | Total | Code | Blank | Comment |
|---|---:|---:|---:|---:|---:|
| `.css` | 60 | 10214 | 7517 | 1079 | 1618 |
| `.html` | 18 | 2257 | 2134 | 116 | 7 |
| `.js` | 33 | 19574 | 18174 | 1327 | 73 |
| `.json` | 10 | 9264 | 9264 | 0 | 0 |
| `.jsonc` | 1 | 17 | 17 | 0 | 0 |
| `.mjs` | 1 | 27 | 22 | 5 | 0 |
| `.py` | 2 | 1069 | 916 | 145 | 8 |
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
