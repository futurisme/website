import type { MindmapSnapshot } from './types';

type SerializedMindmapV2 = {
  v: 2;
  version: number;
  rootId: number | null;
  n: Array<[id: number, title: string, parentId: number | null, depth: number, weight: number]>;
  e: Array<[from: number, to: number]>;
};

/**
 * Compact serializer for network/storage transfer.
 * Keeps payload deterministic and easy to diff.
 */
export function serializeMindmap(snapshot: MindmapSnapshot): string {
  const nodes: SerializedMindmapV2['n'] = new Array(snapshot.nodes.length);
  for (let i = 0; i < snapshot.nodes.length; i += 1) {
    const node = snapshot.nodes[i];
    nodes[i] = [node.id, node.title, node.parentId, node.depth, node.weight];
  }

  const edges: SerializedMindmapV2['e'] = new Array(snapshot.edges.length);
  for (let i = 0; i < snapshot.edges.length; i += 1) {
    const edge = snapshot.edges[i];
    edges[i] = [edge.from, edge.to];
  }

  return JSON.stringify({
    v: 2,
    version: snapshot.version,
    rootId: snapshot.rootId,
    n: nodes,
    e: edges,
  } satisfies SerializedMindmapV2);
}

export function deserializeMindmap(payload: string): MindmapSnapshot {
  const parsed = JSON.parse(payload) as MindmapSnapshot | SerializedMindmapV2;

  if ((parsed as SerializedMindmapV2).v === 2) {
    const modern = parsed as SerializedMindmapV2;
    if (!Array.isArray(modern.n) || !Array.isArray(modern.e)) {
      throw new Error('Invalid mindmap payload.');
    }
    return {
      version: modern.version,
      rootId: modern.rootId,
      nodes: modern.n.map(([id, title, parentId, depth, weight]) => ({ id, title, parentId, depth, weight })),
      edges: modern.e.map(([from, to]) => ({ from, to })),
    };
  }

  const legacy = parsed as MindmapSnapshot;
  if (!Array.isArray(legacy.nodes) || !Array.isArray(legacy.edges)) {
    throw new Error('Invalid mindmap payload.');
  }
  return legacy;
}
