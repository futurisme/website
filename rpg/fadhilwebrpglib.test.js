const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function loadLib() {
  const code = fs.readFileSync(path.join(__dirname, 'fadhilwebrpglib.js'), 'utf8');
  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(code, context, { filename: 'fadhilwebrpglib.js' });
  return context.window.fadhilwebrpglib;
}

function sampleState(lib) {
  const party = [{
    id: 'p1', name: 'Hero', level: 1,
    hp: 80, maxHp: 80, mp: 24, maxMp: 24,
    attack: 20, defense: 8, agility: 12, spirit: 10,
    element: 'wind', alive: true,
    skills: [{ id: 'gust', name: 'Gust', costMp: 5, power: 16, element: 'wind', variance: 0.0 }],
  }];
  const enemies = [{
    id: 'e1', name: 'Slime', level: 1,
    hp: 50, maxHp: 50, mp: 10, maxMp: 10,
    attack: 8, defense: 5, agility: 4, spirit: 4,
    element: 'earth', alive: true,
    skills: [{ id: 'slap', name: 'Slap', costMp: 2, power: 6, element: 'earth', variance: 0.0 }],
  }];
  return lib.createState(party, enemies);
}

test('seededRandom menghasilkan nilai deterministik', () => {
  const lib = loadLib();
  const a = lib.seededRandom(123);
  const b = lib.seededRandom(123);
  assert.equal(a(), b());
  assert.equal(a(), b());
  assert.equal(a(), b());
});

test('autoAction memilih skill saat MP cukup', () => {
  const lib = loadLib();
  const state = sampleState(lib);
  const action = lib.autoAction(state, 'p1');
  assert.equal(action.type, 'skill');
  assert.equal(action.actorId, 'p1');
  assert.equal(action.targetId, 'e1');
  assert.equal(action.skillId, 'gust');
});

test('execute basic menurunkan HP target', () => {
  const lib = loadLib();
  const rand = lib.seededRandom(99);
  const state = sampleState(lib);

  const next = lib.execute(state, { type: 'basic', actorId: 'p1', targetId: 'e1' }, rand);
  assert.ok(next.enemies[0].hp < state.enemies[0].hp);
  assert.equal(next.enemies[0].alive, true);
  assert.ok(Array.isArray(next.logs));
  assert.ok(next.logs.length > 0);
});

test('battleFinished true bila enemy tumbang semua', () => {
  const lib = loadLib();
  const state = sampleState(lib);
  state.enemies[0].hp = 0;
  state.enemies[0].alive = false;
  assert.equal(lib.battleFinished(state), true);
});

test('travelTo berhasil untuk node tetangga', () => {
  const lib = loadLib();
  const state = sampleState(lib);
  const view = lib.getMapView(state);
  const current = view.locations.find((l) => l.isCurrent);
  const neighbor = view.locations.find((l) => l.reachable && !l.isCurrent);
  assert.ok(current);
  assert.ok(neighbor);

  const next = lib.travelTo(state, neighbor.id);
  const nextView = lib.getMapView(next);
  const moved = nextView.locations.find((l) => l.id === neighbor.id);
  assert.equal(moved.isCurrent, true);
});

test('processTextCommand map/battle mengganti mode', () => {
  const lib = loadLib();
  const state = sampleState(lib);

  const mapMode = lib.processTextCommand(state, 'map', lib.seededRandom(1));
  assert.equal(mapMode.mode, 'map');

  const battleMode = lib.processTextCommand(mapMode, 'battle', lib.seededRandom(1));
  assert.equal(battleMode.mode, 'battle');
});

test('createAdventureProfile menghasilkan data personal lengkap', () => {
  const lib = loadLib();
  const profile = lib.createAdventureProfile({ name: 'Fadhil', race: 'elves' }, lib.seededRandom(7));
  assert.equal(profile.name, 'Fadhil');
  assert.equal(profile.race, 'elves');
  assert.ok(profile.birthPlace.length > 0);
  assert.ok(profile.specialSkill.length > 0);
  assert.ok(Array.isArray(profile.introLines));
  assert.ok(profile.introLines.length >= 4);
});

test('tickIdleDays menambah hari dan menjaga state personal', () => {
  const lib = loadLib();
  const profile = lib.createAdventureProfile({ name: 'Nova', race: 'humans' }, lib.seededRandom(11));
  const state = lib.createPersonalState(profile, 5, lib.seededRandom(12));
  const next = lib.tickIdleDays(state, 3);
  assert.equal(next.totalDays, 3);
  assert.equal(next.ageDays, 3);
  const summary = lib.getPersonalSummary(next);
  assert.equal(summary.name, 'Nova');
  assert.equal(summary.ageYears, 5);
  assert.ok(summary.stats.strength > 0);
  assert.ok(summary.stats.intelligence > 0);
  assert.ok(summary.stats.socialWisdom > 0);
});

test('travelPersonal berpindah ke lokasi tetangga dan menambah waktu', () => {
  const lib = loadLib();
  const profile = lib.createAdventureProfile({ name: 'Kira', race: 'dwarves' }, lib.seededRandom(14));
  const state = lib.createPersonalState(profile, 5, lib.seededRandom(15));
  const view = lib.getPersonalMapView(state);
  const current = view.locations.find((l) => l.isCurrent);
  const target = view.locations.find((l) => l.reachable && !l.isCurrent);
  assert.ok(current);
  assert.ok(target);
  const moved = lib.travelPersonal(state, target.id);
  assert.equal(moved.location, target.name);
  assert.equal(moved.totalDays, 2);
});

test('createAdventureProfile tetap variatif dan noble tetap mungkin', () => {
  const lib = loadLib();
  const outcomes = new Set();
  for (let seed = 1; seed <= 120; seed += 1) {
    const profile = lib.createAdventureProfile({ name: `P${seed}`, race: 'humans' }, lib.seededRandom(seed));
    outcomes.add(profile.bornAs);
  }
  assert.ok(outcomes.has('peasants'));
  assert.ok(outcomes.has('commoners'));
  assert.ok(outcomes.has('honorable'));
  assert.ok(outcomes.has('nobles'));
});

test('registerAtGuild berhasil setelah tiba di guild dan memberi grade', () => {
  const lib = loadLib();
  const profile = lib.createAdventureProfile({ name: 'Ira', race: 'elves' }, lib.seededRandom(21));
  let state = lib.createPersonalState(profile, 5, lib.seededRandom(22));
  state = lib.travelPersonal(state, 'loc-river');
  state = lib.travelPersonal(state, 'loc-vale');
  state = lib.travelPersonal(state, 'loc-guild');
  const result = lib.registerAtGuild(state, lib.seededRandom(23));
  assert.equal(result.ok, true);
  assert.equal(result.state.adventurer.registered, true);
  assert.ok(result.state.adventurer.grade.length > 0);
  assert.ok(Array.isArray(result.lines));
  assert.ok(result.lines.length >= 4);
});

test('getExploreView selalu menyediakan Adventurer guild di setiap lokasi', () => {
  const lib = loadLib();
  const profile = lib.createAdventureProfile({ name: 'Rin', race: 'humans' }, lib.seededRandom(30));
  let state = lib.createPersonalState(profile, 5, lib.seededRandom(31));
  const first = lib.getExploreView(state);
  assert.ok(first.buildings.some((b) => b.id === 'guild'));
  state = lib.travelPersonal(state, 'loc-river');
  const second = lib.getExploreView(state);
  assert.ok(second.buildings.some((b) => b.id === 'guild'));
});
