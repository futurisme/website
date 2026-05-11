(function (global) {
  const LIMIT = 400;
  const ID = 'dreambusiness-debugger';
  const state = { logs: [] };
  let hiddenUntilError = false;

  function severity(kind) {
    const key = String(kind || '').toLowerCase();
    if (key.includes('error') || key.includes('invalid') || key.includes('runtime') || key.includes('rejection')) return 'error';
    if (key.includes('warn') || key.includes('blocked')) return 'warn';
    return 'info';
  }

  function add(kind, message, detail) {
    const entry = { t: new Date().toISOString(), kind, message: String(message || ''), detail: detail || null, stack: detail && detail.stack ? String(detail.stack).slice(0, 5000) : null };
    state.logs.push(entry);
    if (state.logs.length > LIMIT) state.logs.splice(0, state.logs.length - LIMIT);
    if (severity(kind) !== 'info') hiddenUntilError = false;
    render();
  }

  function analyzeHistory() {
    const counts = { error: 0, warn: 0, info: 0 };
    state.logs.forEach((entry) => { counts[severity(entry.kind)] += 1; });
    const dominant = Object.entries(counts).sort((a,b)=>b[1]-a[1])[0];
    return { counts, dominant: dominant ? dominant[0] : "info" };
  }

  function infer(entry) {
    const text = `${entry.message} ${(entry.stack || '')}`.toLowerCase();
    if (text.includes('invalid game state')) return 'Kemungkinan state mutation gagal sinkron setelah tick/action.';
    if (text.includes('cannot read properties')) return 'Kemungkinan elemen DOM atau data object null/undefined.';
    if (text.includes('blocked: device release needs')) return 'Perangkat mencoba rilis tanpa CPU market; aturan dependency aktif.';
    if (text.includes('404') || text.includes('resource')) return 'Kemungkinan path asset/deploy mismatch atau cache stale.';
    return 'Perlu inspeksi stack + urutan aksi terakhir pada riwayat.';
  }

  function ensurePanel() {
    if (!global.document || !document.body) return null;
    let panel = document.getElementById(ID);
    if (panel) return panel;
    panel = document.createElement('section');
    panel.id = ID;
    panel.style.cssText = 'position:fixed;left:10px;right:10px;bottom:10px;z-index:2147483647;background:#111827;color:#e5e7eb;border:1px solid #ef4444;border-radius:10px;padding:8px;font:12px/1.4 ui-monospace,monospace;max-height:50vh;overflow:auto;display:none';
    document.body.appendChild(panel);
    return panel;
  }

  async function copyLogs() {
    const payload = JSON.stringify({ generatedAt: new Date().toISOString(), total: state.logs.length, logs: state.logs }, null, 2);
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) await navigator.clipboard.writeText(payload);
      else {
        const ta = document.createElement('textarea');
        ta.value = payload; ta.style.position = 'fixed'; ta.style.opacity = '0';
        document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove();
      }
      add('debugger-info', 'Full logs copied to clipboard');
    } catch (error) {
      add('debugger-error', 'Failed to copy logs', { stack: error instanceof Error ? error.stack : String(error) });
    }
  }

  function render() {
    const panel = ensurePanel();
    if (!panel) return;
    if (!state.logs.length) { panel.style.display = 'none'; return; }
    const last = state.logs[state.logs.length - 1];
    const sev = severity(last.kind);
    if (hiddenUntilError && sev === 'info') { panel.style.display = 'none'; return; }
    if (sev === 'info') { panel.style.display = 'none'; return; }
    panel.style.display = 'block';
    const serialized = state.logs.map((l, i) => `#${i + 1} ${l.t} [${l.kind}] ${l.message}${l.stack ? `\n${l.stack}` : ''}`).join('\n\n');
    const analysis = analyzeHistory();
    panel.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><strong>DreamBusiness Debugger</strong><div style="display:flex;gap:6px"><button id="dreambusiness-debug-close" style="border:1px solid #7f1d1d;background:#1f2937;color:#fca5a5;border-radius:8px;padding:4px 8px;cursor:pointer">Close</button><button id="dreambusiness-debug-copy" style="border:1px solid #374151;background:#0f172a;color:#e5e7eb;border-radius:8px;padding:4px 8px;cursor:pointer">Copy Full Logs</button></div></div><div>Latest: ${last.kind} • ${last.message}</div><div>Prediksi: ${infer(last)}</div><div>Trend: dominant=${analysis.dominant} • error=${analysis.counts.error} warn=${analysis.counts.warn} info=${analysis.counts.info}</div><hr/><pre>${serialized}</pre>`;
    const copyBtn = panel.querySelector('#dreambusiness-debug-copy');
    if (copyBtn) copyBtn.onclick = copyLogs;
    const closeBtn = panel.querySelector('#dreambusiness-debug-close');
    if (closeBtn) closeBtn.onclick = () => { hiddenUntilError = true; panel.style.display = 'none'; };
  }

  global.addEventListener('error', (ev) => add('runtime-error', ev.message || 'window error', { filename: ev.filename, lineno: ev.lineno, colno: ev.colno, stack: ev.error && ev.error.stack }));
  global.addEventListener('unhandledrejection', (ev) => add('unhandled-rejection', ev.reason && ev.reason.message ? ev.reason.message : String(ev.reason), { stack: ev.reason && ev.reason.stack }));

  const cErr = console.error.bind(console);
  console.error = function (...args) { add('console-error', args.map((x) => typeof x === 'string' ? x : JSON.stringify(x)).join(' ')); cErr(...args); };
  const cWarn = console.warn.bind(console);
  console.warn = function (...args) { add('console-warn', args.map((x) => typeof x === 'string' ? x : JSON.stringify(x)).join(' ')); cWarn(...args); };

  global.__dreambusinessDebug = { report: (kind, message, detail) => add(kind, message, detail), getHistory: () => state.logs.slice() };
})(window);
