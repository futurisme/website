import type { BattleAction, BattleEvent, BattleState, RpgSeededRandom, RpgSkill, RpgUnit } from './types';

const ELEMENT_TABLE: Record<RpgUnit['element'], Record<RpgUnit['element'], number>> = {
  fire: { fire: 1, water: 0.78, wind: 1.12, earth: 1.08, light: 1, shadow: 1 },
  water: { fire: 1.24, water: 1, wind: 0.94, earth: 0.9, light: 1, shadow: 1 },
  wind: { fire: 0.96, water: 1.08, wind: 1, earth: 1.2, light: 1, shadow: 1 },
  earth: { fire: 0.92, water: 1.15, wind: 0.82, earth: 1, light: 1, shadow: 1 },
  light: { fire: 1, water: 1, wind: 1, earth: 1, light: 0.92, shadow: 1.2 },
  shadow: { fire: 1, water: 1, wind: 1, earth: 1, light: 1.25, shadow: 0.9 },
};

export function createSeededRandom(seed = 7): RpgSeededRandom {
  let localSeed = seed >>> 0;
  return () => {
    localSeed ^= localSeed << 13;
    localSeed ^= localSeed >>> 17;
    localSeed ^= localSeed << 5;
    return (localSeed >>> 0) / 4294967295;
  };
}

export function cloneUnit(unit: RpgUnit): RpgUnit {
  return {
    ...unit,
    skills: unit.skills.slice(0),
  };
}

export function createBattleState(party: RpgUnit[], enemies: RpgUnit[]): BattleState {
  return {
    turn: 1,
    party: party.map(cloneUnit),
    enemies: enemies.map(cloneUnit),
    log: [],
  };
}

function computeSkillPower(actor: RpgUnit, target: RpgUnit, skill: RpgSkill, rng: RpgSeededRandom): number {
  const base = actor.attack + actor.spirit + skill.power;
  const resistance = target.defense + Math.floor(target.spirit * 0.7);
  const elementScale = ELEMENT_TABLE[skill.element][target.element] ?? 1;
  const spread = 1 + (rng() * 2 - 1) * skill.variance;
  const outcome = Math.floor((base - resistance) * elementScale * spread);
  return Math.max(1, outcome);
}

function picktargets(state: BattleState, actorId: string, targetId: string) {
  const actor = [...state.party, ...state.enemies].find((entry) => entry.id === actorId);
  const target = [...state.party, ...state.enemies].find((entry) => entry.id === targetId);
  return { actor, target };
}

function applyDamage(target: RpgUnit, amount: number, log: BattleEvent[], actorId: string) {
  target.hp = Math.max(0, target.hp - amount);
  target.alive = target.hp > 0;
  log.push({ type: 'damage', actorId, targetId: target.id, amount });
  if (!target.alive) {
    log.push({ type: 'ko', actorId, targetId: target.id, detail: `${target.name} tumbang.` });
  }
}

export function executeAction(state: BattleState, action: BattleAction, rng: RpgSeededRandom): BattleState {
  const next: BattleState = {
    ...state,
    party: state.party.map(cloneUnit),
    enemies: state.enemies.map(cloneUnit),
    turn: state.turn + 1,
    log: [],
  };

  const { actor, target } = picktargets(next, action.actorId, 'targetId' in action ? action.targetId : action.actorId);

  if (!actor || !actor.alive) {
    return state;
  }

  if (action.type === 'guard') {
    next.log.push({ type: 'guard', actorId: actor.id, detail: `${actor.name} bertahan.` });
    return next;
  }

  if (!target || !target.alive) {
    return state;
  }

  if (action.type === 'basic') {
    const basePower = Math.max(1, actor.attack - Math.floor(target.defense * 0.8));
    const amount = Math.max(1, Math.floor(basePower * (0.9 + rng() * 0.2)));
    applyDamage(target, amount, next.log, actor.id);
    return next;
  }

  const skill = actor.skills.find((entry) => entry.id === action.skillId);
  if (!skill || actor.mp < skill.costMp) {
    return executeAction(next, { type: 'basic', actorId: actor.id, targetId: target.id }, rng);
  }

  actor.mp = Math.max(0, actor.mp - skill.costMp);
  next.log.push({ type: 'mp', actorId: actor.id, amount: -skill.costMp, detail: `${actor.name} menggunakan ${skill.name}.` });
  const amount = computeSkillPower(actor, target, skill, rng);
  applyDamage(target, amount, next.log, actor.id);
  return next;
}

export function isBattleFinished(state: BattleState) {
  const partyAlive = state.party.some((unit) => unit.alive);
  const enemiesAlive = state.enemies.some((unit) => unit.alive);
  return !partyAlive || !enemiesAlive;
}

export function buildAutoAction(state: BattleState, actorId: string): BattleAction {
  const actor = [...state.party, ...state.enemies].find((entry) => entry.id === actorId);
  if (!actor || !actor.alive) {
    return { type: 'guard', actorId };
  }

  const enemyPool = state.party.some((entry) => entry.id === actorId) ? state.enemies : state.party;
  const target = enemyPool.find((entry) => entry.alive);
  if (!target) {
    return { type: 'guard', actorId };
  }

  const skill = actor.skills.find((entry) => entry.costMp <= actor.mp);
  if (skill && actor.mp > actor.maxMp * 0.2) {
    return { type: 'skill', actorId: actor.id, targetId: target.id, skillId: skill.id };
  }

  return { type: 'basic', actorId: actor.id, targetId: target.id };
}
