import {
  FadhilMindmapLite,
  buildEdgePath,
  clampScale,
  createViewportState,
  decodeFdhl,
  encodeFdhl,
  loadSnapshot,
  saveSnapshot,
} from '/mindmapmaker/lib/fadhilmindmaplib.browser.js';

const mapIdEl = document.getElementById('map-id');
const statusEl = document.getElementById('status');
const nodesLayer = document.getElementById('nodes');
const edgesLayer = document.getElementById('edges');
const viewport = document.getElementById('viewport');
const addNodeBtn = document.getElementById('add-node');
const removeNodeBtn = document.getElementById('remove-node');
const connectBtn = document.getElementById('connect-node');
const saveCsvBtn = document.getElementById('save-csv');
const saveFdhlBtn = document.getElementById('save-fdhl');
const loadBtn = document.getElementById('load-map');
const loadInput = document.getElementById('load-input');

const mapIdMatch = window.location.pathname.match(/\/(mindmapmaker\/)?editor\/(\d+)/);
const safeMapId = Number.isInteger(Number(mapIdMatch?.[2])) && Number(mapIdMatch[2]) > 0 ? Number(mapIdMatch[2]) : 1;
mapIdEl.textContent = String(safeMapId);

const persisted = loadSnapshot(safeMapId);
let engine = persisted ? FadhilMindmapLite.fromSnapshot(persisted) : new FadhilMindmapLite();
const camera = createViewportState();
const IS_TOUCH_PRIMARY = matchMedia('(pointer: coarse)').matches;
const NODE_BOX = { width: 180, height: 56 };
const PAN_SENSITIVITY = IS_TOUCH_PRIMARY ? 0.78 : 1;

let selectedId = engine.getSnapshot().nodes[0]?.id ?? 1;
let connectSourceId = null;
let dragMode = 'idle';
let activePointerId = null;
let startPointer = { x: 0, y: 0 };
let startNode = { x: 0, y: 0 };
let startCamera = { x: 0, y: 0 };
let dragTargetId = null;
let renderQueued = false;
let fullRenderRequired = true;

centerCameraOnContent(engine.getSnapshot().nodes);

function render() {
  renderQueued = false;
  const transform = `translate(${camera.x}px, ${camera.y}px) scale(${camera.scale})`;
  edgesLayer.style.transform = transform;
  nodesLayer.style.transform = transform;
  if (!fullRenderRequired) {
    return;
  }
  fullRenderRequired = false;
  const snapshot = engine.getSnapshot();

  const byId = new Map(snapshot.nodes.map((n) => [n.id, n]));
  edgesLayer.innerHTML = snapshot.edges
    .map((edge) => {
      const from = byId.get(edge.from);
      const to = byId.get(edge.to);
      if (!from || !to) return '';
      const klass = edge.kind === 'link' ? 'edge-path edge-link' : 'edge-path';
      const fromAnchor = edge.kind === 'link'
        ? { x: from.x + NODE_BOX.width / 2, y: from.y + NODE_BOX.height / 2 }
        : { x: from.x + NODE_BOX.width - 4, y: from.y + NODE_BOX.height / 2 };
      const toAnchor = edge.kind === 'link'
        ? { x: to.x + NODE_BOX.width / 2, y: to.y + NODE_BOX.height / 2 }
        : { x: to.x + 4, y: to.y + NODE_BOX.height / 2 };
      const path = buildEdgePath(fromAnchor, toAnchor);
      if (!path) return '';
      return `<path class="${klass}" d="${path}"></path>`;
    })
    .join('');

  nodesLayer.innerHTML = snapshot.nodes
    .map(
      (node) => `
      <button class="node" data-id="${node.id}" data-selected="${node.id === selectedId}" style="left:${node.x}px;top:${node.y}px">
        ${escapeHtml(node.title)}
        <small>ID ${node.id}</small>
      </button>
    `,
    )
    .join('');

  connectBtn.textContent = engine.hasConnectionFrom(selectedId) ? 'Unconnect' : 'Connect';
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

function save() {
  saveSnapshot(safeMapId, engine.getSnapshot());
}

function pointerStart(event) {
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
    dragTargetId = nodeId;
    const node = engine.getNode(nodeId);
    if (node) {
      startNode = { x: node.x, y: node.y };
      dragMode = 'node';
    }
  } else {
    dragMode = 'pan';
    startCamera = { x: camera.x, y: camera.y };
  }
  requestRender({ full: true });
}

function pointerMove(event) {
  if (event.pointerId !== activePointerId) return;
  if (dragMode === 'idle') return;
  event.preventDefault();

  const dx = (event.clientX - startPointer.x) / camera.scale;
  const dy = (event.clientY - startPointer.y) / camera.scale;

  if (dragMode === 'node' && dragTargetId !== null) {
    engine.updateNode(dragTargetId, { x: startNode.x + dx, y: startNode.y + dy });
  } else if (dragMode === 'pan') {
    camera.x = startCamera.x + (event.clientX - startPointer.x) * PAN_SENSITIVITY;
    camera.y = startCamera.y + (event.clientY - startPointer.y) * PAN_SENSITIVITY;
  }

  requestRender({ full: dragMode !== 'pan' });
}

function pointerEnd(event) {
  if (activePointerId !== null && event.pointerId === activePointerId) {
    viewport.releasePointerCapture(event.pointerId);
  }
  activePointerId = null;
  dragMode = 'idle';
  dragTargetId = null;
  save();
}

function onWheel(event) {
  event.preventDefault();
  camera.scale = clampScale(camera.scale + (event.deltaY > 0 ? -0.05 : 0.05));
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
  engine.addNode(selectedId, `Node ${Date.now().toString().slice(-4)}`);
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
      setStatus('CSV loaded.');
    } else {
      const decoded = lowerName.endsWith('.cws') ? decodeLegacyCws(text) : await decodeFdhl(text);
      const normalized = normalizeLiteSnapshot(decoded) ?? normalizeLiteSnapshotFromWorkspaceArchive(decoded);
      if (normalized) {
        const transformed = transformLegacySnapshot(normalized);
        engine = FadhilMindmapLite.fromSnapshot(transformed);
        centerCameraOnContent(transformed.nodes);
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

document.addEventListener('gesturestart', (e) => e.preventDefault());

requestRender({ full: true });

function escapeHtml(input) {
  return input.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
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

function transformLegacySnapshot(snapshot) {
  const sourceNodes = Array.isArray(snapshot?.nodes) ? snapshot.nodes : [];
  const idSet = new Set();
  const nodes = sourceNodes.map((raw, index) => {
    const parsedId = Number(raw?.id);
    const fallbackId = index + 1;
    const id = Number.isFinite(parsedId) && parsedId > 0 && !idSet.has(parsedId) ? parsedId : fallbackId;
    idSet.add(id);

    const parsedParent = Number(raw?.parentId);
    const parentId = Number.isFinite(parsedParent) && parsedParent > 0 ? parsedParent : null;
    return {
      id,
      title: typeof raw?.title === 'string' && raw.title.trim() ? raw.title : `Node ${id}`,
      parentId,
      depth: Number.isFinite(raw?.depth) ? Math.max(0, Number(raw.depth)) : 0,
      weight: Number.isFinite(raw?.weight) ? Math.max(0.05, Number(raw.weight)) : 1,
      x: Number(raw?.x),
      y: Number(raw?.y),
    };
  });

  if (nodes.length === 0) {
    return new FadhilMindmapLite().getSnapshot();
  }

  const byId = new Map(nodes.map((node) => [node.id, node]));
  const root = nodes.find((node) => node.parentId === null || !byId.has(node.parentId)) ?? nodes[0];
  root.parentId = null;

  const childrenByParent = new Map();
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

  const links = (Array.isArray(snapshot?.links) ? snapshot.links : [])
    .map((link) => ({ from: Number(link?.from), to: Number(link?.to) }))
    .filter((link) => Number.isFinite(link.from) && Number.isFinite(link.to) && byId.has(link.from) && byId.has(link.to) && link.from !== link.to);

  return {
    version: Number.isFinite(snapshot?.version) ? Math.max(1, Number(snapshot.version)) : 1,
    nodes,
    links,
    edges: [],
  };
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
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x + NODE_BOX.width);
    maxY = Math.max(maxY, y + NODE_BOX.height);
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
