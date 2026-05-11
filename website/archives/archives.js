import {
  archiveStorageKey,
  createArchiveCardMarkup,
  goToArchive,
  listArchives,
  readArchiveDocument,
  normalizeArchiveName,
  searchArchives,
  upsertArchiveMeta,
} from './runtime.js';
import {
  createFadhilContainer,
  extractFadhilPayload,
  stringifyFadhil,
} from './fadhil-format.js';

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
const imageArchivesBackFarLeftEl = document.getElementById('image-archives-back-far-left');
const imageArchivesBackFarRightEl = document.getElementById('image-archives-back-far-right');
const fadhilMusicPlayerEl = document.getElementById('fadhil-music-player');
const musicPlayToggleEl = document.getElementById('music-play-toggle');
const musicTimeLabelEl = document.getElementById('music-time-label');
const musicProgressEl = document.getElementById('music-progress');
const ARCHIVES_MUSIC_URL = 'https://audio.jukehost.co.uk/019e1606-064c-727f-bf03-0f007212a347';

let archivesErrorShown = false;
function reportArchivesError(kind, message) {
  if (archivesErrorShown) return;
  archivesErrorShown = true;
  const panel = document.createElement('aside');
  panel.textContent = `archives-error | ${kind}: ${message}`;
  panel.style.cssText = 'position:fixed;left:10px;right:10px;bottom:10px;z-index:2147483647;background:#22090d;color:#fecaca;border:1px solid #ef4444;border-radius:8px;padding:8px;font:12px/1.3 ui-monospace,monospace;';
  document.body.appendChild(panel);
  window.setTimeout(() => {
    panel.remove();
    // one-shot: never show/load again after first anomaly report
    window.removeEventListener('error', onWindowError);
    window.removeEventListener('unhandledrejection', onUnhandledRejection);
  }, 2000);
}

function onWindowError(event) {
  reportArchivesError('runtime-error', event?.message || 'unknown');
}

function onUnhandledRejection(event) {
  reportArchivesError('unhandled-rejection', event?.reason?.message || String(event?.reason || 'unknown'));
}
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

async function hydratePlaylistBanner() {
  if (!playlistBannerEl) return;

  const fallbackImage = '/assets/public/images/portfolio.webp';
  playlistBannerGallery = [PRIMARY_PLAYLIST_BANNER, fallbackImage];
  setPlaylistBanner(0);
  // CORS-safe: skip direct YouTube feed fetch in browser static context.
  // Keep deterministic local/thumbnail gallery to avoid console errors and failed requests.
  const staticThumbs = candidateThumbs('dQw4w9WgXcQ');
  playlistBannerGallery = [PRIMARY_PLAYLIST_BANNER, ...staticThumbs, fallbackImage]
    .filter((value, idx, arr) => Boolean(value) && arr.indexOf(value) === idx);
  setPlaylistBanner(0);
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
  '/assets/public/images/bookshelf.webp',
  '/assets/public/images/youtube-playlist-banner.avif',
  '/assets/public/images/mindmapmaker.webp'
];
let imageArchivesIndex = 0;
let validatedImageArchivesGallery = [...IMAGE_ARCHIVES_GALLERY];
const imagePrewarmPromises = new Map();

function validateImageSource(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(src);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

async function hydrateImageArchivesGallery() {
  const checked = await Promise.all(IMAGE_ARCHIVES_GALLERY.map((src) => validateImageSource(src)));
  const valid = checked.filter(Boolean);
  validatedImageArchivesGallery = valid.length ? valid : ['/assets/public/images/portfolio.webp'];
  await Promise.all(validatedImageArchivesGallery.map((src) => prewarmImageDecode(src)));
}

function prewarmImageDecode(src) {
  if (!src) return Promise.resolve();
  const existing = imagePrewarmPromises.get(src);
  if (existing) return existing;
  const pending = new Promise((resolve) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = async () => {
      try {
        if (typeof img.decode === 'function') {
          await img.decode();
        }
      } catch (_) {
        // noop: decode may reject if browser already has decoded frame.
      }
      resolve();
    };
    img.onerror = () => resolve();
    img.src = src;
  });
  imagePrewarmPromises.set(src, pending);
  return pending;
}

function setImageArchivesSlide(index) {
  if (!imageArchivesMainEl || !validatedImageArchivesGallery.length) return;
  imageArchivesIndex = (index + validatedImageArchivesGallery.length) % validatedImageArchivesGallery.length;

  const mainSrc = validatedImageArchivesGallery[imageArchivesIndex];
  const leftSrc = validatedImageArchivesGallery[(imageArchivesIndex - 1 + validatedImageArchivesGallery.length) % validatedImageArchivesGallery.length];
  const rightSrc = validatedImageArchivesGallery[(imageArchivesIndex + 1) % validatedImageArchivesGallery.length];
  const farLeftSrc = validatedImageArchivesGallery[(imageArchivesIndex - 2 + validatedImageArchivesGallery.length) % validatedImageArchivesGallery.length];
  const farRightSrc = validatedImageArchivesGallery[(imageArchivesIndex + 2) % validatedImageArchivesGallery.length];

  imageArchivesMainEl.src = mainSrc;
  if (imageArchivesBackLeftEl) imageArchivesBackLeftEl.src = leftSrc;
  if (imageArchivesBackRightEl) imageArchivesBackRightEl.src = rightSrc;
  if (imageArchivesBackFarLeftEl) imageArchivesBackFarLeftEl.src = farLeftSrc;
  if (imageArchivesBackFarRightEl) imageArchivesBackFarRightEl.src = farRightSrc;
}

let imageArchivesTimer = null;

function startImageArchivesCarousel() {
  if (imageArchivesTimer || !imageArchivesMainEl) return;
  imageArchivesTimer = window.setInterval(() => {
    setImageArchivesSlide(imageArchivesIndex + 1);
  }, 1000);
}

function stopImageArchivesCarousel() {
  if (!imageArchivesTimer) return;
  window.clearInterval(imageArchivesTimer);
  imageArchivesTimer = null;
}

function setupImageArchivesCarousel() {
  if (!imageArchivesMainEl) return;
  hydrateImageArchivesGallery().then(() => {
    setImageArchivesSlide(0);
    startImageArchivesCarousel();
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stopImageArchivesCarousel();
      return;
    }
    startImageArchivesCarousel();
  }, { passive: true });
}

function setupMusicPlayer() {
  if (!fadhilMusicPlayerEl) return;
  fadhilMusicPlayerEl.src = ARCHIVES_MUSIC_URL;
  fadhilMusicPlayerEl.volume = 1;
  fadhilMusicPlayerEl.preload = 'auto';
  fadhilMusicPlayerEl.crossOrigin = 'anonymous';
  const buildFallbackTrack = () => {
    console.warn('Music player source failed to load, generating local fallback track.');
    const sampleRate = 44100;
    const durationSec = 45;
    const channels = 1;
    const totalSamples = sampleRate * durationSec;
    const dataSize = totalSamples * 2;
    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);
    const writeString = (offset, text) => { for (let i = 0; i < text.length; i += 1) view.setUint8(offset + i, text.charCodeAt(i)); };
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, channels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * channels * 2, true);
    view.setUint16(32, channels * 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, dataSize, true);
    let offset = 44;
    for (let i = 0; i < totalSamples; i += 1) {
      const t = i / sampleRate;
      const envelope = Math.max(0.2, 1 - (t / durationSec));
      const sample = Math.sin(2 * Math.PI * 220 * t) * 0.22 * envelope + Math.sin(2 * Math.PI * 330 * t) * 0.12 * envelope;
      const intSample = Math.max(-1, Math.min(1, sample)) * 32767;
      view.setInt16(offset, intSample, true);
      offset += 2;
    }
    const blobUrl = URL.createObjectURL(new Blob([buffer], { type: 'audio/wav' }));
    fadhilMusicPlayerEl.src = blobUrl;
    fadhilMusicPlayerEl.load();
    return blobUrl;
  };

  fadhilMusicPlayerEl.addEventListener('error', () => {
    buildFallbackTrack();
    reportArchivesError('music-load-fallback', 'Primary source failed, fallback track generated.');
  });

  fadhilMusicPlayerEl.addEventListener('play', () => { archivesErrorShown = false; });

  const formatTime = (seconds) => {
    const safe = Number.isFinite(seconds) && seconds >= 0 ? seconds : 0;
    const mins = Math.floor(safe / 60);
    const secs = Math.floor(safe % 60);
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  const syncMusicUI = () => {
    const duration = Number.isFinite(fadhilMusicPlayerEl.duration) ? fadhilMusicPlayerEl.duration : 0;
    const current = Number.isFinite(fadhilMusicPlayerEl.currentTime) ? fadhilMusicPlayerEl.currentTime : 0;
    if (musicTimeLabelEl) {
      musicTimeLabelEl.textContent = `${formatTime(current)} / ${formatTime(duration)}`;
    }
    if (musicProgressEl) {
      const nextValue = duration > 0 ? Math.round((current / duration) * 1000) : 0;
      musicProgressEl.value = String(nextValue);
    }
    if (musicPlayToggleEl) {
      const isPlaying = !fadhilMusicPlayerEl.paused;
      musicPlayToggleEl.textContent = isPlaying ? '❚❚' : '▶';
      musicPlayToggleEl.setAttribute('aria-label', isPlaying ? 'Pause' : 'Play');
      musicPlayToggleEl.setAttribute('aria-pressed', String(isPlaying));
    }
  };

  musicPlayToggleEl?.addEventListener('click', async () => {
    try {
      if (fadhilMusicPlayerEl.paused) {
        await fadhilMusicPlayerEl.play();
      } else {
        fadhilMusicPlayerEl.pause();
      }
      syncMusicUI();
    } catch (error) {
      reportArchivesError('music-play-toggle', error instanceof Error ? error.message : String(error));
    }
  });

  musicProgressEl?.addEventListener('input', () => {
    const duration = Number.isFinite(fadhilMusicPlayerEl.duration) ? fadhilMusicPlayerEl.duration : 0;
    if (duration <= 0) return;
    const ratio = Number(musicProgressEl.value || 0) / 1000;
    fadhilMusicPlayerEl.currentTime = duration * Math.max(0, Math.min(1, ratio));
    syncMusicUI();
  });

  ['loadedmetadata', 'timeupdate', 'durationchange', 'play', 'pause', 'ended'].forEach((type) => {
    fadhilMusicPlayerEl.addEventListener(type, syncMusicUI, { passive: true });
  });
  syncMusicUI();
}


function setupProceduralImageLoad() {
  const proceduralImages = Array.from(document.querySelectorAll('img[data-procedural-src]'));
  if (!proceduralImages.length) return;

  const hydrate = (img) => {
    if (!img || img.dataset.loaded === 'true') return;
    const src = img.dataset.proceduralSrc;
    if (!src) return;
    img.src = src;
    img.dataset.loaded = 'true';
  };

  if (!('IntersectionObserver' in window)) {
    proceduralImages.forEach(hydrate);
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      hydrate(entry.target);
      observer.unobserve(entry.target);
    }
  }, { rootMargin: '80px 0px' });

  proceduralImages.forEach((img) => observer.observe(img));
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
setupProceduralImageLoad();
setupMusicPlayer();
window.addEventListener('error', onWindowError);
window.addEventListener('unhandledrejection', onUnhandledRejection);
