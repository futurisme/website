import test from 'node:test';
import assert from 'node:assert/strict';
import {
  FadhilMindmapEngine,
  MindmapInteractionRuntime,
  createPostgresMindmapRepository,
  deserializeMindmap,
  parseMindmapSyntax,
  resolveRailwayPostgresConfig,
  serializeMindmap,
  FadhilMindmapLite,
} from './index';

test('engine builds snapshot and layout deterministically', () => {
  const engine = new FadhilMindmapEngine();
  const root = engine.createRoot('Root');
  assert.equal(root.ok, true);
  assert.ok(root.value);

  engine.addNode({ title: 'A', parentId: root.value! });
  engine.addNode({ title: 'B', parentId: root.value! });

  const snapshot = engine.getSnapshot();
  assert.equal(snapshot.nodes.length, 3);
  assert.equal(snapshot.edges.length, 2);

  const layout = engine.computeLayout();
  assert.equal(layout.nodes.length, 3);
  assert.ok(layout.width > 0);
  assert.ok(layout.height > 0);

  const encoded = serializeMindmap(snapshot);
  const decoded = deserializeMindmap(encoded);
  assert.equal(decoded.nodes.length, snapshot.nodes.length);
});

test('syntax parser creates deterministic node plan', () => {
  const plan = parseMindmapSyntax('root("Main")\nnode(2, "Branch A", 1)\nnode(3, "Branch B", 1)');
  assert.equal(plan.rootTitle, 'Main');
  assert.equal(plan.nodes.length, 2);
  assert.equal(plan.nodes[0].id, 2);
});

test('interaction runtime batches commands and supports undo', async () => {
  const runtime = new MindmapInteractionRuntime();
  runtime.enqueue({ type: 'create_root', title: 'Root' });
  runtime.enqueue({ type: 'add_node', parentId: 1, title: 'Branch A' });

  await new Promise((resolve) => setTimeout(resolve, 0));

  const snapshot = runtime.snapshot();
  assert.equal(snapshot.nodes.length, 2);

  const undo = runtime.undo();
  assert.equal(undo.ok, true);
});

test('postgres adapter + railway config resolve', async () => {
  const calls: Array<{ sql: string; params?: readonly unknown[] }> = [];
  const repo = createPostgresMindmapRepository(async (sql, params) => {
    calls.push({ sql, params });
    return { rows: [] };
  });

  const engine = new FadhilMindmapEngine();
  engine.createRoot('Root');
  await repo.save(1, engine.getSnapshot());
  assert.equal(calls.length, 1);
  assert.match(calls[0].sql, /INSERT INTO/);

  const cfg = resolveRailwayPostgresConfig({ DATABASE_URL: 'postgres://example' });
  assert.equal(cfg.connectionString, 'postgres://example');
  assert.equal(cfg.ssl, 'require');
});


test('browser-lite runtime supports lightweight node operations', () => {
  const lite = new FadhilMindmapLite();
  const child = lite.addNode(1, 'Mobile Node');
  assert.equal(lite.getNode(child.id)?.title, 'Mobile Node');
  lite.updateNode(child.id, { x: 120, y: 80 });
  lite.connect(1, child.id);
  assert.equal(lite.hasConnectionFrom(1), true);
  const before = lite.getSnapshot();
  const after = lite.getSnapshot();
  assert.equal(before, after, 'snapshot should be cached when unchanged');
  lite.unconnectFrom(1);
  const csv = lite.toCsv();
  assert.match(csv, /id,title,parentId,x,y,depth,weight/);
  const removed = lite.removeNode(child.id);
  assert.equal(removed, true);
  const snap = lite.getSnapshot();
  assert.equal(snap.nodes.length, 1);
});
