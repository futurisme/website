(function (global) {
  var DEBUG_SESSION_KEY = '__animeindustry_debug_once__';
  var DEBUG_DOM_ID = 'animeindustry-debug-once';
  var HISTORY_LIMIT = 320;
  var WATCHDOG_INTERVAL_MS = 2600;
  var REPORT_DEDUP_WINDOW_MS = 1800;

  function nowIso() { return new Date().toISOString(); }

  function safeStringify(value) {
    try { return JSON.stringify(value, null, 2); } catch (_err) { return String(value); }
  }

  function toPlainError(reason) {
    if (!reason) return { message: 'unknown' };
    if (reason instanceof Error) {
      return {
        name: reason.name || 'Error',
        message: reason.message || String(reason),
        stack: String(reason.stack || '').slice(0, 4000),
      };
    }
    return { message: typeof reason === 'string' ? reason : safeStringify(reason) };
  }

  function getHistory() {
    if (!global.__animeIndustryDebugHistory) global.__animeIndustryDebugHistory = [];
    return global.__animeIndustryDebugHistory;
  }

  function getDedupMap() {
    if (!global.__animeIndustryDebugDedupMap) global.__animeIndustryDebugDedupMap = new Map();
    return global.__animeIndustryDebugDedupMap;
  }

  function computeSignature(kind, detail) {
    var core = [
      kind || 'unknown',
      detail && detail.message ? detail.message : '',
      detail && detail.filename ? detail.filename : '',
      detail && detail.source ? detail.source : '',
      detail && detail.action ? detail.action : '',
      detail && detail.selector ? detail.selector : '',
    ].join('|');
    return core.slice(0, 420);
  }

  function shouldDedup(kind, detail) {
    var map = getDedupMap();
    var sig = computeSignature(kind, detail);
    var now = Date.now();
    var last = map.get(sig) || 0;
    map.set(sig, now);
    return now - last < REPORT_DEDUP_WINDOW_MS;
  }

  function pushHistory(entry) {
    var history = getHistory();
    history.push(entry);
    if (history.length > HISTORY_LIMIT) history.splice(0, history.length - HISTORY_LIMIT);
    return history;
  }

  function inferCauses(kind, detail) {
    var causes = [];
    var msg = String((detail && detail.message) || '').toLowerCase();
    var stack = String((detail && detail.stack) || '').toLowerCase();

    if (kind === 'resource-error' || kind === 'lib-load-failure') {
      causes.push({ text: 'Resource/module gagal load (404, path salah, MIME mismatch, atau cache stale).', confidence: 0.92 });
      causes.push({ text: 'Build/deploy tidak sinkron sehingga HTML memanggil bundle lama/baru yang tidak cocok.', confidence: 0.78 });
    }

    if (kind === 'bootstrap-error' || kind === 'ui-contract-issue') {
      causes.push({ text: 'Elemen DOM kontrak UI tidak tersedia (id/data-action mismatch atau render belum selesai).', confidence: 0.9 });
    }

    if (kind === 'mechanism-warning' || kind === 'interaction-error') {
      causes.push({ text: 'Aksi dipanggil pada state tidak valid (stage belum memenuhi prasyarat atau payload kosong).', confidence: 0.84 });
    }

    if (kind === 'runtime-error' || kind === 'unhandled-rejection') {
      causes.push({ text: 'Exception runtime tidak tertangani di event loop/modul init.', confidence: 0.88 });
      if (msg.indexOf('cannot read properties') >= 0 || msg.indexOf('undefined') >= 0) {
        causes.push({ text: 'Akses properti pada object null/undefined (binding element/state hilang).', confidence: 0.95 });
      }
      if (msg.indexOf('addEventListener'.toLowerCase()) >= 0 || stack.indexOf('queryselector') >= 0) {
        causes.push({ text: 'Listener dipasang ke element yang tidak ditemukan.', confidence: 0.91 });
      }
      if (msg.indexOf('json') >= 0 || msg.indexOf('parse') >= 0) {
        causes.push({ text: 'Parsing payload/save gagal karena format tidak valid atau data korup.', confidence: 0.83 });
      }
    }

    if (kind === 'console-error') {
      causes.push({ text: 'Ada error yang tercetak di console dan berpotensi memblokir sebagian alur game.', confidence: 0.76 });
    }

    if (causes.length === 0) {
      causes.push({ text: 'Anomali terdeteksi tanpa signature kuat; butuh korelasi history + stack.', confidence: 0.45 });
    }

    return causes;
  }

  function inferPredictions(kind, detail) {
    var predictions = [];
    if (kind === 'resource-error' || kind === 'lib-load-failure') {
      predictions.push({ text: 'Mainframe bisa tampil tetapi aksi gameplay tidak memutakhirkan state.', risk: 'high' });
    }
    if (kind === 'bootstrap-error' || kind === 'ui-contract-issue') {
      predictions.push({ text: 'Sebagian tombol/frame tidak responsif sampai struktur DOM dikoreksi.', risk: 'high' });
    }
    if (kind === 'mechanism-warning' || kind === 'interaction-error') {
      predictions.push({ text: 'Pipeline project dapat macet pada stage tertentu sampai syarat terpenuhi.', risk: 'medium' });
    }
    if (kind === 'runtime-error' || kind === 'unhandled-rejection') {
      predictions.push({ text: 'Error berulang pada aksi serupa dan berpotensi merusak autosave/session.', risk: 'high' });
    }
    if (kind === 'console-warn') {
      predictions.push({ text: 'Ada potensi bug laten; belum selalu fatal namun bisa eskalasi.', risk: 'low' });
    }
    if (predictions.length === 0) {
      predictions.push({ text: 'Pengalaman pengguna berpotensi terdegradasi jika anomali berulang.', risk: 'medium' });
    }
    return predictions;
  }

  function computeConfidence(causes) {
    var max = 0;
    for (var i = 0; i < causes.length; i += 1) max = Math.max(max, Number(causes[i].confidence) || 0);
    return max || 0.45;
  }

  function analyze(detail, history) {
    var recent = history.slice(-14);
    var byKind = {};
    for (var i = 0; i < recent.length; i += 1) {
      var k = recent[i].kind || 'unknown';
      byKind[k] = (byKind[k] || 0) + 1;
    }

    var dominantKind = null;
    var dominantCount = 0;
    var keys = Object.keys(byKind);
    for (var j = 0; j < keys.length; j += 1) {
      if (byKind[keys[j]] > dominantCount) {
        dominantKind = keys[j];
        dominantCount = byKind[keys[j]];
      }
    }

    var trend = dominantKind ? ('Dominan: ' + dominantKind + ' x' + dominantCount + ' (14 event terakhir).') : 'Belum cukup data trend.';
    var nextAction = 'Periksa payload detail + stack pada event terbaru, lalu validasi elemen DOM dan urutan inisialisasi.';

    if (dominantKind === 'ui-contract-issue' || dominantKind === 'bootstrap-error') {
      nextAction = 'Audit id/data-action di HTML vs querySelector/listener, serta pastikan render frame dilakukan setelah DOM ready.';
    } else if (dominantKind === 'resource-error') {
      nextAction = 'Validasi path module, response status, MIME type, dan sinkronisasi artefak deploy.';
    } else if (dominantKind === 'runtime-error' || dominantKind === 'unhandled-rejection') {
      nextAction = 'Periksa stack trace teratas dan tambah guard null-state pada path yang terindikasi.';
    }

    return {
      trend: trend,
      nextAction: nextAction,
      frequentKinds: byKind,
      lastMessage: detail && detail.message ? detail.message : '',
    };
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
    panel.style.cssText = [
      'position:fixed',
      'right:10px',
      'left:10px',
      'bottom:10px',
      'z-index:2147483647',
      'padding:10px',
      'border-radius:12px',
      'border:1px solid #ef4444',
      'background:#120c0d',
      'color:#fee2e2',
      'font:12px/1.4 ui-monospace,Menlo,monospace',
      'box-shadow:0 10px 24px rgba(0,0,0,.45)',
      'max-height:62vh',
      'overflow:auto'
    ].join(';') + ';';

    var heading = doc.createElement('strong');
    heading.textContent = 'AnimeIndustry Smart Debug Console';
    heading.style.cssText = 'display:block;margin-bottom:6px;color:#fecaca;';
    panel.appendChild(heading);

    var status = doc.createElement('div');
    status.id = DEBUG_DOM_ID + '-status';
    status.style.cssText = 'margin-bottom:8px;white-space:pre-wrap;border:1px solid #7f1d1d;background:#1f1114;border-radius:8px;padding:7px;';
    panel.appendChild(status);

    var causes = doc.createElement('div');
    causes.id = DEBUG_DOM_ID + '-causes';
    causes.style.cssText = 'margin-bottom:8px;white-space:pre-wrap;';
    panel.appendChild(causes);

    var predictions = doc.createElement('div');
    predictions.id = DEBUG_DOM_ID + '-predictions';
    predictions.style.cssText = 'margin-bottom:8px;white-space:pre-wrap;';
    panel.appendChild(predictions);

    var logs = doc.createElement('pre');
    logs.id = DEBUG_DOM_ID + '-payload';
    logs.style.cssText = 'margin:0;max-height:26vh;overflow:auto;white-space:pre-wrap;word-break:break-word;border:1px solid #7f1d1d;background:#140f11;border-radius:8px;padding:7px;';
    panel.appendChild(logs);

    var row = doc.createElement('div');
    row.style.cssText = 'display:flex;gap:8px;margin-top:8px;';

    var copy = doc.createElement('button');
    copy.textContent = 'Copy Report';
    copy.style.cssText = 'border:1px solid #f87171;background:#7f1d1d;color:#fee2e2;border-radius:8px;padding:4px 8px;cursor:pointer;';
    copy.addEventListener('click', function () {
      var payload = panel.getAttribute('data-last-payload') || '';
      var nav = global.navigator;
      if (nav && nav.clipboard && typeof nav.clipboard.writeText === 'function') {
        nav.clipboard.writeText(payload);
      }
    }, { passive: true });

    var clear = doc.createElement('button');
    clear.textContent = 'Clear Log';
    clear.style.cssText = 'border:1px solid #475569;background:#0f172a;color:#cbd5e1;border-radius:8px;padding:4px 8px;cursor:pointer;';
    clear.addEventListener('click', function () {
      var history = getHistory();
      history.splice(0, history.length);
      logs.textContent = 'History cleared.';
    }, { passive: true });

    var close = doc.createElement('button');
    close.textContent = 'Tutup';
    close.style.cssText = 'border:1px solid #374151;background:#0b1220;color:#cbd5e1;border-radius:8px;padding:4px 8px;cursor:pointer;';
    close.addEventListener('click', function () { panel.remove(); }, { passive: true });

    row.appendChild(copy);
    row.appendChild(clear);
    row.appendChild(close);
    panel.appendChild(row);

    doc.body.appendChild(panel);
    return panel;
  }

  function renderPanel(panel, payload) {
    var statusEl = panel.querySelector('#' + DEBUG_DOM_ID + '-status');
    var causesEl = panel.querySelector('#' + DEBUG_DOM_ID + '-causes');
    var predEl = panel.querySelector('#' + DEBUG_DOM_ID + '-predictions');
    var payloadEl = panel.querySelector('#' + DEBUG_DOM_ID + '-payload');

    if (statusEl) {
      statusEl.textContent = [
        'kind: ' + payload.kind + ' | severity: ' + payload.severity,
        'confidence: ' + Math.round((payload.confidence || 0) * 100) + '%',
        'time: ' + payload.timestamp,
        'trend: ' + payload.analysis.trend,
        'next-step: ' + payload.analysis.nextAction,
        'history-size: ' + payload.history.length,
      ].join('\n');
    }

    if (causesEl) {
      causesEl.textContent = 'PENYEBAB TERDETEKSI:\n- ' + payload.causes.map(function (entry) {
        return entry.text + ' (conf ' + Math.round((entry.confidence || 0) * 100) + '%)';
      }).join('\n- ');
    }

    if (predEl) {
      predEl.textContent = 'PREDIKSI DAMPAK:\n- ' + payload.predictions.map(function (entry) {
        return entry.text + ' [risk ' + String(entry.risk || 'medium').toUpperCase() + ']';
      }).join('\n- ');
    }

    if (payloadEl) {
      payloadEl.textContent = safeStringify({
        latest: payload.detail,
        frequentKinds: payload.analysis.frequentKinds,
        recent: payload.history.slice(-22)
      });
    }

    panel.setAttribute('data-last-payload', safeStringify(payload));
  }

  function report(kind, detail) {
    if (shouldDedup(kind, detail)) return null;

    var severity = kind === 'runtime-error' || kind === 'resource-error' || kind === 'unhandled-rejection' || kind === 'bootstrap-error'
      ? 'critical'
      : (kind === 'interaction-error' || kind === 'ui-contract-issue' ? 'high' : 'medium');

    var entry = {
      kind: kind,
      timestamp: nowIso(),
      detail: detail || {},
      severity: severity,
    };

    var history = pushHistory(entry);
    var causes = inferCauses(kind, detail || {});
    var predictions = inferPredictions(kind, detail || {});
    var payload = {
      system: 'animeindustry',
      version: '2026.04.25-smart-debugger',
      kind: kind,
      severity: severity,
      timestamp: entry.timestamp,
      href: global.location && global.location.href ? global.location.href : '',
      causes: causes,
      predictions: predictions,
      confidence: computeConfidence(causes),
      detail: detail || {},
      analysis: analyze(detail || {}, history),
      history: history.slice(-120)
    };

    if (!hasTriggered()) markTriggered();
    var panel = ensureContainer();
    if (panel) renderPanel(panel, payload);
    return payload;
  }

  function checkUiContracts() {
    var doc = global.document;
    if (!doc) return;

    var app = doc.getElementById('animeIndustryApp');
    if (!app) {
      report('bootstrap-error', { message: 'animeIndustryApp missing on watchdog', selector: '#animeIndustryApp' });
      return;
    }

    var required = [
      '#frameFullProjects',
      '#frameSubProjectCreate',
      '#subProjectCreateBody',
      '[data-action="to-full-projects"]',
      '[data-action="open-create-project"]',
    ];

    for (var i = 0; i < required.length; i += 1) {
      var selector = required[i];
      if (!doc.querySelector(selector)) {
        report('ui-contract-issue', {
          message: 'Required UI selector missing',
          selector: selector,
          action: 'watchdog-ui-contract',
        });
      }
    }
  }

  function installConsoleHooks() {
    if (global.__animeIndustryConsoleHooksInstalled) return;
    global.__animeIndustryConsoleHooksInstalled = true;

    var originalError = global.console && global.console.error ? global.console.error.bind(global.console) : null;
    var originalWarn = global.console && global.console.warn ? global.console.warn.bind(global.console) : null;

    if (originalError) {
      global.console.error = function () {
        var args = Array.prototype.slice.call(arguments || []);
        var message = args.map(function (arg) {
          return arg instanceof Error ? (arg.message || String(arg)) : (typeof arg === 'string' ? arg : safeStringify(arg));
        }).join(' | ').slice(0, 3000);
        report('console-error', { message: message, args: args.map(function (arg) { return String(arg); }).slice(0, 6) });
        originalError.apply(global.console, args);
      };
    }

    if (originalWarn) {
      global.console.warn = function () {
        var args = Array.prototype.slice.call(arguments || []);
        var message = args.map(function (arg) { return typeof arg === 'string' ? arg : safeStringify(arg); }).join(' | ').slice(0, 2000);
        report('console-warn', { message: message });
        originalWarn.apply(global.console, args);
      };
    }
  }

  function install() {
    if (global.__animeIndustryDebuggerInstalled) return;
    global.__animeIndustryDebuggerInstalled = true;

    installConsoleHooks();

    global.addEventListener('error', function (event) {
      var target = event && event.target;
      if (target && target.tagName && target !== global) {
        report('resource-error', {
          tagName: target.tagName,
          source: target.src || target.href || '',
          message: event.message || 'resource load error',
        });
        return;
      }

      var err = event && event.error ? toPlainError(event.error) : null;
      report('runtime-error', {
        message: (event && event.message) || (err && err.message) || '',
        filename: (event && event.filename) || '',
        lineno: (event && event.lineno) || 0,
        colno: (event && event.colno) || 0,
        stack: err && err.stack ? err.stack : '',
      });
    }, true);

    global.addEventListener('unhandledrejection', function (event) {
      var reason = toPlainError(event ? event.reason : null);
      report('unhandled-rejection', {
        message: reason.message,
        stack: reason.stack || '',
        name: reason.name || '',
      });
    });

    global.setInterval(function () {
      checkUiContracts();
    }, WATCHDOG_INTERVAL_MS);
  }

  install();
  global.fadhilAnimeDebugger = { report: report };
})(typeof window !== 'undefined' ? window : globalThis);
