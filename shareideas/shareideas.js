const API_URL = '/api/shareideas';
const HOLD_DRAG_MS = 260;
const HOLD_MOVE_CANCEL_PX = 64;

const state = {
  db: { appTitle: 'ShareIdeas', categories: [] },
  collapsedFolders: {},
  collapsedItems: {},
  version: null,
  online: false,
  drag: null,
  pendingHold: null,
  dragCaptureEl: null,
  dragGhostEl: null,
  activeCategoryId: null,
  pendingSwipe: null,
  titleTapHistory: [],
};

const boardEl = document.getElementById('board');
const statusDotEl = document.getElementById('sync-status-dot');
const appTitleEl = document.getElementById('app-title');
const openAddBtn = document.getElementById('open-add');
const openHelpBtn = document.getElementById('open-help');
const fabWrapEl = document.getElementById('fab-wrap');
const fabToggleEl = document.getElementById('fab-toggle');
const fabPanelLeftEl = document.getElementById('fab-panel-left');
const fabPanelRightEl = document.getElementById('fab-panel-right');
const folderTemplate = document.getElementById('folder-template');
const itemTemplate = document.getElementById('item-template');
const modalLayer = document.getElementById('modal-layer');
const modalEl = document.getElementById('modal');

let saveTimer = null;

function setFabOpen(nextOpen) {
  const open = Boolean(nextOpen);
  fabWrapEl.dataset.open = String(open);
  fabToggleEl.setAttribute('aria-expanded', String(open));
  fabPanelLeftEl.setAttribute('aria-hidden', String(!open));
  fabPanelRightEl.setAttribute('aria-hidden', String(!open));
}

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
  const appTitle = typeof root.appTitle === 'string' && root.appTitle.trim()
    ? root.appTitle.trim().slice(0, 40)
    : 'ShareIdeas';
  const rawCategories = Array.isArray(root.categories) ? root.categories : null;
  const fallbackFolders = Array.isArray(root.folders) ? root.folders : [];

  const sanitizeFolders = (rawFolders) => rawFolders
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

  const categories = (rawCategories && rawCategories.length ? rawCategories : [{ id: 'category-1', name: 'Kategori 1', folders: fallbackFolders }])
    .map((category, categoryIndex) => {
      if (!category || typeof category !== 'object') return null;
      const id = typeof category.id === 'string' && category.id.trim() ? category.id.trim().slice(0, 96) : `category-${categoryIndex + 1}`;
      const name = typeof category.name === 'string' && category.name.trim() ? category.name.trim().slice(0, 80) : `Kategori ${categoryIndex + 1}`;
      const folders = sanitizeFolders(Array.isArray(category.folders) ? category.folders : []);
      return { id, name, folders };
    })
    .filter(Boolean);

  return { appTitle, categories: categories.length ? categories : [{ id: 'category-1', name: 'Kategori 1', folders: [] }] };
}

function getActiveCategory() {
  const categories = state.db.categories;
  if (!categories.length) return null;
  const found = categories.find((entry) => entry.id === state.activeCategoryId);
  return found || categories[0];
}

function getActiveFolders() {
  return getActiveCategory()?.folders ?? [];
}

function setOnlineStatus(online) {
  state.online = online;
  statusDotEl.dataset.online = String(Boolean(online));
  statusDotEl.setAttribute('aria-label', online ? 'Online' : 'Offline');
  statusDotEl.title = online ? 'Online' : 'Offline';
}

function renderTopbar() {
  const title = state.db.appTitle || 'ShareIdeas';
  appTitleEl.textContent = title;
  document.title = title;
}

function openChangeTitleModal() {
  const currentTitle = state.db.appTitle || 'ShareIdeas';
  showModal(`
    <h3>Ganti judul</h3>
    <label>Judul aplikasi<input id="edit-app-title" type="text" value="${currentTitle.replaceAll('"', '&quot;')}" maxlength="40" /></label>
    <div class="actions">
      <button type="button" id="save-app-title">Simpan</button>
      <button type="button" id="close-modal">Batal</button>
    </div>
  `);

  document.getElementById('save-app-title').addEventListener('click', () => {
    const nextTitle = document.getElementById('edit-app-title').value.trim().slice(0, 40);
    if (!nextTitle || nextTitle === currentTitle) {
      closeModal();
      return;
    }
    state.db.appTitle = nextTitle;
    closeModal();
    renderTopbar();
    saveToServer();
  });

  document.getElementById('close-modal').addEventListener('click', closeModal);
}

function onTitlePointerUp(event) {
  if (event.button !== 0) return;
  if (modalLayer.getAttribute('aria-hidden') === 'false') return;
  const now = Date.now();
  state.titleTapHistory = [...state.titleTapHistory.filter((time) => now - time < 700), now];
  if (state.titleTapHistory.length >= 3) {
    state.titleTapHistory = [];
    event.preventDefault();
    openChangeTitleModal();
  }
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
        state.activeCategoryId = getActiveCategory()?.id ?? state.activeCategoryId;
        initCollapsedState();
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
  empty.innerHTML = 'Workspace masih kosong. Buka menu <strong>Actions</strong> lalu tekan tombol <strong>+</strong>.';
  boardEl.append(empty);
}

function openControlGuideModal() {
  showModal(`
    <h3>List Control for PC and Mobile</h3>
    <p>Ringkasan gestur dan aksi utama:</p>
    <ul>
      <li><strong>Triple tap judul</strong> untuk ganti judul workspace.</li>
      <li><strong>Tap Actions</strong> untuk membuka tombol aksi.</li>
      <li><strong>Tombol +</strong> untuk Add Folder / Add Card.</li>
      <li><strong>Swipe kanan/kiri</strong> di area board untuk pindah kategori.</li>
      <li><strong>Hold + drag</strong> folder/card untuk urutkan ulang.</li>
      <li><strong>Tap Expand/Collapse</strong> untuk buka/tutup detail.</li>
    </ul>
    <div class="actions">
      <button type="button" id="close-modal">Tutup</button>
    </div>
  `);
  document.getElementById('close-modal').addEventListener('click', closeModal);
}

function collapseAllFolders() {
  const nextFolders = {};
  getActiveFolders().forEach((folder) => {
    nextFolders[folder.id] = true;
  });
  state.collapsedFolders = nextFolders;
}

function collapseAllCards() {
  const nextCards = {};
  getActiveFolders().forEach((folder) => {
    folder.cards.forEach((card) => {
      nextCards[card.id] = true;
    });
  });
  state.collapsedItems = nextCards;
}

function initCollapsedState() {
  collapseAllFolders();
  collapseAllCards();
}

function expandOnlyFolder(folderId) {
  collapseAllFolders();
  if (folderId) state.collapsedFolders[folderId] = false;

  const expandedCardId = Object.keys(state.collapsedItems).find((cardId) => state.collapsedItems[cardId] === false);
  if (!expandedCardId) return;
  const cardStillVisible = getActiveFolders().some((folder) => folder.id === folderId && folder.cards.some((card) => card.id === expandedCardId));
  if (!cardStillVisible) collapseAllCards();
}

function expandOnlyCard(folderId, cardId) {
  collapseAllCards();
  if (cardId) state.collapsedItems[cardId] = false;
  collapseAllFolders();
  if (folderId) state.collapsedFolders[folderId] = false;
}

function dragShiftOffset(index, kind, folderId) {
  const active = state.drag;
  if (!active || active.kind !== kind) return 0;
  if (kind === 'card') {
    const sourceFolderId = active.sourceFolderId ?? active.folderId;
    const overFolderId = active.overFolderId ?? active.folderId;
    if (folderId !== sourceFolderId && folderId !== overFolderId) return 0;
  }
  if (index === active.fromIndex) return 0;

  const draggedHeight = active.slots?.[active.fromIndex]?.height ?? 0;
  if (!draggedHeight) return 0;

  if (kind === 'card') {
    const sourceFolderId = active.sourceFolderId ?? active.folderId;
    const overFolderId = active.overFolderId ?? active.folderId;

    if (sourceFolderId !== overFolderId) {
      if (folderId === sourceFolderId) {
        return index > active.fromIndex ? -draggedHeight : 0;
      }
      if (folderId === overFolderId) {
        return index >= active.overIndex ? draggedHeight : 0;
      }
      return 0;
    }
  }

  if (active.fromIndex === active.overIndex) return 0;

  if (active.fromIndex < active.overIndex) {
    return index > active.fromIndex && index <= active.overIndex ? -draggedHeight : 0;
  }

  return index >= active.overIndex && index < active.fromIndex ? draggedHeight : 0;
}

function removeDragGhost() {
  if (state.dragGhostEl?.parentNode) state.dragGhostEl.parentNode.removeChild(state.dragGhostEl);
  state.dragGhostEl = null;
}

function updateDragGhostPosition(active) {
  const ghost = state.dragGhostEl;
  if (!ghost || !active) return;
  ghost.style.left = `${active.currentX - active.grabOffsetX}px`;
  ghost.style.top = `${active.currentY - active.grabOffsetY}px`;
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
    grabOffsetX: 0,
    grabOffsetY: 0,
    sourceFolderId: payload.folderId ?? null,
    overFolderId: payload.folderId ?? null,
  };
  state.pendingHold = null;
  state.dragCaptureEl = payload.captureEl ?? null;

  removeDragGhost();
  if (payload.captureEl) {
    const rect = payload.captureEl.getBoundingClientRect();
    const ghost = payload.captureEl.cloneNode(true);
    ghost.classList.remove('is-drag-source');
    ghost.classList.add('drag-ghost');
    ghost.style.width = `${rect.width}px`;
    state.drag.grabOffsetX = payload.startX - rect.left;
    state.drag.grabOffsetY = payload.startY - rect.top;
    state.dragGhostEl = ghost;
    document.body.append(ghost);
    updateDragGhostPosition(state.drag);
  }

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

function resolveCardFolderTarget(pointerX, pointerY, fallbackFolderId) {
  const hovered = document.elementFromPoint(pointerX, pointerY);
  const folderEl = hovered?.closest?.('.folder');
  return folderEl?.dataset?.folderId || fallbackFolderId;
}

function collectCardSlots(folderId) {
  return [...document.querySelectorAll('[data-drag-kind="card"]')]
    .filter((node) => node.dataset.folderId === folderId)
    .map((node) => {
      const rect = node.getBoundingClientRect();
      return {
        top: rect.top,
        middle: rect.top + (rect.height / 2),
        height: rect.height,
      };
    });
}

function onDragPointerMove(event) {
  const active = state.drag;
  if (!active || event.pointerId !== active.pointerId) return;

  event.preventDefault();
  active.currentX = event.clientX;
  active.currentY = event.clientY;
  updateDragGhostPosition(active);

  if (active.kind === 'card') {
    const fallbackFolderId = active.overFolderId ?? active.sourceFolderId ?? active.folderId;
    const nextFolderId = resolveCardFolderTarget(event.clientX, event.clientY, fallbackFolderId);
    if (nextFolderId && nextFolderId !== active.overFolderId) {
      active.overFolderId = nextFolderId;
      active.slots = collectCardSlots(nextFolderId);
    }
  }

  const slotFolderId = active.kind === 'card' ? active.overFolderId : active.folderId;
  const nextIndex = resolveOverIndexBySlot(active.kind, slotFolderId, event.clientY);

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
    const activeFolders = getActiveFolders();
    if (active.kind === 'folder') {
      if (active.fromIndex !== active.overIndex) {
        const category = getActiveCategory();
        if (category) category.folders = reorderArray(activeFolders, active.fromIndex, active.overIndex);
        saveToServer();
      }
    } else if (active.kind === 'card') {
      const sourceFolderId = active.sourceFolderId ?? active.folderId;
      const targetFolderId = active.overFolderId ?? active.folderId;
      const sourceFolder = activeFolders.find((entry) => entry.id === sourceFolderId);
      const targetFolder = activeFolders.find((entry) => entry.id === targetFolderId);
      if (sourceFolder && targetFolder) {
        if (sourceFolderId === targetFolderId) {
          if (active.fromIndex !== active.overIndex) {
            sourceFolder.cards = reorderArray(sourceFolder.cards, active.fromIndex, active.overIndex);
            saveToServer();
          }
        } else if (active.fromIndex >= 0 && active.fromIndex < sourceFolder.cards.length) {
          const [movedCard] = sourceFolder.cards.splice(active.fromIndex, 1);
          if (movedCard) {
            const insertIndex = Math.max(0, Math.min(active.overIndex, targetFolder.cards.length));
            targetFolder.cards.splice(insertIndex, 0, movedCard);
            expandOnlyFolder(targetFolderId);
            state.collapsedFolders[sourceFolderId] = true;
            saveToServer();
          }
        }
      }
    }
  }

  if (state.dragCaptureEl && typeof state.dragCaptureEl.releasePointerCapture === "function") {
    try { state.dragCaptureEl.releasePointerCapture(event.pointerId); } catch {}
  }

  state.dragCaptureEl = null;
  state.drag = null;
  removeDragGhost();
  document.body.classList.remove("drag-active");
  renderBoard();
}

function renderBoard() {
  boardEl.textContent = '';
  const activeCategory = getActiveCategory();
  if (activeCategory) {
    const meta = document.createElement('article');
    meta.className = 'empty';
    meta.textContent = `Kategori aktif: ${activeCategory.name}`;
    boardEl.append(meta);
  }
  const folders = getActiveFolders();
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

    const folderCollapsed = state.collapsedFolders[folder.id] !== false;
    const folderShiftOffset = dragShiftOffset(folderIndex, 'folder');
    root.className = `folder${state.drag?.kind === 'folder' && state.drag.fromIndex === folderIndex ? ' is-drag-source' : ''}`;
    if (folderShiftOffset) root.style.setProperty('--folder-shift-y', `${folderShiftOffset}px`);
    root.dataset.dragKind = 'folder';
    root.dataset.folderId = folder.id;
    root.dataset.dragIndex = String(folderIndex);
    root.dataset.slotActive = String(Boolean(state.drag?.kind === 'folder' && state.drag.overIndex === folderIndex));
    root.dataset.dropTarget = String(Boolean(state.drag?.kind === 'card' && state.drag.overFolderId === folder.id));

    title.textContent = folder.name;
    count.textContent = `${folder.cards.length} ITEMCARDS`;
    root.dataset.collapsed = String(folderCollapsed);
    toggleBtn.textContent = folderCollapsed ? '▼ Expand' : '▲ Collapse';

    root.addEventListener('pointerdown', (event) => {
      pointerDownForDrag({ kind: 'folder', pointerId: event.pointerId, fromIndex: folderIndex, startX: event.clientX, startY: event.clientY, captureEl: event.currentTarget }, event);
    });

    toggleBtn.addEventListener('click', () => {
      if (folderCollapsed) {
        expandOnlyFolder(folder.id);
      } else {
        state.collapsedFolders[folder.id] = true;
        folder.cards.forEach((card) => {
          if (state.collapsedItems[card.id] === false) state.collapsedItems[card.id] = true;
        });
      }
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

      const itemCollapsed = state.collapsedItems[card.id] !== false;
      const cardShiftOffset = dragShiftOffset(cardIndex, 'card', folder.id);
      cardRoot.className = `idea-item${state.drag?.kind === 'card' && state.drag.sourceFolderId === folder.id && state.drag.fromIndex === cardIndex ? ' is-drag-source' : ''}`;
      if (cardShiftOffset) cardRoot.style.setProperty('--card-shift-y', `${cardShiftOffset}px`);
      cardRoot.dataset.dragKind = 'card';
      cardRoot.dataset.folderId = folder.id;
      cardRoot.dataset.dragIndex = String(cardIndex);
      cardRoot.dataset.collapsed = String(itemCollapsed);
      cardRoot.dataset.slotActive = String(Boolean(state.drag?.kind === 'card' && state.drag.overFolderId === folder.id && state.drag.overIndex === cardIndex));

      cardRoot.addEventListener('pointerdown', (event) => {
        pointerDownForDrag({ kind: 'card', folderId: folder.id, pointerId: event.pointerId, fromIndex: cardIndex, startX: event.clientX, startY: event.clientY, captureEl: event.currentTarget }, event);
      });

      cardTitle.textContent = card.title;
      cardDesc.textContent = card.description || 'Belum ada deskripsi.';
      cardToggle.textContent = itemCollapsed ? '▼ Expand' : '▲ Collapse';

      cardToggle.addEventListener('click', () => {
        if (itemCollapsed) {
          expandOnlyCard(folder.id, card.id);
        } else {
          state.collapsedItems[card.id] = true;
        }
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
  renderTopbar();
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

    const folderId = randomId('folder');
    const activeCategory = getActiveCategory();
    if (!activeCategory) return;
    activeCategory.folders.push({ id: folderId, name, cards: [] });
    state.collapsedFolders[folderId] = true;
    closeModal();
    render();
    saveToServer();
  });
  document.getElementById('back-to-chooser').addEventListener('click', openAddChooser);
  document.getElementById('close-modal').addEventListener('click', closeModal);
}

function openAddCardModal() {
  const folders = getActiveFolders();
  const options = folders
    .map((folder) => `<option value="${folder.id}">${folder.name}</option>`)
    .join('');

  showModal(`
    <h3>Add Card</h3>
    ${folders.length ? `<label>Folder tujuan<select id="new-card-folder">${options}</select></label>` : '<p>Buat folder dulu sebelum menambah card.</p>'}
    <label>Judul card<input id="new-card-title" type="text" placeholder="Contoh: Sistem Diplomasi" /></label>
    <div class="actions">
      <button type="button" id="save-new-card" ${folders.length ? '' : 'disabled'}>Simpan</button>
      <button type="button" id="back-to-chooser">Kembali</button>
      <button type="button" id="close-modal">Tutup</button>
    </div>
  `);

  const saveBtn = document.getElementById('save-new-card');
  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      const activeFolders = getActiveFolders();
      const folderId = document.getElementById('new-card-folder')?.value || activeFolders[0]?.id;
      const title = document.getElementById('new-card-title').value.trim().slice(0, 120);
      if (!folderId || !title) return;

      const folder = activeFolders.find((entry) => entry.id === folderId);
      if (!folder) return;

      const cardId = randomId('card');
      folder.cards.push({ id: cardId, title, description: '' });
      state.collapsedItems[cardId] = true;
      closeModal();
      render();
      saveToServer();
    });
  }

  document.getElementById('back-to-chooser').addEventListener('click', openAddChooser);
  document.getElementById('close-modal').addEventListener('click', closeModal);
}

function openEditFolder(folderId) {
  const folder = getActiveFolders().find((entry) => entry.id === folderId);
  if (!folder) return;

  showModal(`
    <h3>Edit Folder</h3>
    <label>Nama folder<input id="edit-folder-name" type="text" value="${folder.name.replaceAll('"', '&quot;')}" /></label>
    <div class="actions">
      <button type="button" id="save-folder-edit">Simpan</button>
      <button type="button" id="delete-folder">Delete</button>
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

  document.getElementById('delete-folder').addEventListener('click', () => {
    const activeFolders = getActiveFolders();
    const folderIndex = activeFolders.findIndex((entry) => entry.id === folderId);
    if (folderIndex < 0) return;
    const [removed] = activeFolders.splice(folderIndex, 1);
    if (removed) {
      delete state.collapsedFolders[removed.id];
      removed.cards.forEach((card) => {
        delete state.collapsedItems[card.id];
      });
    }
    closeModal();
    render();
    saveToServer();
  });

  document.getElementById('close-modal').addEventListener('click', closeModal);
}

function openEditCard(folderId, cardId) {
  const folder = getActiveFolders().find((entry) => entry.id === folderId);
  const card = folder?.cards.find((entry) => entry.id === cardId);
  if (!folder || !card) return;

  showModal(`
    <h3>Edit Card</h3>
    <label>Judul card<input id="edit-card-title" type="text" value="${card.title.replaceAll('"', '&quot;')}" /></label>
    <label>Deskripsi card<textarea id="edit-card-description" rows="8">${card.description}</textarea></label>
    <div class="actions">
      <button type="button" id="save-card-edit">Simpan</button>
      <button type="button" id="delete-card">Delete</button>
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

  document.getElementById('delete-card').addEventListener('click', () => {
    const cardIndex = folder.cards.findIndex((entry) => entry.id === cardId);
    if (cardIndex < 0) return;
    const [removed] = folder.cards.splice(cardIndex, 1);
    if (removed) delete state.collapsedItems[removed.id];
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
    state.activeCategoryId = getActiveCategory()?.id ?? null;
    state.version = typeof payload.version === 'number' ? payload.version : null;
    initCollapsedState();
    setOnlineStatus(true);
  } catch {
    state.db = { appTitle: 'ShareIdeas', categories: [{ id: 'category-1', name: 'Kategori 1', folders: [] }] };
    state.activeCategoryId = 'category-1';
    state.version = null;
    state.collapsedFolders = {};
    state.collapsedItems = {};
    setOnlineStatus(false);
  }

  render();
}

function createCategory() {
  const index = state.db.categories.length + 1;
  const category = { id: randomId('category'), name: `Kategori ${index}`, folders: [] };
  state.db.categories.push(category);
  state.activeCategoryId = category.id;
  initCollapsedState();
  render();
  saveToServer();
}

function switchCategory(direction) {
  const categories = state.db.categories;
  if (!categories.length) return;
  const currentIndex = Math.max(0, categories.findIndex((entry) => entry.id === getActiveCategory()?.id));

  if (direction > 0) {
    if (currentIndex < categories.length - 1) {
      state.activeCategoryId = categories[currentIndex + 1].id;
      initCollapsedState();
      render();
      return;
    }
    showModal(`
      <h3>Ingin membuat kategori baru?</h3>
      <div class="actions">
        <button type="button" id="confirm-new-category">Confirm</button>
        <button type="button" id="close-modal">Cancel</button>
      </div>
    `);
    document.getElementById('confirm-new-category').addEventListener('click', () => {
      closeModal();
      createCategory();
    });
    document.getElementById('close-modal').addEventListener('click', closeModal);
    return;
  }

  if (currentIndex > 0) {
    state.activeCategoryId = categories[currentIndex - 1].id;
    initCollapsedState();
    render();
  }
}

function onBoardPointerDown(event) {
  if (!event.target.closest('.shell')) return;
  if (modalLayer.getAttribute('aria-hidden') === 'false') return;
  if (event.target.closest('button, input, textarea, select')) return;
  state.pendingSwipe = {
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    resolved: false,
    startedAt: Date.now(),
  };
}

function clearPendingHold(pointerId) {
  const pending = state.pendingHold;
  if (pending && pending.pointerId === pointerId) {
    clearTimeout(pending.timerId);
    state.pendingHold = null;
  }
}

function onBoardPointerMove(event) {
  const pending = state.pendingSwipe;
  if (!pending || pending.pointerId !== event.pointerId) return;
  if (pending.resolved) return;
  const dx = event.clientX - pending.startX;
  const dy = event.clientY - pending.startY;
  const elapsed = Date.now() - pending.startedAt;
  if (elapsed > 360) return;
  if (Math.abs(dx) < 72 || Math.abs(dx) < Math.abs(dy) * 1.2) return;
  pending.resolved = true;
  state.pendingSwipe = null;
  clearPendingHold(event.pointerId);
  switchCategory(dx > 0 ? 1 : -1);
}

function onBoardPointerUp(event) {
  const pending = state.pendingSwipe;
  if (!pending || pending.pointerId !== event.pointerId) return;
  if (!pending.resolved) {
    const dx = event.clientX - pending.startX;
    const dy = event.clientY - pending.startY;
    const elapsed = Date.now() - pending.startedAt;
    if (elapsed <= 420 && Math.abs(dx) >= 64 && Math.abs(dx) > Math.abs(dy) * 1.15) {
      clearPendingHold(event.pointerId);
      switchCategory(dx > 0 ? 1 : -1);
    }
  }
  state.pendingSwipe = null;
}

fabToggleEl.addEventListener('click', () => {
  const isOpen = fabWrapEl.dataset.open === 'true';
  setFabOpen(!isOpen);
});

openAddBtn.addEventListener('click', () => {
  setFabOpen(false);
  openAddChooser();
});

openHelpBtn.addEventListener('click', () => {
  setFabOpen(false);
  openControlGuideModal();
});

document.addEventListener('pointerdown', (event) => {
  if (!fabWrapEl.contains(event.target)) setFabOpen(false);
}, { passive: true });

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') setFabOpen(false);
});

appTitleEl.addEventListener('pointerup', onTitlePointerUp);
modalLayer.addEventListener('click', (event) => {
  if (event.target === modalLayer) event.preventDefault();
});
document.addEventListener('pointerdown', onBoardPointerDown, { passive: true });
document.addEventListener('pointermove', onBoardPointerMove, { passive: true });
document.addEventListener('pointerup', onBoardPointerUp, { passive: true });
document.addEventListener('pointercancel', onBoardPointerUp, { passive: true });

document.addEventListener('pointermove', onPointerMove, { passive: false });
document.addEventListener('pointermove', onDragPointerMove, { passive: false });
document.addEventListener('pointerup', (event) => finishDrag(event, true), { passive: true });
document.addEventListener('pointercancel', (event) => finishDrag(event, false), { passive: true });

setFabOpen(false);
void loadFromServer();
