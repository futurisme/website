# Mindmapmaker Original Frontend Map

This document maps the **original** Mindmapmaker frontend structure so deployment and routing can use the intended application (Next.js app in `/mindmapmaker`) instead of replacement static files.

## 1) Original App Entry Flow

- Root landing route: `src/app/page.tsx`
  - Futuristic landing hero, staged title animation, and CTA.
  - CTA points to `/workspace` (resolved with base path in Next config).
- Global layout + metadata: `src/app/layout.tsx`
  - Canonical URL, OpenGraph/Twitter metadata, shared runtime wrapper.
- Core editor/workspace route: `src/app/workspace/page.tsx`

## 2) Original Route Surface (App Router)

Primary route files discovered under `src/app`:

- `page.tsx` (landing)
- `workspace/page.tsx` (workspace/editor)
- `archive-lab/page.tsx`
- `game/page.tsx`
- `game-ideas/page.tsx`
- `BotMaker/page.tsx`
- `EngineTest/page.tsx`
- `TestEngine/page.tsx`
- `FadhilAI-Focused-To-Generate-visual-War-Strategy/page.tsx`
- `fadhilweblib/page.tsx`

## 3) Original Styling + Runtime Assets

- `src/app/globals.css`
- `src/app/page.module.css`
- `src/app/flow.css`
- Shared runtime/components in `src/components/*`
- Prisma-backed runtime dependencies under `src/lib/*` and `prisma/*`

## 4) Original Public Assets

- `public/favicon.ico`
- `public/social-preview-whatsapp.jpg`
- `public/sw.js`
- `public/fonts/inter-var.woff2`

## 5) Deployment Mapping

- Next app package root: `/mindmapmaker/package.json`
- Base path configured in `mindmapmaker/next.config.js` as `/mindmapmaker`.
- Vercel should build the Next app from `/mindmapmaker` and route `/mindmapmaker*` into that build output.

## 6) What Was Reverted

Removed replacement static files that overrode original app behavior:

- `mindmapmaker/index.html`
- `mindmapmaker/app.css`
- `mindmapmaker/app.js`

This restores the project to the intended original frontend architecture.
