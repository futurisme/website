import {
  DEFAULT_NODE_SIZE,
  ROUTE_BUS_PADDING,
  ROUTE_COLUMN_TOLERANCE,
  ROUTE_GRID_SIZE,
  ROUTE_LANE_GAP,
  ROUTE_ROW_TOLERANCE,
  ROUTE_SIDE_BY_SIDE_TOLERANCE,
} from './flow-constants';
import type { FlowRouteData } from './flow-types';
import {
  buildSmartConnectorGeometry,
  buildSmartRoutingCacheKey,
  type SmartConnectorConfig,
  type SmartConnectorEdge,
  type SmartConnectorGeometry,
  type SmartConnectorNode,
} from '@/lib/fadhilweblib/fadhilmindmaplib';

export interface CompactRouteNode extends SmartConnectorNode {}
export interface CompactRouteEdge extends SmartConnectorEdge {}
export interface RoutedEdgeGeometry extends SmartConnectorGeometry {
  data: FlowRouteData;
}

const ROUTING_CONFIG: SmartConnectorConfig = {
  defaultNodeWidth: DEFAULT_NODE_SIZE.width,
  defaultNodeHeight: DEFAULT_NODE_SIZE.height,
  routeGridSize: ROUTE_GRID_SIZE,
  rowTolerance: ROUTE_ROW_TOLERANCE,
  columnTolerance: ROUTE_COLUMN_TOLERANCE,
  sideBySideTolerance: ROUTE_SIDE_BY_SIDE_TOLERANCE,
  laneGap: ROUTE_LANE_GAP,
  busPadding: ROUTE_BUS_PADDING,
};

export function buildRoutingCacheKey(edges: CompactRouteEdge[], nodes: CompactRouteNode[]) {
  return buildSmartRoutingCacheKey(edges, nodes, ROUTING_CONFIG);
}

export function buildAdaptiveRoutedEdgeGeometry(
  edges: CompactRouteEdge[],
  nodes: CompactRouteNode[]
): RoutedEdgeGeometry[] {
  return buildSmartConnectorGeometry(edges, nodes, ROUTING_CONFIG) as RoutedEdgeGeometry[];
}
