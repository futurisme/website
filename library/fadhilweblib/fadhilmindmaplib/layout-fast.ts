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

  const nodeCount = snapshot.nodes.length;
  const indexById = new Map<MindmapNodeId, number>();
  const children: number[][] = Array.from({ length: nodeCount }, () => []);

  for (let i = 0; i < nodeCount; i += 1) {
    indexById.set(snapshot.nodes[i].id, i);
  }

  for (let i = 0; i < snapshot.edges.length; i += 1) {
    const edge = snapshot.edges[i];
    const parentIndex = indexById.get(edge.from);
    const childIndex = indexById.get(edge.to);
    if (parentIndex !== undefined && childIndex !== undefined) {
      children[parentIndex].push(childIndex);
    }
  }

  const rootIndex = indexById.get(snapshot.rootId);
  if (rootIndex === undefined) {
    return { width: 0, height: 0, nodes: [] };
  }

  const order: number[] = [];
  const stack: number[] = [rootIndex];
  while (stack.length > 0) {
    const index = stack.pop()!;
    order.push(index);
    const childIndexes = children[index];
    for (let i = childIndexes.length - 1; i >= 0; i -= 1) {
      stack.push(childIndexes[i]);
    }
  }

  const out: MutableNode[] = new Array(order.length);
  const positionedByIndex: Array<MutableNode | undefined> = new Array(nodeCount);
  let row = 0;
  let maxX = 0;
  let maxY = config.padding;
  for (let i = 0; i < order.length; i += 1) {
    const index = order[i];
    const source = snapshot.nodes[index];
    const y = config.padding + row * config.verticalGap;
    row += 1;
    const x = config.padding + source.depth * config.horizontalGap;
    const positioned: MutableNode = {
      id: source.id,
      depth: source.depth,
      x,
      y,
      radius: config.nodeRadius,
    };
    out[i] = positioned;
    positionedByIndex[index] = positioned;
    if (x > maxX) {
      maxX = x;
    }
    if (y > maxY) {
      maxY = y;
    }
  }

  for (let i = order.length - 1; i >= 0; i -= 1) {
    const index = order[i];
    const node = positionedByIndex[index];
    if (!node) {
      continue;
    }
    const childIndexes = children[index];
    if (childIndexes.length === 0) {
      continue;
    }
    const first = positionedByIndex[childIndexes[0]];
    const last = positionedByIndex[childIndexes[childIndexes.length - 1]];
    if (first && last) {
      node.y = (first.y + last.y) / 2;
      if (node.y > maxY) {
        maxY = node.y;
      }
    }
  }

  const width = maxX + config.padding;
  const height = maxY + config.padding;

  return {
    width,
    height,
    nodes: out,
  };
}
