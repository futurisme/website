(function (global) {
  var DEBUG_SESSION_KEY = '__animeindustry_debug_once__';
  var DEBUG_DOM_ID = 'animeindustry-debug-once';

  function safeStringify(value) {
    try { return JSON.stringify(value, null, 2); } catch (_err) { return String(value); }
  }

  function getDebugHistory() {
    if (!global.__animeIndustryDebugHistory) global.__animeIndustryDebugHistory = [];
    return global.__animeIndustryDebugHistory;
  }

  function record(kind, detail) {
    var history = getDebugHistory();
    history.push({ kind: kind, timestamp: new Date().toISOString(), detail: detail || {} });
    if (history.length > 160) history.splice(0, history.length - 160);
    return history;
  }

  function hasTriggeredDebug() {
    try { return global.sessionStorage.getItem(DEBUG_SESSION_KEY) === '1' || !!global.__animeIndustryDebugTriggered; }
    catch (_err) { return !!global.__animeIndustryDebugTriggered; }
  }

  function markDebugTriggered() {
    global.__animeIndustryDebugTriggered = true;
    try { global.sessionStorage.setItem(DEBUG_SESSION_KEY, '1'); } catch (_err) {}
  }

  function openPanel(payload) {
    var doc = global.document;
    if (!doc || hasTriggeredDebug()) return false;
    if (doc.getElementById(DEBUG_DOM_ID) || !doc.body) return false;
    markDebugTriggered();

    var panel = doc.createElement('section');
    panel.id = DEBUG_DOM_ID;
    panel.style.cssText = 'position:fixed;inset:auto 12px 12px 12px;z-index:2147483647;padding:10px;border-radius:12px;border:1px solid #ef4444;background:#140b0b;color:#fecaca;font:12px/1.4 ui-monospace,Menlo,monospace;';

    var title = doc.createElement('strong');
    title.textContent = 'AnimeIndustry One-shot Debug Report';
    title.style.display = 'block';
    title.style.marginBottom = '6px';
    panel.appendChild(title);

    var pre = doc.createElement('pre');
    pre.style.cssText = 'margin:0;max-height:38vh;overflow:auto;white-space:pre-wrap;word-break:break-word;';
    pre.textContent = safeStringify(payload);
    panel.appendChild(pre);

    var row = doc.createElement('div');
    row.style.cssText = 'display:flex;gap:8px;margin-top:8px;';
    var copy = doc.createElement('button');
    copy.textContent = 'Copy Debug';
    copy.style.cssText = 'border:1px solid #f87171;background:#7f1d1d;color:#fee2e2;border-radius:8px;padding:4px 8px;cursor:pointer;';
    copy.addEventListener('click', function () {
      var nav = global.navigator;
      if (nav && nav.clipboard && typeof nav.clipboard.writeText === 'function') nav.clipboard.writeText(pre.textContent || '');
    }, { passive: true });

    var close = doc.createElement('button');
    close.textContent = 'Tutup';
    close.style.cssText = 'border:1px solid #374151;background:#0f172a;color:#cbd5e1;border-radius:8px;padding:4px 8px;cursor:pointer;';
    close.addEventListener('click', function () { panel.remove(); }, { passive: true });

    row.appendChild(copy);
    row.appendChild(close);
    panel.appendChild(row);
    doc.body.appendChild(panel);
    return true;
  }

  function report(kind, detail) {
    var history = record(kind, detail);
    var payload = {
      system: 'animeindustry',
      version: '2026.04.19-debug-once',
      kind: kind,
      timestamp: new Date().toISOString(),
      href: global.location && global.location.href ? global.location.href : '',
      detail: detail || {},
      history: history.slice(-60),
      causes: [
        'Interaksi UI mengirim payload tidak valid.',
        'State project tidak sinkron terhadap tahap produksi.',
        'Resource module gagal dimuat atau runtime throw exception.'
      ],
      predictions: [
        'Aksi tombol tertentu bisa gagal tanpa update state.',
        'Pipeline project dapat berhenti di tahap tertentu sampai reload.'
      ]
    };
    openPanel(payload);
    return payload;
  }

  function install() {
    if (global.__animeIndustryDebuggerInstalled) return;
    global.__animeIndustryDebuggerInstalled = true;

    global.addEventListener('error', function (event) {
      var target = event && event.target;
      if (target && target.tagName) {
        report('resource-error', { tagName: target.tagName, source: target.src || target.href || '', message: event.message || 'resource load error' });
        return;
      }
      report('runtime-error', { message: event.message || '', filename: event.filename || '', lineno: event.lineno || 0, colno: event.colno || 0 });
    }, true);

    global.addEventListener('unhandledrejection', function (event) {
      report('unhandled-rejection', { reason: event && event.reason ? String(event.reason) : 'unknown' });
    });
  }

  install();
  global.fadhilAnimeDebugger = { report: report };
})(typeof window !== 'undefined' ? window : globalThis);
