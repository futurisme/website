import type { LayoutOptions, LayoutResult, MindmapNodeId, MindmapSnapshot } from './types';

const DEFAULTS: Required<LayoutOptions> = {
  horizontalGap: 260,
  verticalGap: 88,
  nodeRadius: 24,
  padding: 48,
};

interface MutableNode {
  id: MindmapNodeId;
  depth: number;
  x: number;
  y: number;
  radius: number;
}

/**
 * Fast layered layout with subtree centering.
 *
 * Algorithm:
 * 1) Build adjacency from snapshot
 * 2) DFS to assign initial y slots (linear pass)
 * 3) Reverse pass to center parent over children
 */
export function computeMindmapLayout(snapshot: MindmapSnapshot, options: LayoutOptions = {}): LayoutResult {
  const config = { ...DEFAULTS, ...options };
  if (snapshot.nodes.length === 0 || snapshot.rootId === null) {
    return { width: 0, height: 0, nodes: [] };
  }

  const children = new Map<MindmapNodeId, MindmapNodeId[]>();
  const depthById = new Map<MindmapNodeId, number>();

  for (const node of snapshot.nodes) {
    children.set(node.id, []);
    depthById.set(node.id, node.depth);
  }
  for (const edge of snapshot.edges) {
    children.get(edge.from)?.push(edge.to);
  }

  const out: MutableNode[] = [];
  let row = 0;
  const walk = (id: MindmapNodeId): void => {
    const depth = depthById.get(id) ?? 0;
    const y = config.padding + row * config.verticalGap;
    row += 1;

    out.push({
      id,
      depth,
      x: config.padding + depth * config.horizontalGap,
      y,
      radius: config.nodeRadius,
    });

    const childIds = children.get(id) ?? [];
    for (const child of childIds) {
      walk(child);
    }
  };

  walk(snapshot.rootId);

  const byId = new Map(out.map((n) => [n.id, n] as const));
  for (let i = out.length - 1; i >= 0; i -= 1) {
    const node = out[i];
    const childIds = children.get(node.id) ?? [];
    if (childIds.length === 0) {
      continue;
    }
    const first = byId.get(childIds[0]);
    const last = byId.get(childIds[childIds.length - 1]);
    if (first && last) {
      node.y = (first.y + last.y) / 2;
    }
  }

  const width = Math.max(...out.map((n) => n.x)) + config.padding;
  const height = Math.max(...out.map((n) => n.y)) + config.padding;

  return {
    width,
    height,
    nodes: out,
  };
}
