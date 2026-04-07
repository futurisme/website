const API_URL = '/api/shareideas';
const HOLD_DRAG_MS = 260;
const HOLD_MOVE_CANCEL_PX = 64;

const state = {
  db: { folders: [] },
  collapsedFolders: {},
  collapsedItems: {},
  version: null,
  online: false,
  drag: null,
  pendingHold: null,
  dragCaptureEl: null,
};

const boardEl = document.getElementById('board');
const statusEl = document.getElementById('sync-status');
const openAddBtn = document.getElementById('open-add');
const folderTemplate = document.getElementById('folder-template');
const itemTemplate = document.getElementById('item-template');
const modalLayer = document.getElementById('modal-layer');
const modalEl = document.getElementById('modal');

let saveTimer = null;

function randomId(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;
}

function reorderArray(values, fromIndex, toIndex) {
  if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || fromIndex >= values.length || toIndex >= values.length) {
    return values;
  }
  const next = [...values];
  const [picked] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, picked);
  return next;
}

function sanitizeDb(input) {
  const root = input && typeof input === 'object' ? input : {};
  const rawFolders = Array.isArray(root.folders) ? root.folders : [];

  const folders = rawFolders
    .map((folder, folderIndex) => {
      if (!folder || typeof folder !== 'object') return null;
      const name = typeof folder.name === 'string' ? folder.name.trim().slice(0, 80) : '';
      if (!name) return null;

      const folderId = typeof folder.id === 'string' && folder.id.trim() ? folder.id.trim().slice(0, 96) : `folder-${folderIndex + 1}`;
      const rawCards = Array.isArray(folder.cards) ? folder.cards : [];
      const cards = rawCards
        .map((card, cardIndex) => {
          if (!card || typeof card !== 'object') return null;
          const title = typeof card.title === 'string' ? card.title.trim().slice(0, 120) : '';
          if (!title) return null;
          return {
            id: typeof card.id === 'string' && card.id.trim() ? card.id.trim().slice(0, 96) : `card-${folderId}-${cardIndex + 1}`,
            title,
            description: typeof card.description === 'string' ? card.description.trim().slice(0, 6000) : '',
          };
        })
        .filter(Boolean);

      return { id: folderId, name, cards };
    })
    .filter(Boolean);

  return { folders };
}

function setOnlineStatus(online) {
  state.online = online;
  statusEl.textContent = online ? 'ONLINE' : 'OFFLINE';
}

function showModal(html) {
  modalEl.innerHTML = html;
  modalLayer.classList.remove('is-hidden');
  modalLayer.setAttribute('aria-hidden', 'false');
}

function closeModal() {
  modalEl.innerHTML = '';
  modalLayer.classList.add('is-hidden');
  modalLayer.setAttribute('aria-hidden', 'true');
}

function saveToServer() {
  if (saveTimer) clearTimeout(saveTimer);

  saveTimer = setTimeout(async () => {
    try {
      const response = await fetch(API_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: state.db, expectedVersion: state.version }),
      });

      if (response.status === 409) {
        const payload = await response.json().catch(() => ({}));
        state.db = sanitizeDb(payload.data);
        state.version = typeof payload.version === 'number' ? payload.version : state.version;
        render();
        setOnlineStatus(true);
        return;
      }

      if (!response.ok) throw new Error('Save gagal');

      const payload = await response.json().catch(() => ({}));
      state.version = typeof payload.version === 'number' ? payload.version : state.version;
      setOnlineStatus(true);
    } catch {
      setOnlineStatus(false);
    }
  }, 120);
}

function renderEmpty() {
  const empty = document.createElement('article');
  empty.className = 'empty';
  empty.innerHTML = 'Workspace masih kosong. Tekan tombol <strong>Add</strong> di bottom header.';
  boardEl.append(empty);
}

function dragShiftOffset(index, kind, folderId) {
  const active = state.drag;
  if (!active || active.kind !== kind) return 0;
  if (kind === 'card' && active.folderId !== folderId) return 0;
  if (active.fromIndex === active.overIndex || index === active.fromIndex) return 0;

  const draggedHeight = active.slots?.[active.fromIndex]?.height ?? 0;
  if (!draggedHeight) return 0;

  if (active.fromIndex < active.overIndex) {
    return index > active.fromIndex && index <= active.overIndex ? -draggedHeight : 0;
  }

  return index >= active.overIndex && index < active.fromIndex ? draggedHeight : 0;
}

function dragStyle(kind, index, folderId) {
  const active = state.drag;
  if (!active || active.kind !== kind) return '';
  if (kind === 'card' && active.folderId !== folderId) return '';
  if (index !== active.fromIndex) return '';

  const dx = active.currentX - active.startX;
  const dy = active.currentY - active.startY;
  return `--drag-x:${dx}px;--drag-y:${dy}px;`;
}

function onPointerMove(event) {
  const pending = state.pendingHold;
  if (!pending || event.pointerId !== pending.pointerId) return;

  const moved = Math.hypot(event.clientX - pending.startX, event.clientY - pending.startY);
  if (moved > HOLD_MOVE_CANCEL_PX) {
    clearTimeout(pending.timerId);
    state.pendingHold = null;
  }
}

function beginHoldDrag(payload) {
  const slots = [...document.querySelectorAll(`[data-drag-kind="${payload.kind}"]`)]
    .filter((node) => payload.kind !== 'card' || node.dataset.folderId === payload.folderId)
    .map((node) => {
      const rect = node.getBoundingClientRect();
      return {
        top: rect.top,
        middle: rect.top + (rect.height / 2),
        height: rect.height,
      };
    });

  state.drag = {
    ...payload,
    overIndex: payload.fromIndex,
    currentX: payload.startX,
    currentY: payload.startY,
    slots,
  };
  state.pendingHold = null;
  state.dragCaptureEl = payload.captureEl ?? null;

  if (state.dragCaptureEl && typeof state.dragCaptureEl.setPointerCapture === "function") {
    try { state.dragCaptureEl.setPointerCapture(payload.pointerId); } catch {}
  }

  document.body.classList.add("drag-active");
  renderBoard();
}

function pointerDownForDrag(payload, event) {
  if (state.drag || state.pendingHold) return;
  if (event.target.closest('button')) return;

  if (state.pendingHold?.timerId) {
    clearTimeout(state.pendingHold.timerId);
  }

  event.preventDefault();
  const timerId = setTimeout(() => beginHoldDrag(payload), HOLD_DRAG_MS);

  state.pendingHold = {
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    timerId,
  };
}


function resolveOverIndexBySlot(kind, folderId, pointerY) {
  const active = state.drag;
  const slots = active?.slots ?? [];
  if (!slots.length) return 0;

  let slot = slots.length - 1;
  for (let i = 0; i < slots.length; i += 1) {
    if (pointerY < slots[i].middle) {
      slot = i;
      break;
    }
  }
  return slot;
}

function onDragPointerMove(event) {
  const active = state.drag;
  if (!active || event.pointerId !== active.pointerId) return;

  event.preventDefault();
  active.currentX = event.clientX;
  active.currentY = event.clientY;

  const draggingEl = document.querySelector('.is-dragging');
  if (draggingEl) {
    draggingEl.style.setProperty('--drag-x', `${active.currentX - active.startX}px`);
    draggingEl.style.setProperty('--drag-y', `${active.currentY - active.startY}px`);
  }

  const nextIndex = resolveOverIndexBySlot(active.kind, active.folderId, event.clientY);

  if (nextIndex !== active.overIndex) {
    active.overIndex = nextIndex;
    renderBoard();
  }
}

function finishDrag(event, commit = true) {
  const pending = state.pendingHold;
  if (pending && event.pointerId === pending.pointerId) {
    clearTimeout(pending.timerId);
    state.pendingHold = null;
  }

  const active = state.drag;
  if (!active || event.pointerId !== active.pointerId) return;

  if (commit) {
    if (active.kind === 'folder') {
      if (active.fromIndex !== active.overIndex) {
        state.db.folders = reorderArray(state.db.folders, active.fromIndex, active.overIndex);
        saveToServer();
      }
    } else if (active.kind === 'card') {
      const folder = state.db.folders.find((entry) => entry.id === active.folderId);
      if (folder && active.fromIndex !== active.overIndex) {
        folder.cards = reorderArray(folder.cards, active.fromIndex, active.overIndex);
        saveToServer();
      }
    }
  }

  if (state.dragCaptureEl && typeof state.dragCaptureEl.releasePointerCapture === "function") {
    try { state.dragCaptureEl.releasePointerCapture(event.pointerId); } catch {}
  }

  state.dragCaptureEl = null;
  state.drag = null;
  document.body.classList.remove("drag-active");
  renderBoard();
}

function renderBoard() {
  boardEl.textContent = '';
  const folders = state.db.folders;
  if (!folders.length) {
    renderEmpty();
    return;
  }

  folders.forEach((folder, folderIndex) => {
    const fragment = folderTemplate.content.cloneNode(true);
    const root = fragment.querySelector('.folder');
    const title = fragment.querySelector('.folder-title');
    const count = fragment.querySelector('.folder-count');
    const editBtn = fragment.querySelector('.folder-edit');
    const toggleBtn = fragment.querySelector('.folder-toggle');
    const content = fragment.querySelector('.folder-content');

    const folderCollapsed = Boolean(state.collapsedFolders[folder.id]);
    const folderShiftOffset = dragShiftOffset(folderIndex, 'folder');
    const folderDragStyle = dragStyle('folder', folderIndex);

    root.className = `folder${state.drag?.kind === 'folder' && state.drag.fromIndex === folderIndex ? ' is-dragging' : ''}`;
    if (folderShiftOffset) root.style.setProperty('--slot-shift-y', `${folderShiftOffset}px`);
    if (folderDragStyle) root.style.cssText = `${root.style.cssText};${folderDragStyle}`;
    root.dataset.dragKind = 'folder';
    root.dataset.dragIndex = String(folderIndex);
    root.dataset.slotActive = String(Boolean(state.drag?.kind === 'folder' && state.drag.overIndex === folderIndex));

    title.textContent = folder.name;
    count.textContent = `${folder.cards.length} ITEMCARDS`;
    root.dataset.collapsed = String(folderCollapsed);
    toggleBtn.textContent = folderCollapsed ? '▼ Expand' : '▲ Collapse';

    root.addEventListener('pointerdown', (event) => {
      pointerDownForDrag({ kind: 'folder', pointerId: event.pointerId, fromIndex: folderIndex, startX: event.clientX, startY: event.clientY, captureEl: event.currentTarget }, event);
    });

    toggleBtn.addEventListener('click', () => {
      state.collapsedFolders[folder.id] = !state.collapsedFolders[folder.id];
      renderBoard();
    });

    editBtn.addEventListener('click', () => {
      openEditFolder(folder.id);
    });

    folder.cards.forEach((card, cardIndex) => {
      const cardFrag = itemTemplate.content.cloneNode(true);
      const cardRoot = cardFrag.querySelector('.idea-item');
      const cardTitle = cardFrag.querySelector('.idea-title');
      const cardDesc = cardFrag.querySelector('.idea-description');
      const cardEdit = cardFrag.querySelector('.item-edit');
      const cardToggle = cardFrag.querySelector('.detail-toggle');

      const itemCollapsed = Boolean(state.collapsedItems[card.id]);
      const cardShiftOffset = dragShiftOffset(cardIndex, 'card', folder.id);
      const cardDragStyle = dragStyle('card', cardIndex, folder.id);

      cardRoot.className = `idea-item${state.drag?.kind === 'card' && state.drag.folderId === folder.id && state.drag.fromIndex === cardIndex ? ' is-dragging' : ''}`;
      if (cardShiftOffset) cardRoot.style.setProperty('--slot-shift-y', `${cardShiftOffset}px`);
      if (cardDragStyle) cardRoot.style.cssText = `${cardRoot.style.cssText};${cardDragStyle}`;
      cardRoot.dataset.dragKind = 'card';
      cardRoot.dataset.folderId = folder.id;
      cardRoot.dataset.dragIndex = String(cardIndex);
      cardRoot.dataset.collapsed = String(itemCollapsed);
      cardRoot.dataset.slotActive = String(Boolean(state.drag?.kind === 'card' && state.drag.folderId === folder.id && state.drag.overIndex === cardIndex));

      cardRoot.addEventListener('pointerdown', (event) => {
        pointerDownForDrag({ kind: 'card', folderId: folder.id, pointerId: event.pointerId, fromIndex: cardIndex, startX: event.clientX, startY: event.clientY, captureEl: event.currentTarget }, event);
      });

      cardTitle.textContent = card.title;
      cardDesc.textContent = card.description || 'Belum ada deskripsi.';
      cardToggle.textContent = itemCollapsed ? '▼ Expand' : '▲ Collapse';

      cardToggle.addEventListener('click', () => {
        state.collapsedItems[card.id] = !state.collapsedItems[card.id];
        renderBoard();
      });

      cardEdit.addEventListener('click', () => {
        openEditCard(folder.id, card.id);
      });

      content.append(cardFrag);
    });

    boardEl.append(fragment);
  });
}

function render() {
  renderBoard();
}

function openAddChooser() {
  showModal(`
    <h3>Add</h3>
    <div class="actions">
      <button type="button" id="choose-add-folder">Add Folder</button>
      <button type="button" id="choose-add-card">Add Card</button>
      <button type="button" id="close-modal">Tutup</button>
    </div>
  `);

  document.getElementById('choose-add-folder').addEventListener('click', openAddFolderModal);
  document.getElementById('choose-add-card').addEventListener('click', openAddCardModal);
  document.getElementById('close-modal').addEventListener('click', closeModal);
}

function openAddFolderModal() {
  showModal(`
    <h3>Add Folder</h3>
    <label>Nama folder<input id="new-folder-name" type="text" placeholder="Contoh: Pemerintahan" /></label>
    <div class="actions">
      <button type="button" id="save-new-folder">Simpan</button>
      <button type="button" id="back-to-chooser">Kembali</button>
      <button type="button" id="close-modal">Tutup</button>
    </div>
  `);

  document.getElementById('save-new-folder').addEventListener('click', () => {
    const name = document.getElementById('new-folder-name').value.trim().slice(0, 80);
    if (!name) return;

    state.db.folders.push({ id: randomId('folder'), name, cards: [] });
    closeModal();
    render();
    saveToServer();
  });
  document.getElementById('back-to-chooser').addEventListener('click', openAddChooser);
  document.getElementById('close-modal').addEventListener('click', closeModal);
}

function openAddCardModal() {
  const options = state.db.folders
    .map((folder) => `<option value="${folder.id}">${folder.name}</option>`)
    .join('');

  showModal(`
    <h3>Add Card</h3>
    ${state.db.folders.length ? `<label>Folder tujuan<select id="new-card-folder">${options}</select></label>` : '<p>Buat folder dulu sebelum menambah card.</p>'}
    <label>Judul card<input id="new-card-title" type="text" placeholder="Contoh: Sistem Diplomasi" /></label>
    <div class="actions">
      <button type="button" id="save-new-card" ${state.db.folders.length ? '' : 'disabled'}>Simpan</button>
      <button type="button" id="back-to-chooser">Kembali</button>
      <button type="button" id="close-modal">Tutup</button>
    </div>
  `);

  const saveBtn = document.getElementById('save-new-card');
  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      const folderId = document.getElementById('new-card-folder')?.value || state.db.folders[0]?.id;
      const title = document.getElementById('new-card-title').value.trim().slice(0, 120);
      if (!folderId || !title) return;

      const folder = state.db.folders.find((entry) => entry.id === folderId);
      if (!folder) return;

      folder.cards.push({ id: randomId('card'), title, description: '' });
      closeModal();
      render();
      saveToServer();
    });
  }

  document.getElementById('back-to-chooser').addEventListener('click', openAddChooser);
  document.getElementById('close-modal').addEventListener('click', closeModal);
}

function openEditFolder(folderId) {
  const folder = state.db.folders.find((entry) => entry.id === folderId);
  if (!folder) return;

  showModal(`
    <h3>Edit Folder</h3>
    <label>Nama folder<input id="edit-folder-name" type="text" value="${folder.name.replaceAll('"', '&quot;')}" /></label>
    <div class="actions">
      <button type="button" id="save-folder-edit">Simpan</button>
      <button type="button" id="close-modal">Batal</button>
    </div>
  `);

  document.getElementById('save-folder-edit').addEventListener('click', () => {
    const nextName = document.getElementById('edit-folder-name').value.trim().slice(0, 80);
    if (!nextName) return;
    folder.name = nextName;
    closeModal();
    render();
    saveToServer();
  });

  document.getElementById('close-modal').addEventListener('click', closeModal);
}

function openEditCard(folderId, cardId) {
  const folder = state.db.folders.find((entry) => entry.id === folderId);
  const card = folder?.cards.find((entry) => entry.id === cardId);
  if (!folder || !card) return;

  showModal(`
    <h3>Edit Card</h3>
    <label>Judul card<input id="edit-card-title" type="text" value="${card.title.replaceAll('"', '&quot;')}" /></label>
    <label>Deskripsi card<textarea id="edit-card-description" rows="8">${card.description}</textarea></label>
    <div class="actions">
      <button type="button" id="save-card-edit">Simpan</button>
      <button type="button" id="close-modal">Batal</button>
    </div>
  `);

  document.getElementById('save-card-edit').addEventListener('click', () => {
    const nextTitle = document.getElementById('edit-card-title').value.trim().slice(0, 120);
    if (!nextTitle) return;

    card.title = nextTitle;
    card.description = document.getElementById('edit-card-description').value.trim().slice(0, 6000);

    closeModal();
    render();
    saveToServer();
  });

  document.getElementById('close-modal').addEventListener('click', closeModal);
}

async function loadFromServer() {
  try {
    const response = await fetch(API_URL, { cache: 'no-store' });
    if (!response.ok) throw new Error('load gagal');

    const payload = await response.json().catch(() => ({}));
    state.db = sanitizeDb(payload.data);
    state.version = typeof payload.version === 'number' ? payload.version : null;
    setOnlineStatus(true);
  } catch {
    state.db = { folders: [] };
    state.version = null;
    setOnlineStatus(false);
  }

  render();
}

openAddBtn.addEventListener('click', openAddChooser);
modalLayer.addEventListener('click', (event) => {
  if (event.target === modalLayer) closeModal();
});

document.addEventListener('pointermove', onPointerMove, { passive: false });
document.addEventListener('pointermove', onDragPointerMove, { passive: false });
document.addEventListener('pointerup', (event) => finishDrag(event, true), { passive: true });
document.addEventListener('pointercancel', (event) => finishDrag(event, false), { passive: true });

void loadFromServer();
