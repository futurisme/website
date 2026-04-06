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
const engine = persisted ? FadhilMindmapLite.fromSnapshot(persisted) : new FadhilMindmapLite();
const camera = createViewportState();

let selectedId = engine.getSnapshot().nodes[0]?.id ?? 1;
let connectSourceId = null;
let dragMode = 'idle';
let activePointerId = null;
let startPointer = { x: 0, y: 0 };
let startNode = { x: 0, y: 0 };
let startCamera = { x: 0, y: 0 };
let dragTargetId = null;

function render() {
  const snapshot = engine.getSnapshot();
  const transform = `translate(${camera.x}px, ${camera.y}px) scale(${camera.scale})`;
  edgesLayer.style.transform = transform;
  nodesLayer.style.transform = transform;

  const byId = new Map(snapshot.nodes.map((n) => [n.id, n]));
  edgesLayer.innerHTML = snapshot.edges
    .map((edge) => {
      const from = byId.get(edge.from);
      const to = byId.get(edge.to);
      if (!from || !to) return '';
      const klass = edge.kind === 'link' ? 'edge-path edge-link' : 'edge-path';
      return `<path class="${klass}" d="${buildEdgePath({ x: from.x + 85, y: from.y + 24 }, { x: to.x + 8, y: to.y + 24 })}"></path>`;
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
      render();
      pointerEnd(event);
      return;
    }

    selectedId = nodeId;
    dragTargetId = nodeId;
    const node = engine.getSnapshot().nodes.find((n) => n.id === nodeId);
    if (node) {
      startNode = { x: node.x, y: node.y };
      dragMode = 'node';
    }
  } else {
    dragMode = 'pan';
    startCamera = { x: camera.x, y: camera.y };
  }
  render();
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
    camera.x = startCamera.x + (event.clientX - startPointer.x);
    camera.y = startCamera.y + (event.clientY - startPointer.y);
  }

  render();
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
  render();
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
  render();
  save();
  setStatus('Node added.');
});

removeNodeBtn.addEventListener('click', () => {
  const removed = engine.removeNode(selectedId);
  if (removed) {
    selectedId = 1;
    render();
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
    render();
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
  download(`mindmap-${safeMapId}.fdhl`, encoded, 'text/plain;charset=utf-8');
  setStatus('FDHL saved.');
});

loadBtn.addEventListener('click', () => loadInput.click());
loadInput.addEventListener('change', async () => {
  const file = loadInput.files?.[0];
  if (!file) return;
  const text = await file.text();

  try {
    if (file.name.endsWith('.csv')) {
      engine.fromCsv(text);
      setStatus('CSV loaded.');
    } else {
      Object.assign(engine, FadhilMindmapLite.fromSnapshot(await decodeFdhl(text)));
      setStatus('FDHL loaded.');
    }
    selectedId = engine.getSnapshot().nodes[0]?.id ?? 1;
    connectSourceId = null;
    render();
    save();
  } catch (error) {
    console.error(error);
    setStatus('Load failed.');
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

render();

function escapeHtml(input) {
  return input.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}
