export function summarizeMindmap(map) {
  const nodes = Array.isArray(map?.nodes) ? map.nodes : [];
  if (!nodes.length) return 'Belum ada node. Mulai dari topik utama lalu tambah cabang inti.';
  const titles = nodes.map((n) => String(n?.label || n?.title || '').trim()).filter(Boolean);
  const uniq = [...new Set(titles)].slice(0, 6);
  const focus = uniq.slice(0, 3).join(', ');
  const depthHint = nodes.length > 20 ? 'struktur cukup detail' : 'struktur masih ringkas';
  return `Mindmap berisi ${nodes.length} node, fokus: ${focus || 'topik umum'}, ${depthHint}.`;
}

export function rankMindmaps(items) {
  return [...items].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
}
