const FADHIL_MAGIC = 'fadhil/uf-1';
const FADHIL_VERSION = 1;

function normalizeText(value, fallback = '') {
  const text = String(value ?? '').trim();
  return text || fallback;
}

function normalizeMeta(meta) {
  if (!meta || typeof meta !== 'object' || Array.isArray(meta)) return {};
  return { ...meta };
}

function nowIso() {
  return new Date().toISOString();
}

function toCanonicalContainer(source) {
  if (!source || typeof source !== 'object') {
    throw new Error('Format .fadhil tidak valid.');
  }

  if (source.magic !== FADHIL_MAGIC || source.version !== FADHIL_VERSION) {
    throw new Error('Versi/tipe .fadhil tidak didukung.');
  }

  const header = source.header && typeof source.header === 'object' ? source.header : {};
  if (!Object.prototype.hasOwnProperty.call(source, 'data')) {
    throw new Error('Konten .fadhil tidak memiliki data utama.');
  }

  return {
    magic: FADHIL_MAGIC,
    version: FADHIL_VERSION,
    header: {
      type: normalizeText(header.type, 'generic'),
      name: normalizeText(header.name, 'Untitled Document'),
      createdAt: normalizeText(header.createdAt, nowIso()),
      updatedAt: normalizeText(header.updatedAt, nowIso()),
      meta: normalizeMeta(header.meta),
    },
    data: source.data,
  };
}

export function createFadhilContainer({ kind, name, data, meta = {} }) {
  const stampedAt = nowIso();
  return {
    magic: FADHIL_MAGIC,
    version: FADHIL_VERSION,
    header: {
      type: normalizeText(kind, 'generic'),
      name: normalizeText(name, 'Untitled Document'),
      createdAt: stampedAt,
      updatedAt: stampedAt,
      meta: {
        createdWith: 'fadhil.dev archives',
        ...normalizeMeta(meta),
      },
    },
    data,
  };
}

export function stringifyFadhil(container, options = {}) {
  const { compact = false } = options;
  const canonical = toCanonicalContainer(container);
  return compact ? JSON.stringify(canonical) : `${JSON.stringify(canonical, null, 2)}\n`;
}

export function parseFadhil(rawText) {
  const parsed = JSON.parse(String(rawText ?? ''));
  return toCanonicalContainer(parsed);
}

export function extractFadhilPayload(rawText, expectedType = '') {
  const container = typeof rawText === 'string' ? parseFadhil(rawText) : toCanonicalContainer(rawText);
  const requiredType = normalizeText(expectedType, '');
  if (requiredType && container.header.type !== requiredType) {
    throw new Error(`Jenis dokumen tidak cocok. Diharapkan: ${requiredType}`);
  }
  return container.data;
}

export function isFadhilFilename(filename) {
  return String(filename ?? '').toLowerCase().endsWith('.fadhil');
}

export const FADHIL_SPEC = Object.freeze({
  extension: '.fadhil',
  mime: 'application/vnd.fadhil+json',
  magic: FADHIL_MAGIC,
  version: FADHIL_VERSION,
});
