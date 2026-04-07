const API_URL = '/api/shareideas';

const state = {
  db: { folders: [] },
  collapsedFolders: {},
  collapsedItems: {},
  version: null,
  online: false,
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
  statusEl.textContent = online ? "ONLINE" : "OFFLINE";
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

function renderBoard() {
  boardEl.textContent = '';
  const folders = state.db.folders;
  if (!folders.length) {
    renderEmpty();
    return;
  }

  folders.forEach((folder) => {
    const fragment = folderTemplate.content.cloneNode(true);
    const root = fragment.querySelector('.folder');
    const title = fragment.querySelector('.folder-title');
    const count = fragment.querySelector('.folder-count');
    const editBtn = fragment.querySelector('.folder-edit');
    const toggleBtn = fragment.querySelector('.folder-toggle');
    const content = fragment.querySelector('.folder-content');

    const folderCollapsed = Boolean(state.collapsedFolders[folder.id]);

    title.textContent = folder.name;
    count.textContent = `${folder.cards.length} ITEMCARDS`;
    root.dataset.collapsed = String(folderCollapsed);
    toggleBtn.textContent = folderCollapsed ? '▼ Expand' : '▲ Collapse';

    toggleBtn.addEventListener('click', () => {
      state.collapsedFolders[folder.id] = !state.collapsedFolders[folder.id];
      renderBoard();
    });

    editBtn.addEventListener('click', () => {
      openEditFolder(folder.id);
    });

    folder.cards.forEach((card) => {
      const cardFrag = itemTemplate.content.cloneNode(true);
      const cardRoot = cardFrag.querySelector('.idea-item');
      const cardTitle = cardFrag.querySelector('.idea-title');
      const cardDesc = cardFrag.querySelector('.idea-description');
      const cardEdit = cardFrag.querySelector('.item-edit');
      const cardToggle = cardFrag.querySelector('.detail-toggle');

      const itemCollapsed = Boolean(state.collapsedItems[card.id]);
      cardRoot.dataset.collapsed = String(itemCollapsed);
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

void loadFromServer();
