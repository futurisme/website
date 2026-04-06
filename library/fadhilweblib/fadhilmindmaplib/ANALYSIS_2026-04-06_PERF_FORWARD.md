# fadhilmindmaplib deep performance-forward analysis (2026-04-06)

## Goal
Forward proven lightweight/runtime patterns from `fadhilweblib` into `fadhilmindmaplib` so the mindmap stack does not restart from zero and stays focused on fast editor workflows at `/mindmapmaker/editor/<number>`.

## Dependency boundary
- `fadhilmindmaplib` remains framework-native and does **not** depend on external mindmap frameworks.
- Editor/runtime logic is implemented with platform APIs + local project code only (no third-party mindmap engines).

## Existing strengths reused from fadhilweblib
1. **Deterministic state transitions** (similar to `core` utilities): update only when value changes to prevent unnecessary recomputation.
2. **Headless primitive approach**: engine logic in library, rendering logic in editor shell.
3. **Low-allocation loops + map indexing**: aligns with existing optimization style in library internals.

## Forwarded improvements implemented

### 1) O(1) index access for browser lite engine
- Added `nodeIndexById`, `childIdsByParent`, and `outgoingLinkCount` caches.
- Node lookup now avoids repeated `Array.find` scans.
- Link existence checks now avoid full array scans in hot paths.

### 2) Snapshot memoization
- Added `cachedSnapshot + dirtySnapshot` invalidation strategy.
- Repeated `getSnapshot()` calls without mutations now return the same immutable snapshot object.
- Reduces serialization and edge rebuild costs during render-heavy interactions.

### 3) Render-frame batching in editor shell
- Added `requestRender()` with `requestAnimationFrame` guard.
- Pointer move updates no longer force multiple immediate DOM rewrites per event burst.
- Rendering is now naturally aligned with browser paint loop.

### 5) Precision connector + mobile sensitivity upgrades
- Edge routing now uses adaptive cubic Bézier control distances based on geometric separation.
- Invalid coordinates are rejected early to avoid rendering glitches/disappearing paths.
- Android/coarse-pointer panning now applies tuned sensitivity damping to reduce overshoot.

### 4) Safer mutation accounting
- `updateNode` now increments version only if a real value changed.
- Keeps version meaningful and avoids unnecessary persistence writes.

## Performance implications (qualitative)
- **Before**: hot operations (`getNode`, `hasConnectionFrom`, repeat `getSnapshot`) tended toward O(n) scans + repeated object cloning.
- **After**: hot operations are mostly O(1) map lookups; snapshot rebuild is mutation-driven; view updates are frame-batched.

## Outcome for `/mindmapmaker/editor/<number>`
- Faster drag/move response under dense node counts.
- Lower garbage creation during interaction bursts.
- Reduced edge/node redraw pressure from event storms.

## Next suggested step (optional)
- Add benchmark harness (`scripts/`) that measures add/move/connect/remove throughput for 1k/5k/10k nodes and tracks render frame pacing.

## Save/load mechanics alignment with original Mindmapmaker
- Original Mindmapmaker `.fAdHiL` uses two compatible modes:
  1. **Current v2**: `🜂fAdHiL🜁§contentType§compressed§iv§data§exportedAt` with AES-GCM + PBKDF2(v2) + optional `deflate-raw` + alien base8192 framing.
  2. **Legacy v1 JSON envelope**: AES-GCM + PBKDF2(v1) + optional `gzip` + base64url payload.
- Lite editor loader now follows the same crypto/compression decode branches and supports unframed alien fallback candidates so older token variants still decode.
- Compatibility bridge added for `.cws`/workspace payloads that embed JSON/base64 JSON lite snapshots so older exports can be restored when snapshot data is directly available as JSON form.
- Added transformer stage for legacy payload normalization (ID sanitization, parent repair, depth recomputation, fallback layout synthesis for missing coordinates).
- Camera auto-fit now recenters viewport to loaded content bounds so successful load never appears as blank canvas due to off-screen coordinates.
- Important compatibility note: main editor `workspace-archive` payloads that store only binary Yjs updates still require a Yjs translator layer for full fidelity conversion.
