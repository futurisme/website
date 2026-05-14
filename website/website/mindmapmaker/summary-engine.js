const STOPWORDS = new Set(['dan','yang','untuk','dari','pada','dengan','atau','the','and','for']);

export function summarizeMindmap(map) {
  const nodes = Array.isArray(map?.nodes) ? map.nodes : [];
  const links = Array.isArray(map?.links) ? map.links : [];
  if (!nodes.length) return 'Mindmap kosong. Tambahkan node utama, lalu kembangkan cabang prioritas.';
  const words = tokenize(nodes.map((n) => n?.title || n?.label || '').join(' '));
  const top = topKeywords(words, 4).join(', ') || 'topik umum';
  const root = nodes[0]?.title || nodes[0]?.label || 'Root';
  const density = links.length / Math.max(1, nodes.length);
  const maturity = density > 1.2 ? 'sangat terstruktur' : density > 0.7 ? 'cukup terstruktur' : 'masih linear';
  const avgTitle = Math.round(nodes.reduce((a,n)=>a+String(n?.title||n?.label||'').length,0)/Math.max(1,nodes.length));
  return `${root}: ${nodes.length} node, ${links.length} koneksi, fokus ${top}, ${maturity}, rata-rata judul ${avgTitle} karakter.`;
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


export function classifyContributionActivity(events) {
  const result = { node_add: 0, text_add: 0, link_add: 0, edit: 0, other: 0, total: 0, byDay: new Map() };
  for (const ev of Array.isArray(events) ? events : []) {
    const t = String(ev?.type || 'other');
    const delta = Math.max(1, Number(ev?.delta || 1));
    const d = String(ev?.d || new Date(ev?.t || Date.now()).toISOString().slice(0,10));
    if (t === 'node_add') result.node_add += delta;
    else if (t === 'text_add') result.text_add += delta;
    else if (t === 'link_add') result.link_add += delta;
    else if (t === 'edit' || t === 'rename' || t === 'move') result.edit += delta;
    else result.other += delta;
    result.total += delta;
    result.byDay.set(d, (result.byDay.get(d) || 0) + delta);
  }
  return result;
}
