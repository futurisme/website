import {
  archiveStorageKey,
  createArchiveCardMarkup,
  goToArchive,
  listArchives,
  readArchiveDocument,
  normalizeArchiveName,
  searchArchives,
  upsertArchiveMeta,
} from '/library/fadhilweblib/fadhilwebarchivesframework/runtime.js';
import {
  createFadhilContainer,
  extractFadhilPayload,
  stringifyFadhil,
} from '/extension/fadhil-format.js';

const searchEl = document.getElementById('archive-search');
const listEl = document.getElementById('archives-list');
const createBtn = document.getElementById('create-archive-btn');
const manualOpenBtn = document.getElementById('manual-open-btn');
const manualModal = document.getElementById('manual-modal');
const manualContainerEl = document.getElementById('manual-container');
const manualStatusEl = document.getElementById('manual-status');
const manualGenerateBtn = document.getElementById('manual-generate');
const manualCopyBtn = document.getElementById('manual-copy');
const manualApplyBtn = document.getElementById('manual-apply');


const playlistBannerEl = document.getElementById('playlist-banner');
const playlistBannerPrevEl = document.getElementById('playlist-banner-prev');
const playlistBannerNextEl = document.getElementById('playlist-banner-next');
const playlistBannerBackLeftEl = document.getElementById('playlist-banner-back-left');
const playlistBannerBackRightEl = document.getElementById('playlist-banner-back-right');
const imageArchivesMainEl = document.getElementById('image-archives-main');
const imageArchivesBackLeftEl = document.getElementById('image-archives-back-left');
const imageArchivesBackRightEl = document.getElementById('image-archives-back-right');
const PLAYLIST_ID = 'PLxFmUU-8D-UbX24xnBaf64-mqoRZjsqdf';
const PRIMARY_PLAYLIST_BANNER = '/assets/public/images/youtube-playlist-banner.avif';

let playlistBannerGallery = [PRIMARY_PLAYLIST_BANNER];
let playlistBannerIndex = 0;

function candidateThumbs(videoId) {
  if (!videoId) return [];
  return [
    `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
    `https://i.ytimg.com/vi/${videoId}/sddefault.jpg`,
    `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    `https://i.ytimg.com/vi_webp/${videoId}/maxresdefault.webp`,
    `https://i.ytimg.com/vi_webp/${videoId}/hqdefault.webp`,
  ];
}

function applyBannerWithFallback(imgEl, sources) {
  if (!imgEl || !sources.length) return;
  let idx = 0;
  const setNext = () => {
    if (idx >= sources.length) return;
    imgEl.src = sources[idx++];
  };
  imgEl.onerror = setNext;
  setNext();
}

async function hydratePlaylistBanner() {
  if (!playlistBannerEl) return;

  const fallbackImage = '/assets/public/images/portfolio.webp';
  playlistBannerGallery = [PRIMARY_PLAYLIST_BANNER, fallbackImage];
  setPlaylistBanner(0);

  try {
    const response = await fetch(`https://www.youtube.com/feeds/videos.xml?playlist_id=${PLAYLIST_ID}`, {
      cache: 'no-store',
      mode: 'cors',
    });
    if (!response.ok) throw new Error(`Feed status ${response.status}`);

    const xmlText = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlText, 'application/xml');
    const firstVideoId = doc.querySelector('entry > video\:videoId, entry > yt\:videoId')?.textContent?.trim();

    if (!firstVideoId) throw new Error('Playlist feed tidak punya videoId.');

    const dynamicThumbs = candidateThumbs(firstVideoId);
    playlistBannerGallery = [PRIMARY_PLAYLIST_BANNER, ...dynamicThumbs, fallbackImage]
      .filter((value, idx, arr) => Boolean(value) && arr.indexOf(value) === idx);
    setPlaylistBanner(0);
  } catch (error) {
    console.warn('Playlist banner fallback used:', error);
    setPlaylistBanner(0);
  }
}



function setPlaylistBanner(index) {
  if (!playlistBannerEl || !playlistBannerGallery.length) return;
  playlistBannerIndex = (index + playlistBannerGallery.length) % playlistBannerGallery.length;

  const mainSrc = playlistBannerGallery[playlistBannerIndex];
  const leftSrc = playlistBannerGallery[(playlistBannerIndex - 1 + playlistBannerGallery.length) % playlistBannerGallery.length];
  const rightSrc = playlistBannerGallery[(playlistBannerIndex + 1) % playlistBannerGallery.length];

  playlistBannerEl.src = mainSrc;
  if (playlistBannerBackLeftEl) playlistBannerBackLeftEl.src = leftSrc;
  if (playlistBannerBackRightEl) playlistBannerBackRightEl.src = rightSrc;
}

function setupBannerNavigation() {
  playlistBannerPrevEl?.addEventListener('click', () => setPlaylistBanner(playlistBannerIndex - 1));
  playlistBannerNextEl?.addEventListener('click', () => setPlaylistBanner(playlistBannerIndex + 1));
}

const SWIPE_RIGHT_MIN_X = 76;
const SWIPE_MAX_Y = 40;
const SWIPE_RESET_MS = 2600;
const SWIPE_REQUIRED_COUNT = 4;

let touchStartX = null;
let touchStartY = null;
let rightSwipeCount = 0;
let lastSwipeAt = 0;


function isAllowedInteractionTarget(target) {
  return Boolean(
    target?.closest?.('.embed-banner-row') ||
    target?.closest?.('.embed-frame-wrap') ||
    target?.closest?.('input, textarea, [contenteditable="true"]')
  );
}

function setupInteractionGuards() {
  const blockedEvents = ['copy', 'cut', 'contextmenu', 'selectstart', 'dragstart'];
  for (const type of blockedEvents) {
    document.addEventListener(type, (event) => {
      if (isAllowedInteractionTarget(event.target)) return;
      event.preventDefault();
    }, { passive: false });
  }

  document.addEventListener('keydown', (event) => {
    if (isAllowedInteractionTarget(event.target)) return;
    const key = event.key?.toLowerCase();
    if ((event.ctrlKey || event.metaKey) && ['a', 'c', 'x', 's', 'u', 'p'].includes(key)) {
      event.preventDefault();
    }
    if (key === 'f12') {
      event.preventDefault();
    }
  });
}


const IMAGE_ARCHIVES_GALLERY = [
  '/assets/public/images/portfolio.webp',
  '/assets/public/images/shareideas-2.webp',
  '/assets/public/images/bookshelf.webp'
];
let imageArchivesIndex = 0;

function setImageArchivesSlide(index) {
  if (!imageArchivesMainEl || !IMAGE_ARCHIVES_GALLERY.length) return;
  imageArchivesIndex = (index + IMAGE_ARCHIVES_GALLERY.length) % IMAGE_ARCHIVES_GALLERY.length;

  const mainSrc = IMAGE_ARCHIVES_GALLERY[imageArchivesIndex];
  const leftSrc = IMAGE_ARCHIVES_GALLERY[(imageArchivesIndex - 1 + IMAGE_ARCHIVES_GALLERY.length) % IMAGE_ARCHIVES_GALLERY.length];
  const rightSrc = IMAGE_ARCHIVES_GALLERY[(imageArchivesIndex + 1) % IMAGE_ARCHIVES_GALLERY.length];

  imageArchivesMainEl.src = mainSrc;
  if (imageArchivesBackLeftEl) imageArchivesBackLeftEl.src = leftSrc;
  if (imageArchivesBackRightEl) imageArchivesBackRightEl.src = rightSrc;
}

function setupImageArchivesCarousel() {
  if (!imageArchivesMainEl) return;
  setImageArchivesSlide(0);
  window.setInterval(() => {
    setImageArchivesSlide(imageArchivesIndex + 1);
  }, 2000);
}

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

function setManualStatus(message) {
  if (manualStatusEl) {
    manualStatusEl.textContent = message;
  }
}

function buildManualSnapshot() {
  const registry = listArchives();
  const documents = registry.map((entry) => {
    const key = archiveStorageKey(entry.slug);
    const raw = localStorage.getItem(key);
    return {
      slug: entry.slug,
      key,
      raw,
      parsed: readArchiveDocument(entry.slug),
    };
  });

  const payload = {
    magic: 'fadhil/archives-bundle',
    version: 1,
    exportedAt: new Date().toISOString(),
    registry,
    documents,
  };

  const container = createFadhilContainer({
    kind: 'archives-manual-backup',
    name: 'All archives snapshot',
    meta: {
      source: 'fadhil.dev/archives',
      includes: 'registry+documents+raw',
      extension: '.fadhil',
    },
    data: payload,
  });

  return stringifyFadhil(container);
}

function openManualModal() {
  if (!manualModal) return;
  if (!manualContainerEl?.value.trim()) {
    manualContainerEl.value = buildManualSnapshot();
  }
  if (!manualModal.open) {
    manualModal.showModal();
  }
  setManualStatus('Manual save/load siap. Data memakai container .fadhil.');
}

function registerRightSwipe(endX, endY) {
  if (touchStartX == null || touchStartY == null) return;
  const deltaX = endX - touchStartX;
  const deltaY = Math.abs(endY - touchStartY);
  touchStartX = null;
  touchStartY = null;

  if (deltaX < SWIPE_RIGHT_MIN_X || deltaY > SWIPE_MAX_Y) return;

  const now = Date.now();
  if (now - lastSwipeAt > SWIPE_RESET_MS) {
    rightSwipeCount = 0;
  }
  rightSwipeCount += 1;
  lastSwipeAt = now;

  if (rightSwipeCount >= SWIPE_REQUIRED_COUNT) {
    rightSwipeCount = 0;
    openManualModal();
  } else {
    setManualStatus(`Swipe kanan terdeteksi (${rightSwipeCount}/${SWIPE_REQUIRED_COUNT}).`);
  }
}

function parseManualSnapshot(raw) {
  const payload = extractFadhilPayload(raw, 'archives-manual-backup');
  if (!payload || payload.magic !== 'fadhil/archives-bundle') {
    throw new Error('Snapshot tidak cocok untuk seluruh archives.');
  }
  if (!Array.isArray(payload.registry) || !Array.isArray(payload.documents)) {
    throw new Error('Snapshot rusak: registry/documents tidak valid.');
  }
  return payload;
}

function listStoredArchiveKeys() {
  const keys = [];
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (typeof key === 'string' && key.startsWith('fadhil-archive:')) {
      keys.push(key);
    }
  }
  return keys;
}

function applyManualSnapshot(raw) {
  const payload = parseManualSnapshot(raw);
  const documentsBySlug = new Map(payload.documents.map((doc) => [doc?.slug, doc]));
  const snapshotKeys = new Set(payload.registry.map((entry) => archiveStorageKey(entry?.slug)).filter(Boolean));

  for (const existingKey of listStoredArchiveKeys()) {
    if (!snapshotKeys.has(existingKey)) {
      localStorage.removeItem(existingKey);
    }
  }

  localStorage.setItem('fadhil-archives-registry-v1', JSON.stringify(payload.registry));

  for (const entry of payload.registry) {
    const slug = entry?.slug;
    if (!slug) continue;
    const key = archiveStorageKey(slug);
    const doc = documentsBySlug.get(slug);

    if (typeof doc?.raw === 'string') {
      localStorage.setItem(key, doc.raw);
      continue;
    }

    if (doc?.parsed && typeof doc.parsed === 'object') {
      localStorage.setItem(key, JSON.stringify(doc.parsed));
    }
  }
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

manualOpenBtn?.addEventListener('click', openManualModal);

manualGenerateBtn?.addEventListener('click', () => {
  manualContainerEl.value = buildManualSnapshot();
  setManualStatus('Snapshot baru berhasil dibuat (all archives + all contents).');
});

manualCopyBtn?.addEventListener('click', async () => {
  try {
    const text = manualContainerEl.value.trim() || buildManualSnapshot();
    manualContainerEl.value = text;
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      setManualStatus('Snapshot .fadhil berhasil disalin ke clipboard.');
    } else {
      setManualStatus('Clipboard tidak tersedia. Snapshot tetap ada di textarea.');
    }
  } catch (error) {
    setManualStatus(`Copy gagal: ${error instanceof Error ? error.message : String(error)}`);
  }
});

manualApplyBtn?.addEventListener('click', () => {
  try {
    const raw = String(manualContainerEl.value || '').trim();
    if (!raw) {
      throw new Error('Container snapshot masih kosong.');
    }
    applyManualSnapshot(raw);
    renderArchives();
    hydratePlaylistBanner();
    setManualStatus('Snapshot berhasil dimuat ulang. Semua archives dipulihkan.');
  } catch (error) {
    setManualStatus(`Load gagal: ${error instanceof Error ? error.message : String(error)}`);
  }
});

document.addEventListener('touchstart', (event) => {
  const touch = event.changedTouches?.[0];
  if (!touch) return;
  touchStartX = touch.clientX;
  touchStartY = touch.clientY;
}, { passive: true });

document.addEventListener('touchend', (event) => {
  const touch = event.changedTouches?.[0];
  if (!touch) return;
  registerRightSwipe(touch.clientX, touch.clientY);
}, { passive: true });

document.addEventListener('touchcancel', () => {
  touchStartX = null;
  touchStartY = null;
}, { passive: true });

renderArchives();
setupBannerNavigation();
hydratePlaylistBanner();
setupInteractionGuards();
setupImageArchivesCarousel();
