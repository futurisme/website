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
const mapId = mapIdMatch ? Number(mapIdMatch[2]) : 1;
const safeMapId = Number.isInteger(mapId) && mapId > 0 ? mapId : 1;
mapIdEl.textContent = String(safeMapId);

const persisted = loadSnapshot(safeMapId);
const engine = persisted ? FadhilMindmapLite.fromSnapshot(persisted) : new FadhilMindmapLite();
const camera = createViewportState();

let selectedId = engine.getSnapshot().nodes[0]?.id ?? 1;
let mode = 'idle';
let dragTargetId = null;
let connectSourceId = null;
let startPointer = { x: 0, y: 0 };
let startNode = { x: 0, y: 0 };
let startCamera = { x: 0, y: 0 };

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
      return `<path class="${klass}" d="${buildEdgePath({ x: from.x + 85, y: from.y + 26 }, { x: to.x + 8, y: to.y + 26 })}"></path>`;
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

function pointerPosition(event) {
  if (event.touches?.[0]) return { x: event.touches[0].clientX, y: event.touches[0].clientY };
  return { x: event.clientX, y: event.clientY };
}

function onPointerDown(event) {
  const targetNode = event.target.closest('.node');
  const pos = pointerPosition(event);
  startPointer = pos;

  if (targetNode) {
    const targetId = Number(targetNode.dataset.id);

    if (connectSourceId !== null && connectSourceId !== targetId) {
      engine.connect(connectSourceId, targetId);
      connectSourceId = null;
      setStatus(`Connected node ${selectedId} -> ${targetId}`);
      save();
      render();
      return;
    }

    selectedId = targetId;
    dragTargetId = selectedId;
    const snap = engine.getSnapshot();
    const node = snap.nodes.find((n) => n.id === dragTargetId);
    if (node) {
      startNode = { x: node.x, y: node.y };
      mode = 'drag-node';
    }
  } else {
    mode = 'pan';
    startCamera = { x: camera.x, y: camera.y };
  }
  render();
}

function onPointerMove(event) {
  if (mode === 'idle') return;
  event.preventDefault();

  const pos = pointerPosition(event);
  const dx = (pos.x - startPointer.x) / camera.scale;
  const dy = (pos.y - startPointer.y) / camera.scale;

  if (mode === 'drag-node' && dragTargetId !== null) {
    engine.updateNode(dragTargetId, { x: startNode.x + dx, y: startNode.y + dy });
    render();
    return;
  }

  if (mode === 'pan') {
    camera.x = startCamera.x + (pos.x - startPointer.x);
    camera.y = startCamera.y + (pos.y - startPointer.y);
    render();
  }
}

function onPointerUp() {
  mode = 'idle';
  dragTargetId = null;
  save();
}

function onWheel(event) {
  event.preventDefault();
  camera.scale = clampScale(camera.scale + (event.deltaY > 0 ? -0.05 : 0.05));
  render();
}

function save() {
  saveSnapshot(safeMapId, engine.getSnapshot());
}

function setStatus(text) {
  statusEl.textContent = text;
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
  save();
  render();
  setStatus('Node added.');
});

removeNodeBtn.addEventListener('click', () => {
  const removed = engine.removeNode(selectedId);
  if (removed) {
    selectedId = 1;
    save();
    render();
    setStatus('Node removed.');
  } else {
    setStatus('Root node cannot be removed.');
  }
});

connectBtn.addEventListener('click', () => {
  if (engine.hasConnectionFrom(selectedId)) {
    engine.unconnectFrom(selectedId);
    save();
    render();
    setStatus('Connections removed from selected node.');
    return;
  }
  connectSourceId = selectedId;
  setStatus('Connect mode: tap target node to create connection.');
});

saveCsvBtn.addEventListener('click', () => {
  download(`mindmap-${safeMapId}.csv`, engine.toCsv(), 'text/csv;charset=utf-8');
  setStatus('CSV exported.');
});

saveFdhlBtn.addEventListener('click', async () => {
  const encoded = await encodeFdhl(engine.getSnapshot());
  download(`mindmap-${safeMapId}.fdhl`, encoded, 'text/plain;charset=utf-8');
  setStatus('.fdhl exported with repository archive format.');
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
      const payload = await decodeFdhl(text);
      const restored = FadhilMindmapLite.fromSnapshot(payload);
      Object.assign(engine, restored);
      setStatus('.fdhl loaded.');
    }

    save();
    render();
  } catch (error) {
    console.error(error);
    setStatus('Failed to load file.');
  }
});

viewport.addEventListener('mousedown', onPointerDown);
viewport.addEventListener('mousemove', onPointerMove);
window.addEventListener('mouseup', onPointerUp);
viewport.addEventListener('touchstart', onPointerDown, { passive: false });
viewport.addEventListener('touchmove', onPointerMove, { passive: false });
window.addEventListener('touchend', onPointerUp, { passive: false });
viewport.addEventListener('wheel', onWheel, { passive: false });
window.addEventListener('beforeunload', save);

render();

function escapeHtml(input) {
  return input
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
