export type RpgElement = 'fire' | 'water' | 'wind' | 'earth' | 'light' | 'shadow';

export type RpgSkill = {
  id: string;
  name: string;
  costMp: number;
  power: number;
  element: RpgElement;
  variance: number;
};

export type RpgUnit = {
  id: string;
  name: string;
  level: number;
  maxHp: number;
  hp: number;
  maxMp: number;
  mp: number;
  attack: number;
  defense: number;
  agility: number;
  spirit: number;
  element: RpgElement;
  skills: RpgSkill[];
  alive: boolean;
};

export type BattleAction =
  | { type: 'basic'; actorId: string; targetId: string }
  | { type: 'skill'; actorId: string; targetId: string; skillId: string }
  | { type: 'guard'; actorId: string };

export type BattleEvent = {
  type: 'damage' | 'heal' | 'ko' | 'mp' | 'guard';
  actorId: string;
  targetId?: string;
  amount?: number;
  detail?: string;
};

export type BattleState = {
  turn: number;
  party: RpgUnit[];
  enemies: RpgUnit[];
  log: BattleEvent[];
};

export type RpgSeededRandom = () => number;
