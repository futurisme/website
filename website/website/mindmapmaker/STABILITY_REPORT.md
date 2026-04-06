# Mindmapmaker static rewrite stability report

## Scope
- `/mindmapmaker` menu
- `/mindmapmaker/editor/<number>` editor entry page

## Hydration mismatch prevention
- Both pages are static HTML with deterministic markup.
- No SSR/client framework hydration is involved, so SSR hydration mismatch class is eliminated.
- Small client script in editor only updates text node from URL path and does not re-render full UI.

## Broken styles / UI prevention
- Stylesheets are linked using absolute URLs (`/mindmapmaker/...`) to avoid relative URL breakage on non-trailing-slash routes.
- fadhilweblib theme tokens (`--fwlb-*`) are used in local CSS to ensure style compatibility and predictable fallback behavior.
- `data-fwlb-theme="game"` + `data-slot="theme-scope"` is present for theme selector support.

## FOUC mitigation
- Inline critical fallback styles in `<head>` guarantee readable first paint.
- CSS preload hints are applied before regular stylesheet tags.

## Routing behavior
- `/mindmapmaker` and `/mindmapmaker/` route to the menu page.
- `/mindmapmaker/editor/<number>` routes to one static editor shell page; JS safely reads numeric ID from path.
