const ROOT_PARENT = -1;
const ARCHIVE_PREFIX = '🜂fAdHiL🜁';
const ALIEN_BLOCK_START = 0x3400;
const ALIEN_BASE = 8192;
const PASSPHRASE_V2 = 'FadhilAkbar.ChartWorkspace.FeatureLib.v2';
const SALT_V2 = 'ChartWorkspace::fAdHiL::Alien::2026';

export class FadhilMindmapLite {
  constructor() {
    this.version = 1;
    this.nextId = 2;
    this.nodes = [{ id: 1, title: 'Main Topic', parentId: null, x: 0, y: 0, depth: 0, weight: 1 }];
    this.links = [];
  }

  static fromSnapshot(snapshot) {
    const engine = new FadhilMindmapLite();
    if (snapshot?.nodes?.length) {
      engine.nodes = snapshot.nodes.map((n) => ({ ...n }));
      engine.links = Array.isArray(snapshot.links) ? snapshot.links.map((l) => ({ ...l })) : [];
      engine.nextId = Math.max(...engine.nodes.map((n) => n.id), 1) + 1;
      engine.version = snapshot.version || 1;
    }
    return engine;
  }

  getSnapshot() {
    const treeEdges = this.nodes.filter((n) => n.parentId !== null).map((n) => ({ from: n.parentId, to: n.id, kind: 'tree' }));
    const linkEdges = this.links.map((l) => ({ ...l, kind: 'link' }));
    return {
      version: this.version,
      nodes: this.nodes.map((n) => ({ ...n })),
      links: this.links.map((l) => ({ ...l })),
      edges: [...treeEdges, ...linkEdges],
    };
  }

  addNode(parentId, title = 'New Node') {
    const parent = this.nodes.find((n) => n.id === parentId) || this.nodes[0];
    const siblings = this.nodes.filter((n) => n.parentId === parent.id);
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
    this.nodes.push(node);
    this.version += 1;
    return node;
  }

  removeNode(id) {
    if (id === 1) return false;
    const target = this.nodes.find((n) => n.id === id);
    if (!target) return false;

    const parentId = target.parentId ?? 1;
    this.nodes = this.nodes
      .filter((n) => n.id !== id)
      .map((n) => (n.parentId === id ? { ...n, parentId } : n));

    this.links = this.links.filter((link) => link.from !== id && link.to !== id);
    this.version += 1;
    return true;
  }

  updateNode(id, patch) {
    const node = this.nodes.find((n) => n.id === id);
    if (!node) return;
    if (patch.title !== undefined) node.title = patch.title;
    if (patch.x !== undefined) node.x = patch.x;
    if (patch.y !== undefined) node.y = patch.y;
    this.version += 1;
  }

  connect(from, to) {
    if (from === to) return false;
    if (!this.nodes.some((n) => n.id === from) || !this.nodes.some((n) => n.id === to)) return false;
    if (this.links.some((l) => l.from === from && l.to === to)) return false;
    this.links.push({ from, to });
    this.version += 1;
    return true;
  }

  unconnectFrom(from) {
    const before = this.links.length;
    this.links = this.links.filter((l) => l.from !== from);
    if (this.links.length !== before) {
      this.version += 1;
      return true;
    }
    return false;
  }

  hasConnectionFrom(id) {
    return this.links.some((l) => l.from === id);
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
    this.version += 1;
    return true;
  }
}

export function buildEdgePath(from, to) {
  const midX = (from.x + to.x) / 2;
  return `M ${from.x} ${from.y} C ${midX} ${from.y}, ${midX} ${to.y}, ${to.x} ${to.y}`;
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

export async function encodeFdhl(payload) {
  const text = JSON.stringify(payload);
  const bytes = new TextEncoder().encode(text);
  const compressed = await maybeDeflate(bytes);

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await getKey();
  const cipher = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, compressed));
  return `${ARCHIVE_PREFIX}§workspace-archive§1§${encodeAlienFramed(iv)}§${encodeAlienFramed(cipher)}§${new Date().toISOString()}`;
}

export async function decodeFdhl(raw) {
  const parts = raw.split('§');
  if (!raw.startsWith(`${ARCHIVE_PREFIX}§`) || parts.length < 6) {
    throw new Error('Invalid .fdhl format');
  }
  const iv = decodeAlienFramed(parts[3]);
  const cipher = decodeAlienFramed(parts[4]);

  const key = await getKey();
  const plain = new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, cipher));
  const inflated = await maybeInflate(plain);
  return JSON.parse(new TextDecoder().decode(inflated));
}

async function getKey() {
  const encoder = new TextEncoder();
  const base = await crypto.subtle.importKey('raw', encoder.encode(PASSPHRASE_V2), { name: 'PBKDF2' }, false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: encoder.encode(SALT_V2), iterations: 150000, hash: 'SHA-256' },
    base,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

async function maybeDeflate(bytes) {
  if (typeof CompressionStream === 'undefined') return bytes;
  const stream = new Blob([bytes]).stream().pipeThrough(new CompressionStream('deflate-raw'));
  const result = new Uint8Array(await new Response(stream).arrayBuffer());
  return result.length < bytes.length ? result : bytes;
}

async function maybeInflate(bytes) {
  if (typeof DecompressionStream === 'undefined') return bytes;
  try {
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
    return new Uint8Array(await new Response(stream).arrayBuffer());
  } catch {
    return bytes;
  }
}

function encodeAlienFramed(bytes) {
  return `${bytes.length.toString(36)}~${encodeAlienSymbols(bytes)}`;
}

function decodeAlienFramed(text) {
  const sep = text.indexOf('~');
  const expected = Number.parseInt(text.slice(0, sep), 36);
  const decoded = decodeAlienSymbols(text.slice(sep + 1));
  return decoded.slice(0, expected);
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

export function parentIdOf(node) {
  return node.parentId ?? ROOT_PARENT;
}
