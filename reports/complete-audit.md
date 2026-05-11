# Complete Audit — fadhil.dev

Generated: 2026-05-11T10:19:54Z

## Executive Summary

- Base URL: `https://fadhil.dev`
- Paths checked: 13
- HTTP 200: 13
- Errors (non-200/redirect): 0
- Missing meta description: 1
- Missing canonical: 1
- Missing H1: 2
- Missing HTML lang: 0
- Missing OG title: 1
- Missing OG description: 1
- Missing twitter:card: 10
- Missing JSON-LD: 13
- Duplicate file groups (all): 81
- Total LOC (repository): 106809
- Code LOC (repository): 96292
- Potential unused static files: 1
- Deprecated pattern hits: 681
- Missing security headers (CSP/HSTS/XCTO/Referrer): 26
- Avg response time (ms): 218.2
- P95 response time (ms): 323.6
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
| `/` | 200 | — | 323.6 | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ✅ | ❌ | ✅ |
| `/archives` | 200 | — | 423.2 | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ |
| `/books` | 200 | — | 303.6 | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ✅ |
| `/books/editor` | 200 | — | 222.8 | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ✅ |
| `/daily-streak` | 200 | — | 200.9 | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ |
| `/dreambusiness` | 200 | — | 104.7 | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ✅ |
| `/home` | 200 | — | 137.3 | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ✅ |
| `/hype` | 200 | — | 174.0 | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ✅ |
| `/mindmapmaker` | 200 | — | 213.3 | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ |
| `/mindmapmaker/editor/1` | 200 | — | 168.7 | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ |
| `/rpg` | 200 | — | 228.6 | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ✅ |
| `/shareideas` | 200 | — | 177.6 | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ✅ |
| `/shareideas/page/1` | 200 | — | 158.8 | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ✅ |

## Security Header Coverage (HTTP 200 pages)

| Header | Missing Count |
|---|---:|
| `content-security-policy` | 13 |
| `strict-transport-security` | 13 |
| `x-content-type-options` | 0 |
| `referrer-policy` | 0 |

## Vercel Target Integrity

- Route target issues: 0
- Build glob issues: 0

## Crawl Support Audit (robots + sitemap)

| Endpoint | Status | Time (ms) | Notes |
|---|---:|---:|---|
| `/robots.txt` | 200 | 137.1 | `user-agent-ok,sitemap-ok` |
| `/sitemap.xml` | 200 | 225.5 | `url-count=12` |

## Local Crawl Asset Audit (Repository)

- robots.txt exists: yes
- sitemap.xml exists: yes
- robots user-agent wildcard: yes
- robots sitemap directive: yes
- local sitemap URL count: 12
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
| `assets/public/images/mindmapmaker.webp` | 4 | 7 | ✅ | ❌ |
| `website/portfolio/testing/images/mindmapmaker.webp` | 2 | 7 | ✅ | ❌ |
| `website/portfolio/testing/images/portfolio.webp` | 2 | 15 | ✅ | ❌ |
| `website/portfolio/testing/images/share-ideas.webp` | 2 | 2 | ✅ | ❌ |

### Group 3 — files: 2, bytes: 107586
| File | Refs (exact path) | Refs (basename) | Active Scope | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|
| `games/hype/industry-ui.js` | 3 | 6 | ✅ | ❌ |
| `hype/industry-ui.js` | 6 | 6 | ❌ | ❌ |

### Group 4 — files: 2, bytes: 102618
| File | Refs (exact path) | Refs (basename) | Active Scope | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|
| `games/rpg/fadhilwebrpglib.js` | 354 | 364 | ✅ | ❌ |
| `rpg/fadhilwebrpglib.js` | 358 | 364 | ❌ | ❌ |

### Group 5 — files: 2, bytes: 60930
| File | Refs (exact path) | Refs (basename) | Active Scope | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|
| `fadhil.svg` | 25 | 25 | ❌ | ❌ |
| `website/fadhil.svg` | 4 | 25 | ✅ | ❌ |

### Group 6 — files: 2, bytes: 45382
| File | Refs (exact path) | Refs (basename) | Active Scope | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|
| `fadhil-512x512.png` | 30 | 30 | ❌ | ❌ |
| `website/fadhil-512x512.png` | 6 | 30 | ✅ | ❌ |

### Group 7 — files: 2, bytes: 33990
| File | Refs (exact path) | Refs (basename) | Active Scope | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|
| `games/hype/hype-debugger.js` | 129 | 132 | ✅ | ❌ |
| `hype/hype-debugger.js` | 132 | 132 | ❌ | ❌ |

### Group 8 — files: 3, bytes: 29067
| File | Refs (exact path) | Refs (basename) | Active Scope | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|
| `library/fadhilweblib/styles/theme.css` | 2 | 13 | ✅ | ❌ |
| `website/home/theme.css` | 2 | 13 | ✅ | ❌ |
| `website/website/mindmapmaker/theme.css` | 2 | 13 | ✅ | ❌ |

### Group 9 — files: 2, bytes: 24730
| File | Refs (exact path) | Refs (basename) | Active Scope | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|
| `games/hype/industry-ui.css` | 3 | 6 | ✅ | ❌ |
| `hype/industry-ui.css` | 6 | 6 | ❌ | ❌ |

### Group 10 — files: 2, bytes: 18270
| File | Refs (exact path) | Refs (basename) | Active Scope | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|
| `dreambusiness/dream-business-game.tsx` | 6 | 6 | ❌ | ❌ |
| `games/dreambusiness/dream-business-game.tsx` | 2 | 6 | ✅ | ❌ |

### Group 11 — files: 2, bytes: 17286
| File | Refs (exact path) | Refs (basename) | Active Scope | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|
| `games/hype/name-datasets.js` | 3 | 6 | ✅ | ❌ |
| `hype/name-datasets.js` | 6 | 6 | ❌ | ❌ |

### Group 12 — files: 2, bytes: 14856
| File | Refs (exact path) | Refs (basename) | Active Scope | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|
| `games/rpg/fadhilwebrpglib-test.js` | 2 | 6 | ✅ | ❌ |
| `rpg/fadhilwebrpglib-test.js` | 6 | 6 | ❌ | ❌ |

### Group 13 — files: 3, bytes: 13248
| File | Refs (exact path) | Refs (basename) | Active Scope | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|
| `library/fadhilweblib/fadhilwebarchivesframework/runtime.js` | 5 | 14 | ✅ | ❌ |
| `website/archives/runtime.js` | 4 | 14 | ✅ | ❌ |
| `website/library/fadhilweblib/fadhilwebarchivesframework/runtime.js` | 2 | 14 | ✅ | ❌ |

### Group 14 — files: 2, bytes: 12364
| File | Refs (exact path) | Refs (basename) | Active Scope | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|
| `library/fadhilweblib/core/types/hooks.ts` | 2 | 4 | ✅ | ❌ |
| `website/mindmapmaker/src/lib/fadhilweblib/core/types/hooks.ts` | 2 | 4 | ✅ | ❌ |

### Group 15 — files: 2, bytes: 12234
| File | Refs (exact path) | Refs (basename) | Active Scope | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|
| `games/hype/hype-engine-bundle.js` | 3 | 6 | ✅ | ❌ |
| `hype/hype-engine-bundle.js` | 6 | 6 | ❌ | ❌ |

### Group 16 — files: 2, bytes: 10924
| File | Refs (exact path) | Refs (basename) | Active Scope | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|
| `library/fadhilweblib/core/use-dialog.ts` | 2 | 4 | ✅ | ❌ |
| `website/mindmapmaker/src/lib/fadhilweblib/core/use-dialog.ts` | 2 | 4 | ✅ | ❌ |

### Group 17 — files: 2, bytes: 9980
| File | Refs (exact path) | Refs (basename) | Active Scope | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|
| `library/fadhilweblib/core/syntax/expression.ts` | 2 | 4 | ✅ | ❌ |
| `website/mindmapmaker/src/lib/fadhilweblib/core/syntax/expression.ts` | 2 | 4 | ✅ | ❌ |

### Group 18 — files: 2, bytes: 9740
| File | Refs (exact path) | Refs (basename) | Active Scope | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|
| `library/fadhilweblib/components/collapsible-panel.tsx` | 2 | 4 | ✅ | ❌ |
| `website/mindmapmaker/src/lib/fadhilweblib/components/collapsible-panel.tsx` | 2 | 4 | ✅ | ❌ |

### Group 19 — files: 2, bytes: 9532
| File | Refs (exact path) | Refs (basename) | Active Scope | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|
| `library/fadhilweblib/core/state-syntax.ts` | 2 | 4 | ✅ | ❌ |
| `website/mindmapmaker/src/lib/fadhilweblib/core/state-syntax.ts` | 2 | 4 | ✅ | ❌ |

### Group 20 — files: 2, bytes: 9166
| File | Refs (exact path) | Refs (basename) | Active Scope | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|
| `library/fadhilweblib/components/overlay/drawer.tsx` | 2 | 4 | ✅ | ❌ |
| `website/mindmapmaker/src/lib/fadhilweblib/components/overlay/drawer.tsx` | 2 | 4 | ✅ | ❌ |

### Group 21 — files: 2, bytes: 9004
| File | Refs (exact path) | Refs (basename) | Active Scope | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|
| `index.html` | 89 | 89 | ❌ | ❌ |
| `website/portfolio/index.html` | 4 | 89 | ✅ | ❌ |

### Group 22 — files: 2, bytes: 8828
| File | Refs (exact path) | Refs (basename) | Active Scope | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|
| `library/fadhilweblib/components/overlay/dialog.tsx` | 2 | 4 | ✅ | ❌ |
| `website/mindmapmaker/src/lib/fadhilweblib/components/overlay/dialog.tsx` | 2 | 4 | ✅ | ❌ |

### Group 23 — files: 3, bytes: 8349
| File | Refs (exact path) | Refs (basename) | Active Scope | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|
| `extension/fadhil-format.js` | 5 | 10 | ❌ | ❌ |
| `website/archives/fadhil-format.js` | 4 | 10 | ✅ | ❌ |
| `website/extension/fadhil-format.js` | 2 | 10 | ✅ | ❌ |

### Group 24 — files: 2, bytes: 8142
| File | Refs (exact path) | Refs (basename) | Active Scope | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|
| `library/fadhilweblib/core/use-roving-focus.ts` | 2 | 4 | ✅ | ❌ |
| `website/mindmapmaker/src/lib/fadhilweblib/core/use-roving-focus.ts` | 2 | 4 | ✅ | ❌ |

### Group 25 — files: 2, bytes: 7236
| File | Refs (exact path) | Refs (basename) | Active Scope | Safe Delete Candidate |
|---|---:|---:|:---:|:---:|
| `library/fadhilweblib/components/layout/section.tsx` | 0 | 0 | ✅ | ❌ |
| `website/mindmapmaker/src/lib/fadhilweblib/components/layout/section.tsx` | 0 | 0 | ✅ | ❌ |

## Static Unused File Audit (High Confidence)

- Candidate files scanned: 72
- Used via vercel config: 0
- Used via exact references: 71
- Potential unused files: 1

| Extension | Count |
|---|---:|
| `.js` | 1 |

| Potential unused file | Exact path refs |
|---|---:|
| `games/dreambusiness/app.js` | 0 |

### Notes

- Audit scope is intentionally limited to static delivery folders to minimize false positives.
- A file is considered used when matched by vercel routes/builds or referenced by exact repository path.
- Dynamic runtime fetches may not be detected; validate before deletion.

## LOC Audit (Whole Repository)

- Tracked files scanned: 478
- Total lines: 106809
- Code lines: 96292
- Blank lines: 8625
- Comment lines: 1892

| Extension | Files | Total | Code | Blank | Comment |
|---|---:|---:|---:|---:|---:|
| `.css` | 63 | 10538 | 7810 | 1082 | 1646 |
| `.html` | 19 | 3247 | 3066 | 167 | 14 |
| `.js` | 46 | 25675 | 23764 | 1829 | 82 |
| `.json` | 10 | 11821 | 11821 | 0 | 0 |
| `.jsonc` | 1 | 17 | 17 | 0 | 0 |
| `.mjs` | 1 | 27 | 22 | 5 | 0 |
| `.py` | 2 | 994 | 846 | 141 | 7 |
| `.sh` | 2 | 46 | 28 | 11 | 7 |
| `.sql` | 6 | 87 | 65 | 10 | 12 |
| `.svg` | 2 | 6 | 6 | 0 | 0 |
| `.toml` | 1 | 12 | 11 | 1 | 0 |
| `.ts` | 201 | 31848 | 28203 | 3571 | 74 |
| `.tsx` | 115 | 22345 | 20520 | 1795 | 30 |
| `.txt` | 1 | 20 | 14 | 5 | 1 |
| `.xml` | 1 | 63 | 63 | 0 | 0 |
| `[no-ext]` | 7 | 63 | 36 | 8 | 19 |

## Deprecated Code Audit

- Total pattern hits: 681
- Files with hits: 8

| Pattern | Hits |
|---|---:|
| `var-declaration` | 681 |

| File | Line | Pattern | Snippet |
|---|---:|---|---|
| `dreambusiness/dream-engine-bundle.js` | 2 | `var-declaration` | `var SEMICONDUCTOR_PRIMARY = [` |
| `dreambusiness/dream-engine-bundle.js` | 34 | `var-declaration` | `var SEMICONDUCTOR_SECONDARY = [` |
| `dreambusiness/dream-engine-bundle.js` | 56 | `var-declaration` | `var GAME_PRIMARY = [` |
| `dreambusiness/dream-engine-bundle.js` | 78 | `var-declaration` | `var GAME_SECONDARY = [` |
| `dreambusiness/dream-engine-bundle.js` | 100 | `var-declaration` | `var SOFTWARE_PRIMARY = [` |
| `dreambusiness/dream-engine-bundle.js` | 122 | `var-declaration` | `var SOFTWARE_SECONDARY = [` |
| `dreambusiness/dream-engine-bundle.js` | 144 | `var-declaration` | `var TERTIARY = ["Group", "Works", "Labs", "Collective", "Hub", "Division", "Center", "Network"];` |
| `dreambusiness/dream-engine-bundle.js` | 170 | `var-declaration` | `var MAX_CACHE_SIZE = 250;` |
| `dreambusiness/dream-engine-bundle.js` | 171 | `var-declaration` | `var parsedStringSyntaxCache = /* @__PURE__ */ new Map();` |
| `dreambusiness/dream-engine-bundle.js` | 172 | `var-declaration` | `var parsedObjectSyntaxCache = /* @__PURE__ */ new WeakMap();` |
| `dreambusiness/dream-engine-bundle.js` | 173 | `var-declaration` | `var EMPTY_PARSED_SYNTAX = Object.freeze({});` |
| `dreambusiness/dream-engine-bundle.js` | 174 | `var-declaration` | `var EMPTY_STYLE = Object.freeze({});` |
| `dreambusiness/dream-engine-bundle.js` | 175 | `var-declaration` | `var EMPTY_SEMANTICS = Object.freeze({});` |
| `dreambusiness/dream-engine-bundle.js` | 176 | `var-declaration` | `var EMPTY_LOGIC = Object.freeze({});` |
| `dreambusiness/dream-engine-bundle.js` | 177 | `var-declaration` | `var EMPTY_ATTRS = Object.freeze({});` |
| `dreambusiness/dream-engine-bundle.js` | 178 | `var-declaration` | `var EMPTY_RESOLVED_SYNTAX = Object.freeze({` |
| `dreambusiness/dream-engine-bundle.js` | 184 | `var-declaration` | `var KEY_ALIASES = {` |
| `dreambusiness/dream-engine-bundle.js` | 407 | `var-declaration` | `var GROUP_ALIASES = {` |
| `dreambusiness/dream-engine-bundle.js` | 434 | `var-declaration` | `var GROUP_KEYS = {` |
| `dreambusiness/dream-engine-bundle.js` | 615 | `var-declaration` | `var GROUP_KEY_SETS = Object.freeze({` |
| `dreambusiness/dream-engine-bundle.js` | 648 | `var-declaration` | `var FadhilWebSyntaxError = class extends Error {` |
| `dreambusiness/dream-engine-bundle.js` | 1061 | `var-declaration` | `var DEFAULT_RELEASE_PROFILE = Object.freeze({` |
| `dreambusiness/dream-engine-bundle.js` | 1080 | `var-declaration` | `var RELEASE_PROFILE_SYNTAX = `vars(` |
| `dreambusiness/dream-engine-bundle.js` | 1136 | `var-declaration` | `var GAME_RELEASE_SYNTAX_PROFILE = buildReleaseSyntaxProfile();` |
| `dreambusiness/dream-engine-bundle.js` | 1137 | `var-declaration` | `var ALLOWED_FUNCTIONS = {` |
| `dreambusiness/dream-engine-bundle.js` | 1143 | `var-declaration` | `var OP_PRIORITY = {` |
| `dreambusiness/dream-engine-bundle.js` | 1149 | `var-declaration` | `var expressionCache = /* @__PURE__ */ new Map();` |
| `dreambusiness/dream-engine-bundle.js` | 1150 | `var-declaration` | `var programCache = /* @__PURE__ */ new Map();` |
| `dreambusiness/dream-engine-bundle.js` | 1332 | `var-declaration` | `var GAME_MATH_EXPRESSIONS = Object.freeze({` |
| `dreambusiness/dream-engine-bundle.js` | 1339 | `var-declaration` | `var TICK_MS = 200;` |
| `dreambusiness/dream-engine-bundle.js` | 1340 | `var-declaration` | `var START_DATE_UTC = Date.UTC(2e3, 0, 1);` |
| `dreambusiness/dream-engine-bundle.js` | 1341 | `var-declaration` | `var NPC_ACTION_EVERY_TICKS = 10;` |
| `dreambusiness/dream-engine-bundle.js` | 1342 | `var-declaration` | `var PLAYER_STARTING_CASH = 140;` |
| `dreambusiness/dream-engine-bundle.js` | 1343 | `var-declaration` | `var INITIAL_NPC_COUNT = 75;` |
| `dreambusiness/dream-engine-bundle.js` | 1344 | `var-declaration` | `var MAX_ACTIVE_NPCS = 75;` |
| `dreambusiness/dream-engine-bundle.js` | 1345 | `var-declaration` | `var NPC_GROWTH_START_DAY = 180;` |
| `dreambusiness/dream-engine-bundle.js` | 1346 | `var-declaration` | `var NPC_GROWTH_INTERVAL_DAYS = 60;` |
| `dreambusiness/dream-engine-bundle.js` | 1347 | `var-declaration` | `var NPC_GROWTH_BATCH = 3;` |
| `dreambusiness/dream-engine-bundle.js` | 1348 | `var-declaration` | `var GOVERNANCE_REFRESH_TICK_INTERVAL = 5;` |
| `dreambusiness/dream-engine-bundle.js` | 1349 | `var-declaration` | `var EXECUTIVE_MIN_TENURE_DAYS = 30;` |
| `dreambusiness/dream-engine-bundle.js` | 1350 | `var-declaration` | `var BOARD_VOTE_WINDOW_DAYS = 30;` |
| `dreambusiness/dream-engine-bundle.js` | 1351 | `var-declaration` | `var BOARD_VOTE_LIMIT_PER_WINDOW = 2;` |
| `dreambusiness/dream-engine-bundle.js` | 1352 | `var-declaration` | `var INVESTOR_TAX_INTERVAL_DAYS = 30;` |
| `dreambusiness/dream-engine-bundle.js` | 1353 | `var-declaration` | `var TOTAL_SHARES = 1e3;` |
| `dreambusiness/dream-engine-bundle.js` | 1354 | `var-declaration` | `var INITIAL_FOUNDER_OWNERSHIP_RATIO = 0.52;` |
| `dreambusiness/dream-engine-bundle.js` | 1355 | `var-declaration` | `var COMPANY_TRADE_FEE_RATE = 0.018;` |
| `dreambusiness/dream-engine-bundle.js` | 1356 | `var-declaration` | `var HOLDER_TRADE_FEE_RATE = 0.052;` |
| `dreambusiness/dream-engine-bundle.js` | 1357 | `var-declaration` | `var MIN_TRADE_AMOUNT = 0.1;` |
| `dreambusiness/dream-engine-bundle.js` | 1358 | `var-declaration` | `var PLAN_DURATION_DAYS = 30;` |
| `dreambusiness/dream-engine-bundle.js` | 1359 | `var-declaration` | `var MAX_ACTIVE_COMPANIES = 8;` |
| `dreambusiness/dream-engine-bundle.js` | 1360 | `var-declaration` | `var COMPANY_KEYS = ["cosmic", "rmd", "heroscop", "venture4", "venture5", "venture6", "venture7", "venture8"];` |
| `dreambusiness/dream-engine-bundle.js` | 1361 | `var-declaration` | `var CORE_COMPANY_KEYS = ["cosmic", "rmd", "heroscop"];` |
| `dreambusiness/dream-engine-bundle.js` | 1362 | `var-declaration` | `var DYNAMIC_COMPANY_KEYS = ["venture4", "venture5", "venture6", "venture7", "venture8"];` |
| `dreambusiness/dream-engine-bundle.js` | 1363 | `var-declaration` | `var PRICE_PRESETS = [` |
| `dreambusiness/dream-engine-bundle.js` | 1368 | `var-declaration` | `var DEFAULT_PROFILE_DRAFT = {` |
| `dreambusiness/dream-engine-bundle.js` | 1374 | `var-declaration` | `var STRATEGY_LABELS = {` |
| `dreambusiness/dream-engine-bundle.js` | 1381 | `var-declaration` | `var EXECUTIVE_ROLE_META = {` |
| `dreambusiness/dream-engine-bundle.js` | 1407 | `var-declaration` | `var EXECUTIVE_ROLES = Object.keys(EXECUTIVE_ROLE_META);` |
| `dreambusiness/dream-engine-bundle.js` | 1408 | `var-declaration` | `var NPC_FIRST_NAMES = [` |
| `dreambusiness/dream-engine-bundle.js` | 1480 | `var-declaration` | `var NPC_LAST_NAMES = [` |
| `dreambusiness/dream-engine-bundle.js` | 1542 | `var-declaration` | `var NPC_NAME_VARIANT_SUFFIXES = ["a", "an", "el", "er", "ia", "in", "is", "on", "or", "us"];` |
| `dreambusiness/dream-engine-bundle.js` | 1543 | `var-declaration` | `var toTitleCaseToken = (value) => value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();` |
| `dreambusiness/dream-engine-bundle.js` | 1544 | `var-declaration` | `var NPC_FIRST_NAME_POOL = Array.from(/* @__PURE__ */ new Set([` |
| `dreambusiness/dream-engine-bundle.js` | 1548 | `var-declaration` | `var NPC_LAST_NAME_POOL = Array.from(/* @__PURE__ */ new Set([` |
| `dreambusiness/dream-engine-bundle.js` | 1552 | `var-declaration` | `var NPC_PERSONAS = [` |
| `dreambusiness/dream-engine-bundle.js` | 3008 | `var-declaration` | `var INITIAL_BASELINES = {` |
| `games/hype/hype-debugger.js` | 2 | `var-declaration` | `var DEBUG_SESSION_KEY = '__hype_debug_once__';` |
| `games/hype/hype-debugger.js` | 3 | `var-declaration` | `var DEBUG_DOM_ID = 'hype-debug-once';` |
| `games/hype/hype-debugger.js` | 4 | `var-declaration` | `var HISTORY_LIMIT = 320;` |
| `games/hype/hype-debugger.js` | 5 | `var-declaration` | `var WATCHDOG_INTERVAL_MS = 2600;` |
| `games/hype/hype-debugger.js` | 6 | `var-declaration` | `var REPORT_DEDUP_WINDOW_MS = 1800;` |
| `games/hype/hype-debugger.js` | 37 | `var-declaration` | `var core = [` |
| `games/hype/hype-debugger.js` | 49 | `var-declaration` | `var map = getDedupMap();` |
| `games/hype/hype-debugger.js` | 50 | `var-declaration` | `var sig = computeSignature(kind, detail);` |
| `games/hype/hype-debugger.js` | 51 | `var-declaration` | `var now = Date.now();` |
| `games/hype/hype-debugger.js` | 52 | `var-declaration` | `var last = map.get(sig) || 0;` |
| `games/hype/hype-debugger.js` | 58 | `var-declaration` | `var history = getHistory();` |
| `games/hype/hype-debugger.js` | 65 | `var-declaration` | `var causes = [];` |
| `games/hype/hype-debugger.js` | 66 | `var-declaration` | `var msg = String((detail && detail.message) || '').toLowerCase();` |
| `games/hype/hype-debugger.js` | 67 | `var-declaration` | `var stack = String((detail && detail.stack) || '').toLowerCase();` |
| `games/hype/hype-debugger.js` | 107 | `var-declaration` | `var predictions = [];` |
| `games/hype/hype-debugger.js` | 130 | `var-declaration` | `var max = 0;` |
| `games/hype/hype-debugger.js` | 136 | `var-declaration` | `var recent = history.slice(-14);` |
| `games/hype/hype-debugger.js` | 137 | `var-declaration` | `var byKind = {};` |
| `games/hype/hype-debugger.js` | 139 | `var-declaration` | `var k = recent[i].kind || 'unknown';` |
| `games/hype/hype-debugger.js` | 143 | `var-declaration` | `var dominantKind = null;` |
| `games/hype/hype-debugger.js` | 144 | `var-declaration` | `var dominantCount = 0;` |
| `games/hype/hype-debugger.js` | 145 | `var-declaration` | `var keys = Object.keys(byKind);` |
| `games/hype/hype-debugger.js` | 153 | `var-declaration` | `var trend = dominantKind ? ('Dominan: ' + dominantKind + ' x' + dominantCount + ' (14 event terakhir).') : 'Belum cukup data trend.';` |
| `games/hype/hype-debugger.js` | 154 | `var-declaration` | `var nextAction = 'Periksa payload detail + stack pada event terbaru, lalu validasi elemen DOM dan urutan inisialisasi.';` |
| `games/hype/hype-debugger.js` | 183 | `var-declaration` | `var doc = global.document;` |
| `games/hype/hype-debugger.js` | 185 | `var-declaration` | `var existing = doc.getElementById(DEBUG_DOM_ID);` |
| `games/hype/hype-debugger.js` | 188 | `var-declaration` | `var panel = doc.createElement('section');` |
| `games/hype/hype-debugger.js` | 207 | `var-declaration` | `var heading = doc.createElement('strong');` |
| `games/hype/hype-debugger.js` | 212 | `var-declaration` | `var status = doc.createElement('div');` |
| `games/hype/hype-debugger.js` | 217 | `var-declaration` | `var causes = doc.createElement('div');` |
| `games/hype/hype-debugger.js` | 222 | `var-declaration` | `var predictions = doc.createElement('div');` |
| `games/hype/hype-debugger.js` | 227 | `var-declaration` | `var logs = doc.createElement('pre');` |
| `games/hype/hype-debugger.js` | 232 | `var-declaration` | `var row = doc.createElement('div');` |
| `games/hype/hype-debugger.js` | 235 | `var-declaration` | `var copy = doc.createElement('button');` |
| `games/hype/hype-debugger.js` | 239 | `var-declaration` | `var payload = panel.getAttribute('data-last-payload') || '';` |
| `games/hype/hype-debugger.js` | 240 | `var-declaration` | `var nav = global.navigator;` |
| `games/hype/hype-debugger.js` | 246 | `var-declaration` | `var clear = doc.createElement('button');` |
| `games/hype/hype-debugger.js` | 250 | `var-declaration` | `var history = getHistory();` |
| `games/hype/hype-debugger.js` | 255 | `var-declaration` | `var close = doc.createElement('button');` |
| `games/hype/hype-debugger.js` | 270 | `var-declaration` | `var statusEl = panel.querySelector('#' + DEBUG_DOM_ID + '-status');` |
| `games/hype/hype-debugger.js` | 271 | `var-declaration` | `var causesEl = panel.querySelector('#' + DEBUG_DOM_ID + '-causes');` |
| `games/hype/hype-debugger.js` | 272 | `var-declaration` | `var predEl = panel.querySelector('#' + DEBUG_DOM_ID + '-predictions');` |
| `games/hype/hype-debugger.js` | 273 | `var-declaration` | `var payloadEl = panel.querySelector('#' + DEBUG_DOM_ID + '-payload');` |
| `games/hype/hype-debugger.js` | 312 | `var-declaration` | `var severity = kind === 'runtime-error' || kind === 'resource-error' || kind === 'unhandled-rejection' || kind === 'bootstrap-error'` |
| `games/hype/hype-debugger.js` | 316 | `var-declaration` | `var entry = {` |
| `games/hype/hype-debugger.js` | 323 | `var-declaration` | `var history = pushHistory(entry);` |
| `games/hype/hype-debugger.js` | 324 | `var-declaration` | `var causes = inferCauses(kind, detail || {});` |
| `games/hype/hype-debugger.js` | 325 | `var-declaration` | `var predictions = inferPredictions(kind, detail || {});` |
| `games/hype/hype-debugger.js` | 326 | `var-declaration` | `var payload = {` |
| `games/hype/hype-debugger.js` | 342 | `var-declaration` | `var panel = ensureContainer();` |
| `games/hype/hype-debugger.js` | 348 | `var-declaration` | `var doc = global.document;` |
| `games/hype/hype-debugger.js` | 351 | `var-declaration` | `var app = doc.getElementById('hypeApp');` |
| `games/hype/hype-debugger.js` | 357 | `var-declaration` | `var required = [` |
| `games/hype/hype-debugger.js` | 366 | `var-declaration` | `var selector = required[i];` |
| `games/hype/hype-debugger.js` | 381 | `var-declaration` | `var originalError = global.console && global.console.error ? global.console.error.bind(global.console) : null;` |
| `games/hype/hype-debugger.js` | 382 | `var-declaration` | `var originalWarn = global.console && global.console.warn ? global.console.warn.bind(global.console) : null;` |
| `games/hype/hype-debugger.js` | 386 | `var-declaration` | `var args = Array.prototype.slice.call(arguments || []);` |
| `games/hype/hype-debugger.js` | 387 | `var-declaration` | `var message = args.map(function (arg) {` |
| `games/hype/hype-debugger.js` | 397 | `var-declaration` | `var args = Array.prototype.slice.call(arguments || []);` |
| `games/hype/hype-debugger.js` | 398 | `var-declaration` | `var message = args.map(function (arg) { return typeof arg === 'string' ? arg : safeStringify(arg); }).join(' | ').slice(0, 2000);` |
| `games/hype/hype-debugger.js` | 412 | `var-declaration` | `var target = event && event.target;` |
| `games/hype/hype-debugger.js` | 422 | `var-declaration` | `var err = event && event.error ? toPlainError(event.error) : null;` |
| `games/hype/hype-debugger.js` | 433 | `var-declaration` | `var reason = toPlainError(event ? event.reason : null);` |
| `games/rpg/fadhilwebrpglib.js` | 2 | `var-declaration` | `var DEBUG_SESSION_KEY = '__fwrpg_debug_once__';` |
| `games/rpg/fadhilwebrpglib.js` | 3 | `var-declaration` | `var DEBUG_DOM_ID = 'fwrpg-debug-once';` |
| `games/rpg/fadhilwebrpglib.js` | 4 | `var-declaration` | `var DEBUG_HISTORY_LIMIT = 220;` |
| `games/rpg/fadhilwebrpglib.js` | 15 | `var-declaration` | `var causes = [];` |
| `games/rpg/fadhilwebrpglib.js` | 36 | `var-declaration` | `var predictions = [];` |
| `games/rpg/fadhilwebrpglib.js` | 56 | `var-declaration` | `var history = getDebugHistory();` |
| `games/rpg/fadhilwebrpglib.js` | 84 | `var-declaration` | `var doc = global && global.document;` |
| `games/rpg/fadhilwebrpglib.js` | 86 | `var-declaration` | `var body = doc.body;` |
| `games/rpg/fadhilwebrpglib.js` | 92 | `var-declaration` | `var panel = doc.createElement('section');` |
| `games/rpg/fadhilwebrpglib.js` | 97 | `var-declaration` | `var heading = doc.createElement('strong');` |
| `games/rpg/fadhilwebrpglib.js` | 103 | `var-declaration` | `var detail = doc.createElement('pre');` |
| `games/rpg/fadhilwebrpglib.js` | 108 | `var-declaration` | `var actions = doc.createElement('div');` |
| `games/rpg/fadhilwebrpglib.js` | 110 | `var-declaration` | `var copyBtn = doc.createElement('button');` |
| `games/rpg/fadhilwebrpglib.js` | 114 | `var-declaration` | `var text = detail.textContent || '';` |
| `games/rpg/fadhilwebrpglib.js` | 115 | `var-declaration` | `var nav = global.navigator;` |
| `games/rpg/fadhilwebrpglib.js` | 121 | `var-declaration` | `var closeBtn = doc.createElement('button');` |
| `games/rpg/fadhilwebrpglib.js` | 134 | `var-declaration` | `var info = detail || {};` |
| `games/rpg/fadhilwebrpglib.js` | 135 | `var-declaration` | `var history = getDebugHistory();` |
| `games/rpg/fadhilwebrpglib.js` | 136 | `var-declaration` | `var payload = {` |
| `games/rpg/fadhilwebrpglib.js` | 154 | `var-declaration` | `var payload = buildDebugPayload(kind, detail);` |
| `games/rpg/fadhilwebrpglib.js` | 160 | `var-declaration` | `var doc = global && global.document;` |
| `games/rpg/fadhilwebrpglib.js` | 164 | `var-declaration` | `var config = options || {};` |
| `games/rpg/fadhilwebrpglib.js` | 165 | `var-declaration` | `var param = config.triggerParam || 'rpgdebug';` |
| `games/rpg/fadhilwebrpglib.js` | 166 | `var-declaration` | `var search = (global.location && global.location.search) || '';` |
| `games/rpg/fadhilwebrpglib.js` | 175 | `var-declaration` | `var target = event && event.target;` |
| `games/rpg/fadhilwebrpglib.js` | 202 | `var-declaration` | `var localSeed = seed >>> 0;` |
| `games/rpg/fadhilwebrpglib.js` | 211 | `var-declaration` | `var elementTable = {` |
| `games/rpg/fadhilwebrpglib.js` | 314 | `var-declaration` | `var config = options || {};` |
| `games/rpg/fadhilwebrpglib.js` | 315 | `var-declaration` | `var map = cloneMap(config.map || defaultWorldMap());` |
| `games/rpg/fadhilwebrpglib.js` | 316 | `var-declaration` | `var location = map.locations.find(function (loc) { return loc.id === map.playerLocationId; }) || map.locations[0];` |
| `games/rpg/fadhilwebrpglib.js` | 373 | `var-declaration` | `var jitter = Math.floor(rng() * 6);` |
| `games/rpg/fadhilwebrpglib.js` | 374 | `var-declaration` | `var burden = u.status.some(function (s) { return s.type === 'slow'; }) ? -8 : 0;` |
| `games/rpg/fadhilwebrpglib.js` | 375 | `var-declaration` | `var haste = u.status.some(function (s) { return s.type === 'haste'; }) ? 7 : 0;` |
| `games/rpg/fadhilwebrpglib.js` | 376 | `var-declaration` | `var stance = u.role === 'striker' ? 2 : 0;` |
| `games/rpg/fadhilwebrpglib.js` | 388 | `var-declaration` | `var active = unit.status.find(function (s) { return s.type === statusType; });` |
| `games/rpg/fadhilwebrpglib.js` | 400 | `var-declaration` | `var poisonDamage = Math.max(1, Math.floor(unit.maxHp * 0.06));` |
| `games/rpg/fadhilwebrpglib.js` | 407 | `var-declaration` | `var regen = Math.max(1, Math.floor(unit.maxHp * 0.05));` |
| `games/rpg/fadhilwebrpglib.js` | 425 | `var-declaration` | `var base = actor.attack + actor.spirit + skill.power + Math.floor(combo * 0.7) + Math.floor(actor.tp * 0.2);` |
| `games/rpg/fadhilwebrpglib.js` | 426 | `var-declaration` | `var reduction = target.defense + Math.floor(target.spirit * 0.65);` |
| `games/rpg/fadhilwebrpglib.js` | 427 | `var-declaration` | `var multiplier = (elementTable[skill.element] && elementTable[skill.element][target.element]) || 1;` |
| `games/rpg/fadhilwebrpglib.js` | 428 | `var-declaration` | `var fieldBuff = weatherModifier(field, skill.element);` |
| `games/rpg/fadhilwebrpglib.js` | 429 | `var-declaration` | `var spread = 1 + (rng() * 2 - 1) * skill.variance;` |
| `games/rpg/fadhilwebrpglib.js` | 430 | `var-declaration` | `var criticalRate = Math.min(0.4, 0.05 + actor.agility / 240);` |
| `games/rpg/fadhilwebrpglib.js` | 431 | `var-declaration` | `var crit = rng() < criticalRate;` |
| `games/rpg/fadhilwebrpglib.js` | 432 | `var-declaration` | `var guardScale = target.guarding ? 0.5 : 1;` |
| `games/rpg/fadhilwebrpglib.js` | 433 | `var-declaration` | `var breakBonus = target.breakGauge <= 0 ? 1.2 : 1;` |
| `games/rpg/fadhilwebrpglib.js` | 434 | `var-declaration` | `var raw = Math.max(1, Math.floor((base - reduction) * multiplier * fieldBuff * spread * guardScale * breakBonus));` |
| `games/rpg/fadhilwebrpglib.js` | 439 | `var-declaration` | `var usable = actor.skills.filter(function (skill) {` |
| `games/rpg/fadhilwebrpglib.js` | 447 | `var-declaration` | `var alive = pool.filter(function (u) { return u.alive; });` |
| `games/rpg/fadhilwebrpglib.js` | 453 | `var-declaration` | `var action = { type: type, actorId: actorId, targetId: targetId };` |
| `games/rpg/fadhilwebrpglib.js` | 454 | `var-declaration` | `var extraKeys = Object.keys(extras || {});` |
| `games/rpg/fadhilwebrpglib.js` | 462 | `var-declaration` | `var actor = getUnit(state, actorId);` |
| `games/rpg/fadhilwebrpglib.js` | 464 | `var-declaration` | `var catalog = [{ id: 'basic', label: 'basic' }, { id: 'guard', label: 'guard' }];` |
| `games/rpg/fadhilwebrpglib.js` | 482 | `var-declaration` | `var actor = getUnit(state, actorId);` |
| `games/rpg/fadhilwebrpglib.js` | 484 | `var-declaration` | `var actorInParty = getSide(state, actorId) === 'party';` |
| `games/rpg/fadhilwebrpglib.js` | 485 | `var-declaration` | `var foes = actorInParty ? state.enemies : state.party;` |
| `games/rpg/fadhilwebrpglib.js` | 486 | `var-declaration` | `var allies = actorInParty ? state.party : state.enemies;` |
| `games/rpg/fadhilwebrpglib.js` | 487 | `var-declaration` | `var enemy = nexttargetFromPool(foes);` |
| `games/rpg/fadhilwebrpglib.js` | 488 | `var-declaration` | `var allyLow = nexttargetFromPool(allies);` |
| `games/rpg/fadhilwebrpglib.js` | 494 | `var-declaration` | `var skillId = selectedId.slice(6);` |
| `games/rpg/fadhilwebrpglib.js` | 495 | `var-declaration` | `var skill = actor.skills.find(function (s) { return s.id === skillId; });` |
| `games/rpg/fadhilwebrpglib.js` | 497 | `var-declaration` | `var target = skill.target === 'ally' ? allyLow : enemy;` |
| `games/rpg/fadhilwebrpglib.js` | 502 | `var-declaration` | `var itemId = selectedId.slice(5);` |
| `games/rpg/fadhilwebrpglib.js` | 503 | `var-declaration` | `var item = state.inventory.find(function (i) { return i.id === itemId; });` |
| `games/rpg/fadhilwebrpglib.js` | 504 | `var-declaration` | `var targetForItem = item && item.revive > 0 ? (allies.find(function (u) { return !u.alive; }) || allyLow) : allyLow;` |
| `games/rpg/fadhilwebrpglib.js` | 512 | `var-declaration` | `var actor = getUnit(state, actorId);` |
| `games/rpg/fadhilwebrpglib.js` | 515 | `var-declaration` | `var actorInParty = getSide(state, actorId) === 'party';` |
| `games/rpg/fadhilwebrpglib.js` | 516 | `var-declaration` | `var allies = actorInParty ? state.party : state.enemies;` |
| `games/rpg/fadhilwebrpglib.js` | 517 | `var-declaration` | `var foes = actorInParty ? state.enemies : state.party;` |
| `games/rpg/fadhilwebrpglib.js` | 518 | `var-declaration` | `var enemy = nexttargetFromPool(foes);` |
| `games/rpg/fadhilwebrpglib.js` | 521 | `var-declaration` | `var fallen = allies.find(function (entry) { return !entry.alive; });` |
| `games/rpg/fadhilwebrpglib.js` | 522 | `var-declaration` | `var reviveItem = state.inventory.find(function (entry) { return entry.qty > 0 && entry.revive > 0; });` |
| `games/rpg/fadhilwebrpglib.js` | 525 | `var-declaration` | `var needHeal = allies.find(function (entry) { return entry.alive && entry.hp / entry.maxHp < 0.33; });` |
| `games/rpg/fadhilwebrpglib.js` | 526 | `var-declaration` | `var healingSkill = actor.skills.find(function (skill) {` |
| `games/rpg/fadhilwebrpglib.js` | 533 | `var-declaration` | `var breakSkill = actor.skills.find(function (skill) {` |
| `games/rpg/fadhilwebrpglib.js` | 538 | `var-declaration` | `var limitSkill = actor.skills.find(function (skill) {` |
| `games/rpg/fadhilwebrpglib.js` | 543 | `var-declaration` | `var skill = pickSkill(actor, false);` |
| `games/rpg/fadhilwebrpglib.js` | 594 | `var-declaration` | `var dice = rng();` |
| `games/rpg/fadhilwebrpglib.js` | 622 | `var-declaration` | `var next = normalizeState(state);` |
| `games/rpg/fadhilwebrpglib.js` | 623 | `var-declaration` | `var actor = getUnit(next, action.actorId);` |
| `games/rpg/fadhilwebrpglib.js` | 650 | `var-declaration` | `var target = getUnit(next, action.targetId);` |
| `games/rpg/fadhilwebrpglib.js` | 654 | `var-declaration` | `var item = next.inventory.find(function (entry) { return entry.id === action.itemId && entry.qty > 0; });` |
| `games/rpg/fadhilwebrpglib.js` | 673 | `var-declaration` | `var basicSkill = { power: Math.max(8, Math.floor(actor.attack * 0.55)), element: actor.element, variance: 0.12, breakDamage: 18 };` |
| `games/rpg/fadhilwebrpglib.js` | 674 | `var-declaration` | `var basic = computeDamage(actor, target, basicSkill, rng, next.combo, next.field);` |
| `games/rpg/fadhilwebrpglib.js` | 689 | `var-declaration` | `var skill = actor.skills.find(function (entry) { return entry.id === action.skillId; });` |
| `games/rpg/fadhilwebrpglib.js` | 700 | `var-declaration` | `var heal = Math.max(1, Math.floor(actor.spirit * skill.healScale + actor.level * 2));` |
| `games/rpg/fadhilwebrpglib.js` | 710 | `var-declaration` | `var outcome = computeDamage(actor, target, skill, rng, next.combo, next.field);` |
| `games/rpg/fadhilwebrpglib.js` | 731 | `var-declaration` | `var next = normalizeState(state);` |
| `games/rpg/fadhilwebrpglib.js` | 732 | `var-declaration` | `var order = createTimeline(next, rng);` |
| `games/rpg/fadhilwebrpglib.js` | 739 | `var-declaration` | `var actorId = order[i];` |
| `games/rpg/fadhilwebrpglib.js` | 740 | `var-declaration` | `var action = planner ? planner(next, actorId) : autoAction(next, actorId);` |
| `games/rpg/fadhilwebrpglib.js` | 750 | `var-declaration` | `var working = normalizeState(state);` |
| `games/rpg/fadhilwebrpglib.js` | 751 | `var-declaration` | `var rounds = maxRounds || 4;` |
| `games/rpg/fadhilwebrpglib.js` | 752 | `var-declaration` | `var logAccumulator = [];` |
| `games/rpg/fadhilwebrpglib.js` | 767 | `var-declaration` | `var map = state.world.map;` |
| `games/rpg/fadhilwebrpglib.js` | 768 | `var-declaration` | `var current = getMapLocation(map, map.playerLocationId);` |
| `games/rpg/fadhilwebrpglib.js` | 775 | `var-declaration` | `var isCurrent = loc.id === map.playerLocationId;` |
| `games/rpg/fadhilwebrpglib.js` | 776 | `var-declaration` | `var reachable = isCurrent || (current && current.neighbors.indexOf(loc.id) >= 0);` |
| `games/rpg/fadhilwebrpglib.js` | 792 | `var-declaration` | `var next = normalizeState(state);` |
| `games/rpg/fadhilwebrpglib.js` | 793 | `var-declaration` | `var cam = next.world.map.camera;` |
| `games/rpg/fadhilwebrpglib.js` | 802 | `var-declaration` | `var origin = getMapLocation(map, fromId);` |
| `games/rpg/fadhilwebrpglib.js` | 808 | `var-declaration` | `var next = normalizeState(state);` |
| `games/rpg/fadhilwebrpglib.js` | 809 | `var-declaration` | `var map = next.world.map;` |
| `games/rpg/fadhilwebrpglib.js` | 815 | `var-declaration` | `var destination = getMapLocation(map, locationId);` |
| `games/rpg/fadhilwebrpglib.js` | 831 | `var-declaration` | `var cmd = (command || '').trim().toLowerCase();` |
| `games/rpg/fadhilwebrpglib.js` | 834 | `var-declaration` | `var helpState = normalizeState(state);` |
| `games/rpg/fadhilwebrpglib.js` | 839 | `var-declaration` | `var summary = getBattleSummary(state);` |
| `games/rpg/fadhilwebrpglib.js` | 840 | `var-declaration` | `var statusState = normalizeState(state);` |
| `games/rpg/fadhilwebrpglib.js` | 845 | `var-declaration` | `var mapState = normalizeState(state);` |
| `games/rpg/fadhilwebrpglib.js` | 851 | `var-declaration` | `var battleState = normalizeState(state);` |
| `games/rpg/fadhilwebrpglib.js` | 866 | `var-declaration` | `var unknown = normalizeState(state);` |
| `games/rpg/fadhilwebrpglib.js` | 872 | `var-declaration` | `var partyAlive = aliveUnits(state.party).length;` |
| `games/rpg/fadhilwebrpglib.js` | 873 | `var-declaration` | `var enemyAlive = aliveUnits(state.enemies).length;` |
| `games/rpg/fadhilwebrpglib.js` | 874 | `var-declaration` | `var winner = '';` |
| `games/rpg/fadhilwebrpglib.js` | 893 | `var-declaration` | `var raceCatalog = {` |
| `games/rpg/fadhilwebrpglib.js` | 899 | `var-declaration` | `var bornAsCatalog = [` |
| `games/rpg/fadhilwebrpglib.js` | 906 | `var-declaration` | `var birthPlaces = [` |
| `games/rpg/fadhilwebrpglib.js` | 915 | `var-declaration` | `var specialSkills = [` |
| `games/rpg/fadhilwebrpglib.js` | 923 | `var-declaration` | `var gradeCatalog = ['F+', 'E', 'D', 'C', 'B', 'A', 'AA', 'S', 'SS', 'SSS', 'SSR', 'SSU+'];` |
| `games/rpg/fadhilwebrpglib.js` | 926 | `var-declaration` | `var acc = 2166136261;` |
| `games/rpg/fadhilwebrpglib.js` | 939 | `var-declaration` | `var race = String(inputRace || '').toLowerCase();` |
| `games/rpg/fadhilwebrpglib.js` | 945 | `var-declaration` | `var roll = sampleRandom(rng);` |
| `games/rpg/fadhilwebrpglib.js` | 946 | `var-declaration` | `var cursor = 0;` |
| `games/rpg/fadhilwebrpglib.js` | 955 | `var-declaration` | `var rand = rng || Math.random;` |
| `games/rpg/fadhilwebrpglib.js` | 956 | `var-declaration` | `var name = String((input && input.name) || '').trim();` |
| `games/rpg/fadhilwebrpglib.js` | 958 | `var-declaration` | `var race = normalizeRace(input && input.race);` |
| `games/rpg/fadhilwebrpglib.js` | 959 | `var-declaration` | `var bornAs = pickBornAs(rand);` |
| `games/rpg/fadhilwebrpglib.js` | 960 | `var-declaration` | `var birthPlace = randomPick(birthPlaces, rand);` |
| `games/rpg/fadhilwebrpglib.js` | 961 | `var-declaration` | `var specialSkill = randomPick(specialSkills, rand);` |
| `games/rpg/fadhilwebrpglib.js` | 980 | `var-declaration` | `var rand = rng || Math.random;` |
| `games/rpg/fadhilwebrpglib.js` | 981 | `var-declaration` | `var age = Math.max(5, Math.min(8, Number(startAge) || 5));` |
| `games/rpg/fadhilwebrpglib.js` | 982 | `var-declaration` | `var raceStats = raceCatalog[profile.race] ? raceCatalog[profile.race].stats : raceCatalog.humans.stats;` |
| `games/rpg/fadhilwebrpglib.js` | 983 | `var-declaration` | `var bornAs = bornAsCatalog.find(function (entry) { return entry.id === profile.bornAs; }) || bornAsCatalog[0];` |
| `games/rpg/fadhilwebrpglib.js` | 1036 | `var-declaration` | `var next = {` |
| `games/rpg/fadhilwebrpglib.js` | 1084 | `var-declaration` | `var rawStep = Number(days);` |
| `games/rpg/fadhilwebrpglib.js` | 1085 | `var-declaration` | `var step = Number.isFinite(rawStep) ? Math.max(0, Math.floor(rawStep)) : 1;` |
| `games/rpg/fadhilwebrpglib.js` | 1099 | `var-declaration` | `var month = Math.floor(personalState.ageDays / 30) + 1;` |
| `games/rpg/fadhilwebrpglib.js` | 1100 | `var-declaration` | `var day = (personalState.ageDays % 30) + 1;` |
| `games/rpg/fadhilwebrpglib.js` | 1122 | `var-declaration` | `var map = personalState.world.map;` |
| `games/rpg/fadhilwebrpglib.js` | 1123 | `var-declaration` | `var currentId = map.currentLocationId;` |
| `games/rpg/fadhilwebrpglib.js` | 1124 | `var-declaration` | `var current = map.locations.find(function (loc) { return loc.id === currentId; }) || map.locations[0];` |
| `games/rpg/fadhilwebrpglib.js` | 1145 | `var-declaration` | `var next = tickIdleDays(personalState, 0);` |
| `games/rpg/fadhilwebrpglib.js` | 1146 | `var-declaration` | `var cam = next.world.map.camera;` |
| `games/rpg/fadhilwebrpglib.js` | 1153 | `var-declaration` | `var next = tickIdleDays(personalState, 2);` |
| `games/rpg/fadhilwebrpglib.js` | 1154 | `var-declaration` | `var map = next.world.map;` |
| `games/rpg/fadhilwebrpglib.js` | 1155 | `var-declaration` | `var current = map.locations.find(function (loc) { return loc.id === map.currentLocationId; });` |
| `games/rpg/fadhilwebrpglib.js` | 1158 | `var-declaration` | `var destination = map.locations.find(function (loc) { return loc.id === targetLocationId; });` |
| `games/rpg/fadhilwebrpglib.js` | 1167 | `var-declaration` | `var base = [` |
| `games/rpg/fadhilwebrpglib.js` | 1177 | `var-declaration` | `var map = personalState.world.map;` |
| `games/rpg/fadhilwebrpglib.js` | 1178 | `var-declaration` | `var current = map.locations.find(function (loc) { return loc.id === map.currentLocationId; }) || map.locations[0];` |
| `games/rpg/fadhilwebrpglib.js` | 1188 | `var-declaration` | `var rand = rng || Math.random;` |
| `games/rpg/fadhilwebrpglib.js` | 1189 | `var-declaration` | `var next = tickIdleDays(personalState, 1);` |
| `games/rpg/fadhilwebrpglib.js` | 1190 | `var-declaration` | `var map = next.world.map;` |
| `games/rpg/fadhilwebrpglib.js` | 1194 | `var-declaration` | `var scoreNorm = computeAdventurerScore(next, rand);` |
| `games/rpg/fadhilwebrpglib.js` | 1195 | `var-declaration` | `var gradeMeta = scoreToGrade(scoreNorm);` |
| `games/rpg/fadhilwebrpglib.js` | 1216 | `var-declaration` | `var s = personalState.stats;` |
| `games/rpg/fadhilwebrpglib.js` | 1217 | `var-declaration` | `var total = s.strength + s.agility + s.durability + s.stamina + s.intelligence + s.wisdom + s.willpower + s.perception + s.charisma + s.appearance + s.socialWis` |
| `games/rpg/fadhilwebrpglib.js` | 1222 | `var-declaration` | `var gradeIndex = Math.max(0, Math.min(gradeCatalog.length - 1, Math.floor(scoreNorm)));` |
| `games/rpg/fadhilwebrpglib.js` | 1223 | `var-declaration` | `var fraction = scoreNorm - gradeIndex;` |
| `games/rpg/fadhilwebrpglib.js` | 1224 | `var-declaration` | `var delta = fraction >= 0.67 ? '+' : (fraction <= 0.25 ? '-' : '');` |
| `games/rpg/fadhilwebrpglib.js` | 1229 | `var-declaration` | `var rand = rng || Math.random;` |
| `games/rpg/fadhilwebrpglib.js` | 1230 | `var-declaration` | `var next = tickIdleDays(personalState, 1);` |
| `games/rpg/fadhilwebrpglib.js` | 1234 | `var-declaration` | `var adjusted = Math.max(0, Math.min(11.999, next.adventurer.score + (sampleRandom(rand) - 0.48) * 0.5));` |
| `games/rpg/fadhilwebrpglib.js` | 1235 | `var-declaration` | `var gradeMeta = scoreToGrade(adjusted);` |
| `games/rpg/fadhilwebrpglib.js` | 1244 | `var-declaration` | `var rand = rng || Math.random;` |
| `games/rpg/fadhilwebrpglib.js` | 1245 | `var-declaration` | `var limit = Math.max(1, Math.min(80, maxEntries || 80));` |
| `games/rpg/fadhilwebrpglib.js` | 1246 | `var-declaration` | `var list = [];` |
| `games/rpg/fadhilwebrpglib.js` | 1247 | `var-declaration` | `var npcStyles = ['aggressive', 'analyst', 'risk-controller', 'support-core', 'tempo-runner'];` |
| `games/rpg/fadhilwebrpglib.js` | 1248 | `var-declaration` | `var npcMoods = ['fokus', 'tenang', 'adaptif', 'kompetitif', 'eksperimental'];` |
| `games/rpg/fadhilwebrpglib.js` | 1249 | `var-declaration` | `var npcMoves = ['menyusun rute farming', 'menyesuaikan build equipment', 'menganalisis pola boss', 'menjaga stamina tim', 'mencari peluang event'];` |
| `games/rpg/fadhilwebrpglib.js` | 1251 | `var-declaration` | `var score = Math.max(0, Math.min(11.999, sampleRandom(rand) * 12));` |
| `games/rpg/fadhilwebrpglib.js` | 1252 | `var-declaration` | `var meta = scoreToGrade(score);` |
| `games/rpg/fadhilwebrpglib.js` | 1253 | `var-declaration` | `var style = npcStyles[Math.floor(sampleRandom(rand) * npcStyles.length)];` |
| `games/rpg/fadhilwebrpglib.js` | 1254 | `var-declaration` | `var mood = npcMoods[Math.floor(sampleRandom(rand) * npcMoods.length)];` |
| `games/rpg/fadhilwebrpglib.js` | 1255 | `var-declaration` | `var move = npcMoves[Math.floor(sampleRandom(rand) * npcMoves.length)];` |
| `games/rpg/index.html` | 244 | `var-declaration` | `var payload = {` |
| `games/rpg/index.html` | 260 | `var-declaration` | `var wrap = document.createElement('section');` |
| `games/rpg/index.html` | 262 | `var-declaration` | `var text = document.createElement('pre');` |
| `games/rpg/index.html` | 265 | `var-declaration` | `var copy = document.createElement('button');` |
| `games/rpg/index.html` | 278 | `var-declaration` | `var lib = window.fadhilwebrpglib;` |
| `games/rpg/index.html` | 279 | `var-declaration` | `var debugAgent = null;` |
| `games/rpg/index.html` | 280 | `var-declaration` | `var rng = null;` |
| `games/rpg/index.html` | 281 | `var-declaration` | `var profile = null;` |
| `games/rpg/index.html` | 282 | `var-declaration` | `var personalState = null;` |
| `games/rpg/index.html` | 283 | `var-declaration` | `var idleTimer = null;` |
| `games/rpg/index.html` | 284 | `var-declaration` | `var introTimer = null;` |
| `games/rpg/index.html` | 285 | `var-declaration` | `var panelOpenState = { Physical: true, Mental: false, Social: false };` |
| `games/rpg/index.html` | 286 | `var-declaration` | `var activeBuilding = null;` |
| `games/rpg/index.html` | 290 | `var-declaration` | `var el = $('runtimeStatus');` |
| `games/rpg/index.html` | 299 | `var-declaration` | `var mapDrag = { active:false, x:0, y:0, moved:false };` |
| `games/rpg/index.html` | 302 | `var-declaration` | `var seed = (Date.now() & 0xffffffff) ^ (Math.floor(performance.now() * 1000) & 0xffffffff) ^ ((Math.random() * 0xffffffff) >>> 0);` |
| `games/rpg/index.html` | 304 | `var-declaration` | `var arr = new Uint32Array(1);` |
| `games/rpg/index.html` | 313 | `var-declaration` | `var summary = lib.getPersonalSummary(personalState);` |
| `games/rpg/index.html` | 314 | `var-declaration` | `var monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];` |
| `games/rpg/index.html` | 315 | `var-declaration` | `var monthIndex = Math.max(0, Math.min(11, Math.floor(summary.ageDays / 30)));` |
| `games/rpg/index.html` | 316 | `var-declaration` | `var dayStr = String((summary.ageDays % 30) + 1).padStart(2, '0');` |
| `games/rpg/index.html` | 317 | `var-declaration` | `var yearStr = String(summary.ageYears).padStart(4, '0');` |
| `games/rpg/index.html` | 322 | `var-declaration` | `var panels = [` |
| `games/rpg/index.html` | 328 | `var-declaration` | `var rows = panel.items.map(function(item){` |
| `games/rpg/index.html` | 329 | `var-declaration` | `var value = Number(item[1]) || 0;` |
| `games/rpg/index.html` | 330 | `var-declaration` | `var width = Math.max(4, Math.min(100, Math.round((value / 20) * 100)));` |
| `games/rpg/index.html` | 331 | `var-declaration` | `var gradient = width < 35 ? 'linear-gradient(90deg,#7f1d1d,#b91c1c)' : (width < 68 ? 'linear-gradient(90deg,#f97316,#eab308)' : 'linear-gradient(90deg,#06b6d4,#` |
| `games/rpg/index.html` | 334 | `var-declaration` | `var opened = panelOpenState[panel.title] || (panelIndex === 0 && panelOpenState[panel.title] == null);` |
| `games/rpg/index.html` | 338 | `var-declaration` | `var exploreBtn = $('openExploreBtn');` |
| `games/rpg/index.html` | 349 | `var-declaration` | `var view = lib.getExploreView(personalState);` |
| `games/rpg/index.html` | 358 | `var-declaration` | `var view = lib.getPersonalMapView(personalState);` |
| `games/rpg/index.html` | 359 | `var-declaration` | `var byId = {};` |
| `games/rpg/index.html` | 361 | `var-declaration` | `var links = [];` |
| `games/rpg/index.html` | 363 | `var-declaration` | `var full = personalState.world.map.locations.find(function(x){ return x.id === loc.id; }) || { neighbors: [] };` |
| `games/rpg/index.html` | 366 | `var-declaration` | `var target = byId[targetId];` |
| `games/rpg/index.html` | 367 | `var-declaration` | `var dx = target.x - loc.x;` |
| `games/rpg/index.html` | 368 | `var-declaration` | `var dy = target.y - loc.y;` |
| `games/rpg/index.html` | 369 | `var-declaration` | `var len = Math.sqrt(dx * dx + dy * dy);` |
| `games/rpg/index.html` | 370 | `var-declaration` | `var ang = Math.atan2(dy, dx) * 180 / Math.PI;` |
| `games/rpg/index.html` | 374 | `var-declaration` | `var nodes = view.locations.map(function(loc){` |
| `games/rpg/index.html` | 380 | `var-declaration` | `var plane = $('mapPlane');` |
| `games/rpg/index.html` | 401 | `var-declaration` | `var frameNodes = Array.prototype.slice.call($('introStage').querySelectorAll('.intro-bg'));` |
| `games/rpg/index.html` | 402 | `var-declaration` | `var textStrong = $('introText').querySelector('strong');` |
| `games/rpg/index.html` | 403 | `var-declaration` | `var textWrap = $('introText');` |
| `games/rpg/index.html` | 404 | `var-declaration` | `var blackout = $('introBlackout');` |
| `games/rpg/index.html` | 405 | `var-declaration` | `var frames = [` |
| `games/rpg/index.html` | 412 | `var-declaration` | `var idx = 0;` |
| `games/rpg/index.html` | 413 | `var-declaration` | `var minDuration = 1000;` |
| `games/rpg/index.html` | 450 | `var-declaration` | `var idx = 0;` |
| `games/rpg/index.html` | 451 | `var-declaration` | `var seq = lines || [];` |
| `games/rpg/index.html` | 452 | `var-declaration` | `var timer = setInterval(function(){` |
| `games/rpg/index.html` | 473 | `var-declaration` | `var summary = lib.getPersonalSummary(personalState);` |
| `games/rpg/index.html` | 499 | `var-declaration` | `var name = $('nameInput').value;` |
| `games/rpg/index.html` | 500 | `var-declaration` | `var race = $('raceInput').value;` |
| `games/rpg/index.html` | 507 | `var-declaration` | `var age = ev.target && ev.target.dataset ? Number(ev.target.dataset.age || 0) : 0;` |
| `games/rpg/index.html` | 566 | `var-declaration` | `var targetId = ev.target && ev.target.dataset ? ev.target.dataset.travel : '';` |
| `games/rpg/index.html` | 568 | `var-declaration` | `var before = personalState.location;` |
| `games/rpg/index.html` | 572 | `var-declaration` | `var summary = lib.getPersonalSummary(personalState);` |
| `games/rpg/index.html` | 576 | `var-declaration` | `var reg = lib.registerAtGuild(personalState, rng);` |
| `games/rpg/index.html` | 587 | `var-declaration` | `var dx = ev.clientX - mapDrag.x;` |
| `games/rpg/index.html` | 588 | `var-declaration` | `var dy = ev.clientY - mapDrag.y;` |
| `games/rpg/index.html` | 598 | `var-declaration` | `var details = ev.target;` |
| `games/rpg/index.html` | 603 | `var-declaration` | `var id = ev.target && ev.target.dataset ? ev.target.dataset.building : '';` |
| `games/rpg/index.html` | 605 | `var-declaration` | `var view = lib.getExploreView(personalState);` |
| `games/rpg/index.html` | 606 | `var-declaration` | `var building = view.buildings.find(function(item){ return item.id === id; });` |
| `games/rpg/index.html` | 612 | `var-declaration` | `var id = ev.target && ev.target.id ? ev.target.id : '';` |
| `games/rpg/index.html` | 620 | `var-declaration` | `var reg = lib.registerAtGuild(personalState, rng);` |
| `games/rpg/index.html` | 627 | `var-declaration` | `var ranking = lib.getGuildRanking(personalState, rng, 80);` |
| `games/rpg/index.html` | 640 | `var-declaration` | `var re = lib.recheckGrade(personalState, rng);` |
| `hype/hype-debugger.js` | 2 | `var-declaration` | `var DEBUG_SESSION_KEY = '__hype_debug_once__';` |
| `hype/hype-debugger.js` | 3 | `var-declaration` | `var DEBUG_DOM_ID = 'hype-debug-once';` |
| `hype/hype-debugger.js` | 4 | `var-declaration` | `var HISTORY_LIMIT = 320;` |
| `hype/hype-debugger.js` | 5 | `var-declaration` | `var WATCHDOG_INTERVAL_MS = 2600;` |
| `hype/hype-debugger.js` | 6 | `var-declaration` | `var REPORT_DEDUP_WINDOW_MS = 1800;` |
| `hype/hype-debugger.js` | 37 | `var-declaration` | `var core = [` |
| `hype/hype-debugger.js` | 49 | `var-declaration` | `var map = getDedupMap();` |
| `hype/hype-debugger.js` | 50 | `var-declaration` | `var sig = computeSignature(kind, detail);` |
| `hype/hype-debugger.js` | 51 | `var-declaration` | `var now = Date.now();` |
| `hype/hype-debugger.js` | 52 | `var-declaration` | `var last = map.get(sig) || 0;` |
| `hype/hype-debugger.js` | 58 | `var-declaration` | `var history = getHistory();` |
| `hype/hype-debugger.js` | 65 | `var-declaration` | `var causes = [];` |
| `hype/hype-debugger.js` | 66 | `var-declaration` | `var msg = String((detail && detail.message) || '').toLowerCase();` |
| `hype/hype-debugger.js` | 67 | `var-declaration` | `var stack = String((detail && detail.stack) || '').toLowerCase();` |
| `hype/hype-debugger.js` | 107 | `var-declaration` | `var predictions = [];` |
| `hype/hype-debugger.js` | 130 | `var-declaration` | `var max = 0;` |
| `hype/hype-debugger.js` | 136 | `var-declaration` | `var recent = history.slice(-14);` |
| `hype/hype-debugger.js` | 137 | `var-declaration` | `var byKind = {};` |
| `hype/hype-debugger.js` | 139 | `var-declaration` | `var k = recent[i].kind || 'unknown';` |
| `hype/hype-debugger.js` | 143 | `var-declaration` | `var dominantKind = null;` |
| `hype/hype-debugger.js` | 144 | `var-declaration` | `var dominantCount = 0;` |
| `hype/hype-debugger.js` | 145 | `var-declaration` | `var keys = Object.keys(byKind);` |
| `hype/hype-debugger.js` | 153 | `var-declaration` | `var trend = dominantKind ? ('Dominan: ' + dominantKind + ' x' + dominantCount + ' (14 event terakhir).') : 'Belum cukup data trend.';` |
| `hype/hype-debugger.js` | 154 | `var-declaration` | `var nextAction = 'Periksa payload detail + stack pada event terbaru, lalu validasi elemen DOM dan urutan inisialisasi.';` |
| `hype/hype-debugger.js` | 183 | `var-declaration` | `var doc = global.document;` |
| `hype/hype-debugger.js` | 185 | `var-declaration` | `var existing = doc.getElementById(DEBUG_DOM_ID);` |
| `hype/hype-debugger.js` | 188 | `var-declaration` | `var panel = doc.createElement('section');` |
