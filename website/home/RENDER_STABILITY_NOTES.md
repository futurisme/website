# Render Stability Audit (Hydration / UI / FOUC)

Date: 2026-04-06

## Scope audited
- `/home` (static page in `website/home`)
- `/portfolio` and `/portfolio/testing/*` static delivery routes

## Findings
1. **Broken styles in `/home`**
   - Root cause: relative stylesheet URLs (`./theme.css`, `./home.css`) resolve to `/theme.css` and `/home.css` when route is `/home` (without trailing slash), causing CSS miss.
   - Result: unstyled page shown in production screenshot.

2. **FOUC risk on `/home`**
   - No early critical CSS, so first paint could flash unthemed content before external CSS arrives.

3. **Hydration mismatch risk**
   - `/home` is fully static HTML (no framework hydration).
   - `/portfolio` shell is static and mounts client app in `/portfolio/testing/testing.js`; not SSR-hydrated in this setup.
   - Therefore classic SSR/client hydration mismatch does not apply to `/home` and is low risk for `/portfolio/testing` under current static mount approach.

## Fixes applied
- Switched `/home` CSS references to absolute path:
  - `/home/theme.css`
  - `/home/home.css`
- Added preload hints for both stylesheets.
- Added minimal inline critical CSS in `<head>` to prevent initial flash.
- Aligned `home.css` tokens to fadhilweblib variables (`--fwlb-*`) to maintain full theme compatibility and avoid token mismatch drift.
- Added `data-fwlb-theme="game"` and `data-slot="theme-scope"` on `<main>` so fadhilweblib theme selectors apply from first styled render.

## Expected outcome
- `/home` loads styled immediately with no missing-css layout break.
- No hydration mismatch warnings for `/home` because there is no hydration step.
- Reduced FOUC due to critical fallback + CSS preload.
