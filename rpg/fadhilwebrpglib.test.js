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
