# Complete Audit — fadhil.dev

Generated: 2026-05-11T10:46:38Z

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
- Duplicate file groups (all): 76
- Total LOC (repository): 104257
- Code LOC (repository): 93737
- Potential unused static files: 0
- Deprecated pattern hits: 0
- Missing security headers (CSP/HSTS/XCTO/Referrer): 0
- Avg response time (ms): 191.7
- P95 response time (ms): 260.6
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
| `/` | 200 | — | 264.5 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/archives` | 200 | — | 244.2 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/books` | 200 | — | 235.2 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/books/editor` | 200 | — | 228.3 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/daily-streak` | 200 | — | 260.6 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/dreambusiness` | 200 | — | 246.8 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/home` | 200 | — | 144.2 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/hype` | 200 | — | 195.8 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/mindmapmaker` | 200 | — | 96.5 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/mindmapmaker/editor/1` | 200 | — | 101.7 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/rpg` | 200 | — | 201.3 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/shareideas` | 200 | — | 172.2 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/shareideas/page/1` | 200 | — | 100.7 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

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
| `/robots.txt` | 200 | 202.0 | `user-agent-ok,sitemap-ok` |
| `/sitemap.xml` | 200 | 125.0 | `url-count=12` |

## Local Crawl Asset Audit (Repository)

- robots.txt exists: yes
- sitemap.xml exists: yes
- robots user-agent wildcard: yes
- robots sitemap directive: yes
- local sitemap URL count: 12
- local sitemap coverage gap: 0

## Duplicate File Analysis (Top 25)

### Group 1 — files: 2, bytes: 107586
| File | Refs (exact path) | Refs (basename) | Active Scope | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|
| `games/hype/industry-ui.js` | 3 | 6 | ✅ | ❌ |
| `hype/industry-ui.js` | 6 | 6 | ❌ | ❌ |

### Group 2 — files: 2, bytes: 102618
| File | Refs (exact path) | Refs (basename) | Active Scope | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|
| `games/rpg/fadhilwebrpglib.js` | 5 | 15 | ✅ | ❌ |
| `rpg/fadhilwebrpglib.js` | 9 | 15 | ❌ | ❌ |

### Group 3 — files: 2, bytes: 33990
| File | Refs (exact path) | Refs (basename) | Active Scope | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|
| `games/hype/hype-debugger.js` | 3 | 6 | ✅ | ❌ |
| `hype/hype-debugger.js` | 6 | 6 | ❌ | ❌ |

### Group 4 — files: 3, bytes: 29067
| File | Refs (exact path) | Refs (basename) | Active Scope | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|
| `library/fadhilweblib/styles/theme.css` | 2 | 13 | ✅ | ❌ |
| `website/home/theme.css` | 2 | 13 | ✅ | ❌ |
| `website/website/mindmapmaker/theme.css` | 2 | 13 | ✅ | ❌ |

### Group 5 — files: 2, bytes: 24730
| File | Refs (exact path) | Refs (basename) | Active Scope | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|
| `games/hype/industry-ui.css` | 3 | 6 | ✅ | ❌ |
| `hype/industry-ui.css` | 6 | 6 | ❌ | ❌ |

### Group 6 — files: 2, bytes: 18270
| File | Refs (exact path) | Refs (basename) | Active Scope | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|
| `dreambusiness/dream-business-game.tsx` | 4 | 4 | ❌ | ❌ |
| `games/dreambusiness/dream-business-game.tsx` | 2 | 4 | ✅ | ❌ |

### Group 7 — files: 2, bytes: 17286
| File | Refs (exact path) | Refs (basename) | Active Scope | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|
| `games/hype/name-datasets.js` | 3 | 6 | ✅ | ❌ |
| `hype/name-datasets.js` | 6 | 6 | ❌ | ❌ |

### Group 8 — files: 2, bytes: 14856
| File | Refs (exact path) | Refs (basename) | Active Scope | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|
| `games/rpg/fadhilwebrpglib-test.js` | 2 | 4 | ✅ | ❌ |
| `rpg/fadhilwebrpglib-test.js` | 4 | 4 | ❌ | ❌ |

### Group 9 — files: 3, bytes: 13248
| File | Refs (exact path) | Refs (basename) | Active Scope | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|
| `library/fadhilweblib/fadhilwebarchivesframework/runtime.js` | 5 | 12 | ✅ | ❌ |
| `website/archives/runtime.js` | 2 | 12 | ✅ | ❌ |
| `website/library/fadhilweblib/fadhilwebarchivesframework/runtime.js` | 2 | 12 | ✅ | ❌ |

### Group 10 — files: 2, bytes: 12364
| File | Refs (exact path) | Refs (basename) | Active Scope | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|
| `library/fadhilweblib/core/types/hooks.ts` | 2 | 4 | ✅ | ❌ |
| `website/mindmapmaker/src/lib/fadhilweblib/core/types/hooks.ts` | 2 | 4 | ✅ | ❌ |

### Group 11 — files: 2, bytes: 12234
| File | Refs (exact path) | Refs (basename) | Active Scope | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|
| `games/hype/hype-engine-bundle.js` | 3 | 6 | ✅ | ❌ |
| `hype/hype-engine-bundle.js` | 6 | 6 | ❌ | ❌ |

### Group 12 — files: 2, bytes: 10924
| File | Refs (exact path) | Refs (basename) | Active Scope | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|
| `library/fadhilweblib/core/use-dialog.ts` | 2 | 4 | ✅ | ❌ |
| `website/mindmapmaker/src/lib/fadhilweblib/core/use-dialog.ts` | 2 | 4 | ✅ | ❌ |

### Group 13 — files: 2, bytes: 9980
| File | Refs (exact path) | Refs (basename) | Active Scope | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|
| `library/fadhilweblib/core/syntax/expression.ts` | 2 | 4 | ✅ | ❌ |
| `website/mindmapmaker/src/lib/fadhilweblib/core/syntax/expression.ts` | 2 | 4 | ✅ | ❌ |

### Group 14 — files: 2, bytes: 9740
| File | Refs (exact path) | Refs (basename) | Active Scope | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|
| `library/fadhilweblib/components/collapsible-panel.tsx` | 2 | 4 | ✅ | ❌ |
| `website/mindmapmaker/src/lib/fadhilweblib/components/collapsible-panel.tsx` | 2 | 4 | ✅ | ❌ |

### Group 15 — files: 2, bytes: 9532
| File | Refs (exact path) | Refs (basename) | Active Scope | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|
| `library/fadhilweblib/core/state-syntax.ts` | 2 | 4 | ✅ | ❌ |
| `website/mindmapmaker/src/lib/fadhilweblib/core/state-syntax.ts` | 2 | 4 | ✅ | ❌ |

### Group 16 — files: 2, bytes: 9166
| File | Refs (exact path) | Refs (basename) | Active Scope | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|
| `library/fadhilweblib/components/overlay/drawer.tsx` | 2 | 4 | ✅ | ❌ |
| `website/mindmapmaker/src/lib/fadhilweblib/components/overlay/drawer.tsx` | 2 | 4 | ✅ | ❌ |

### Group 17 — files: 2, bytes: 8828
| File | Refs (exact path) | Refs (basename) | Active Scope | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|
| `library/fadhilweblib/components/overlay/dialog.tsx` | 2 | 4 | ✅ | ❌ |
| `website/mindmapmaker/src/lib/fadhilweblib/components/overlay/dialog.tsx` | 2 | 4 | ✅ | ❌ |

### Group 18 — files: 3, bytes: 8349
| File | Refs (exact path) | Refs (basename) | Active Scope | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|
| `extension/fadhil-format.js` | 5 | 8 | ❌ | ❌ |
| `website/archives/fadhil-format.js` | 2 | 8 | ✅ | ❌ |
| `website/extension/fadhil-format.js` | 2 | 8 | ✅ | ❌ |

### Group 19 — files: 2, bytes: 8142
| File | Refs (exact path) | Refs (basename) | Active Scope | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|
| `library/fadhilweblib/core/use-roving-focus.ts` | 2 | 4 | ✅ | ❌ |
| `website/mindmapmaker/src/lib/fadhilweblib/core/use-roving-focus.ts` | 2 | 4 | ✅ | ❌ |

### Group 20 — files: 2, bytes: 7236
| File | Refs (exact path) | Refs (basename) | Active Scope | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|
| `library/fadhilweblib/components/layout/section.tsx` | 2 | 4 | ✅ | ❌ |
| `website/mindmapmaker/src/lib/fadhilweblib/components/layout/section.tsx` | 2 | 4 | ✅ | ❌ |

### Group 21 — files: 2, bytes: 6900
| File | Refs (exact path) | Refs (basename) | Active Scope | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|
| `library/fadhilweblib/components/button.tsx` | 0 | 0 | ✅ | ❌ |
| `website/mindmapmaker/src/lib/fadhilweblib/components/button.tsx` | 0 | 0 | ✅ | ❌ |

### Group 22 — files: 2, bytes: 6406
| File | Refs (exact path) | Refs (basename) | Active Scope | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|
| `library/fadhilweblib/components/navigation/tabs.tsx` | 0 | 0 | ✅ | ❌ |
| `website/mindmapmaker/src/lib/fadhilweblib/components/navigation/tabs.tsx` | 0 | 0 | ✅ | ❌ |

### Group 23 — files: 2, bytes: 6388
| File | Refs (exact path) | Refs (basename) | Active Scope | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|
| `library/fadhilweblib/components/forms/field.tsx` | 0 | 0 | ✅ | ❌ |
| `website/mindmapmaker/src/lib/fadhilweblib/components/forms/field.tsx` | 0 | 0 | ✅ | ❌ |

### Group 24 — files: 2, bytes: 6276
| File | Refs (exact path) | Refs (basename) | Active Scope | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|
| `dreambusiness/dreambusiness-module.css` | 0 | 2 | ❌ | ✅ |
| `games/dreambusiness/dreambusiness-module.css` | 0 | 2 | ✅ | ❌ |
Safe candidates: `dreambusiness/dreambusiness-module.css`

### Group 25 — files: 2, bytes: 5970
| File | Refs (exact path) | Refs (basename) | Active Scope | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|
| `library/fadhilweblib/core/use-tabs.ts` | 0 | 0 | ✅ | ❌ |
| `website/mindmapmaker/src/lib/fadhilweblib/core/use-tabs.ts` | 0 | 0 | ✅ | ❌ |

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

- Tracked files scanned: 475
- Total lines: 104257
- Code lines: 93737
- Blank lines: 8628
- Comment lines: 1892

| Extension | Files | Total | Code | Blank | Comment |
|---|---:|---:|---:|---:|---:|
| `.css` | 63 | 10538 | 7810 | 1082 | 1646 |
| `.html` | 18 | 3155 | 2974 | 167 | 14 |
| `.js` | 45 | 25704 | 23792 | 1830 | 82 |
| `.json` | 10 | 9296 | 9296 | 0 | 0 |
| `.jsonc` | 1 | 17 | 17 | 0 | 0 |
| `.mjs` | 1 | 27 | 22 | 5 | 0 |
| `.py` | 2 | 1033 | 883 | 143 | 7 |
| `.sh` | 2 | 46 | 28 | 11 | 7 |
| `.sql` | 6 | 87 | 65 | 10 | 12 |
| `.svg` | 1 | 3 | 3 | 0 | 0 |
| `.toml` | 1 | 12 | 11 | 1 | 0 |
| `.ts` | 201 | 31848 | 28203 | 3571 | 74 |
| `.tsx` | 115 | 22345 | 20520 | 1795 | 30 |
| `.txt` | 1 | 20 | 14 | 5 | 1 |
| `.xml` | 1 | 63 | 63 | 0 | 0 |
| `[no-ext]` | 7 | 63 | 36 | 8 | 19 |

## Deprecated Code Audit

- Total pattern hits: 0
- Files with hits: 0

| Pattern | Hits |
|---|---:|
