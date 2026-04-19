(function (global) {
  var DEBUG_SESSION_KEY = '__fwrpg_debug_once__';
  var DEBUG_DOM_ID = 'fwrpg-debug-once';

  function safeStringify(value) {
    try {
      return JSON.stringify(value, null, 2);
    } catch (_err) {
      return String(value);
    }
  }

  function buildLikelyCauses(payload) {
    var causes = [];
    if (payload.kind === 'lib-load-failure') {
      causes.push('Path script tidak valid atau file tidak ikut ter-deploy.');
      causes.push('Akses file diblokir (404/403/CSP/MIME mismatch).');
      causes.push('Service worker / cache lama masih menunjuk versi file yang hilang.');
    }
    if (payload.kind === 'resource-error') {
      causes.push('Resource gagal dimuat akibat URL salah, cache stale, atau kebijakan keamanan browser.');
    }
    if (payload.kind === 'runtime-error' || payload.kind === 'interaction-error') {
      causes.push('Exception saat eksekusi runtime/interaksi tombol.');
      causes.push('State tidak valid (null/undefined) ketika handler dipicu.');
    }
    if (payload.kind === 'unhandled-rejection') {
      causes.push('Promise rejection tidak ditangani, biasanya dari async flow yang gagal.');
    }
    if (causes.length === 0) causes.push('Anomali terdeteksi tanpa signature spesifik.');
    return causes;
  }

  function buildPredictions(payload) {
    var predictions = [];
    if (payload.kind === 'lib-load-failure') {
      predictions.push('Fitur RPG tidak akan terinisialisasi dan status UI tetap di mode gagal load.');
      predictions.push('Semua interaksi tombol yang bergantung pada library akan non-fungsional.');
    } else if (payload.kind === 'interaction-error') {
      predictions.push('Aksi berikutnya berpotensi gagal pada hero/action yang sama sampai state direfresh.');
    } else if (payload.kind === 'runtime-error') {
      predictions.push('Render parsial mungkin masih jalan, namun beberapa frame dapat gagal update.');
    } else {
      predictions.push('Kegagalan berulang mungkin muncul ketika pemicu yang sama terjadi lagi.');
    }
    return predictions;
  }

  function hasTriggeredDebug() {
    if (!global || !global.sessionStorage) return !!global.__fwrpgDebugTriggered;
    try {
      return global.sessionStorage.getItem(DEBUG_SESSION_KEY) === '1' || !!global.__fwrpgDebugTriggered;
    } catch (_err) {
      return !!global.__fwrpgDebugTriggered;
    }
  }

  function markDebugTriggered() {
    global.__fwrpgDebugTriggered = true;
    if (!global || !global.sessionStorage) return;
    try {
      global.sessionStorage.setItem(DEBUG_SESSION_KEY, '1');
    } catch (_err) {}
  }

  function openDebugContainer(payload) {
    var doc = global && global.document;
    if (!doc || hasTriggeredDebug()) return false;
    var body = doc.body;
    if (!body) return false;

    if (doc.getElementById(DEBUG_DOM_ID)) return false;
    markDebugTriggered();

    var panel = doc.createElement('section');
    panel.id = DEBUG_DOM_ID;
    panel.setAttribute('role', 'alert');
    panel.style.cssText = 'position:fixed;inset:auto 12px 12px 12px;z-index:2147483647;padding:10px;border-radius:12px;border:1px solid #ef4444;background:#140b0b;color:#fecaca;font:12px/1.4 ui-monospace,Menlo,monospace;box-shadow:0 8px 24px rgba(0,0,0,.45)';

    var heading = doc.createElement('strong');
    heading.textContent = 'RPG One-shot Debug Report';
    heading.style.display = 'block';
    heading.style.marginBottom = '6px';
    panel.appendChild(heading);

    var detail = doc.createElement('pre');
    detail.style.cssText = 'margin:0;max-height:38vh;overflow:auto;white-space:pre-wrap;word-break:break-word;';
    detail.textContent = safeStringify(payload);
    panel.appendChild(detail);

    var actions = doc.createElement('div');
    actions.style.cssText = 'display:flex;gap:6px;margin-top:8px;';
    var copyBtn = doc.createElement('button');
    copyBtn.textContent = 'Copy Debug';
    copyBtn.style.cssText = 'border:1px solid #f87171;background:#7f1d1d;color:#fee2e2;border-radius:8px;padding:4px 8px;cursor:pointer;';
    copyBtn.addEventListener('click', function () {
      var text = detail.textContent || '';
      var nav = global.navigator;
      if (nav && nav.clipboard && typeof nav.clipboard.writeText === 'function') {
        nav.clipboard.writeText(text);
      }
    }, { passive: true });

    var closeBtn = doc.createElement('button');
    closeBtn.textContent = 'Tutup';
    closeBtn.style.cssText = 'border:1px solid #374151;background:#0f172a;color:#cbd5e1;border-radius:8px;padding:4px 8px;cursor:pointer;';
    closeBtn.addEventListener('click', function () { panel.remove(); }, { passive: true });

    actions.appendChild(copyBtn);
    actions.appendChild(closeBtn);
    panel.appendChild(actions);
    body.appendChild(panel);
    return true;
  }

  function buildDebugPayload(kind, detail) {
    var info = detail || {};
    var payload = {
      system: 'fadhilwebrpglib',
      version: '2026.04.18-debug-once',
      kind: kind,
      timestamp: new Date().toISOString(),
      href: global.location && global.location.href ? global.location.href : '',
      causes: [],
      predictions: [],
      detail: info
    };
    payload.causes = buildLikelyCauses(payload);
    payload.predictions = buildPredictions(payload);
    return payload;
  }

  function reportDebugIssue(kind, detail) {
    var payload = buildDebugPayload(kind, detail);
    openDebugContainer(payload);
    return payload;
  }

  function installOneShotDebug(options) {
    var doc = global && global.document;
    if (!doc || global.__fwrpgDebugInstalled) return { report: reportDebugIssue };
    global.__fwrpgDebugInstalled = true;

    var config = options || {};
    var param = config.triggerParam || 'rpgdebug';
    var search = (global.location && global.location.search) || '';
    if (search.indexOf(param + '=1') >= 0) {
      reportDebugIssue('manual-trigger', { source: 'query-param' });
    }

    global.addEventListener('error', function (event) {
      var target = event && event.target;
      if (target && target.tagName) {
        reportDebugIssue('resource-error', {
          tagName: target.tagName,
          source: target.src || target.href || '',
          message: event.message || 'resource load error'
        });
        return;
      }
      reportDebugIssue('runtime-error', {
        message: event.message || '',
        filename: event.filename || '',
        lineno: event.lineno || 0,
        colno: event.colno || 0
      });
    }, true);

    global.addEventListener('unhandledrejection', function (event) {
      reportDebugIssue('unhandled-rejection', {
        reason: event && event.reason ? String(event.reason && event.reason.message ? event.reason.message : event.reason) : 'unknown'
      });
    });

    return { report: reportDebugIssue };
  }

  function seededRandom(seed) {
    var localSeed = seed >>> 0;
    return function () {
      localSeed ^= localSeed << 13;
      localSeed ^= localSeed >>> 17;
      localSeed ^= localSeed << 5;
      return (localSeed >>> 0) / 4294967295;
    };
  }

  var elementTable = {
    fire: { fire: 1, water: 0.78, wind: 1.12, earth: 1.08, light: 1, shadow: 1 },
    water: { fire: 1.24, water: 1, wind: 0.94, earth: 0.9, light: 1, shadow: 1 },
    wind: { fire: 0.96, water: 1.08, wind: 1, earth: 1.2, light: 1, shadow: 1 },
    earth: { fire: 0.92, water: 1.15, wind: 0.82, earth: 1, light: 1, shadow: 1 },
    light: { fire: 1, water: 1, wind: 1, earth: 1, light: 0.92, shadow: 1.2 },
    shadow: { fire: 1, water: 1, wind: 1, earth: 1, light: 1.25, shadow: 0.9 }
  };

  function defaultWorldMap() {
    return {
      width: 1280,
      height: 900,
      playerLocationId: 'loc-aurelia',
      camera: { x: 0, y: 0, zoom: 1 },
      locations: [
        { id: 'loc-aurelia', name: 'Aurelia City', type: 'city', x: 220, y: 250, danger: 1, neighbors: ['loc-kaze', 'loc-benteng'] },
        { id: 'loc-kaze', name: 'Kaze Village', type: 'village', x: 400, y: 430, danger: 2, neighbors: ['loc-aurelia', 'loc-ruins'] },
        { id: 'loc-benteng', name: 'Benteng Sol', type: 'city', x: 550, y: 180, danger: 3, neighbors: ['loc-aurelia', 'loc-ruins', 'loc-oracle'] },
        { id: 'loc-ruins', name: 'Ruins Noctis', type: 'dungeon', x: 780, y: 420, danger: 4, neighbors: ['loc-kaze', 'loc-benteng', 'loc-oracle'] },
        { id: 'loc-oracle', name: 'Oracle Delta', type: 'village', x: 980, y: 620, danger: 5, neighbors: ['loc-ruins', 'loc-benteng'] }
      ]
    };
  }

  function cloneMap(map) {
    return {
      width: map.width,
      height: map.height,
      playerLocationId: map.playerLocationId,
      camera: { x: map.camera.x, y: map.camera.y, zoom: map.camera.zoom || 1 },
      locations: map.locations.map(function (loc) {
        return {
          id: loc.id,
          name: loc.name,
          type: loc.type,
          x: loc.x,
          y: loc.y,
          danger: loc.danger || 1,
          neighbors: (loc.neighbors || []).slice(0)
        };
      })
    };
  }

  function cloneUnit(unit) {
    return {
      id: unit.id,
      name: unit.name,
      role: unit.role || 'vanguard',
      level: unit.level,
      hp: unit.hp,
      maxHp: unit.maxHp,
      mp: unit.mp,
      maxMp: unit.maxMp,
      tp: unit.tp || 0,
      attack: unit.attack,
      defense: unit.defense,
      agility: unit.agility,
      spirit: unit.spirit,
      element: unit.element,
      alive: unit.alive,
      guarding: !!unit.guarding,
      status: (unit.status || []).map(function (entry) { return { type: entry.type, turns: entry.turns }; }),
      limit: unit.limit || 0,
      breakGauge: unit.breakGauge == null ? 100 : unit.breakGauge,
      maxBreakGauge: unit.maxBreakGauge || 100,
      skills: (unit.skills || []).map(function (skill) {
        return {
          id: skill.id,
          name: skill.name,
          costMp: skill.costMp || 0,
          costTp: skill.costTp || 0,
          power: skill.power || 0,
          element: skill.element || 'light',
          variance: skill.variance == null ? 0.1 : skill.variance,
          target: skill.target || 'enemy',
          addStatus: skill.addStatus || null,
          healScale: skill.healScale || 0,
          limitCost: skill.limitCost || 0,
          breakDamage: skill.breakDamage || 20,
          tags: (skill.tags || []).slice(0)
        };
      })
    };
  }

  function cloneItems(items) {
    return (items || []).map(function (item) {
      return {
        id: item.id,
        name: item.name,
        qty: item.qty || 0,
        healHp: item.healHp || 0,
        healMp: item.healMp || 0,
        cleanse: item.cleanse || false,
        target: item.target || 'ally',
        revive: item.revive || 0
      };
    });
  }

  function createState(party, enemies, options) {
    var config = options || {};
    var map = cloneMap(config.map || defaultWorldMap());
    var location = map.locations.find(function (loc) { return loc.id === map.playerLocationId; }) || map.locations[0];

    return {
      turn: 1,
      cycle: 1,
      party: party.map(cloneUnit),
      enemies: enemies.map(cloneUnit),
      inventory: cloneItems(config.inventory),
      combo: 0,
      logs: [],
      timeline: [],
      mode: 'battle',
      world: {
        map: map,
        currentLocationId: location.id,
        travelCount: 0,
        lastEvent: 'Awal petualangan di ' + location.name + '.'
      },
      field: {
        weather: config.weather || 'clear',
        tempo: config.tempo || 1,
        anomaly: config.anomaly || 'none',
        intensity: config.intensity || 0
      },
      metrics: {
        totalDamage: 0,
        totalHealing: 0,
        actions: 0,
        mpSpent: 0
      }
    };
  }

  function collectUnits(state) {
    return state.party.concat(state.enemies);
  }

  function getUnit(state, id) {
    return collectUnits(state).find(function (u) { return u.id === id; });
  }

  function getSide(state, id) {
    return state.party.some(function (u) { return u.id === id; }) ? 'party' : 'enemies';
  }

  function aliveUnits(list) {
    return list.filter(function (u) { return u.alive; });
  }

  function battleFinished(state) {
    return aliveUnits(state.party).length === 0 || aliveUnits(state.enemies).length === 0;
  }

  function createTimeline(state, rng) {
    return collectUnits(state)
      .filter(function (u) { return u.alive; })
      .map(function (u) {
        var jitter = Math.floor(rng() * 6);
        var burden = u.status.some(function (s) { return s.type === 'slow'; }) ? -8 : 0;
        var haste = u.status.some(function (s) { return s.type === 'haste'; }) ? 7 : 0;
        var stance = u.role === 'striker' ? 2 : 0;
        return { id: u.id, initiative: Math.floor((u.agility + u.level + jitter + burden + haste + stance) * state.field.tempo) };
      })
      .sort(function (a, b) { return b.initiative - a.initiative; })
      .map(function (entry) { return entry.id; });
  }

  function hasStatus(unit, statusType) {
    return unit.status.some(function (s) { return s.type === statusType && s.turns > 0; });
  }

  function applyStatus(unit, statusType, turns) {
    var active = unit.status.find(function (s) { return s.type === statusType; });
    if (active) {
      active.turns = Math.max(active.turns, turns);
      return;
    }
    unit.status.push({ type: statusType, turns: turns });
  }

  function tickStatus(unit, logs) {
    unit.status = unit.status
      .map(function (entry) {
        if (entry.type === 'poison' && unit.alive) {
          var poisonDamage = Math.max(1, Math.floor(unit.maxHp * 0.06));
          unit.hp = Math.max(0, unit.hp - poisonDamage);
          unit.alive = unit.hp > 0;
          logs.push(unit.name + ' terkena racun (' + poisonDamage + ').');
          if (!unit.alive) logs.push(unit.name + ' kalah oleh racun.');
        }
        if (entry.type === 'regen' && unit.alive) {
          var regen = Math.max(1, Math.floor(unit.maxHp * 0.05));
          unit.hp = Math.min(unit.maxHp, unit.hp + regen);
          logs.push(unit.name + ' memulihkan ' + regen + ' HP dari regen.');
        }
        return { type: entry.type, turns: entry.turns - 1 };
      })
      .filter(function (entry) { return entry.turns > 0; });
  }

  function weatherModifier(field, skillElement) {
    if (field.weather === 'rain' && skillElement === 'water') return 1.12;
    if (field.weather === 'rain' && skillElement === 'fire') return 0.88;
    if (field.weather === 'storm' && skillElement === 'wind') return 1.15;
    if (field.weather === 'eclipse' && (skillElement === 'shadow' || skillElement === 'light')) return 1.18;
    return 1;
  }

  function computeDamage(actor, target, skill, rng, combo, field) {
    var base = actor.attack + actor.spirit + skill.power + Math.floor(combo * 0.7) + Math.floor(actor.tp * 0.2);
    var reduction = target.defense + Math.floor(target.spirit * 0.65);
    var multiplier = (elementTable[skill.element] && elementTable[skill.element][target.element]) || 1;
    var fieldBuff = weatherModifier(field, skill.element);
    var spread = 1 + (rng() * 2 - 1) * skill.variance;
    var criticalRate = Math.min(0.4, 0.05 + actor.agility / 240);
    var crit = rng() < criticalRate;
    var guardScale = target.guarding ? 0.5 : 1;
    var breakBonus = target.breakGauge <= 0 ? 1.2 : 1;
    var raw = Math.max(1, Math.floor((base - reduction) * multiplier * fieldBuff * spread * guardScale * breakBonus));
    return { amount: crit ? Math.floor(raw * 1.65) : raw, crit: crit };
  }

  function pickSkill(actor, allowLimit) {
    var usable = actor.skills.filter(function (skill) {
      return skill.costMp <= actor.mp && skill.costTp <= actor.tp && (allowLimit || !skill.limitCost) && actor.limit >= skill.limitCost;
    });
    usable.sort(function (a, b) { return b.power - a.power; });
    return usable[0] || null;
  }

  function nextTargetFromPool(pool) {
    var alive = pool.filter(function (u) { return u.alive; });
    alive.sort(function (a, b) { return (a.hp / a.maxHp) - (b.hp / b.maxHp); });
    return alive[0] || null;
  }

  function buildAction(type, actorId, targetId, extras) {
    var action = { type: type, actorId: actorId, targetId: targetId };
    var extraKeys = Object.keys(extras || {});
    for (var i = 0; i < extraKeys.length; i += 1) {
      action[extraKeys[i]] = extras[extraKeys[i]];
    }
    return action;
  }

  function listActionCatalog(state, actorId) {
    var actor = getUnit(state, actorId);
    if (!actor || !actor.alive) return [];
    var catalog = [{ id: 'basic', label: 'basic' }, { id: 'guard', label: 'guard' }];

    actor.skills.forEach(function (skill) {
      catalog.push({
        id: 'skill:' + skill.id,
        label: 'skill ' + skill.name + ' (MP ' + skill.costMp + ', TP ' + skill.costTp + ')',
        enabled: actor.mp >= skill.costMp && actor.tp >= skill.costTp && actor.limit >= skill.limitCost
      });
    });

    state.inventory.forEach(function (item) {
      if (item.qty > 0) catalog.push({ id: 'item:' + item.id, label: 'item ' + item.name + ' x' + item.qty, enabled: true });
    });

    return catalog;
  }

  function buildManualAction(state, actorId, selectedId) {
    var actor = getUnit(state, actorId);
    if (!actor || !actor.alive) return null;
    var actorInParty = getSide(state, actorId) === 'party';
    var foes = actorInParty ? state.enemies : state.party;
    var allies = actorInParty ? state.party : state.enemies;
    var enemy = nextTargetFromPool(foes);
    var allyLow = nextTargetFromPool(allies);

    if (selectedId === 'basic') return enemy ? buildAction('basic', actorId, enemy.id) : null;
    if (selectedId === 'guard') return { type: 'guard', actorId: actorId };

    if (selectedId.indexOf('skill:') === 0) {
      var skillId = selectedId.slice(6);
      var skill = actor.skills.find(function (s) { return s.id === skillId; });
      if (!skill) return null;
      var target = skill.target === 'ally' ? allyLow : enemy;
      return target ? buildAction('skill', actorId, target.id, { skillId: skillId }) : null;
    }

    if (selectedId.indexOf('item:') === 0) {
      var itemId = selectedId.slice(5);
      var item = state.inventory.find(function (i) { return i.id === itemId; });
      var targetForItem = item && item.revive > 0 ? (allies.find(function (u) { return !u.alive; }) || allyLow) : allyLow;
      return targetForItem ? buildAction('item', actorId, targetForItem.id, { itemId: itemId }) : null;
    }

    return null;
  }

  function autoAction(state, actorId) {
    var actor = getUnit(state, actorId);
    if (!actor || !actor.alive) return { type: 'guard', actorId: actorId };

    var actorInParty = getSide(state, actorId) === 'party';
    var allies = actorInParty ? state.party : state.enemies;
    var foes = actorInParty ? state.enemies : state.party;
    var enemy = nextTargetFromPool(foes);
    if (!enemy) return { type: 'guard', actorId: actorId };

    var fallen = allies.find(function (entry) { return !entry.alive; });
    var reviveItem = state.inventory.find(function (entry) { return entry.qty > 0 && entry.revive > 0; });
    if (fallen && reviveItem && actorInParty) return buildAction('item', actor.id, fallen.id, { itemId: reviveItem.id });

    var needHeal = allies.find(function (entry) { return entry.alive && entry.hp / entry.maxHp < 0.33; });
    var healingSkill = actor.skills.find(function (skill) {
      return skill.healScale > 0 && skill.target === 'ally' && actor.mp >= skill.costMp;
    });
    if (needHeal && healingSkill) return buildAction('skill', actor.id, needHeal.id, { skillId: healingSkill.id });

    if (hasStatus(actor, 'stun')) return { type: 'guard', actorId: actor.id };

    var breakSkill = actor.skills.find(function (skill) {
      return (skill.tags || []).indexOf('breaker') >= 0 && actor.mp >= skill.costMp && actor.tp >= skill.costTp;
    });
    if (breakSkill && enemy.breakGauge > 0 && enemy.breakGauge < 55) return buildAction('skill', actor.id, enemy.id, { skillId: breakSkill.id });

    var limitSkill = actor.skills.find(function (skill) {
      return skill.limitCost > 0 && actor.limit >= skill.limitCost && actor.mp >= skill.costMp && actor.tp >= skill.costTp;
    });
    if (limitSkill && state.combo >= 3) return buildAction('skill', actor.id, enemy.id, { skillId: limitSkill.id });

    var skill = pickSkill(actor, false);
    if (skill && actor.mp > actor.maxMp * 0.18) return buildAction('skill', actor.id, enemy.id, { skillId: skill.id });

    return buildAction('basic', actor.id, enemy.id);
  }

  function normalizeState(state) {
    return {
      turn: state.turn,
      cycle: state.cycle,
      party: state.party.map(cloneUnit),
      enemies: state.enemies.map(cloneUnit),
      inventory: cloneItems(state.inventory),
      combo: state.combo,
      logs: [],
      timeline: state.timeline.slice(0),
      mode: state.mode,
      world: {
        map: cloneMap(state.world.map),
        currentLocationId: state.world.currentLocationId,
        travelCount: state.world.travelCount,
        lastEvent: state.world.lastEvent
      },
      field: {
        weather: state.field.weather,
        tempo: state.field.tempo,
        anomaly: state.field.anomaly,
        intensity: state.field.intensity
      },
      metrics: {
        totalDamage: state.metrics.totalDamage,
        totalHealing: state.metrics.totalHealing,
        actions: state.metrics.actions,
        mpSpent: state.metrics.mpSpent
      }
    };
  }

  function reduceBreak(target, amount, logs) {
    target.breakGauge = Math.max(0, target.breakGauge - amount);
    if (target.breakGauge === 0 && !hasStatus(target, 'stun')) {
      applyStatus(target, 'stun', 1);
      logs.push(target.name + ' mengalami BREAK dan stun.');
    }
  }

  function refillBreak(unit) {
    unit.breakGauge = Math.min(unit.maxBreakGauge, unit.breakGauge + 14);
  }

  function rotateField(field, rng, logs) {
    var dice = rng();
    if (dice < 0.12) {
      field.weather = 'rain';
      field.tempo = 0.95;
      field.anomaly = 'surge';
      field.intensity = Math.min(3, field.intensity + 1);
      logs.push('Anomali: hujan arcane memperkuat elemen air.');
    } else if (dice < 0.24) {
      field.weather = 'storm';
      field.tempo = 1.08;
      field.anomaly = 'voltage';
      logs.push('Anomali: badai meningkatkan tempo turn.');
    } else if (dice < 0.3) {
      field.weather = 'eclipse';
      field.tempo = 1;
      field.anomaly = 'umbra';
      logs.push('Anomali: eclipse menguatkan light/shadow.');
    } else if (field.intensity > 0) {
      field.intensity -= 1;
      if (field.intensity === 0) {
        field.weather = 'clear';
        field.tempo = 1;
        field.anomaly = 'none';
      }
    }
  }

  function execute(state, action, rng) {
    var next = normalizeState(state);
    var actor = getUnit(next, action.actorId);
    if (!actor || !actor.alive) return state;

    actor.guarding = false;
    tickStatus(actor, next.logs);
    if (!actor.alive) {
      next.turn += 1;
      return next;
    }

    if (hasStatus(actor, 'stun')) {
      next.logs.push(actor.name + ' terkena stun dan melewatkan giliran.');
      next.turn += 1;
      return next;
    }

    if (action.type === 'guard') {
      actor.guarding = true;
      actor.mp = Math.min(actor.maxMp, actor.mp + 4);
      actor.tp = Math.min(100, actor.tp + 8);
      refillBreak(actor);
      next.logs.push(actor.name + ' bertahan dan memulihkan MP/TP + break gauge.');
      next.turn += 1;
      next.metrics.actions += 1;
      return next;
    }

    var target = getUnit(next, action.targetId);
    if (!target) return state;

    if (action.type === 'item') {
      var item = next.inventory.find(function (entry) { return entry.id === action.itemId && entry.qty > 0; });
      if (!item) return execute(next, { type: 'guard', actorId: actor.id }, rng);
      item.qty -= 1;
      if (!target.alive && item.revive > 0) {
        target.alive = true;
        target.hp = Math.min(target.maxHp, item.revive);
      }
      if (item.healHp) target.hp = Math.min(target.maxHp, target.hp + item.healHp);
      if (item.healMp) target.mp = Math.min(target.maxMp, target.mp + item.healMp);
      if (item.cleanse) target.status = [];
      next.logs.push(actor.name + ' memakai ' + item.name + ' ke ' + target.name + '.');
      next.turn += 1;
      next.metrics.actions += 1;
      return next;
    }

    if (!target.alive) return state;

    if (action.type === 'basic') {
      var basicSkill = { power: Math.max(8, Math.floor(actor.attack * 0.55)), element: actor.element, variance: 0.12, breakDamage: 18 };
      var basic = computeDamage(actor, target, basicSkill, rng, next.combo, next.field);
      target.hp = Math.max(0, target.hp - basic.amount);
      target.alive = target.hp > 0;
      actor.limit = Math.min(100, actor.limit + 10);
      actor.tp = Math.min(100, actor.tp + 12);
      reduceBreak(target, basicSkill.breakDamage, next.logs);
      next.combo = Math.min(9, next.combo + 1);
      next.logs.push(actor.name + ' menyerang ' + target.name + ' (' + basic.amount + (basic.crit ? ' CRIT' : '') + ').');
      if (!target.alive) next.logs.push(target.name + ' kalah.');
      next.turn += 1;
      next.metrics.actions += 1;
      next.metrics.totalDamage += basic.amount;
      return next;
    }

    var skill = actor.skills.find(function (entry) { return entry.id === action.skillId; });
    if (!skill || actor.mp < skill.costMp || actor.tp < skill.costTp || actor.limit < skill.limitCost) {
      return execute(next, { type: 'basic', actorId: actor.id, targetId: target.id }, rng);
    }

    actor.mp = Math.max(0, actor.mp - skill.costMp);
    actor.tp = Math.max(0, actor.tp - skill.costTp);
    actor.limit = Math.max(0, actor.limit - skill.limitCost);
    next.metrics.mpSpent += skill.costMp;

    if (skill.healScale > 0 && skill.target === 'ally') {
      var heal = Math.max(1, Math.floor(actor.spirit * skill.healScale + actor.level * 2));
      target.hp = Math.min(target.maxHp, target.hp + heal);
      if (skill.addStatus) applyStatus(target, skill.addStatus, 2);
      next.logs.push(actor.name + ' menggunakan ' + skill.name + ' memulihkan ' + target.name + ' +' + heal + ' HP.');
      next.turn += 1;
      next.metrics.actions += 1;
      next.metrics.totalHealing += heal;
      return next;
    }

    var outcome = computeDamage(actor, target, skill, rng, next.combo, next.field);
    target.hp = Math.max(0, target.hp - outcome.amount);
    target.alive = target.hp > 0;
    actor.limit = Math.min(100, actor.limit + 18);
    actor.tp = Math.min(100, actor.tp + 10);
    reduceBreak(target, skill.breakDamage || 20, next.logs);
    next.combo = Math.min(9, next.combo + 2);
    next.logs.push(actor.name + ' memakai ' + skill.name + ' ke ' + target.name + ' (' + outcome.amount + (outcome.crit ? ' CRIT' : '') + ').');
    if (skill.addStatus && target.alive && rng() < 0.35) {
      applyStatus(target, skill.addStatus, 2);
      next.logs.push(target.name + ' terkena status ' + skill.addStatus + '.');
    }
    if (!target.alive) next.logs.push(target.name + ' kalah.');

    next.turn += 1;
    next.metrics.actions += 1;
    next.metrics.totalDamage += outcome.amount;
    return next;
  }

  function runRound(state, rng, planner) {
    var next = normalizeState(state);
    var order = createTimeline(next, rng);
    next.timeline = order.slice(0);
    next.logs = ['=== Round ' + next.cycle + ' ==='];
    rotateField(next.field, rng, next.logs);

    for (var i = 0; i < order.length; i += 1) {
      if (battleFinished(next)) break;
      var actorId = order[i];
      var action = planner ? planner(next, actorId) : autoAction(next, actorId);
      next = execute(next, action, rng);
      if (next.logs.length > 18) next.logs = next.logs.slice(next.logs.length - 18);
    }

    next.cycle += 1;
    return next;
  }

  function simulate(state, rng, maxRounds) {
    var working = normalizeState(state);
    var rounds = maxRounds || 4;
    var logAccumulator = [];
    for (var i = 0; i < rounds; i += 1) {
      if (battleFinished(working)) break;
      working = runRound(working, rng);
      logAccumulator = logAccumulator.concat(working.logs);
    }
    working.logs = logAccumulator.slice(-40);
    return working;
  }

  function getMapLocation(map, id) {
    return map.locations.find(function (loc) { return loc.id === id; }) || null;
  }

  function getMapView(state) {
    var map = state.world.map;
    var current = getMapLocation(map, map.playerLocationId);
    return {
      width: map.width,
      height: map.height,
      playerLocationId: map.playerLocationId,
      camera: { x: map.camera.x, y: map.camera.y, zoom: map.camera.zoom },
      locations: map.locations.map(function (loc) {
        var isCurrent = loc.id === map.playerLocationId;
        var reachable = isCurrent || (current && current.neighbors.indexOf(loc.id) >= 0);
        return {
          id: loc.id,
          name: loc.name,
          type: loc.type,
          x: loc.x,
          y: loc.y,
          danger: loc.danger,
          isCurrent: isCurrent,
          reachable: reachable
        };
      })
    };
  }

  function updateMapCamera(state, dx, dy) {
    var next = normalizeState(state);
    var cam = next.world.map.camera;
    cam.x = Math.max(-next.world.map.width * 0.5, Math.min(next.world.map.width * 0.5, cam.x + dx));
    cam.y = Math.max(-next.world.map.height * 0.5, Math.min(next.world.map.height * 0.5, cam.y + dy));
    next.logs = [];
    return next;
  }

  function canTravel(map, fromId, toId) {
    if (fromId === toId) return false;
    var origin = getMapLocation(map, fromId);
    if (!origin) return false;
    return origin.neighbors.indexOf(toId) >= 0;
  }

  function travelTo(state, locationId) {
    var next = normalizeState(state);
    var map = next.world.map;
    if (!canTravel(map, map.playerLocationId, locationId)) {
      next.logs = ['Tidak bisa travel langsung ke lokasi itu. Pilih node tetangga.'];
      return next;
    }

    var destination = getMapLocation(map, locationId);
    map.playerLocationId = locationId;
    next.world.currentLocationId = locationId;
    next.world.travelCount += 1;
    next.mode = 'battle';
    next.world.lastEvent = 'Tiba di ' + destination.name + '. Potensi ancaman level ' + destination.danger + '.';
    next.logs = ['Travel sukses ke ' + destination.name + '.', 'Encounter tier naik: +' + destination.danger + '.'];

    next.field.intensity = Math.min(3, destination.danger - 1);
    if (destination.type === 'dungeon') next.field.weather = 'eclipse';
    if (destination.type === 'village') next.field.weather = 'clear';

    return next;
  }

  function processTextCommand(state, command, rng) {
    var cmd = (command || '').trim().toLowerCase();
    if (!cmd) return state;
    if (cmd === 'help') {
      var helpState = normalizeState(state);
      helpState.logs = ['Command: help, status, map, battle, round, auto, travel <id>.'];
      return helpState;
    }
    if (cmd === 'status') {
      var summary = getBattleSummary(state);
      var statusState = normalizeState(state);
      statusState.logs = ['Mode: ' + statusState.mode + ', Lokasi: ' + statusState.world.currentLocationId + ', PartyAlive: ' + summary.partyAlive + ', EnemyAlive: ' + summary.enemyAlive + '.'];
      return statusState;
    }
    if (cmd === 'map') {
      var mapState = normalizeState(state);
      mapState.mode = 'map';
      mapState.logs = ['Mode map aktif. Klik node tetangga untuk travel.'];
      return mapState;
    }
    if (cmd === 'battle') {
      var battleState = normalizeState(state);
      battleState.mode = 'battle';
      battleState.logs = ['Kembali ke mode battle.'];
      return battleState;
    }
    if (cmd === 'round') {
      return runRound(state, rng);
    }
    if (cmd === 'auto') {
      return simulate(state, rng, 3);
    }
    if (cmd.indexOf('travel ') === 0) {
      return travelTo(state, cmd.slice(7));
    }

    var unknown = normalizeState(state);
    unknown.logs = ['Command tidak dikenal: ' + cmd + '. Ketik help.'];
    return unknown;
  }

  function getBattleSummary(state) {
    var partyAlive = aliveUnits(state.party).length;
    var enemyAlive = aliveUnits(state.enemies).length;
    var winner = '';
    if (partyAlive === 0) winner = 'enemy';
    if (enemyAlive === 0) winner = 'party';
    return {
      cycle: state.cycle,
      combo: state.combo,
      partyAlive: partyAlive,
      enemyAlive: enemyAlive,
      winner: winner,
      finished: winner !== '',
      weather: state.field.weather,
      anomaly: state.field.anomaly,
      metrics: state.metrics,
      mode: state.mode,
      location: state.world.currentLocationId,
      travelCount: state.world.travelCount
    };
  }

  var raceCatalog = {
    humans: { label: 'Humans', stats: { vitality: 1, intellect: 1, charisma: 2, craft: 1, fortune: 1 } },
    elves: { label: 'Elves', stats: { vitality: 0, intellect: 3, charisma: 1, craft: 2, fortune: 1 } },
    dwarves: { label: 'Dwarves', stats: { vitality: 3, intellect: 1, charisma: 0, craft: 3, fortune: 0 } }
  };

  var bornAsCatalog = [
    { id: 'peasants', label: 'Peasants', bonus: { vitality: 1, craft: 1 } },
    { id: 'commoners', label: 'Commoners', bonus: { charisma: 1, fortune: 1 } },
    { id: 'honorable', label: 'Honorable', bonus: { intellect: 1, charisma: 2 } },
    { id: 'nobles', label: 'Nobles', bonus: { intellect: 2, fortune: 2 } }
  ];

  var birthPlaces = [
    'Dusun Emberfall',
    'Lereng Aurora',
    'Pesisir Veloria',
    'Benteng Kharon',
    'Kampung Lumen',
    'Hutan Nythra'
  ];

  var specialSkills = [
    'Echo Reading',
    'Iron Will',
    'Moonlit Aim',
    'Thread of Fortune',
    'Aegis Pulse',
    'Whispercraft'
  ];

  function capitalize(value) {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }

  function randomPick(list, rng) {
    return list[Math.floor(rng() * list.length)];
  }

  function normalizeRace(inputRace) {
    var race = String(inputRace || '').toLowerCase();
    if (!raceCatalog[race]) return 'humans';
    return race;
  }

  function createAdventureProfile(input, rng) {
    var rand = rng || Math.random;
    var name = String((input && input.name) || '').trim();
    if (!name) name = 'Wanderer';
    var race = normalizeRace(input && input.race);
    var bornAs = randomPick(bornAsCatalog, rand);
    var birthPlace = randomPick(birthPlaces, rand);
    var specialSkill = randomPick(specialSkills, rand);
    return {
      name: name.slice(0, 32),
      race: race,
      raceLabel: raceCatalog[race].label,
      birthPlace: birthPlace,
      specialSkill: specialSkill,
      bornAs: bornAs.id,
      bornAsLabel: bornAs.label,
      introLines: [
        'Malam sunyi pecah oleh tangisan pertama di ' + birthPlace + '.',
        name + ' lahir sebagai ' + raceCatalog[race].label + ', membawa aura tak biasa.',
        'Takdir menandai hidupmu dengan bakat: ' + specialSkill + '.',
        'Darahmu tercatat sebagai ' + bornAs.label + ', dan dunia mulai bergerak.'
      ]
    };
  }

  function createPersonalState(profile, startAge, rng) {
    var rand = rng || Math.random;
    var age = Math.max(5, Math.min(8, Number(startAge) || 5));
    var raceStats = raceCatalog[profile.race] ? raceCatalog[profile.race].stats : raceCatalog.humans.stats;
    var bornAs = bornAsCatalog.find(function (entry) { return entry.id === profile.bornAs; }) || bornAsCatalog[0];
    function stat(base) { return Math.max(1, base + Math.floor(rand() * 4)); }
    return {
      profile: {
        name: profile.name,
        race: profile.race,
        raceLabel: profile.raceLabel,
        birthPlace: profile.birthPlace,
        specialSkill: profile.specialSkill,
        bornAs: profile.bornAs,
        bornAsLabel: profile.bornAsLabel
      },
      ageYears: age,
      ageDays: 0,
      totalDays: 0,
      location: profile.birthPlace,
      energy: 100,
      mood: 72,
      stats: {
        vitality: stat(6 + raceStats.vitality + (bornAs.bonus.vitality || 0)),
        intellect: stat(6 + raceStats.intellect + (bornAs.bonus.intellect || 0)),
        charisma: stat(6 + raceStats.charisma + (bornAs.bonus.charisma || 0)),
        craft: stat(6 + raceStats.craft + (bornAs.bonus.craft || 0)),
        fortune: stat(6 + raceStats.fortune + (bornAs.bonus.fortune || 0))
      },
      logs: ['Kehidupan dimulai di umur ' + age + '.']
    };
  }

  function tickIdleDays(personalState, days) {
    var next = {
      profile: personalState.profile,
      ageYears: personalState.ageYears,
      ageDays: personalState.ageDays,
      totalDays: personalState.totalDays,
      location: personalState.location,
      energy: personalState.energy,
      mood: personalState.mood,
      stats: {
        vitality: personalState.stats.vitality,
        intellect: personalState.stats.intellect,
        charisma: personalState.stats.charisma,
        craft: personalState.stats.craft,
        fortune: personalState.stats.fortune
      },
      logs: personalState.logs.slice(-14)
    };
    var step = Math.max(1, days || 1);
    next.totalDays += step;
    next.ageDays += step;
    while (next.ageDays >= 365) {
      next.ageYears += 1;
      next.ageDays -= 365;
      next.logs.push('Usia bertambah menjadi ' + next.ageYears + ' tahun.');
    }
    next.energy = Math.max(50, Math.min(100, next.energy - Math.floor(step / 3) + 2));
    next.mood = Math.max(20, Math.min(100, next.mood + (next.stats.fortune > 9 ? 1 : 0)));
    return next;
  }

  function getPersonalSummary(personalState) {
    var month = Math.floor(personalState.ageDays / 30) + 1;
    var day = (personalState.ageDays % 30) + 1;
    return {
      name: personalState.profile.name,
      race: personalState.profile.raceLabel,
      bornAs: personalState.profile.bornAsLabel,
      specialSkill: personalState.profile.specialSkill,
      location: personalState.location,
      ageYears: personalState.ageYears,
      ageDays: personalState.ageDays,
      calendarText: 'Year ' + personalState.ageYears + ' · Month ' + month + ' · Day ' + day,
      totalDays: personalState.totalDays,
      energy: personalState.energy,
      mood: personalState.mood,
      stats: personalState.stats
    };
  }

  global.fadhilwebrpglib = {
    seededRandom: seededRandom,
    createState: createState,
    autoAction: autoAction,
    execute: execute,
    battleFinished: battleFinished,
    createTimeline: createTimeline,
    runRound: runRound,
    simulate: simulate,
    listActionCatalog: listActionCatalog,
    buildManualAction: buildManualAction,
    getMapView: getMapView,
    updateMapCamera: updateMapCamera,
    travelTo: travelTo,
    processTextCommand: processTextCommand,
    getBattleSummary: getBattleSummary,
    createAdventureProfile: createAdventureProfile,
    createPersonalState: createPersonalState,
    tickIdleDays: tickIdleDays,
    getPersonalSummary: getPersonalSummary,
    installOneShotDebug: installOneShotDebug,
    reportDebugIssue: reportDebugIssue
  };
})(window);
