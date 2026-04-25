const ARCHIVE_REGISTRY_KEY = 'fadhil-archives-registry-v1';

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function escapeHtml(text) {
  return String(text ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function formatArchiveDateTime(value) {
  const parsed = Date.parse(String(value ?? ''));
  if (!Number.isFinite(parsed) || parsed <= 0) return 'Unknown update';

  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(parsed));
}

export function createArchiveCardMarkup(entry) {
  const slug = escapeHtml(entry?.slug ?? '');
  const name = escapeHtml(entry?.name ?? 'Untitled Archive');
  const href = `/archives/${encodeURIComponent(entry?.slug ?? '')}`;
  const updatedText = formatArchiveDateTime(entry?.updatedAt);

  return `<li><div class="archive-title-row"><a href="${href}">${name}</a><span class="archive-updated">${updatedText}</span></div><span class="archive-slug">${slug}</span></li>`;
}

export function slugifyArchiveName(input) {
  const text = String(input ?? '').trim().toLowerCase();
  const slug = text
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 64);
  return slug || null;
}

export function normalizeArchiveName(input, fallback = 'Untitled Archive') {
  const text = String(input ?? '').trim().replace(/\s+/g, ' ');
  if (!text) return fallback;
  return text.slice(0, 80);
}

export function listArchives() {
  const entries = readJson(ARCHIVE_REGISTRY_KEY, []);
  if (!Array.isArray(entries)) return [];
  return entries
    .filter((entry) => entry && typeof entry === 'object')
    .map((entry) => ({
      slug: slugifyArchiveName(entry.slug) ?? null,
      name: normalizeArchiveName(entry.name),
      createdAt: typeof entry.createdAt === 'string' ? entry.createdAt : new Date(0).toISOString(),
      updatedAt: typeof entry.updatedAt === 'string' ? entry.updatedAt : new Date(0).toISOString(),
    }))
    .filter((entry) => Boolean(entry.slug))
    .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
}

export function searchArchives(entries, keyword) {
  const normalizedKeyword = String(keyword ?? '').trim().toLowerCase();
  if (!normalizedKeyword) return Array.isArray(entries) ? entries : [];
  if (!Array.isArray(entries)) return [];

  return entries.filter((entry) => {
    const name = String(entry?.name ?? '').toLowerCase();
    const slug = String(entry?.slug ?? '').toLowerCase();
    return name.includes(normalizedKeyword) || slug.includes(normalizedKeyword);
  });
}

export function upsertArchiveMeta(name) {
  const normalizedName = normalizeArchiveName(name);
  const slug = slugifyArchiveName(normalizedName);
  if (!slug) {
    throw new Error('Nama arsip tidak valid.');
  }

  const nowIso = new Date().toISOString();
  const entries = listArchives();
  const foundIndex = entries.findIndex((entry) => entry.slug === slug);

  if (foundIndex >= 0) {
    entries[foundIndex] = {
      ...entries[foundIndex],
      name: normalizedName,
      updatedAt: nowIso,
    };
  } else {
    entries.unshift({
      slug,
      name: normalizedName,
      createdAt: nowIso,
      updatedAt: nowIso,
    });
  }

  writeJson(ARCHIVE_REGISTRY_KEY, entries);
  return { slug, name: normalizedName };
}

export function resolveArchiveSlugFromPath(pathname = window.location.pathname) {
  const match = /^\/archives\/([^/]+)\/?$/.exec(pathname);
  return match ? decodeURIComponent(match[1]) : null;
}

export function goToArchive(slug) {
  window.location.href = `/archives/${encodeURIComponent(slug)}`;
}

export function archiveStorageKey(slug) {
  return `fadhil-archive:${slug}`;
}

export function readArchiveDocument(slug) {
  return readJson(archiveStorageKey(slug), {
    meta: { title: 'Untitled Archive', slug },
    sections: [],
    notes: '',
  });
}

export function writeArchiveDocument(slug, doc) {
  writeJson(archiveStorageKey(slug), doc);
  const title = normalizeArchiveName(doc?.meta?.title || slug);
  upsertArchiveMeta(title);
}
