const API_URL = '/api/shareideas';
const HOLD_DRAG_MS = 220;
const HOLD_MOVE_CANCEL_PX = 8;

const state = {
  db: { folders: [] },
  collapsedFolders: {},
  collapsedItems: {},
  version: null,
  online: false,
  drag: null,
  pendingHold: null,
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

function dragShiftClass(index, kind, folderId) {
  const active = state.drag;
  if (!active || active.kind !== kind) return '';
  if (kind === 'card' && active.folderId !== folderId) return '';
  if (active.fromIndex === active.overIndex || index === active.fromIndex) return '';

  const low = Math.min(active.fromIndex, active.overIndex);
  const high = Math.max(active.fromIndex, active.overIndex);
  if (index < low || index > high) return '';

  return active.fromIndex < active.overIndex ? 'drag-shift-up' : 'drag-shift-down';
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
  state.drag = {
    ...payload,
    overIndex: payload.fromIndex,
    currentX: payload.startX,
    currentY: payload.startY,
  };
  state.pendingHold = null;
  renderBoard();
}

function pointerDownForDrag(payload, event) {
  if (event.target.closest('button')) return;

  if (state.pendingHold?.timerId) {
    clearTimeout(state.pendingHold.timerId);
  }

  const timerId = setTimeout(() => beginHoldDrag(payload), HOLD_DRAG_MS);

  state.pendingHold = {
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    timerId,
  };
}

function onDragPointerMove(event) {
  const active = state.drag;
  if (!active || event.pointerId !== active.pointerId) return;

  active.currentX = event.clientX;
  active.currentY = event.clientY;

  const point = document.elementFromPoint(event.clientX, event.clientY);
  if (!point) {
    renderBoard();
    return;
  }

  if (active.kind === 'folder') {
    const hovered = point.closest('[data-drag-kind="folder"]');
    if (hovered) {
      const nextIndex = Number.parseInt(hovered.dataset.dragIndex ?? '-1', 10);
      if (Number.isFinite(nextIndex) && nextIndex >= 0 && nextIndex !== active.overIndex) {
        active.overIndex = nextIndex;
      }
    }
  } else {
    const hovered = point.closest('[data-drag-kind="card"]');
    if (hovered && hovered.dataset.folderId === active.folderId) {
      const nextIndex = Number.parseInt(hovered.dataset.dragIndex ?? '-1', 10);
      if (Number.isFinite(nextIndex) && nextIndex >= 0 && nextIndex !== active.overIndex) {
        active.overIndex = nextIndex;
      }
    }
  }

  renderBoard();
}

function finishDrag(event) {
  const pending = state.pendingHold;
  if (pending && event.pointerId === pending.pointerId) {
    clearTimeout(pending.timerId);
    state.pendingHold = null;
  }

  const active = state.drag;
  if (!active || event.pointerId !== active.pointerId) return;

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

  state.drag = null;
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
    const folderShift = dragShiftClass(folderIndex, 'folder');
    const folderDragStyle = dragStyle('folder', folderIndex);

    root.className = `folder${folderShift ? ` ${folderShift}` : ''}${state.drag?.kind === 'folder' && state.drag.fromIndex === folderIndex ? ' is-dragging' : ''}`;
    if (folderDragStyle) root.style.cssText = folderDragStyle;
    root.dataset.dragKind = 'folder';
    root.dataset.dragIndex = String(folderIndex);

    title.textContent = folder.name;
    count.textContent = `${folder.cards.length} ITEMCARDS`;
    root.dataset.collapsed = String(folderCollapsed);
    toggleBtn.textContent = folderCollapsed ? '▼ Expand' : '▲ Collapse';

    root.addEventListener('pointerdown', (event) => {
      pointerDownForDrag({ kind: 'folder', pointerId: event.pointerId, fromIndex: folderIndex, startX: event.clientX, startY: event.clientY }, event);
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
      const cardShift = dragShiftClass(cardIndex, 'card', folder.id);
      const cardDragStyle = dragStyle('card', cardIndex, folder.id);

      cardRoot.className = `idea-item${cardShift ? ` ${cardShift}` : ''}${state.drag?.kind === 'card' && state.drag.folderId === folder.id && state.drag.fromIndex === cardIndex ? ' is-dragging' : ''}`;
      if (cardDragStyle) cardRoot.style.cssText = cardDragStyle;
      cardRoot.dataset.dragKind = 'card';
      cardRoot.dataset.folderId = folder.id;
      cardRoot.dataset.dragIndex = String(cardIndex);
      cardRoot.dataset.collapsed = String(itemCollapsed);

      cardRoot.addEventListener('pointerdown', (event) => {
        pointerDownForDrag({ kind: 'card', folderId: folder.id, pointerId: event.pointerId, fromIndex: cardIndex, startX: event.clientX, startY: event.clientY }, event);
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

document.addEventListener('pointermove', onPointerMove, { passive: true });
document.addEventListener('pointermove', onDragPointerMove, { passive: true });
document.addEventListener('pointerup', finishDrag, { passive: true });
document.addEventListener('pointercancel', finishDrag, { passive: true });

void loadFromServer();
