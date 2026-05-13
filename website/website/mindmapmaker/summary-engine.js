const STOPWORDS = new Set(['dan','yang','untuk','dari','pada','dengan','atau','the','and','for']);

export function summarizeMindmap(map) {
  const nodes = Array.isArray(map?.nodes) ? map.nodes : [];
  const links = Array.isArray(map?.links) ? map.links : [];
  if (!nodes.length) return 'Mindmap kosong. Tambahkan node utama, lalu kembangkan cabang prioritas.';
  const words = tokenize(nodes.map((n) => n?.title || n?.label || '').join(' '));
  const top = topKeywords(words, 5).join(', ') || 'topik umum';
  const root = nodes[0]?.title || nodes[0]?.label || 'Root';
  const density = links.length / Math.max(1, nodes.length);
  const maturity = density > 1.2 ? 'terhubung kuat' : density > 0.7 ? 'cukup terhubung' : 'masih linear';
  return `${root}: ${nodes.length} node, ${links.length} koneksi, fokus ${top}, struktur ${maturity}.`;
}

export function suggestFormatImprovements(map) {
  const nodes = Array.isArray(map?.nodes) ? map.nodes : [];
  const long = nodes.filter((n) => String(n?.title || '').length > 38).length;
  const empty = nodes.filter((n) => !String(n?.title || '').trim()).length;
  const tips = [];
  if (long > 0) tips.push(`Ringkas ${long} judul node agar <= 38 karakter.`);
  if (empty > 0) tips.push(`Isi ${empty} node yang masih kosong.`);
  tips.push('Gunakan pola: Topik > Subtopik > Aksi agar mudah dipindai.');
  return tips;
}

export function rankMindmaps(items) {
  return [...items].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0) || (b.nodeCount || 0) - (a.nodeCount || 0));
}

function tokenize(text) {
  return String(text).toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').split(/\s+/).filter((w) => w.length > 2 && !STOPWORDS.has(w));
}
function topKeywords(words, limit) {
  const m = new Map();
  for (const w of words) m.set(w, (m.get(w) || 0) + 1);
  return [...m.entries()].sort((a,b)=>b[1]-a[1]).slice(0, limit).map(([w])=>w);
}
