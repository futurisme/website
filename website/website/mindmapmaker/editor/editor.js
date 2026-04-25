import {
  FadhilMindmapLite,
  buildEdgePath,
  clampScale,
  createViewportState,
  decodeFdhl,
  encodeFdhl,
  loadSnapshot,
  loadSnapshotRemote,
  saveSnapshot,
} from '/mindmapmaker/lib/fadhilmindmaplib-browser.js';

const mapIdEl = document.getElementById('map-id');
const statusEl = document.getElementById('status');
const nodesLayer = document.getElementById('nodes');
const edgesLayer = document.getElementById('edges');
const viewport = document.getElementById('viewport');
const boundaryLayer = document.getElementById('workspace-boundary');
const addNodeBtn = document.getElementById('add-node');
const removeNodeBtn = document.getElementById('remove-node');
const connectBtn = document.getElementById('connect-node');
const saveCsvBtn = document.getElementById('save-csv');
const saveFdhlBtn = document.getElementById('save-fdhl');
const loadBtn = document.getElementById('load-map');
const loadInput = document.getElementById('load-input');
const undoBtn = document.getElementById('undo-node');
const redoBtn = document.getElementById('redo-node');
const syncStatusDotEl = document.getElementById('sync-status-dot');

const mapIdMatch = window.location.pathname.match(/\/(mindmapmaker\/)?editor\/(\d+)/);
const safeMapId = Number.isInteger(Number(mapIdMatch?.[2])) && Number(mapIdMatch[2]) > 0 ? Number(mapIdMatch[2]) : 1;
mapIdEl.textContent = String(safeMapId);

const persisted = loadSnapshot(safeMapId);
let engine = persisted ? FadhilMindmapLite.fromSnapshot(persisted) : new FadhilMindmapLite();
const camera = createViewportState();
const IS_TOUCH_PRIMARY = matchMedia('(pointer: coarse)').matches;
const GRID_SIZE = 100;
const GRID_COLUMNS_SHORT = 2;
const GRID_COLUMNS_LONG = 4;
const GRID_ROWS = 1;
const LONG_NODE_THRESHOLD = 36;
const PAN_SENSITIVITY = IS_TOUCH_PRIMARY ? 0.78 : 1;

let selectedId = engine.getSnapshot().nodes[0]?.id ?? 1;
let connectSourceId = null;
let dragMode = 'idle';
let activePointerId = null;
let startPointer = { x: 0, y: 0 };
let startNode = { x: 0, y: 0 };
let startCamera = { x: 0, y: 0 };
let dragtargetId = null;
let renderQueued = false;
let fullRenderRequired = true;
let lastSavedVersion = Number.isFinite(engine.version) ? engine.version : 0;
let dragMoved = false;
let dragNodePosition = null;
let pinchState = null;
let nodeElementById = new Map();
let edgeElementsByNodeId = new Map();
const tapBurst = { nodeId: null, stamps: [] };

snapEngineNodesToGrid();
centerCameraOnContent(engine.getSnapshot().nodes);
void hydrateFromRemote();

function render() {
  renderQueued = false;
  applyViewportTransform();
  if (!fullRenderRequired) {
    return;
  }
  fullRenderRequired = false;
  const snapshot = engine.getSnapshot();
  const bounds = getWorkspaceBounds(snapshot.nodes);
  renderWorkspaceBoundary(bounds);

  const byId = new Map(snapshot.nodes.map((n) => [n.id, n]));
  edgesLayer.innerHTML = snapshot.links
    .map((edge) => {
      const from = byId.get(edge.from);
      const to = byId.get(edge.to);
      if (!from || !to) return '';
      const klass = 'edge-path edge-link';
      const fromMetrics = getNodeMetrics(from);
      const toMetrics = getNodeMetrics(to);
      const fromAnchor = { x: from.x + fromMetrics.width / 2, y: from.y + fromMetrics.height / 2 };
      const toAnchor = { x: to.x + toMetrics.width / 2, y: to.y + toMetrics.height / 2 };
      const path = buildEdgePath(fromAnchor, toAnchor);
      if (!path) return '';
      return `<path class="${klass}" data-from="${edge.from}" data-to="${edge.to}" d="${path}"></path>`;
    })
    .join('');

  nodesLayer.innerHTML = snapshot.nodes
    .map(
      (node) => {
        const metrics = getNodeMetrics(node);
        return `
      <button class="node" data-id="${node.id}" data-selected="${node.id === selectedId}" data-grid-columns="${metrics.columns}" style="left:${node.x}px;top:${node.y}px;width:${metrics.width}px;height:${metrics.height}px">
        ${escapeHtml(node.title)}
        <small>ID ${node.id}</small>
      </button>
    `;
      },
    )
    .join('');
  rebuildRenderIndexes();

  connectBtn.textContent = engine.hasConnectionFrom(selectedId) ? 'Unconnect' : 'Connect';
  syncToolbarButtons();
}

function applyViewportTransform() {
  const snapUnit = 1 / Math.max(1, window.devicePixelRatio || 1);
  const snappedX = Math.round(camera.x / snapUnit) * snapUnit;
  const snappedY = Math.round(camera.y / snapUnit) * snapUnit;
  const transform = `translate3d(${snappedX}px, ${snappedY}px, 0) scale(${camera.scale})`;
  edgesLayer.style.transform = transform;
  nodesLayer.style.transform = transform;
  if (boundaryLayer) {
    boundaryLayer.style.transform = transform;
  }
}

function rebuildRenderIndexes() {
  nodeElementById = new Map();
  edgeElementsByNodeId = new Map();
  nodesLayer.querySelectorAll('.node').forEach((nodeEl) => {
    const id = Number(nodeEl.dataset.id);
    if (Number.isFinite(id)) {
      nodeElementById.set(id, nodeEl);
    }
  });
  edgesLayer.querySelectorAll('path[data-from][data-to]').forEach((pathEl) => {
    const from = Number(pathEl.dataset.from);
    const to = Number(pathEl.dataset.to);
    if (!Number.isFinite(from) || !Number.isFinite(to)) return;
    bindEdgeToNode(from, pathEl);
    bindEdgeToNode(to, pathEl);
  });
}

function bindEdgeToNode(nodeId, edgeEl) {
  let list = edgeElementsByNodeId.get(nodeId);
  if (!list) {
    list = [];
    edgeElementsByNodeId.set(nodeId, list);
  }
  list.push(edgeEl);
}

function updateNodeVisual(nodeId) {
  const node = engine.getNode(nodeId);
  if (!node) return;
  const nodeEl = nodeElementById.get(nodeId);
  const metrics = getNodeMetrics(node);
  if (nodeEl) {
    nodeEl.style.left = `${node.x}px`;
    nodeEl.style.top = `${node.y}px`;
    nodeEl.style.width = `${metrics.width}px`;
    nodeEl.style.height = `${metrics.height}px`;
    nodeEl.dataset.gridColumns = String(metrics.columns);
  }
  const edges = edgeElementsByNodeId.get(nodeId);
  if (!edges || edges.length === 0) return;
  for (const edgeEl of edges) {
    const from = Number(edgeEl.dataset.from);
    const to = Number(edgeEl.dataset.to);
    const fromNode = engine.getNode(from);
    const toNode = engine.getNode(to);
    if (!fromNode || !toNode) continue;
    const fromMetrics = getNodeMetrics(fromNode);
    const toMetrics = getNodeMetrics(toNode);
    const fromAnchor = { x: fromNode.x + fromMetrics.width / 2, y: fromNode.y + fromMetrics.height / 2 };
    const toAnchor = { x: toNode.x + toMetrics.width / 2, y: toNode.y + toMetrics.height / 2 };
    const path = buildEdgePath(fromAnchor, toAnchor);
    if (path) {
      edgeEl.setAttribute('d', path);
    }
  }
}

function requestRender({ full = false } = {}) {
  if (full) {
    fullRenderRequired = true;
  }
  if (renderQueued) return;
  renderQueued = true;
  requestAnimationFrame(render);
}

function setStatus(text) {
  statusEl.textContent = text;
}

function setRemoteOnline(online) {
  if (!syncStatusDotEl) return;
  const next = Boolean(online);
  syncStatusDotEl.dataset.online = String(next);
  syncStatusDotEl.setAttribute('aria-label', next ? 'Online' : 'Offline');
  syncStatusDotEl.title = next ? 'Online' : 'Offline';
}

function syncToolbarButtons() {
  if (undoBtn) {
    undoBtn.disabled = !engine.canUndo();
  }
  if (redoBtn) {
    redoBtn.disabled = !engine.canRedo();
  }
}

function save() {
  if (!Number.isFinite(engine.version) || engine.version === lastSavedVersion) {
    return;
  }
  const didSave = saveSnapshot(safeMapId, engine.getSnapshot());
  if (didSave) {
    lastSavedVersion = engine.version;
  }
}

async function hydrateFromRemote() {
  const remote = await loadSnapshotRemote(safeMapId);
  if (!remote) {
    setRemoteOnline(false);
    return;
  }
  try {
    engine = FadhilMindmapLite.fromSnapshot(remote);
    snapEngineNodesToGrid();
    selectedId = engine.getSnapshot().nodes[0]?.id ?? selectedId;
    centerCameraOnContent(engine.getSnapshot().nodes);
    setStatus('Workspace loaded from database.');
    saveSnapshot(safeMapId, engine.getSnapshot(), { remote: false });
    lastSavedVersion = Number.isFinite(engine.version) ? engine.version : lastSavedVersion;
    setRemoteOnline(true);
    requestRender({ full: true });
  } catch {
    setRemoteOnline(false);
    // Keep local fallback snapshot when remote payload is not usable.
  }
}

async function probeRemoteConnection() {
  try {
    const response = await fetch(`/api/mindmapmaker?id=${safeMapId}`, { method: 'GET', cache: 'no-store' });
    setRemoteOnline(response.ok);
  } catch {
    setRemoteOnline(false);
  }
}

function pointerStart(event) {
  registerPointer(event);
  if (activePointers.size >= 2) {
    dragMode = 'idle';
    dragtargetId = null;
    dragMoved = false;
    dragNodePosition = null;
    syncPinchState();
    return;
  }
  if (activePointerId !== null) return;
  activePointerId = event.pointerId;
  viewport.setPointerCapture(event.pointerId);

  const nodeEl = event.target.closest('.node');
  startPointer = { x: event.clientX, y: event.clientY };

  if (nodeEl) {
    const nodeId = Number(nodeEl.dataset.id);
    if (connectSourceId !== null && connectSourceId !== nodeId) {
      engine.connect(connectSourceId, nodeId);
      connectSourceId = null;
      setStatus(`Connected ${selectedId} -> ${nodeId}`);
      save();
      requestRender({ full: true });
      pointerEnd(event);
      return;
    }

    selectedId = nodeId;
    dragtargetId = nodeId;
    const node = engine.getNode(nodeId);
    if (node) {
      startNode = { x: node.x, y: node.y };
      dragMode = 'node';
      dragMoved = false;
      dragNodePosition = null;
    }
  } else {
    dragMode = 'pan';
    startCamera = { x: camera.x, y: camera.y };
  }
  requestRender({ full: true });
}

function pointerMove(event) {
  if (!activePointers.has(event.pointerId)) return;
  registerPointer(event);
  if (activePointers.size >= 2) {
    event.preventDefault();
    applyPinchZoom();
    requestRender();
    return;
  }
  if (event.pointerId !== activePointerId) return;
  if (dragMode === 'idle') return;
  event.preventDefault();

  const bounds = getWorkspaceBounds(engine.getSnapshot().nodes);
  const dx = (event.clientX - startPointer.x) / camera.scale;
  const dy = (event.clientY - startPointer.y) / camera.scale;

  if (dragMode === 'node' && dragtargetId !== null) {
    const activeNode = engine.getNode(dragtargetId);
    if (!activeNode) {
      return;
    }
    const nextX = clampNodeX(snapToGrid(startNode.x + dx), bounds, dragtargetId);
    const nextY = clampNodeY(snapToGrid(startNode.y + dy), bounds, dragtargetId);
    if (nextX !== activeNode.x || nextY !== activeNode.y) {
      dragMoved = true;
      dragNodePosition = { x: nextX, y: nextY };
      engine.updateNode(dragtargetId, { x: nextX, y: nextY }, { recordHistory: false });
      updateNodeVisual(dragtargetId);
    }
  } else if (dragMode === 'pan') {
    camera.x = startCamera.x + (event.clientX - startPointer.x) * PAN_SENSITIVITY;
    camera.y = startCamera.y + (event.clientY - startPointer.y) * PAN_SENSITIVITY;
  }

  if (dragMode === 'pan') {
    requestRender();
  }
}

function pointerEnd(event) {
  unregisterPointer(event);
  if (activePointers.size >= 2) {
    syncPinchState();
    return;
  }
  if (pinchState && activePointers.size === 1) {
    const [pointer] = activePointers.values();
    startPointer = { x: pointer.x, y: pointer.y };
    startCamera = { x: camera.x, y: camera.y };
    dragMode = 'pan';
    activePointerId = pointer.id;
    pinchState = null;
    return;
  }
  if (activePointerId !== null && event.pointerId === activePointerId) {
    viewport.releasePointerCapture(event.pointerId);
  }
  if (dragMode === 'node' && dragtargetId !== null && !dragMoved) {
    handleNodeTapForRename(dragtargetId);
  }
  if (dragMode === 'node' && dragtargetId !== null && dragMoved && dragNodePosition) {
    engine.updateNode(dragtargetId, dragNodePosition);
    save();
  }
  activePointerId = null;
  dragMode = 'idle';
  dragtargetId = null;
  dragMoved = false;
  dragNodePosition = null;
  pinchState = null;
}

function handleNodeTapForRename(nodeId) {
  const now = Date.now();
  const recent = tapBurst.nodeId === nodeId ? tapBurst.stamps.filter((ts) => now - ts < 700) : [];
  recent.push(now);
  tapBurst.nodeId = nodeId;
  tapBurst.stamps = recent;
  if (recent.length < 3) {
    return;
  }
  tapBurst.stamps = [];
  openRenameNodePopup(nodeId);
}

function openRenameNodePopup(nodeId) {
  const node = engine.getNode(nodeId);
  if (!node) return;
  const draft = window.prompt('Rename node', node.title);
  if (draft === null) return;
  const nextTitle = draft.trim();
  if (!nextTitle || nextTitle === node.title) return;
  engine.updateNode(nodeId, { title: nextTitle });
  selectedId = nodeId;
  requestRender({ full: true });
  save();
  setStatus(`Node ${nodeId} renamed.`);
}

function onWheel(event) {
  event.preventDefault();
  const nextScale = clampScale(camera.scale + (event.deltaY > 0 ? -0.05 : 0.05));
  zoomAtPoint(event.clientX, event.clientY, nextScale);
  requestRender();
}

function download(filename, content, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

addNodeBtn.addEventListener('click', () => {
  const created = engine.addNode(selectedId, `Node ${Date.now().toString().slice(-4)}`);
  if (created) {
    engine.updateNode(created.id, { x: snapToGrid(created.x), y: snapToGrid(created.y) }, { recordHistory: false });
  }
  requestRender({ full: true });
  save();
  setStatus('Node added.');
});

removeNodeBtn.addEventListener('click', () => {
  const removed = engine.removeNode(selectedId);
  if (removed) {
    selectedId = 1;
    requestRender({ full: true });
    save();
    setStatus('Node removed.');
  } else {
    setStatus('Root node cannot be removed.');
  }
});

connectBtn.addEventListener('click', () => {
  if (engine.hasConnectionFrom(selectedId)) {
    engine.unconnectFrom(selectedId);
    connectSourceId = null;
    requestRender({ full: true });
    save();
    setStatus('Connection removed from selected node.');
    return;
  }
  connectSourceId = selectedId;
  setStatus('Connect mode active. Tap target node.');
});

undoBtn?.addEventListener('click', () => {
  const didUndo = engine.undo();
  if (!didUndo) {
    setStatus('No actions to undo.');
    return;
  }
  selectedId = engine.getNode(selectedId)?.id ?? engine.getSnapshot().nodes[0]?.id ?? 1;
  connectSourceId = null;
  requestRender({ full: true });
  save();
  setStatus('Undo complete.');
});

redoBtn?.addEventListener('click', () => {
  const didRedo = engine.redo();
  if (!didRedo) {
    setStatus('No actions to redo.');
    return;
  }
  selectedId = engine.getNode(selectedId)?.id ?? engine.getSnapshot().nodes[0]?.id ?? 1;
  connectSourceId = null;
  requestRender({ full: true });
  save();
  setStatus('Redo complete.');
});

saveCsvBtn.addEventListener('click', () => {
  download(`mindmap-${safeMapId}.csv`, engine.toCsv(), 'text/csv;charset=utf-8');
  setStatus('CSV saved.');
});

saveFdhlBtn.addEventListener('click', async () => {
  const encoded = await encodeFdhl(engine.getSnapshot());
  download(`mindmap-${safeMapId}.fAdHiL`, encoded, 'application/x-fadhil-archive');
  setStatus('.fAdHiL saved.');
});

loadBtn.addEventListener('click', () => loadInput.click());
loadInput.addEventListener('change', async () => {
  const file = loadInput.files?.[0];
  if (!file) return;
  const text = await file.text();

  try {
    const lowerName = file.name.toLowerCase();
    if (lowerName.endsWith('.csv')) {
      engine.fromCsv(text);
      snapEngineNodesToGrid();
      setStatus('CSV loaded.');
    } else {
      const decoded = lowerName.endsWith('.cws') ? decodeLegacyCws(text) : await decodeFdhl(text);
      const apiDecoded = (!decoded || typeof decoded !== 'object' || !Array.isArray(decoded.nodes))
        ? await decodeViaArchiveLabApi(text)
        : null;
      const normalized = normalizeLiteSnapshot(decoded)
        ?? normalizeLiteSnapshotFromWorkspaceArchive(decoded)
        ?? normalizeLiteSnapshot(apiDecoded)
        ?? normalizeLiteSnapshotFromWorkspaceArchive(apiDecoded);
      if (normalized) {
        const transformed = transformLegacySnapshot(normalized);
        engine = FadhilMindmapLite.fromSnapshot(transformed);
        snapEngineNodesToGrid();
        const preferredViewport = extractViewport(apiDecoded) ?? extractViewport(decoded) ?? extractViewport(normalized);
        if (preferredViewport) {
          applyCameraViewport(preferredViewport);
          if (!hasVisibleNodeInViewport(transformed.nodes)) {
            centerCameraOnContent(transformed.nodes);
          }
        } else {
          centerCameraOnContent(transformed.nodes);
        }
        setStatus(lowerName.endsWith('.cws') ? '.cws loaded.' : '.fAdHiL loaded.');
      } else {
        throw new Error('Payload file tidak dikenali. Gunakan .fAdHiL/.fdhl/.cws yang berisi snapshot lite.');
      }
    }
    selectedId = engine.getSnapshot().nodes[0]?.id ?? 1;
    connectSourceId = null;
    requestRender({ full: true });
    save();
  } catch (error) {
    console.error(error);
    setStatus(`Load failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
  loadInput.value = '';
});

viewport.addEventListener('pointerdown', pointerStart);
viewport.addEventListener('pointermove', pointerMove, { passive: false });
viewport.addEventListener('pointerup', pointerEnd);
viewport.addEventListener('pointercancel', pointerEnd);
viewport.addEventListener('wheel', onWheel, { passive: false });
window.addEventListener('beforeunload', save);
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    void probeRemoteConnection();
  }
});

document.addEventListener('gesturestart', (e) => e.preventDefault());
setRemoteOnline(false);
void probeRemoteConnection();
setInterval(() => {
  void probeRemoteConnection();
}, 20000);

requestRender({ full: true });

function escapeHtml(input) {
  return input.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}

function getNodeMetrics(node) {
  const title = typeof node?.title === 'string' ? node.title.trim() : '';
  const columns = title.length > LONG_NODE_THRESHOLD ? GRID_COLUMNS_LONG : GRID_COLUMNS_SHORT;
  return {
    columns,
    width: columns * GRID_SIZE,
    height: GRID_ROWS * GRID_SIZE,
  };
}

function snapToGrid(value) {
  return Math.round(Number(value) / GRID_SIZE) * GRID_SIZE;
}

function snapEngineNodesToGrid() {
  const snapshot = engine.getSnapshot();
  for (const node of snapshot.nodes) {
    const nextX = snapToGrid(node.x);
    const nextY = snapToGrid(node.y);
    if (nextX !== node.x || nextY !== node.y) {
      engine.updateNode(node.id, { x: nextX, y: nextY }, { recordHistory: false });
    }
  }
}

function normalizeLiteSnapshot(input) {
  if (!input || typeof input !== 'object') {
    return null;
  }
  if (Array.isArray(input.nodes)) {
    return input;
  }
  if (input.payload && typeof input.payload === 'object' && Array.isArray(input.payload.nodes)) {
    return input.payload;
  }
  if (
    input.payload
    && typeof input.payload === 'object'
    && input.payload.payload
    && typeof input.payload.payload === 'object'
    && Array.isArray(input.payload.payload.nodes)
  ) {
    return input.payload.payload;
  }
  return null;
}

function normalizeLiteSnapshotFromWorkspaceArchive(input) {
  if (!input || typeof input !== 'object' || typeof input.snapshot !== 'string') {
    return null;
  }
  return parseSnapshotString(input.snapshot);
}

async function decodeViaArchiveLabApi(raw) {
  try {
    const response = await fetch('/api/archive/decode-lite', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ raw }),
    });
    if (!response.ok) {
      return null;
    }
    const payload = await response.json();
    if (!payload?.ok || !payload.workspace) {
      return null;
    }
    return payload.workspace;
  } catch {
    return null;
  }
}

function transformLegacySnapshot(snapshot) {
  const sourceNodes = Array.isArray(snapshot?.nodes) ? snapshot.nodes : [];
  const sourceEdges = extractEdgePairs(snapshot);
  const idSet = new Set();
  const idAlias = new Map();
  let nextId = 1;
  const nodes = sourceNodes.map((raw, index) => {
    const sourceId = raw?.id ?? `node-${index + 1}`;
    const parsedId = Number(sourceId);
    const fallbackId = index + 1;
    const id = Number.isFinite(parsedId) && parsedId > 0 && !idSet.has(parsedId) ? parsedId : Math.max(fallbackId, nextId++);
    idSet.add(id);
    idAlias.set(String(sourceId), id);

    const parsedParent = Number(raw?.parentId);
    const position = raw?.position && typeof raw.position === 'object' ? raw.position : null;
    const parentId = Number.isFinite(parsedParent) && parsedParent > 0 ? parsedParent : null;
    return {
      id,
      title: typeof raw?.title === 'string' && raw.title.trim()
        ? raw.title
        : (typeof raw?.label === 'string' && raw.label.trim() ? raw.label : `Node ${id}`),
      parentId,
      depth: Number.isFinite(raw?.depth) ? Math.max(0, Number(raw.depth)) : 0,
      weight: Number.isFinite(raw?.weight) ? Math.max(0.05, Number(raw.weight)) : 1,
      x: Number(position?.x ?? raw?.x),
      y: Number(position?.y ?? raw?.y),
    };
  });

  if (nodes.length === 0) {
    return new FadhilMindmapLite().getSnapshot();
  }

  const byId = new Map(nodes.map((node) => [node.id, node]));
  const root = nodes.find((node) => node.parentId === null || !byId.has(node.parentId)) ?? nodes[0];
  root.parentId = null;

  const childrenByParent = new Map();
  const seenParentByNode = new Set();
  for (const edge of sourceEdges) {
    const sourceId = idAlias.get(String(edge.from));
    const targetId = idAlias.get(String(edge.to));
    if (!sourceId || !targetId || sourceId === targetId) continue;
    const target = byId.get(targetId);
    if (!target) continue;
    if (!seenParentByNode.has(targetId)) {
      target.parentId = sourceId;
      seenParentByNode.add(targetId);
    }
  }
  for (const node of nodes) {
    if (node.id === root.id) continue;
    if (node.parentId === null || !byId.has(node.parentId)) {
      node.parentId = root.id;
    }
    let list = childrenByParent.get(node.parentId);
    if (!list) {
      list = [];
      childrenByParent.set(node.parentId, list);
    }
    list.push(node.id);
  }

  // Recompute depth deterministically from parent links.
  const depthQueue = [root.id];
  root.depth = 0;
  while (depthQueue.length > 0) {
    const current = depthQueue.shift();
    if (!current) break;
    const parentNode = byId.get(current);
    const children = childrenByParent.get(current) ?? [];
    for (const childId of children) {
      const child = byId.get(childId);
      if (!child || !parentNode) continue;
      child.depth = parentNode.depth + 1;
      depthQueue.push(childId);
    }
  }

  const hasValidCoordinates = nodes.some((node) => Number.isFinite(node.x) && Number.isFinite(node.y) && (Math.abs(node.x) > 1 || Math.abs(node.y) > 1));
  if (!hasValidCoordinates) {
    applyFallbackLayout(root.id, byId, childrenByParent);
  } else {
    for (const node of nodes) {
      if (!Number.isFinite(node.x) || !Number.isFinite(node.y)) {
        const parent = node.parentId !== null ? byId.get(node.parentId) : null;
        node.x = parent ? parent.x + 220 : 0;
        node.y = parent ? parent.y : 0;
      }
    }
  }

  const dedupLink = new Set();
  const links = sourceEdges
    .map((edge) => ({ from: idAlias.get(String(edge.from)), to: idAlias.get(String(edge.to)) }))
    .filter((link) => Number.isFinite(link.from) && Number.isFinite(link.to) && byId.has(link.from) && byId.has(link.to) && link.from !== link.to)
    .filter((link) => {
      const key = `${link.from}->${link.to}`;
      if (dedupLink.has(key)) return false;
      dedupLink.add(key);
      return true;
    });

  return {
    version: Number.isFinite(snapshot?.version) ? Math.max(1, Number(snapshot.version)) : 1,
    nodes,
    links,
    edges: [],
  };
}

function extractEdgePairs(snapshot) {
  const links = Array.isArray(snapshot?.links) ? snapshot.links : [];
  const edges = Array.isArray(snapshot?.edges) ? snapshot.edges : [];
  const pairs = [];
  for (const link of links) {
    if (link && link.from !== undefined && link.to !== undefined) {
      pairs.push({ from: link.from, to: link.to });
    }
  }
  for (const edge of edges) {
    if (edge && edge.from !== undefined && edge.to !== undefined) {
      pairs.push({ from: edge.from, to: edge.to });
      continue;
    }
    if (edge && edge.source !== undefined && edge.target !== undefined) {
      pairs.push({ from: edge.source, to: edge.target });
    }
  }
  return pairs;
}

function applyFallbackLayout(rootId, byId, childrenByParent) {
  let row = 0;
  const walk = (id, depth) => {
    const node = byId.get(id);
    if (!node) return;
    const children = childrenByParent.get(id) ?? [];
    if (children.length === 0) {
      node.x = depth * 220;
      node.y = row * 90;
      row += 1;
      return;
    }
    for (const childId of children) {
      walk(childId, depth + 1);
    }
    const first = byId.get(children[0]);
    const last = byId.get(children[children.length - 1]);
    node.x = depth * 220;
    node.y = first && last ? (first.y + last.y) / 2 : row * 90;
  };
  walk(rootId, 0);
}

function decodeLegacyCws(text) {
  const parsed = tryParseJson(text);
  if (parsed) {
    return parsed;
  }

  const trimmed = text.trim();
  if (trimmed.startsWith('cws::')) {
    const payload = decodeBase64Utf8(trimmed.slice(5));
    const parsedCws = tryParseJson(payload);
    if (parsedCws) {
      return parsedCws;
    }
  }

  const maybeB64 = decodeBase64Utf8(trimmed);
  const parsedB64 = tryParseJson(maybeB64);
  if (parsedB64) {
    return parsedB64;
  }

  throw new Error('Format .cws lama tidak dikenali.');
}

function parseSnapshotString(snapshot) {
  const parsedInline = tryParseJson(snapshot);
  if (parsedInline) {
    return normalizeLiteSnapshot(parsedInline);
  }
  const decoded = decodeBase64Utf8(snapshot);
  const parsedBase64 = tryParseJson(decoded);
  if (parsedBase64) {
    return normalizeLiteSnapshot(parsedBase64);
  }
  return null;
}

function tryParseJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function decodeBase64Utf8(text) {
  const clean = text.trim().replace(/^data:.*?;base64,/, '').replaceAll('-', '+').replaceAll('_', '/');
  if (!clean) return '';
  try {
    const pad = '='.repeat((4 - (clean.length % 4)) % 4);
    const binary = atob(clean + pad);
    const bytes = Uint8Array.from(binary, (ch) => ch.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  } catch {
    return '';
  }
}

function centerCameraOnContent(nodes) {
  if (!Array.isArray(nodes) || nodes.length === 0) {
    return;
  }
  const viewportWidth = viewport.clientWidth || 1;
  const viewportHeight = viewport.clientHeight || 1;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const node of nodes) {
    const x = Number(node.x);
    const y = Number(node.y);
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
    const metrics = getNodeMetrics(node);
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x + metrics.width);
    maxY = Math.max(maxY, y + metrics.height);
  }
  if (!Number.isFinite(minX) || !Number.isFinite(minY)) return;

  const contentWidth = Math.max(1, maxX - minX);
  const contentHeight = Math.max(1, maxY - minY);
  const fitScale = clampScale(Math.min(viewportWidth / (contentWidth + 96), viewportHeight / (contentHeight + 96)));
  camera.scale = fitScale;

  const centerX = minX + contentWidth / 2;
  const centerY = minY + contentHeight / 2;
  camera.x = viewportWidth / 2 - centerX * fitScale;
  camera.y = viewportHeight / 2 - centerY * fitScale;
}

function getWorkspaceBounds(nodes = []) {
  const viewportWidth = Math.max(360, viewport.clientWidth || 360);
  const viewportHeight = Math.max(240, viewport.clientHeight || 240);
  const dynamicWidth = Math.max(2400, Math.round(viewportWidth * 4.8));
  const dynamicHeight = Math.max(1600, Math.round(viewportHeight * 4.8));
  let maxNodeX = 0;
  let maxNodeY = 0;
  for (const node of nodes) {
    const x = Number(node?.x);
    const y = Number(node?.y);
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
    const metrics = getNodeMetrics(node);
    maxNodeX = Math.max(maxNodeX, x + metrics.width + 320);
    maxNodeY = Math.max(maxNodeY, y + metrics.height + 240);
  }
  return {
    minX: 0,
    minY: 0,
    maxX: Math.max(dynamicWidth, maxNodeX),
    maxY: Math.max(dynamicHeight, maxNodeY),
  };
}

function clampNodeX(x, bounds, nodeId = null) {
  const metrics = getNodeMetrics(nodeId === null ? null : engine.getNode(nodeId));
  return Math.min(bounds.maxX - metrics.width, Math.max(bounds.minX, x));
}

function clampNodeY(y, bounds, nodeId = null) {
  const metrics = getNodeMetrics(nodeId === null ? null : engine.getNode(nodeId));
  return Math.min(bounds.maxY - metrics.height, Math.max(bounds.minY, y));
}

function renderWorkspaceBoundary(bounds) {
  if (!boundaryLayer) return;
  boundaryLayer.style.left = `${bounds.minX}px`;
  boundaryLayer.style.top = `${bounds.minY}px`;
  boundaryLayer.style.width = `${Math.max(1, bounds.maxX - bounds.minX)}px`;
  boundaryLayer.style.height = `${Math.max(1, bounds.maxY - bounds.minY)}px`;
}

const activePointers = new Map();

function registerPointer(event) {
  activePointers.set(event.pointerId, { id: event.pointerId, x: event.clientX, y: event.clientY });
}

function unregisterPointer(event) {
  activePointers.delete(event.pointerId);
}

function syncPinchState() {
  if (activePointers.size < 2) {
    pinchState = null;
    return;
  }
  const [a, b] = Array.from(activePointers.values()).slice(0, 2);
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const distance = Math.max(8, Math.hypot(dx, dy));
  pinchState = {
    startDistance: distance,
    startScale: camera.scale,
    startX: (a.x + b.x) / 2,
    startY: (a.y + b.y) / 2,
  };
}

function applyPinchZoom() {
  if (!pinchState || activePointers.size < 2) {
    syncPinchState();
    return;
  }
  const [a, b] = Array.from(activePointers.values()).slice(0, 2);
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const distance = Math.max(8, Math.hypot(dx, dy));
  const centerX = (a.x + b.x) / 2;
  const centerY = (a.y + b.y) / 2;
  const ratio = distance / pinchState.startDistance;
  const nextScale = clampScale(pinchState.startScale * ratio);
  zoomAtPoint(centerX, centerY, nextScale);
}

function zoomAtPoint(clientX, clientY, nextScale) {
  const rect = viewport.getBoundingClientRect();
  const px = clientX - rect.left;
  const py = clientY - rect.top;
  const worldX = (px - camera.x) / camera.scale;
  const worldY = (py - camera.y) / camera.scale;
  camera.scale = nextScale;
  camera.x = px - worldX * nextScale;
  camera.y = py - worldY * nextScale;
}

function extractViewport(input) {
  if (!input || typeof input !== 'object' || !input.viewport || typeof input.viewport !== 'object') {
    return null;
  }
  const { x, y, zoom, scale } = input.viewport;
  const finalZoom = Number.isFinite(zoom) ? Number(zoom) : Number(scale);
  if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(finalZoom)) {
    return null;
  }
  return { x: Number(x), y: Number(y), zoom: finalZoom };
}

function applyCameraViewport(viewportState) {
  camera.scale = clampScale(viewportState.zoom);
  camera.x = viewportState.x;
  camera.y = viewportState.y;
}

function hasVisibleNodeInViewport(nodes) {
  const width = viewport.clientWidth || 1;
  const height = viewport.clientHeight || 1;
  for (const node of nodes) {
    const x = Number(node.x);
    const y = Number(node.y);
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
    const metrics = getNodeMetrics(node);
    const sx = x * camera.scale + camera.x;
    const sy = y * camera.scale + camera.y;
    const sw = metrics.width * camera.scale;
    const sh = metrics.height * camera.scale;
    if (sx + sw >= 0 && sy + sh >= 0 && sx <= width && sy <= height) {
      return true;
    }
  }
  return false;
}
