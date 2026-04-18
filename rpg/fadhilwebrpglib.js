(function (global) {
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
    return {
      turn: 1,
      cycle: 1,
      party: party.map(cloneUnit),
      enemies: enemies.map(cloneUnit),
      inventory: cloneItems(config.inventory),
      combo: 0,
      logs: [],
      timeline: [],
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
    return { amount: crit ? Math.floor(raw * 1.65) : raw, crit: crit, multiplier: multiplier * fieldBuff };
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
    var catalog = [
      { id: 'basic', label: 'Basic Attack', type: 'basic' },
      { id: 'guard', label: 'Guard', type: 'guard' }
    ];
    actor.skills.forEach(function (skill) {
      catalog.push({
        id: 'skill:' + skill.id,
        label: skill.name + ' (MP ' + skill.costMp + ', TP ' + skill.costTp + ')',
        type: 'skill',
        skillId: skill.id,
        enabled: actor.mp >= skill.costMp && actor.tp >= skill.costTp && actor.limit >= skill.limitCost
      });
    });
    state.inventory.forEach(function (item) {
      if (item.qty > 0) {
        catalog.push({ id: 'item:' + item.id, label: item.name + ' x' + item.qty, type: 'item', itemId: item.id, enabled: true });
      }
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

    if (selectedId === 'basic') {
      return enemy ? buildAction('basic', actorId, enemy.id) : null;
    }
    if (selectedId === 'guard') {
      return { type: 'guard', actorId: actorId };
    }
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
      var targetForItem = item && item.revive > 0
        ? (allies.find(function (u) { return !u.alive; }) || allyLow)
        : allyLow;
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
    if (fallen && reviveItem && actorInParty) {
      return buildAction('item', actor.id, fallen.id, { itemId: reviveItem.id });
    }

    var needHeal = allies.find(function (entry) { return entry.alive && entry.hp / entry.maxHp < 0.33; });
    var healingSkill = actor.skills.find(function (skill) {
      return skill.healScale > 0 && skill.target === 'ally' && actor.mp >= skill.costMp;
    });
    if (needHeal && healingSkill) {
      return buildAction('skill', actor.id, needHeal.id, { skillId: healingSkill.id });
    }

    var item = state.inventory.find(function (entry) {
      return entry.qty > 0 && entry.healHp > 0 && actorInParty;
    });
    if (needHeal && item && needHeal.hp / needHeal.maxHp < 0.25) {
      return buildAction('item', actor.id, needHeal.id, { itemId: item.id });
    }

    if (hasStatus(actor, 'stun')) {
      return { type: 'guard', actorId: actor.id };
    }

    var breakSkill = actor.skills.find(function (skill) {
      return (skill.tags || []).indexOf('breaker') >= 0 && actor.mp >= skill.costMp && actor.tp >= skill.costTp;
    });
    if (breakSkill && enemy.breakGauge > 0 && enemy.breakGauge < 55) {
      return buildAction('skill', actor.id, enemy.id, { skillId: breakSkill.id });
    }

    var limitSkill = actor.skills.find(function (skill) {
      return skill.limitCost > 0 && actor.limit >= skill.limitCost && actor.mp >= skill.costMp && actor.tp >= skill.costTp;
    });
    if (limitSkill && state.combo >= 3) {
      return buildAction('skill', actor.id, enemy.id, { skillId: limitSkill.id });
    }

    var skill = pickSkill(actor, false);
    if (skill && actor.mp > actor.maxMp * 0.18) {
      return buildAction('skill', actor.id, enemy.id, { skillId: skill.id });
    }

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

  function appendLog(logs, line) {
    logs.push(line);
  }

  function reduceBreak(target, amount, logs) {
    target.breakGauge = Math.max(0, target.breakGauge - amount);
    if (target.breakGauge === 0 && !hasStatus(target, 'stun')) {
      applyStatus(target, 'stun', 1);
      appendLog(logs, target.name + ' mengalami BREAK dan stun.');
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
      appendLog(next.logs, actor.name + ' terkena stun dan melewatkan giliran.');
      next.turn += 1;
      return next;
    }

    if (action.type === 'guard') {
      actor.guarding = true;
      actor.mp = Math.min(actor.maxMp, actor.mp + 4);
      actor.tp = Math.min(100, actor.tp + 8);
      refillBreak(actor);
      appendLog(next.logs, actor.name + ' bertahan dan memulihkan MP/TP + break gauge.');
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
      appendLog(next.logs, actor.name + ' memakai ' + item.name + ' ke ' + target.name + '.');
      next.turn += 1;
      next.metrics.actions += 1;
      return next;
    }

    if (!target.alive) return state;

    if (action.type === 'basic') {
      var basicSkill = {
        power: Math.max(8, Math.floor(actor.attack * 0.55)),
        element: actor.element,
        variance: 0.12,
        breakDamage: 18
      };
      var basic = computeDamage(actor, target, basicSkill, rng, next.combo, next.field);
      target.hp = Math.max(0, target.hp - basic.amount);
      target.alive = target.hp > 0;
      actor.limit = Math.min(100, actor.limit + 10);
      actor.tp = Math.min(100, actor.tp + 12);
      reduceBreak(target, basicSkill.breakDamage, next.logs);
      next.combo = Math.min(9, next.combo + 1);
      appendLog(next.logs, actor.name + ' menyerang ' + target.name + ' (' + basic.amount + (basic.crit ? ' CRIT' : '') + ').');
      if (!target.alive) appendLog(next.logs, target.name + ' kalah.');
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
      appendLog(next.logs, actor.name + ' menggunakan ' + skill.name + ' memulihkan ' + target.name + ' +' + heal + ' HP.');
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
    appendLog(next.logs, actor.name + ' memakai ' + skill.name + ' ke ' + target.name + ' (' + outcome.amount + (outcome.crit ? ' CRIT' : '') + ').');
    if (skill.addStatus && target.alive && rng() < 0.35) {
      applyStatus(target, skill.addStatus, 2);
      appendLog(next.logs, target.name + ' terkena status ' + skill.addStatus + '.');
    }
    if (!target.alive) appendLog(next.logs, target.name + ' kalah.');

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
      if (next.logs.length > 18) {
        next.logs = next.logs.slice(next.logs.length - 18);
      }
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
      metrics: state.metrics
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
    getBattleSummary: getBattleSummary
  };
})(window);
