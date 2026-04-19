(function (global) {
  var DEBUG_SESSION_KEY = '__animeindustry_debug_once__';
  var DEBUG_DOM_ID = 'animeindustry-debug-once';
  var HISTORY_LIMIT = 260;

  function safeStringify(value) {
    try { return JSON.stringify(value, null, 2); } catch (_err) { return String(value); }
  }

  function getHistory() {
    if (!global.__animeIndustryDebugHistory) global.__animeIndustryDebugHistory = [];
    return global.__animeIndustryDebugHistory;
  }

  function inferCauses(kind, detail) {
    var causes = [];
    if (kind === 'resource-error' || kind === 'lib-load-failure') {
      causes.push('Engine/library module tidak ter-load (path salah, 404, MIME, cache stale).');
      causes.push('Asset di-deploy tidak sinkron dengan HTML terbaru.');
    }
    if (kind === 'bootstrap-error') causes.push('DOM root/elemen wajib tidak ditemukan saat startup.');
    if (kind === 'mechanism-warning') causes.push('Mekanisme stage/action dipanggil pada state yang tidak valid.');
    if (kind === 'interaction-error') causes.push('Aksi user melempar exception atau payload invalid.');
    if (kind === 'runtime-error' || kind === 'unhandled-rejection') causes.push('Exception runtime tidak tertangani pada event loop/module init.');
    if (causes.length === 0) causes.push('Anomali terdeteksi tanpa signature spesifik.');
    return causes;
  }

  function inferPredictions(kind, detail) {
    var predictions = [];
    if (kind === 'resource-error' || kind === 'lib-load-failure') {
      predictions.push('UI akan tampil tetapi data panel kosong karena runtime gagal boot.');
      predictions.push('Semua tombol aksi tidak mengubah state.');
    }
    if (kind === 'bootstrap-error') predictions.push('Render awal gagal total; diperlukan verifikasi id container dan urutan script.');
    if (kind === 'mechanism-warning') predictions.push('Pipeline project berisiko macet di stage tertentu sampai state diperbaiki/reset.');
    if (kind === 'interaction-error') predictions.push('Aksi sama berpotensi gagal berulang pada input berikutnya.');
    if (predictions.length === 0) predictions.push('Potensi degradasi pengalaman pengguna pada alur simulasi.');
    return predictions;
  }

  function pushHistory(kind, detail) {
    var history = getHistory();
    history.push({ kind: kind, timestamp: new Date().toISOString(), detail: detail || {} });
    if (history.length > HISTORY_LIMIT) history.splice(0, history.length - HISTORY_LIMIT);
    return history;
  }

  function hasTriggered() {
    try { return global.sessionStorage.getItem(DEBUG_SESSION_KEY) === '1' || !!global.__animeIndustryDebugTriggered; }
    catch (_err) { return !!global.__animeIndustryDebugTriggered; }
  }

  function markTriggered() {
    global.__animeIndustryDebugTriggered = true;
    try { global.sessionStorage.setItem(DEBUG_SESSION_KEY, '1'); } catch (_err) {}
  }

  function ensureContainer() {
    var doc = global.document;
    if (!doc || !doc.body) return null;
    var existing = doc.getElementById(DEBUG_DOM_ID);
    if (existing) return existing;

    var panel = doc.createElement('section');
    panel.id = DEBUG_DOM_ID;
    panel.style.cssText = 'position:fixed;inset:auto 10px 10px 10px;z-index:2147483647;padding:10px;border-radius:12px;border:1px solid #ef4444;background:#140b0b;color:#fecaca;font:12px/1.4 ui-monospace,Menlo,monospace;';

    var heading = doc.createElement('strong');
    heading.textContent = 'AnimeIndustry Aggressive Debugger';
    heading.style.display = 'block';
    heading.style.marginBottom = '6px';
    panel.appendChild(heading);

    var summary = doc.createElement('div');
    summary.id = DEBUG_DOM_ID + '-summary';
    summary.style.cssText = 'margin-bottom:6px;white-space:pre-wrap;';
    panel.appendChild(summary);

    var pre = doc.createElement('pre');
    pre.id = DEBUG_DOM_ID + '-payload';
    pre.style.cssText = 'margin:0;max-height:40vh;overflow:auto;white-space:pre-wrap;word-break:break-word;';
    panel.appendChild(pre);

    var row = doc.createElement('div');
    row.style.cssText = 'display:flex;gap:8px;margin-top:8px;';

    var copy = doc.createElement('button');
    copy.textContent = 'Copy Debug';
    copy.style.cssText = 'border:1px solid #f87171;background:#7f1d1d;color:#fee2e2;border-radius:8px;padding:4px 8px;cursor:pointer;';
    copy.addEventListener('click', function () {
      var nav = global.navigator;
      if (nav && nav.clipboard && typeof nav.clipboard.writeText === 'function') {
        nav.clipboard.writeText((pre.textContent || '') + '\n' + (summary.textContent || ''));
      }
    }, { passive: true });

    var close = doc.createElement('button');
    close.textContent = 'Tutup';
    close.style.cssText = 'border:1px solid #374151;background:#0f172a;color:#cbd5e1;border-radius:8px;padding:4px 8px;cursor:pointer;';
    close.addEventListener('click', function () { panel.remove(); }, { passive: true });

    row.appendChild(copy);
    row.appendChild(close);
    panel.appendChild(row);

    doc.body.appendChild(panel);
    return panel;
  }

  function report(kind, detail) {
    var history = pushHistory(kind, detail);
    var payload = {
      system: 'animeindustry',
      version: '2026.04.19-aggressive',
      kind: kind,
      timestamp: new Date().toISOString(),
      href: global.location && global.location.href ? global.location.href : '',
      causes: inferCauses(kind, detail),
      predictions: inferPredictions(kind, detail),
      detail: detail || {},
      history: history.slice(-80)
    };

    if (!hasTriggered()) markTriggered();
    var panel = ensureContainer();
    if (panel) {
      var summaryEl = panel.querySelector('#' + DEBUG_DOM_ID + '-summary');
      var payloadEl = panel.querySelector('#' + DEBUG_DOM_ID + '-payload');
      if (summaryEl) {
        summaryEl.textContent = [
          'kind: ' + kind,
          'causes: ' + payload.causes.join(' | '),
          'predictions: ' + payload.predictions.join(' | '),
          'history-size: ' + history.length,
        ].join('\n');
      }
      if (payloadEl) payloadEl.textContent = safeStringify(payload);
    }
    return payload;
  }

  function install() {
    if (global.__animeIndustryDebuggerInstalled) return;
    global.__animeIndustryDebuggerInstalled = true;

    global.addEventListener('error', function (event) {
      var target = event && event.target;
      if (target && target.tagName) {
        report('resource-error', {
          tagName: target.tagName,
          source: target.src || target.href || '',
          message: event.message || 'resource load error',
        });
        return;
      }
      report('runtime-error', {
        message: event.message || '',
        filename: event.filename || '',
        lineno: event.lineno || 0,
        colno: event.colno || 0,
      });
    }, true);

    global.addEventListener('unhandledrejection', function (event) {
      report('unhandled-rejection', {
        reason: event && event.reason ? String(event.reason && event.reason.message ? event.reason.message : event.reason) : 'unknown',
      });
    });

    global.setInterval(function () {
      var app = global.document && global.document.getElementById('animeIndustryApp');
      if (!app) report('bootstrap-error', { message: 'animeIndustryApp missing on watchdog' });
    }, 2500);
  }

  install();
  global.fadhilAnimeDebugger = { report: report };
})(typeof window !== 'undefined' ? window : globalThis);
