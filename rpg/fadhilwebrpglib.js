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
      level: unit.level,
      hp: unit.hp,
      maxHp: unit.maxHp,
      mp: unit.mp,
      maxMp: unit.maxMp,
      attack: unit.attack,
      defense: unit.defense,
      agility: unit.agility,
      spirit: unit.spirit,
      element: unit.element,
      alive: unit.alive,
      guarding: !!unit.guarding,
      status: (unit.status || []).map(function (entry) { return { type: entry.type, turns: entry.turns }; }),
      limit: unit.limit || 0,
      skills: (unit.skills || []).map(function (skill) {
        return {
          id: skill.id,
          name: skill.name,
          costMp: skill.costMp || 0,
          power: skill.power || 0,
          element: skill.element || 'light',
          variance: skill.variance == null ? 0.1 : skill.variance,
          target: skill.target || 'enemy',
          addStatus: skill.addStatus || null,
          healScale: skill.healScale || 0,
          limitCost: skill.limitCost || 0
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
        target: item.target || 'ally'
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
      timeline: []
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
        return { id: u.id, initiative: u.agility + u.level + jitter + burden };
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
        return { type: entry.type, turns: entry.turns - 1 };
      })
      .filter(function (entry) { return entry.turns > 0; });
  }

  function computeDamage(actor, target, skill, rng, combo) {
    var base = actor.attack + actor.spirit + skill.power + Math.floor(combo * 0.7);
    var reduction = target.defense + Math.floor(target.spirit * 0.65);
    var multiplier = (elementTable[skill.element] && elementTable[skill.element][target.element]) || 1;
    var spread = 1 + (rng() * 2 - 1) * skill.variance;
    var criticalRate = Math.min(0.35, 0.05 + actor.agility / 250);
    var crit = rng() < criticalRate;
    var guardScale = target.guarding ? 0.5 : 1;
    var raw = Math.max(1, Math.floor((base - reduction) * multiplier * spread * guardScale));
    return { amount: crit ? Math.floor(raw * 1.65) : raw, crit: crit, multiplier: multiplier };
  }

  function pickSkill(actor, allowLimit) {
    var usable = actor.skills.filter(function (skill) {
      return skill.costMp <= actor.mp && (allowLimit || !skill.limitCost) && actor.limit >= skill.limitCost;
    });
    return usable[0] || null;
  }

  function nextTargetFromPool(pool) {
    return pool.find(function (u) { return u.alive; }) || null;
  }

  function buildAction(type, actorId, targetId, extras) {
    var action = { type: type, actorId: actorId, targetId: targetId };
    var extraKeys = Object.keys(extras || {});
    for (var i = 0; i < extraKeys.length; i += 1) {
      action[extraKeys[i]] = extras[extraKeys[i]];
    }
    return action;
  }

  function autoAction(state, actorId) {
    var actor = getUnit(state, actorId);
    if (!actor || !actor.alive) return { type: 'guard', actorId: actorId };

    var actorInParty = getSide(state, actorId) === 'party';
    var allies = actorInParty ? state.party : state.enemies;
    var foes = actorInParty ? state.enemies : state.party;
    var enemy = nextTargetFromPool(foes);
    if (!enemy) return { type: 'guard', actorId: actorId };

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

    var limitSkill = actor.skills.find(function (skill) {
      return skill.limitCost > 0 && actor.limit >= skill.limitCost && actor.mp >= skill.costMp;
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
      timeline: state.timeline.slice(0)
    };
  }

  function appendLog(logs, line) {
    logs.push(line);
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
      appendLog(next.logs, actor.name + ' bertahan dan memulihkan MP.');
      next.turn += 1;
      return next;
    }

    var target = getUnit(next, action.targetId);
    if (!target || !target.alive) return state;

    if (action.type === 'item') {
      var item = next.inventory.find(function (entry) { return entry.id === action.itemId && entry.qty > 0; });
      if (!item) return execute(next, { type: 'guard', actorId: actor.id }, rng);
      item.qty -= 1;
      if (item.healHp) target.hp = Math.min(target.maxHp, target.hp + item.healHp);
      if (item.healMp) target.mp = Math.min(target.maxMp, target.mp + item.healMp);
      if (item.cleanse) target.status = [];
      appendLog(next.logs, actor.name + ' memakai ' + item.name + ' ke ' + target.name + '.');
      next.turn += 1;
      return next;
    }

    if (action.type === 'basic') {
      var basicSkill = {
        power: Math.max(8, Math.floor(actor.attack * 0.55)),
        element: actor.element,
        variance: 0.12
      };
      var basic = computeDamage(actor, target, basicSkill, rng, next.combo);
      target.hp = Math.max(0, target.hp - basic.amount);
      target.alive = target.hp > 0;
      actor.limit = Math.min(100, actor.limit + 10);
      next.combo = Math.min(9, next.combo + 1);
      appendLog(next.logs, actor.name + ' menyerang ' + target.name + ' (' + basic.amount + (basic.crit ? ' CRIT' : '') + ').');
      if (!target.alive) appendLog(next.logs, target.name + ' kalah.');
      next.turn += 1;
      return next;
    }

    var skill = actor.skills.find(function (entry) { return entry.id === action.skillId; });
    if (!skill || actor.mp < skill.costMp || actor.limit < skill.limitCost) {
      return execute(next, { type: 'basic', actorId: actor.id, targetId: target.id }, rng);
    }

    actor.mp = Math.max(0, actor.mp - skill.costMp);
    actor.limit = Math.max(0, actor.limit - skill.limitCost);

    if (skill.healScale > 0 && skill.target === 'ally') {
      var heal = Math.max(1, Math.floor(actor.spirit * skill.healScale + actor.level * 2));
      target.hp = Math.min(target.maxHp, target.hp + heal);
      appendLog(next.logs, actor.name + ' menggunakan ' + skill.name + ' memulihkan ' + target.name + ' +' + heal + ' HP.');
      next.turn += 1;
      return next;
    }

    var outcome = computeDamage(actor, target, skill, rng, next.combo);
    target.hp = Math.max(0, target.hp - outcome.amount);
    target.alive = target.hp > 0;
    actor.limit = Math.min(100, actor.limit + 18);
    next.combo = Math.min(9, next.combo + 2);
    appendLog(next.logs, actor.name + ' memakai ' + skill.name + ' ke ' + target.name + ' (' + outcome.amount + (outcome.crit ? ' CRIT' : '') + ').');
    if (skill.addStatus && target.alive && rng() < 0.35) {
      applyStatus(target, skill.addStatus, 2);
      appendLog(next.logs, target.name + ' terkena status ' + skill.addStatus + '.');
    }
    if (!target.alive) appendLog(next.logs, target.name + ' kalah.');

    next.turn += 1;
    return next;
  }

  function runRound(state, rng, planner) {
    var next = normalizeState(state);
    var order = createTimeline(next, rng);
    next.timeline = order.slice(0);
    next.logs = ['=== Round ' + next.cycle + ' ==='];
    for (var i = 0; i < order.length; i += 1) {
      if (battleFinished(next)) break;
      var actorId = order[i];
      var action = planner ? planner(next, actorId) : autoAction(next, actorId);
      next = execute(next, action, rng);
      if (next.logs.length > 12) {
        next.logs = next.logs.slice(next.logs.length - 12);
      }
    }
    next.cycle += 1;
    return next;
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
      finished: winner !== ''
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
    getBattleSummary: getBattleSummary
  };
})(window);
