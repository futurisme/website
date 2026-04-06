# fadhilmindmaplib

`fadhilmindmaplib` is a high-performance child framework under `fadhilweblib` focused on mindmap creation/editing at low runtime cost.

## Design goals
- **Low memory churn**: struct-of-arrays graph storage, dense lookup tables.
- **Fast updates**: O(1) node lookup and append-friendly operations.
- **Lightweight layout**: deterministic layered layout with subtree centering.
- **Portable snapshots**: compact JSON serialize/deserialize helpers.
- **Full-stack ready**: frontend interaction runtime + backend PostgreSQL repository adapter.

## Core API
- `MindmapGraphStore` → low-level data store
- `FadhilMindmapEngine` → high-level command API
- `MindmapInteractionRuntime` → microtask-batched interaction engine + undo
- `parseMindmapSyntax(source)` → lightweight mindmap DSL parser
- `computeMindmapLayout(snapshot)` → fast layout computation
- `createPostgresMindmapRepository(query)` → PostgreSQL persistence adapter
- `resolveRailwayPostgresConfig(env)` → Railway-compatible DB env resolver

## Quick start
```ts
import { FadhilMindmapEngine, MindmapInteractionRuntime, createPostgresMindmapRepository } from './fadhilmindmaplib';

const engine = new FadhilMindmapEngine();
const root = engine.createRoot('Mindmap Root');
if (root.ok && root.value) {
  engine.addNode({ title: 'Branch A', parentId: root.value });
  engine.addNode({ title: 'Branch B', parentId: root.value });
}

const layout = engine.computeLayout({ horizontalGap: 220, verticalGap: 80 });

const runtime = new MindmapInteractionRuntime();
runtime.enqueue({ type: 'create_root', title: 'Realtime Root' });

// Optional backend persistence with your DB executor
const repo = createPostgresMindmapRepository(async (sql, params) => {
  // bridge to `pg`, prisma.$queryRawUnsafe, etc.
  return { rows: [] };
});
```

## Performance notes
- Node arrays auto-grow exponentially to reduce reallocations.
- Layout is two-pass DFS + centroid adjustment with linear complexity over nodes.
- Interaction runtime batches commands in microtasks for low overhead.
- PostgreSQL adapter performs single upsert per save to minimize round-trips.
