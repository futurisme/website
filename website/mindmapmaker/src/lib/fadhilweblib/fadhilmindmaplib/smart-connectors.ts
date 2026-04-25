export type SmartDirectionGroup = 'up' | 'down' | 'flat';
export type SmartRouteKind = 'horizontal' | 'vertical' | 'bus';

export interface SmartRoutePoint {
  x: number;
  y: number;
}

export interface SmartRouteData {
  kind: SmartRouteKind;
  points: SmartRoutePoint[];
  laneIndex: number;
  directionGroup: SmartDirectionGroup;
  sharedBusId?: string;
}

export interface SmartConnectorNode {
  id: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
}

export interface SmartConnectorEdge {
  id: string;
  source: string;
  target: string;
}

export interface SmartConnectorGeometry {
  id: string;
  sourceHandle?: string;
  targetHandle?: string;
  data: SmartRouteData;
}

export interface SmartConnectorConfig {
  defaultNodeWidth: number;
  defaultNodeHeight: number;
  routeGridSize: number;
  rowTolerance: number;
  columnTolerance: number;
  sideBySideTolerance: number;
  laneGap: number;
  busPadding: number;
}

export interface SmartConnectorRuntime {
  route: (edges: SmartConnectorEdge[], nodes: SmartConnectorNode[]) => SmartConnectorGeometry[];
  cacheSize: () => number;
}

interface NodeMetrics {
  centerX: number;
  centerY: number;
  width: number;
  height: number;
}

interface AnchorMeta {
  sourceAnchor: SmartRoutePoint;
  targetAnchor: SmartRoutePoint;
  sourceHandle: string;
  targetHandle: string;
}

interface EdgeRoutingMeta {
  edge: SmartConnectorEdge;
  kind: Exclude<SmartRouteKind, 'bus'>;
  sign: 1 | -1;
  sourceAnchor: SmartRoutePoint;
  targetAnchor: SmartRoutePoint;
  sourceHandle: string;
  targetHandle: string;
  directionGroup: SmartDirectionGroup;
}

interface BusEdgeMeta {
  sourceHandle: string;
  targetHandle: string;
  data: SmartRouteData;
}

function getNodeSize(node: SmartConnectorNode, config: SmartConnectorConfig) {
  const rawWidth = typeof node.width === 'number' && Number.isFinite(node.width)
    ? node.width
    : config.defaultNodeWidth;
  const rawHeight = typeof node.height === 'number' && Number.isFinite(node.height)
    ? node.height
    : config.defaultNodeHeight;

  return {
    width: rawWidth > 0 ? rawWidth : config.defaultNodeWidth,
    height: rawHeight > 0 ? rawHeight : config.defaultNodeHeight,
  };
}

function createNodeMetrics(node: SmartConnectorNode, config: SmartConnectorConfig): NodeMetrics {
  const size = getNodeSize(node, config);
  return {
    centerX: node.x + size.width / 2,
    centerY: node.y + size.height / 2,
    width: size.width,
    height: size.height,
  };
}

function snapToRouteGrid(value: number, config: SmartConnectorConfig) {
  return Math.round(value / config.routeGridSize) * config.routeGridSize;
}

function buildPath(points: SmartRoutePoint[], config: SmartConnectorConfig) {
  const normalized: SmartRoutePoint[] = [];
  for (let i = 0; i < points.length; i += 1) {
    const point = points[i];
    const snapped = { x: snapToRouteGrid(point.x, config), y: snapToRouteGrid(point.y, config) };
    const prev = normalized[normalized.length - 1];
    if (!prev || prev.x !== snapped.x || prev.y !== snapped.y) {
      normalized.push(snapped);
    }
  }

  return normalized;
}

function resolveDirectionGroup(sourceY: number, targetY: number, config: SmartConnectorConfig): SmartDirectionGroup {
  if (targetY > sourceY + config.rowTolerance) {
    return 'down';
  }

  if (targetY < sourceY - config.rowTolerance) {
    return 'up';
  }

  return 'flat';
}

function resolveOrientationFromMetrics(source: NodeMetrics, target: NodeMetrics, config: SmartConnectorConfig): Exclude<SmartRouteKind, 'bus'> {
  const dx = target.centerX - source.centerX;
  const dy = target.centerY - source.centerY;
  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);

  if (absDy <= config.rowTolerance) {
    return 'horizontal';
  }

  if (absDx <= config.columnTolerance) {
    return 'vertical';
  }

  const normDx = absDx / Math.max(1, source.width + target.width);
  const normDy = absDy / Math.max(1, source.height + target.height);

  return normDx >= normDy ? 'horizontal' : 'vertical';
}

function getVerticalAnchors(source: NodeMetrics, target: NodeMetrics, sign: 1 | -1): AnchorMeta {
  if (sign >= 0) {
    return {
      sourceAnchor: { x: source.centerX, y: source.centerY },
      targetAnchor: { x: target.centerX, y: target.centerY },
      sourceHandle: 's-bottom',
      targetHandle: 't-top',
    };
  }

  return {
    sourceAnchor: { x: source.centerX, y: source.centerY },
    targetAnchor: { x: target.centerX, y: target.centerY },
    sourceHandle: 's-top',
    targetHandle: 't-bottom',
  };
}

function getHorizontalAnchors(source: NodeMetrics, target: NodeMetrics, sign: 1 | -1): AnchorMeta {
  if (sign >= 0) {
    return {
      sourceAnchor: { x: source.centerX, y: source.centerY },
      targetAnchor: { x: target.centerX, y: target.centerY },
      sourceHandle: 's-right',
      targetHandle: 't-left',
    };
  }

  return {
    sourceAnchor: { x: source.centerX, y: source.centerY },
    targetAnchor: { x: target.centerX, y: target.centerY },
    sourceHandle: 's-left',
    targetHandle: 't-right',
  };
}

function edgeToBusRoute(
  source: NodeMetrics,
  target: NodeMetrics,
  laneIndex: number,
  sharedBusId: string,
  directionGroup: Extract<SmartDirectionGroup, 'up' | 'down'>,
  config: SmartConnectorConfig
): BusEdgeMeta {
  const directionSign: 1 | -1 = directionGroup === 'down' ? 1 : -1;
  const sourceAnchor = {
    x: source.centerX,
    y: source.centerY,
  };
  const targetAnchor = {
    x: target.centerX,
    y: target.centerY,
  };

  const span = Math.max(1, Math.abs(targetAnchor.y - sourceAnchor.y));
  const busDistance = Math.max(config.busPadding, span * 0.45);
  const busY = snapToRouteGrid(sourceAnchor.y + directionSign * busDistance, config);

  const points = buildPath([
    sourceAnchor,
    { x: sourceAnchor.x, y: busY },
    { x: targetAnchor.x, y: busY },
    targetAnchor,
  ], config);

  return {
    sourceHandle: directionSign > 0 ? 's-bottom' : 's-top',
    targetHandle: directionSign > 0 ? 't-top' : 't-bottom',
    data: {
      kind: 'bus',
      points,
      laneIndex,
      sharedBusId,
      directionGroup,
    },
  };
}

function buildLaneOffsets(items: EdgeRoutingMeta[], axis: 'x' | 'y', config: SmartConnectorConfig) {
  const sorted = [...items].sort((a, b) => {
    const aValue = axis === 'x' ? a.targetAnchor.x : a.targetAnchor.y;
    const bValue = axis === 'x' ? b.targetAnchor.x : b.targetAnchor.y;
    if (aValue === bValue) {
      return a.edge.id.localeCompare(b.edge.id);
    }
    return aValue - bValue;
  });

  const offsetMap = new Map<string, { offset: number; index: number }>();
  sorted.forEach((item, index) => {
    const offset = (index - (sorted.length - 1) / 2) * config.laneGap;
    offsetMap.set(item.edge.id, { offset: snapToRouteGrid(offset, config), index });
  });

  return offsetMap;
}

export function buildSmartRoutingCacheKey(edges: SmartConnectorEdge[], nodes: SmartConnectorNode[], config: SmartConnectorConfig) {
  const nodeParts = [...nodes]
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((node) => {
      const size = getNodeSize(node, config);
      return `${node.id}:${snapToRouteGrid(node.x, config)}:${snapToRouteGrid(node.y, config)}:${snapToRouteGrid(size.width, config)}:${snapToRouteGrid(size.height, config)}`;
    });

  const edgeParts = [...edges]
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((edge) => `${edge.id}:${edge.source}->${edge.target}`);

  return `${nodeParts.join('|')}__${edgeParts.join('|')}`;
}

export function buildSmartConnectorGeometry(
  edges: SmartConnectorEdge[],
  nodes: SmartConnectorNode[],
  config: SmartConnectorConfig
): SmartConnectorGeometry[] {
  if (edges.length === 0) {
    return [];
  }

  const nodeMap = new Map<string, NodeMetrics>();
  for (let i = 0; i < nodes.length; i += 1) {
    const node = nodes[i];
    nodeMap.set(node.id, createNodeMetrics(node, config));
  }
  const busEdgeMap = new Map<string, BusEdgeMeta>();
  const outgoingMap = new Map<string, SmartConnectorEdge[]>();

  for (let i = 0; i < edges.length; i += 1) {
    const edge = edges[i];
    const current = outgoingMap.get(edge.source);
    if (current) {
      current.push(edge);
    } else {
      outgoingMap.set(edge.source, [edge]);
    }
  }

  outgoingMap.forEach((outgoing, sourceId) => {
    if (outgoing.length < 2) {
      return;
    }

    const sourceNode = nodeMap.get(sourceId);
    if (!sourceNode) {
      return;
    }

    const withtargets = outgoing
      .map((edge) => ({ edge, target: nodeMap.get(edge.target) }))
      .filter((item): item is { edge: SmartConnectorEdge; target: NodeMetrics } => Boolean(item.target))
      .sort((a, b) => {
        if (a.target.centerX === b.target.centerX) {
          return a.edge.id.localeCompare(b.edge.id);
        }
        return a.target.centerX - b.target.centerX;
      });

    if (withtargets.length < 2) {
      return;
    }

    const grouped: Record<'down' | 'up', Array<{ edge: SmartConnectorEdge; target: NodeMetrics }>> = {
      down: [],
      up: [],
    };

    withtargets.forEach((item) => {
      const direction = resolveDirectionGroup(sourceNode.centerY, item.target.centerY, config);
      if (direction === 'down' || direction === 'up') {
        grouped[direction].push(item);
      }
    });

    (['down', 'up'] as const).forEach((direction) => {
      const bucket = grouped[direction];
      if (bucket.length < 2) {
        return;
      }

      const sharedBusId = `${sourceId}:${direction}:bus`;
      bucket.forEach(({ edge, target }, laneIndex) => {
        busEdgeMap.set(edge.id, edgeToBusRoute(sourceNode, target, laneIndex, sharedBusId, direction, config));
      });
    });
  });

  const routingMeta: EdgeRoutingMeta[] = [];
  for (const edge of edges) {
    const source = nodeMap.get(edge.source);
    const target = nodeMap.get(edge.target);
    if (!source || !target) {
      continue;
    }

    const kind = resolveOrientationFromMetrics(source, target, config);

    const sign: 1 | -1 = kind === 'horizontal'
      ? target.centerX >= source.centerX ? 1 : -1
      : target.centerY >= source.centerY ? 1 : -1;

    const anchors = kind === 'horizontal'
      ? getHorizontalAnchors(source, target, sign)
      : getVerticalAnchors(source, target, sign);

    routingMeta.push({
      edge,
      kind,
      sign,
      sourceAnchor: anchors.sourceAnchor,
      targetAnchor: anchors.targetAnchor,
      sourceHandle: anchors.sourceHandle,
      targetHandle: anchors.targetHandle,
      directionGroup: resolveDirectionGroup(source.centerY, target.centerY, config),
    });
  }

  const horizontalRoutingMeta: EdgeRoutingMeta[] = [];
  const verticalRoutingMeta: EdgeRoutingMeta[] = [];
  for (let i = 0; i < routingMeta.length; i += 1) {
    const item = routingMeta[i];
    if (item.kind === 'horizontal') {
      horizontalRoutingMeta.push(item);
    } else {
      verticalRoutingMeta.push(item);
    }
  }

  const horizontalOffsets = buildLaneOffsets(horizontalRoutingMeta, 'y', config);
  const verticalOffsets = buildLaneOffsets(verticalRoutingMeta, 'x', config);

  return routingMeta.map((meta) => {
    const busMeta = busEdgeMap.get(meta.edge.id);
    if (busMeta) {
      return {
        id: meta.edge.id,
        sourceHandle: busMeta.sourceHandle,
        targetHandle: busMeta.targetHandle,
        data: busMeta.data,
      };
    }

    const offsetMeta = meta.kind === 'horizontal'
      ? horizontalOffsets.get(meta.edge.id)
      : verticalOffsets.get(meta.edge.id);
    const offset = offsetMeta?.offset ?? 0;
    const laneIndex = offsetMeta?.index ?? 0;

    if (meta.kind === 'horizontal') {
      const sideBySide = Math.abs(meta.targetAnchor.y - meta.sourceAnchor.y) <= config.sideBySideTolerance;
      const directAllowed = sideBySide && meta.sign > 0;
      const midpointX = (meta.sourceAnchor.x + meta.targetAnchor.x) / 2;
      const curveClearance = Math.max(config.defaultNodeWidth * 0.65, Math.abs(meta.targetAnchor.x - meta.sourceAnchor.x) * 0.18);

      const controlX = directAllowed
        ? midpointX
        : snapToRouteGrid(midpointX + curveClearance * meta.sign, config);

      const points = directAllowed
        ? buildPath([meta.sourceAnchor, meta.targetAnchor], config)
        : buildPath([
          meta.sourceAnchor,
          { x: controlX + offset, y: meta.sourceAnchor.y },
          { x: controlX + offset, y: meta.targetAnchor.y },
          meta.targetAnchor,
        ], config);

      return {
        id: meta.edge.id,
        sourceHandle: meta.sourceHandle,
        targetHandle: meta.targetHandle,
        data: {
          kind: 'horizontal',
          points,
          laneIndex,
          directionGroup: meta.directionGroup,
        },
      };
    }

    const midY = snapToRouteGrid((meta.sourceAnchor.y + meta.targetAnchor.y) / 2, config);
    const points = buildPath([
      meta.sourceAnchor,
      { x: meta.sourceAnchor.x + offset, y: midY },
      { x: meta.targetAnchor.x + offset, y: midY },
      meta.targetAnchor,
    ], config);

    return {
      id: meta.edge.id,
      sourceHandle: meta.sourceHandle,
      targetHandle: meta.targetHandle,
      data: {
        kind: 'vertical',
        points,
        laneIndex,
        directionGroup: meta.directionGroup,
      },
    };
  });
}

export function createSmartConnectorCache(maxEntries = 240) {
  const cache = new Map<string, SmartConnectorGeometry[]>();

  const get = (key: string) => cache.get(key);
  const set = (key: string, value: SmartConnectorGeometry[]) => {
    if (cache.has(key)) {
      cache.delete(key);
    }
    cache.set(key, value);

    if (cache.size > maxEntries) {
      const oldest = cache.keys().next().value;
      if (oldest) {
        cache.delete(oldest);
      }
    }
  };

  return { get, set, size: () => cache.size };
}

function buildFastTopologyFingerprint(edges: SmartConnectorEdge[]) {
  if (edges.length === 0) {
    return 'e:0';
  }

  let out = `e:${edges.length}|`;
  for (let i = 0; i < edges.length; i += 1) {
    const edge = edges[i];
    out += `${edge.id}>${edge.source}>${edge.target}|`;
  }
  return out;
}

function buildFastNodeFingerprint(nodes: SmartConnectorNode[], config: SmartConnectorConfig) {
  if (nodes.length === 0) {
    return 'n:0';
  }

  let out = `n:${nodes.length}|`;
  for (let i = 0; i < nodes.length; i += 1) {
    const node = nodes[i];
    const size = getNodeSize(node, config);
    out += `${node.id}:${snapToRouteGrid(node.x, config)}:${snapToRouteGrid(node.y, config)}:${snapToRouteGrid(size.width, config)}:${snapToRouteGrid(size.height, config)}|`;
  }
  return out;
}

export function createSmartConnectorRuntime(config: SmartConnectorConfig, maxEntries = 320): SmartConnectorRuntime {
  const cache = createSmartConnectorCache(maxEntries);
  let lastFingerprint = '';
  let lastGeometry: SmartConnectorGeometry[] = [];

  const route = (edges: SmartConnectorEdge[], nodes: SmartConnectorNode[]) => {
    if (edges.length === 0) {
      lastFingerprint = '';
      lastGeometry = [];
      return [];
    }

    const fingerprint = `${buildFastTopologyFingerprint(edges)}__${buildFastNodeFingerprint(nodes, config)}`;
    if (fingerprint === lastFingerprint) {
      return lastGeometry;
    }

    const cached = cache.get(fingerprint);
    if (cached) {
      lastFingerprint = fingerprint;
      lastGeometry = cached;
      return cached;
    }

    const computed = buildSmartConnectorGeometry(edges, nodes, config);
    cache.set(fingerprint, computed);
    lastFingerprint = fingerprint;
    lastGeometry = computed;
    return computed;
  };

  return {
    route,
    cacheSize: cache.size,
  };
}
