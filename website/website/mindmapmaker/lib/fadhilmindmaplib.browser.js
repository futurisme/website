const ROOT_PARENT = -1;
const ARCHIVE_PREFIX = '🜂fAdHiL🜁';
const ALIEN_BLOCK_START = 0x3400;
const ALIEN_BASE = 8192;
const PASSPHRASE_V2 = 'FadhilAkbar.ChartWorkspace.FeatureLib.v2';
const SALT_V2 = 'ChartWorkspace::fAdHiL::Alien::2026';
const PASSPHRASE_V1 = 'FadhilAkbar.ChartWorkspace.FeatureLib.v1';
const SALT_V1 = 'ChartWorkspace::fAdHiL::2026';
const MAGIC = 'chartworkspace/fadhil-archive';
const CURRENT_VERSION = 2;
const CURRENT_ALGO = 'aes-gcm+deflate+alien-b8192';
const LEGACY_ALGO = 'aes-gcm+gzip+base64url';

export class FadhilMindmapLite {
  constructor() {
    this.version = 1;
    this.nextId = 2;
    this.nodes = [{ id: 1, title: 'Main Topic', parentId: null, x: 0, y: 0, depth: 0, weight: 1 }];
    this.links = [];
    this.nodeIndexById = new Map([[1, 0]]);
    this.childIdsByParent = new Map();
    this.outgoingLinkCount = new Map();
    this.cachedSnapshot = null;
    this.dirtySnapshot = true;
  }

  static fromSnapshot(snapshot) {
    const engine = new FadhilMindmapLite();
    if (snapshot?.nodes?.length) {
      engine.nodes = snapshot.nodes.map((n) => ({ ...n }));
      engine.links = Array.isArray(snapshot.links) ? snapshot.links.map((l) => ({ ...l })) : [];
      engine.nextId = Math.max(...engine.nodes.map((n) => n.id), 1) + 1;
      engine.version = snapshot.version || 1;
      engine.rebuildIndexes();
    }
    return engine;
  }

  getSnapshot() {
    if (!this.dirtySnapshot && this.cachedSnapshot) {
      return this.cachedSnapshot;
    }
    const treeEdges = this.nodes.filter((n) => n.parentId !== null).map((n) => ({ from: n.parentId, to: n.id, kind: 'tree' }));
    const linkEdges = this.links.map((l) => ({ ...l, kind: 'link' }));
    this.cachedSnapshot = {
      version: this.version,
      nodes: this.nodes.map((n) => ({ ...n })),
      links: this.links.map((l) => ({ ...l })),
      edges: [...treeEdges, ...linkEdges],
    };
    this.dirtySnapshot = false;
    return this.cachedSnapshot;
  }

  getNode(id) {
    const index = this.nodeIndexById.get(id);
    if (index === undefined) return undefined;
    return this.nodes[index];
  }

  addNode(parentId, title = 'New Node') {
    const parent = this.getNode(parentId) || this.nodes[0];
    const siblings = this.childIdsByParent.get(parent.id) || [];
    const id = this.nextId++;
    const node = {
      id,
      title,
      parentId: parent.id,
      x: parent.x + 220,
      y: parent.y + siblings.length * 90,
      depth: (parent.depth ?? 0) + 1,
      weight: 1,
    };
    this.pushNode(node);
    this.bumpVersion();
    return node;
  }

  removeNode(id) {
    if (id === 1) return false;
    const target = this.getNode(id);
    if (!target) return false;

    const parentId = target.parentId ?? 1;
    this.nodes = this.nodes
      .filter((n) => n.id !== id)
      .map((n) => (n.parentId === id ? { ...n, parentId } : n));

    this.links = this.links.filter((link) => link.from !== id && link.to !== id);
    this.rebuildIndexes();
    this.bumpVersion();
    return true;
  }

  updateNode(id, patch) {
    const node = this.getNode(id);
    if (!node) return;
    const prevTitle = node.title;
    const prevX = node.x;
    const prevY = node.y;
    if (patch.title !== undefined) node.title = patch.title;
    if (patch.x !== undefined) node.x = patch.x;
    if (patch.y !== undefined) node.y = patch.y;
    if (node.title !== prevTitle || node.x !== prevX || node.y !== prevY) {
      this.bumpVersion();
    }
  }

  connect(from, to) {
    if (from === to) return false;
    if (!this.nodeIndexById.has(from) || !this.nodeIndexById.has(to)) return false;
    if (this.links.some((l) => l.from === from && l.to === to)) return false;
    this.links.push({ from, to });
    this.outgoingLinkCount.set(from, (this.outgoingLinkCount.get(from) || 0) + 1);
    this.bumpVersion();
    return true;
  }

  unconnectFrom(from) {
    const count = this.outgoingLinkCount.get(from) || 0;
    if (count === 0) return false;
    this.links = this.links.filter((l) => l.from !== from);
    this.outgoingLinkCount.set(from, 0);
    this.bumpVersion();
    return true;
  }

  hasConnectionFrom(id) {
    return (this.outgoingLinkCount.get(id) || 0) > 0;
  }

  toCsv() {
    const head = 'id,title,parentId,x,y,depth,weight';
    const rows = this.nodes.map((n) => [n.id, csvEsc(n.title), n.parentId ?? '', n.x, n.y, n.depth ?? 0, n.weight ?? 1].join(','));
    return [head, ...rows].join('\n');
  }

  fromCsv(csv) {
    const lines = csv.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length < 2) return false;
    const parsed = [];
    for (const line of lines.slice(1)) {
      const parts = splitCsv(line);
      if (parts.length < 7) continue;
      parsed.push({
        id: Number(parts[0]),
        title: unCsv(parts[1]),
        parentId: parts[2] ? Number(parts[2]) : null,
        x: Number(parts[3]),
        y: Number(parts[4]),
        depth: Number(parts[5]) || 0,
        weight: Number(parts[6]) || 1,
      });
    }
    if (parsed.length === 0) return false;
    this.nodes = parsed;
    this.links = [];
    this.nextId = Math.max(...this.nodes.map((n) => n.id), 1) + 1;
    this.rebuildIndexes();
    this.bumpVersion();
    return true;
  }

  pushNode(node) {
    const index = this.nodes.length;
    this.nodes.push(node);
    this.nodeIndexById.set(node.id, index);
    if (node.parentId !== null) {
      let children = this.childIdsByParent.get(node.parentId);
      if (!children) {
        children = [];
        this.childIdsByParent.set(node.parentId, children);
      }
      children.push(node.id);
    }
  }

  rebuildIndexes() {
    this.nodeIndexById = new Map();
    this.childIdsByParent = new Map();
    this.outgoingLinkCount = new Map();
    for (let i = 0; i < this.nodes.length; i += 1) {
      const node = this.nodes[i];
      this.nodeIndexById.set(node.id, i);
      if (node.parentId !== null) {
        let children = this.childIdsByParent.get(node.parentId);
        if (!children) {
          children = [];
          this.childIdsByParent.set(node.parentId, children);
        }
        children.push(node.id);
      }
    }
    for (const link of this.links) {
      this.outgoingLinkCount.set(link.from, (this.outgoingLinkCount.get(link.from) || 0) + 1);
    }
    this.dirtySnapshot = true;
    this.cachedSnapshot = null;
  }

  bumpVersion() {
    this.version += 1;
    this.dirtySnapshot = true;
    this.cachedSnapshot = null;
  }
}

export function buildEdgePath(from, to) {
  if (!Number.isFinite(from?.x) || !Number.isFinite(from?.y) || !Number.isFinite(to?.x) || !Number.isFinite(to?.y)) {
    return '';
  }
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const distance = Math.hypot(dx, dy);
  const control = Math.max(28, Math.min(220, distance * 0.35));
  const adaptiveX = dx >= 0 ? control : Math.max(44, control * 1.4);
  const c1x = from.x + adaptiveX;
  const c2x = to.x - adaptiveX;
  return `M ${round3(from.x)} ${round3(from.y)} C ${round3(c1x)} ${round3(from.y)}, ${round3(c2x)} ${round3(to.y)}, ${round3(to.x)} ${round3(to.y)}`;
}

function round3(value) {
  return Math.round(value * 1000) / 1000;
}

export function defaultStorageKey(mapId) {
  return `fadhil_mindmap_${mapId}`;
}

export function saveSnapshot(mapId, snapshot) {
  localStorage.setItem(defaultStorageKey(mapId), JSON.stringify(snapshot));
}

export function loadSnapshot(mapId) {
  const raw = localStorage.getItem(defaultStorageKey(mapId));
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function createViewportState() {
  return { x: 0, y: 0, scale: 1 };
}

export function clampScale(scale) {
  return Math.min(2, Math.max(0.45, scale));
}

export async function encodeFdhl(payload, contentType = 'workspace-archive') {
  const text = JSON.stringify(payload);
  const bytes = new TextEncoder().encode(text);
  const packed = await maybeDeflate(bytes);

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await getKey('current');
  const cipher = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv: toArrayBuffer(iv) }, key, toArrayBuffer(packed.bytes)));
  return `${ARCHIVE_PREFIX}§${contentType}§${packed.compressed ? '1' : '0'}§${encodeAlienFramed(iv)}§${encodeAlienFramed(cipher)}§${new Date().toISOString()}`;
}

export async function decodeFdhl(raw) {
  const text = String(raw ?? '').trim();
  if (!text) {
    throw new Error('Empty .fAdHiL/.fdhl content');
  }

  if (text.startsWith('{')) {
    const maybeJson = JSON.parse(text);
    if (Array.isArray(maybeJson?.nodes)) {
      return maybeJson;
    }
    return decodeFromJsonEnvelope(maybeJson);
  }

  const parsed = parseV2(text);
  if (!parsed) {
    throw new Error('Invalid .fAdHiL/.fdhl string format');
  }
  return decodeFromV2(parsed);
}

async function decodeFromJsonEnvelope(parsed) {
  const isLegacy = parsed?.magic === MAGIC && parsed?.version === 1 && parsed?.algo === LEGACY_ALGO;
  const isCurrent = parsed?.magic === MAGIC && parsed?.version === CURRENT_VERSION && parsed?.algo === CURRENT_ALGO;
  if (!isLegacy && !isCurrent) {
    throw new Error('Format file .fAdHiL tidak valid.');
  }
  if (typeof parsed?.iv !== 'string' || typeof parsed?.data !== 'string') {
    throw new Error('Metadata file .fAdHiL tidak lengkap.');
  }

  if (isLegacy) {
    const key = await getKey('legacy');
    const iv = fromBase64Url(parsed.iv);
    const cipher = fromBase64Url(parsed.data);
    const plain = new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: toArrayBuffer(iv) }, key, toArrayBuffer(cipher)));
    const unpacked = await maybeInflate(plain, 'gzip', Boolean(parsed.compressed));
    return JSON.parse(new TextDecoder().decode(unpacked));
  }

  return decodeFromV2(parsed);
}

async function decodeFromV2(parsed) {
  const key = await getKey('current');
  const ivCandidates = decodeAlienFramedCandidates(parsed.iv, 12);
  const cipherCandidates = decodeAlienFramedCandidates(parsed.data);
  let lastError = null;

  for (const iv of ivCandidates) {
    for (const cipher of cipherCandidates) {
      try {
        const plain = new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: toArrayBuffer(iv) }, key, toArrayBuffer(cipher)));
        const unpacked = await maybeInflate(plain, 'deflate-raw', Boolean(parsed.compressed));
        return JSON.parse(new TextDecoder().decode(unpacked));
      } catch (error) {
        lastError = error;
      }
    }
  }

  const message = lastError instanceof Error ? lastError.message : String(lastError ?? 'unknown');
  throw new Error(`Dekripsi .fAdHiL gagal: ${message}`);
}

async function getKey(mode) {
  const encoder = new TextEncoder();
  const base = await crypto.subtle.importKey('raw', encoder.encode(mode === 'legacy' ? PASSPHRASE_V1 : PASSPHRASE_V2), { name: 'PBKDF2' }, false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode(mode === 'legacy' ? SALT_V1 : SALT_V2),
      iterations: mode === 'legacy' ? 120000 : 150000,
      hash: 'SHA-256',
    },
    base,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

async function maybeDeflate(bytes) {
  if (typeof CompressionStream === 'undefined') return { bytes, compressed: false };
  const stream = new Blob([toArrayBuffer(bytes)]).stream().pipeThrough(new CompressionStream('deflate-raw'));
  const result = new Uint8Array(await new Response(stream).arrayBuffer());
  if (result.length >= bytes.length) {
    return { bytes, compressed: false };
  }
  return { bytes: result, compressed: true };
}

async function maybeInflate(bytes, format = 'deflate-raw', compressed = true) {
  if (!compressed) return bytes;
  if (typeof DecompressionStream === 'undefined') {
    throw new Error('Browser tidak mendukung dekompresi untuk file .fAdHiL terkompresi.');
  }
  try {
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream(format));
    return new Uint8Array(await new Response(stream).arrayBuffer());
  } catch (error) {
    throw new Error(`Dekompresi gagal: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function encodeAlienFramed(bytes) {
  return `${bytes.length.toString(36)}~${encodeAlienSymbols(bytes)}`;
}

function decodeAlienFramedCandidates(text, expectedLength) {
  const sep = text.indexOf('~');
  if (sep > 0) {
    const expected = Number.parseInt(text.slice(0, sep), 36);
    if (!Number.isFinite(expected) || expected < 0) {
      throw new Error('Header panjang simbol alien .fAdHiL tidak valid.');
    }
    const decoded = decodeAlienSymbols(text.slice(sep + 1));
    if (decoded.length < expected) {
      throw new Error('Data simbol alien .fAdHiL terpotong.');
    }
    return [decoded.slice(0, expected)];
  }

  const decoded = decodeAlienSymbols(text);
  const candidates = [decoded];
  if (decoded.length > 0) {
    candidates.push(decoded.slice(0, decoded.length - 1));
  }
  if (typeof expectedLength === 'number') {
    const exact = candidates.find((bytes) => bytes.length === expectedLength);
    if (exact) {
      return [exact];
    }
  }
  return candidates;
}

function encodeAlienSymbols(bytes) {
  let bits = 0;
  let bitCount = 0;
  let out = '';
  for (const byte of bytes) {
    bits = (bits << 8) | byte;
    bitCount += 8;
    while (bitCount >= 13) {
      bitCount -= 13;
      const value = (bits >> bitCount) & 0x1fff;
      out += String.fromCharCode(ALIEN_BLOCK_START + value);
      bits &= (1 << bitCount) - 1;
    }
  }
  if (bitCount > 0) {
    const value = (bits << (13 - bitCount)) & 0x1fff;
    out += String.fromCharCode(ALIEN_BLOCK_START + value);
  }
  return out;
}

function decodeAlienSymbols(text) {
  let bits = 0;
  let bitCount = 0;
  const out = [];
  for (let i = 0; i < text.length; i += 1) {
    const value = text.charCodeAt(i) - ALIEN_BLOCK_START;
    if (value < 0 || value >= ALIEN_BASE) throw new Error('Alien decode fail');
    bits = (bits << 13) | value;
    bitCount += 13;
    while (bitCount >= 8) {
      bitCount -= 8;
      out.push((bits >> bitCount) & 0xff);
      bits &= (1 << bitCount) - 1;
    }
  }
  return new Uint8Array(out);
}

function csvEsc(v) {
  const text = String(v).replaceAll('"', '""');
  return `"${text}"`;
}

function unCsv(v) {
  return v.replace(/^"|"$/g, '').replaceAll('""', '"');
}

function splitCsv(line) {
  const out = [];
  let current = '';
  let inQuote = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      inQuote = !inQuote;
      current += ch;
      continue;
    }
    if (ch === ',' && !inQuote) {
      out.push(current);
      current = '';
      continue;
    }
    current += ch;
  }
  out.push(current);
  return out;
}

function parseV2(raw) {
  if (!raw.startsWith(`${ARCHIVE_PREFIX}§`)) {
    return null;
  }
  const parts = raw.split('§');
  if (parts.length !== 6) {
    throw new Error('Format string .fAdHiL futuristik tidak valid.');
  }
  const [, contentType, compressedFlag, iv, data, exportedAt] = parts;
  return {
    magic: MAGIC,
    version: CURRENT_VERSION,
    algo: CURRENT_ALGO,
    contentType,
    compressed: compressedFlag === '1',
    iv,
    data,
    exportedAt,
  };
}

function toArrayBuffer(bytes) {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
}

function fromBase64Url(value) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  const output = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    output[i] = binary.charCodeAt(i);
  }
  return output;
}

export function parentIdOf(node) {
  return node.parentId ?? ROOT_PARENT;
}
