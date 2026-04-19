import assert from 'node:assert/strict';
import test from 'node:test';
import { createSmartConnectorRuntime } from '@/lib/fadhilweblib/fadhilmindmaplib';
import {
  DEFAULT_NODE_SIZE,
  ROUTE_BUS_PADDING,
  ROUTE_COLUMN_TOLERANCE,
  ROUTE_GRID_SIZE,
  ROUTE_LANE_GAP,
  ROUTE_ROW_TOLERANCE,
  ROUTE_SIDE_BY_SIDE_TOLERANCE,
} from './flow-constants';

const runtime = createSmartConnectorRuntime({
  defaultNodeWidth: DEFAULT_NODE_SIZE.width,
  defaultNodeHeight: DEFAULT_NODE_SIZE.height,
  routeGridSize: ROUTE_GRID_SIZE,
  rowTolerance: ROUTE_ROW_TOLERANCE,
  columnTolerance: ROUTE_COLUMN_TOLERANCE,
  sideBySideTolerance: ROUTE_SIDE_BY_SIDE_TOLERANCE,
  laneGap: ROUTE_LANE_GAP,
  busPadding: ROUTE_BUS_PADDING,
});

test('smart connector runtime returns previous geometry without recompute on identical fingerprint', () => {
  const nodes = [
    { id: 'a', x: 0, y: 0, width: 280, height: 120 },
    { id: 'b', x: 400, y: 0, width: 280, height: 120 },
  ];
  const edges = [{ id: 'e1', source: 'a', target: 'b' }];

  const first = runtime.route(edges, nodes);
  const second = runtime.route(edges, nodes);

  assert.equal(first, second);
  assert.equal(first.length, 1);
});
