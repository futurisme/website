import {
  createArchiveCardMarkup,
  goToArchive,
  listArchives,
  normalizeArchiveName,
  searchArchives,
  upsertArchiveMeta,
} from '/library/fadhilweblib/fadhilwebarchivesframework/runtime.js';

const searchEl = document.getElementById('archive-search');
const listEl = document.getElementById('archives-list');
const createBtn = document.getElementById('create-archive-btn');

function renderArchives() {
  const archives = listArchives();
  const keyword = String(searchEl?.value || '').trim().toLowerCase();

  const filtered = keyword ? searchArchives(archives, keyword) : archives;

  if (!filtered.length) {
    listEl.innerHTML = `<li class="hint">${archives.length ? 'No archive found.' : 'No archives yet.'}</li>`;
    return;
  }

  listEl.innerHTML = filtered.map((entry) => createArchiveCardMarkup(entry)).join('');
}

searchEl?.addEventListener('input', renderArchives);

createBtn?.addEventListener('click', () => {
  const requested = window.prompt('Archive name');
  if (requested == null) return;
  const name = normalizeArchiveName(requested, '');
  if (!name) return;
  const { slug } = upsertArchiveMeta(name);
  goToArchive(slug);
});

renderArchives();
