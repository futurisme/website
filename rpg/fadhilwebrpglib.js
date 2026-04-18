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
      skills: unit.skills.slice(),
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

  function createState(party, enemies) {
    return {
      turn: 1,
      party: party.map(cloneUnit),
      enemies: enemies.map(cloneUnit),
      logs: []
    };
  }

  function getUnit(state, id) {
    return state.party.concat(state.enemies).find(function (u) { return u.id === id; });
  }

  function nextTarget(state, actorId) {
    var actorInParty = state.party.some(function (u) { return u.id === actorId; });
    var pool = actorInParty ? state.enemies : state.party;
    return pool.find(function (u) { return u.alive; }) || null;
  }

  function skillPower(actor, target, skill, rand) {
    var base = actor.attack + actor.spirit + skill.power;
    var reduction = target.defense + Math.floor(target.spirit * 0.7);
    var multiplier = (elementTable[skill.element] && elementTable[skill.element][target.element]) || 1;
    var spread = 1 + (rand() * 2 - 1) * skill.variance;
    return Math.max(1, Math.floor((base - reduction) * multiplier * spread));
  }

  function autoAction(state, actorId) {
    var actor = getUnit(state, actorId);
    var target = nextTarget(state, actorId);
    if (!actor || !actor.alive || !target) {
      return { type: 'guard', actorId: actorId };
    }
    var skill = actor.skills.find(function (item) { return item.costMp <= actor.mp; });
    if (skill && actor.mp > actor.maxMp * 0.2) {
      return { type: 'skill', actorId: actor.id, targetId: target.id, skillId: skill.id };
    }
    return { type: 'basic', actorId: actor.id, targetId: target.id };
  }

  function execute(state, action, rand) {
    var next = createState(state.party, state.enemies);
    next.turn = state.turn + 1;
    var actor = getUnit(next, action.actorId);
    if (!actor || !actor.alive) {
      return state;
    }

    if (action.type === 'guard') {
      next.logs.push(actor.name + ' bertahan.');
      return next;
    }

    var target = getUnit(next, action.targetId);
    if (!target || !target.alive) {
      return state;
    }

    if (action.type === 'basic') {
      var raw = Math.max(1, actor.attack - Math.floor(target.defense * 0.8));
      var damage = Math.max(1, Math.floor(raw * (0.9 + rand() * 0.2)));
      target.hp = Math.max(0, target.hp - damage);
      target.alive = target.hp > 0;
      next.logs.push(actor.name + ' menyerang ' + target.name + ' (' + damage + ').');
      if (!target.alive) next.logs.push(target.name + ' kalah.');
      return next;
    }

    var skill = actor.skills.find(function (item) { return item.id === action.skillId; });
    if (!skill || actor.mp < skill.costMp) {
      return execute(next, { type: 'basic', actorId: actor.id, targetId: target.id }, rand);
    }

    actor.mp = Math.max(0, actor.mp - skill.costMp);
    var skillDamage = skillPower(actor, target, skill, rand);
    target.hp = Math.max(0, target.hp - skillDamage);
    target.alive = target.hp > 0;
    next.logs.push(actor.name + ' memakai ' + skill.name + ' ke ' + target.name + ' (' + skillDamage + ').');
    if (!target.alive) next.logs.push(target.name + ' kalah.');
    return next;
  }

  function battleFinished(state) {
    var partyAlive = state.party.some(function (u) { return u.alive; });
    var enemyAlive = state.enemies.some(function (u) { return u.alive; });
    return !partyAlive || !enemyAlive;
  }

  global.fadhilwebrpglib = {
    seededRandom: seededRandom,
    createState: createState,
    autoAction: autoAction,
    execute: execute,
    battleFinished: battleFinished
  };
})(window);
