import {
  FADHIL_SPEC,
  createFadhilContainer,
  extractFadhilPayload,
  isFadhilFilename,
  stringifyFadhil,
} from '/extension/fadhil-format.js';
import {
  normalizeArchiveName,
  readArchiveDocument,
  resolveArchiveSlugFromPath,
  slugifyArchiveName,
  upsertArchiveMeta,
  writeArchiveDocument,
} from '/library/fadhilweblib/fadhilwebarchivesframework/runtime.js';

const slug = slugifyArchiveName(resolveArchiveSlugFromPath());
if (!slug) {
  window.location.replace('/archives');
}

const titleEl = document.getElementById('workspace-title');
const archiveTitleInput = document.getElementById('archive-title');
const notesEl = document.getElementById('archive-notes');
const saveLocalBtn = document.getElementById('save-local');
const saveFileBtn = document.getElementById('save-file');
const loadFileBtn = document.getElementById('load-file');
const copyFileBtn = document.getElementById('copy-file');
const loadContainerBtn = document.getElementById('load-container');
const loadInput = document.getElementById('load-input');
const containerEl = document.getElementById('fadhil-container');
const layoutStateEl = document.getElementById('layout-state');
const statusEl = document.getElementById('status');

function setStatus(message) {
  statusEl.textContent = message;
}

function currentDoc() {
  return {
    magic: 'fadhil/archive-document',
    version: 2,
    meta: {
      slug,
      title: normalizeArchiveName(archiveTitleInput.value || slug),
      updatedAt: new Date().toISOString(),
    },
    sections: [],
    notes: String(notesEl.value || '').slice(0, 200000),
  };
}

function buildContainerText({ compact = false } = {}) {
  const doc = currentDoc();
  const container = createFadhilContainer({
    kind: 'archive-document',
    name: doc.meta.title,
    meta: {
      slug,
      updatedAt: doc.meta.updatedAt,
    },
    data: doc,
  });

  return stringifyFadhil(container, { compact });
}

function applyDoc(doc) {
  const safeTitle = normalizeArchiveName(doc?.meta?.title || slug);
  archiveTitleInput.value = safeTitle;
  notesEl.value = typeof doc?.notes === 'string' ? doc.notes : '';
  titleEl.textContent = safeTitle;
  upsertArchiveMeta(safeTitle);
}

function saveLocal() {
  const doc = currentDoc();
  writeArchiveDocument(slug, doc);
  titleEl.textContent = doc.meta.title;
  setStatus(`Saved local (${new Date().toLocaleTimeString()})`);
}

function download(filename, content, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function parseArchiveFromText(raw, filename = '.fadhil container') {
  let parsed;
  if (String(filename).toLowerCase().endsWith('.json')) {
    parsed = JSON.parse(raw);
  } else if (isFadhilFilename(filename) || filename === '.fadhil container' || String(filename).toLowerCase().endsWith('.txt')) {
    parsed = extractFadhilPayload(raw, 'archive-document');
  } else {
    throw new Error('File harus berekstensi .fadhil, .json, atau .txt');
  }

  if (!parsed || parsed.magic !== 'fadhil/archive-document') {
    throw new Error('Format archive tidak cocok.');
  }

  return parsed;
}

async function copyContainer() {
  const text = buildContainerText();
  containerEl.value = text;

  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    setStatus('Container .fadhil dibuat dan disalin ke clipboard.');
  } else {
    setStatus('Container .fadhil dibuat. Clipboard tidak tersedia di browser ini.');
  }
}

function validateModernLayoutAndControls() {
  const app = document.getElementById('workspace-app');
  const cards = app?.querySelectorAll('.card') ?? [];
  const allButtonsReady = [saveLocalBtn, saveFileBtn, loadFileBtn, copyFileBtn, loadContainerBtn].every(Boolean);
  const styled = window.getComputedStyle(document.body).backgroundImage !== 'none';
  const ok = cards.length >= 2 && allButtonsReady && styled;

  layoutStateEl.textContent = ok ? 'Style check: modern layout active' : 'Style check: fallback/plain';
}

saveLocalBtn.addEventListener('click', saveLocal);
archiveTitleInput.addEventListener('change', saveLocal);
notesEl.addEventListener('change', saveLocal);

saveFileBtn.addEventListener('click', () => {
  const downloadable = buildContainerText({ compact: true });
  containerEl.value = buildContainerText({ compact: false });
  download(`archives-${slug}${FADHIL_SPEC.extension}`, downloadable, FADHIL_SPEC.mime);
  setStatus(`Exported ${FADHIL_SPEC.extension} (compact mode)`);
});

copyFileBtn.addEventListener('click', async () => {
  try {
    await copyContainer();
  } catch (error) {
    setStatus(`Copy gagal: ${error instanceof Error ? error.message : String(error)}`);
  }
});

loadContainerBtn.addEventListener('click', () => {
  try {
    const raw = String(containerEl.value || '').trim();
    if (!raw) {
      throw new Error('Container masih kosong.');
    }

    const parsed = parseArchiveFromText(raw, '.fadhil container');
    applyDoc(parsed);
    saveLocal();
    setStatus('Container .fadhil berhasil dimuat.');
  } catch (error) {
    setStatus(`Load container gagal: ${error instanceof Error ? error.message : String(error)}`);
  }
});

loadFileBtn.addEventListener('click', () => loadInput.click());
loadInput.addEventListener('change', async () => {
  const file = loadInput.files?.[0];
  if (!file) return;

  try {
    const raw = await file.text();
    const parsed = parseArchiveFromText(raw, file.name);
    applyDoc(parsed);
    saveLocal();
    containerEl.value = buildContainerText();
    setStatus(`Imported ${file.name}`);
  } catch (error) {
    setStatus(`Import gagal: ${error instanceof Error ? error.message : String(error)}`);
  }

  loadInput.value = '';
});

applyDoc(readArchiveDocument(slug));
containerEl.value = buildContainerText();
validateModernLayoutAndControls();
setStatus(`Ready. Primary extension: ${FADHIL_SPEC.extension}`);
