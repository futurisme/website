const canvas = document.getElementById('canvas');
const linksSvg = document.getElementById('links');
const nodeLabel = document.getElementById('nodeLabel');
const selectionText = document.getElementById('selection');

const state = {
  nodes: new Map(),
  edges: [],
  selected: [],
  drag: null,
};

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

function createNode(label, x = 120, y = 120) {
  const id = uid();
  const node = { id, label: label || `Idea ${state.nodes.size + 1}`, x, y };
  state.nodes.set(id, node);
  draw();
  selectOnly(id);
}

function createEdge(from, to) {
  if (from === to) return;
  const exists = state.edges.some((edge) => edge.from === from && edge.to === to);
  if (!exists) state.edges.push({ from, to });
  draw();
}

function removeNode(id) {
  state.nodes.delete(id);
  state.edges = state.edges.filter((e) => e.from !== id && e.to !== id);
  state.selected = state.selected.filter((selected) => selected !== id);
  draw();
}

function selectOnly(id) {
  state.selected = [id];
  updateSelectionLabel();
  draw();
}

function toggleSelection(id) {
  if (state.selected.includes(id)) {
    state.selected = state.selected.filter((selected) => selected !== id);
  } else {
    state.selected = [...state.selected.slice(-1), id];
  }
  updateSelectionLabel();
  draw();
}

function updateSelectionLabel() {
  selectionText.textContent = `Selected: ${state.selected.length ? state.selected.join(', ') : 'none'}`;
}

function centerOf(node) {
  return { x: node.x + 70, y: node.y + 24 };
}

function drawLinks() {
  linksSvg.innerHTML = '';
  for (const edge of state.edges) {
    const from = state.nodes.get(edge.from);
    const to = state.nodes.get(edge.to);
    if (!from || !to) continue;
    const a = centerOf(from);
    const b = centerOf(to);
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', a.x);
    line.setAttribute('y1', a.y);
    line.setAttribute('x2', b.x);
    line.setAttribute('y2', b.y);
    linksSvg.appendChild(line);
  }
}

function drawNodes() {
  canvas.innerHTML = '';
  for (const node of state.nodes.values()) {
    const el = document.createElement('div');
    el.className = `node${state.selected.includes(node.id) ? ' active' : ''}`;
    el.style.left = `${node.x}px`;
    el.style.top = `${node.y}px`;
    el.dataset.id = node.id;
    el.innerHTML = `<div class="title">${node.label}</div><small>${node.id}</small>`;

    el.addEventListener('click', (event) => {
      event.stopPropagation();
      if (event.shiftKey) toggleSelection(node.id);
      else selectOnly(node.id);
    });

    el.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      state.drag = {
        id: node.id,
        dx: event.clientX - node.x,
        dy: event.clientY - node.y,
      };
      el.setPointerCapture(event.pointerId);
    });

    canvas.appendChild(el);
  }
}

function draw() {
  drawLinks();
  drawNodes();
}

canvas.addEventListener('pointermove', (event) => {
  if (!state.drag) return;
  const node = state.nodes.get(state.drag.id);
  if (!node) return;
  node.x = Math.max(8, event.clientX - state.drag.dx);
  node.y = Math.max(8, event.clientY - state.drag.dy - canvas.getBoundingClientRect().top);
  draw();
});

window.addEventListener('pointerup', () => {
  state.drag = null;
});

canvas.addEventListener('click', () => {
  state.selected = [];
  updateSelectionLabel();
  draw();
});

document.getElementById('addRoot').addEventListener('click', () => {
  createNode(nodeLabel.value.trim(), 90 + state.nodes.size * 20, 90 + state.nodes.size * 20);
});

document.getElementById('addChild').addEventListener('click', () => {
  const parentId = state.selected.at(-1);
  if (!parentId) return;
  const parent = state.nodes.get(parentId);
  const label = nodeLabel.value.trim() || `Child of ${parent.label}`;
  const x = parent.x + 200;
  const y = parent.y + 80;
  createNode(label, x, y);
  const childId = state.selected[0];
  createEdge(parentId, childId);
});

document.getElementById('connect').addEventListener('click', () => {
  if (state.selected.length < 2) return;
  const [from, to] = state.selected;
  createEdge(from, to);
});

document.getElementById('delete').addEventListener('click', () => {
  state.selected.forEach(removeNode);
  state.selected = [];
  updateSelectionLabel();
  draw();
});

document.getElementById('reset').addEventListener('click', () => {
  state.nodes.clear();
  state.edges = [];
  state.selected = [];
  updateSelectionLabel();
  draw();
});

createNode('Main Topic', 220, 160);
createNode('Branch A', 480, 80);
createNode('Branch B', 500, 250);
createEdge(Array.from(state.nodes.keys())[0], Array.from(state.nodes.keys())[1]);
createEdge(Array.from(state.nodes.keys())[0], Array.from(state.nodes.keys())[2]);
updateSelectionLabel();
draw();
