# Complete Audit — fadhil.dev

Generated: 2026-04-27T11:18:21Z

## Executive Summary

- Base URL: `https://fadhil.dev`
- Paths checked: 15
- HTTP 200: 15
- Errors (non-200/redirect): 0
- Missing meta description: 0
- Missing canonical: 0
- Missing H1: 3
- Missing HTML lang: 0
- Missing OG title: 10
- Missing OG description: 10
- Missing twitter:card: 12
- Missing JSON-LD: 15
- Duplicate file groups (all): 82
- Potential unused static files: 0
- Missing security headers (CSP/HSTS/XCTO/Referrer): 45
- Avg response time (ms): 231.1
- P95 response time (ms): 308.0
- Vercel route target issues: 0
- Vercel build glob issues: 0
- robots.txt status: 200
- sitemap.xml status: 200
- Sitemap URL count: 13
- Sitemap coverage gap (audited routes not in sitemap): 0
- Local robots/sitemap ready: yes
- Local sitemap coverage gap: 0
- Local HTML files audited: 14
- Local HTML missing robots meta: 0
- Local HTML missing OG title: 0
- Local HTML missing twitter:card: 0

## Domain Route Audit

| Path | Status | Redirect | Time (ms) | Meta Desc | Canonical | H1 | OG | Tw | JSON-LD | HTTPS | SecHdr | Deprecated |
|---|---:|:---:|---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| `/` | 200 | — | 290.1 | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ✅ | ❌ | ✅ |
| `/animeindustry` | 200 | — | 322.2 | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ |
| `/archives` | 200 | — | 271.1 | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ |
| `/books` | 200 | — | 256.6 | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ |
| `/books/editor` | 200 | — | 258.5 | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ |
| `/games/animeindustry` | 200 | — | 308.0 | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ |
| `/games/dreambusiness` | 200 | — | 210.1 | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ |
| `/games/rpg` | 200 | — | 181.7 | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ |
| `/home` | 200 | — | 210.6 | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ |
| `/mindmapmaker` | 200 | — | 227.3 | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ |
| `/mindmapmaker/editor/1` | 200 | — | 295.6 | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ |
| `/portfolio` | 200 | — | 167.1 | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ✅ | ❌ | ✅ |
| `/rpg` | 200 | — | 105.1 | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ |
| `/shareideas` | 200 | — | 208.2 | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ |
| `/shareideas/page/1` | 200 | — | 153.8 | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ |

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
| `/robots.txt` | 200 | 161.6 | `user-agent-ok,sitemap-ok` |
| `/sitemap.xml` | 200 | 123.8 | `url-count=13` |

## Local Crawl Asset Audit (Repository)

- robots.txt exists: yes
- sitemap.xml exists: yes
- robots user-agent wildcard: yes
- robots sitemap directive: yes
- local sitemap URL count: 13
- local sitemap coverage gap: 0

## Duplicate File Analysis (Top 25)

### Group 1 — files: 2, bytes: 519876
| File | Refs (exact path) | Refs (basename) | Active Scope | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|
| `assets/public/images/shareideas-2.webp` | 5 | 5 | ✅ | ❌ |
| `assets/public/images/shareideas.webp` | 2 | 2 | ✅ | ❌ |

### Group 2 — files: 4, bytes: 238528
| File | Refs (exact path) | Refs (basename) | Active Scope | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|
| `assets/public/images/mindmapmaker.webp` | 2 | 5 | ✅ | ❌ |
| `website/portfolio/testing/images/mindmapmaker.webp` | 2 | 5 | ✅ | ❌ |
| `website/portfolio/testing/images/portfolio.webp` | 2 | 10 | ✅ | ❌ |
| `website/portfolio/testing/images/share-ideas.webp` | 2 | 2 | ✅ | ❌ |

### Group 3 — files: 2, bytes: 56686
| File | Refs (exact path) | Refs (basename) | Active Scope | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|
| `library/fadhilweblib/core/syntax/style.ts` | 2 | 4 | ✅ | ❌ |
| `website/mindmapmaker/src/lib/fadhilweblib/core/syntax/style.ts` | 2 | 4 | ✅ | ❌ |

### Group 4 — files: 2, bytes: 38256
| File | Refs (exact path) | Refs (basename) | Active Scope | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|
| `library/fadhilweblib/core/syntax/parse.ts` | 3 | 5 | ✅ | ❌ |
| `website/mindmapmaker/src/lib/fadhilweblib/core/syntax/parse.ts` | 2 | 5 | ✅ | ❌ |

### Group 5 — files: 2, bytes: 36082
| File | Refs (exact path) | Refs (basename) | Active Scope | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|
| `library/fadhilweblib/core/types/components.ts` | 2 | 4 | ✅ | ❌ |
| `website/mindmapmaker/src/lib/fadhilweblib/core/types/components.ts` | 2 | 4 | ✅ | ❌ |

### Group 6 — files: 2, bytes: 27518
| File | Refs (exact path) | Refs (basename) | Active Scope | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|
| `library/fadhilweblib/core/syntax-test.ts` | 2 | 4 | ✅ | ❌ |
| `website/mindmapmaker/src/lib/fadhilweblib/core/syntax-test.ts` | 2 | 4 | ✅ | ❌ |

### Group 7 — files: 2, bytes: 27378
| File | Refs (exact path) | Refs (basename) | Active Scope | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|
| `library/fadhilweblib/styles/theme.css` | 4 | 17 | ✅ | ❌ |
| `website/mindmapmaker/src/lib/fadhilweblib/styles/theme.css` | 2 | 17 | ✅ | ❌ |

### Group 8 — files: 2, bytes: 25980
| File | Refs (exact path) | Refs (basename) | Active Scope | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|
| `library/fadhilweblib/core/syntax/constants.ts` | 3 | 5 | ✅ | ❌ |
| `website/mindmapmaker/src/lib/fadhilweblib/core/syntax/constants.ts` | 2 | 5 | ✅ | ❌ |

### Group 9 — files: 2, bytes: 22364
| File | Refs (exact path) | Refs (basename) | Active Scope | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|
| `library/fadhilweblib/core/types/syntax.ts` | 2 | 9 | ✅ | ❌ |
| `website/mindmapmaker/src/lib/fadhilweblib/core/types/syntax.ts` | 2 | 9 | ✅ | ❌ |

### Group 10 — files: 2, bytes: 19378
| File | Refs (exact path) | Refs (basename) | Active Scope | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|
| `website/home/theme.css` | 2 | 17 | ✅ | ❌ |
| `website/website/mindmapmaker/theme.css` | 2 | 17 | ✅ | ❌ |

### Group 11 — files: 2, bytes: 12364
| File | Refs (exact path) | Refs (basename) | Active Scope | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|
| `library/fadhilweblib/core/types/hooks.ts` | 2 | 4 | ✅ | ❌ |
| `website/mindmapmaker/src/lib/fadhilweblib/core/types/hooks.ts` | 2 | 4 | ✅ | ❌ |

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

### Group 18 — files: 2, bytes: 8142
| File | Refs (exact path) | Refs (basename) | Active Scope | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|
| `library/fadhilweblib/core/use-roving-focus.ts` | 2 | 4 | ✅ | ❌ |
| `website/mindmapmaker/src/lib/fadhilweblib/core/use-roving-focus.ts` | 2 | 4 | ✅ | ❌ |

### Group 19 — files: 2, bytes: 7236
| File | Refs (exact path) | Refs (basename) | Active Scope | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|
| `library/fadhilweblib/components/layout/section.tsx` | 2 | 4 | ✅ | ❌ |
| `website/mindmapmaker/src/lib/fadhilweblib/components/layout/section.tsx` | 2 | 4 | ✅ | ❌ |

### Group 20 — files: 2, bytes: 7070
| File | Refs (exact path) | Refs (basename) | Active Scope | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|
| `library/fadhilweblib/components/media/adaptive-media.tsx` | 2 | 4 | ✅ | ❌ |
| `website/mindmapmaker/src/lib/fadhilweblib/components/media/adaptive-media.tsx` | 2 | 4 | ✅ | ❌ |

### Group 21 — files: 2, bytes: 7036
| File | Refs (exact path) | Refs (basename) | Active Scope | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|
| `node_modules/.pnpm/lock.yaml` | 2 | 4 | ❌ | ❌ |
| `pnpm-lock.yaml` | 2 | 2 | ❌ | ❌ |

### Group 22 — files: 2, bytes: 6900
| File | Refs (exact path) | Refs (basename) | Active Scope | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|
| `library/fadhilweblib/components/button.tsx` | 2 | 4 | ✅ | ❌ |
| `website/mindmapmaker/src/lib/fadhilweblib/components/button.tsx` | 2 | 4 | ✅ | ❌ |

### Group 23 — files: 2, bytes: 6406
| File | Refs (exact path) | Refs (basename) | Active Scope | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|
| `library/fadhilweblib/components/navigation/tabs.tsx` | 2 | 4 | ✅ | ❌ |
| `website/mindmapmaker/src/lib/fadhilweblib/components/navigation/tabs.tsx` | 2 | 4 | ✅ | ❌ |

### Group 24 — files: 2, bytes: 6388
| File | Refs (exact path) | Refs (basename) | Active Scope | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|
| `library/fadhilweblib/components/forms/field.tsx` | 2 | 4 | ✅ | ❌ |
| `website/mindmapmaker/src/lib/fadhilweblib/components/forms/field.tsx` | 2 | 4 | ✅ | ❌ |

### Group 25 — files: 2, bytes: 5970
| File | Refs (exact path) | Refs (basename) | Active Scope | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|
| `library/fadhilweblib/core/use-tabs.ts` | 2 | 4 | ✅ | ❌ |
| `website/mindmapmaker/src/lib/fadhilweblib/core/use-tabs.ts` | 2 | 4 | ✅ | ❌ |

## Static Unused File Audit (High Confidence)

- Candidate files scanned: 70
- Used via vercel config: 70
- Used via exact references: 0
- Potential unused files: 0

| Extension | Count |
|---|---:|

| Potential unused file | Exact path refs |
|---|---:|

## Local HTML Metadata Coverage Audit

- HTML files audited: 14
- Missing `<title>`: 0
- Missing meta description: 0
- Missing canonical: 0
- Missing robots: 0
- Missing Open Graph title: 0
- Missing Open Graph description: 0
- Missing Twitter card: 0
- Missing JSON-LD: 0
- Missing HTML lang: 0
- Missing H1: 0

| Missing check | Count |
|---|---:|
| `title` | 0 |
| `meta_description` | 0 |
| `canonical` | 0 |
| `robots` | 0 |
| `og_title` | 0 |
| `og_description` | 0 |
| `twitter_card` | 0 |
| `json_ld` | 0 |
| `html_lang` | 0 |
| `h1` | 0 |

### Notes

- Audit scope is intentionally limited to static delivery folders to minimize false positives.
- A file is considered used when matched by vercel routes/builds or referenced by exact repository path.
- Dynamic runtime fetches may not be detected; validate before deletion.
- Local HTML metadata coverage audit is static repository inspection and should be paired with live deployment checks.
