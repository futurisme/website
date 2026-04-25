import assert from 'node:assert/strict';
import test from 'node:test';

import { transpileSinglePassAotDsl } from './aot-transpiler';

test('transpileSinglePassAotDsl emits nested native ESM with attrs, events and reactivity', () => {
  const source = 'section#app.shell[data-kind="hero"]{h1 "Welcome {{name}}";button.primary@click=increment "Increment"}';
  const result = transpileSinglePassAotDsl(source, { moduleName: 'counter', sourceMapHint: true });

  assert.match(result.code, /document\.createElement\("section"\)/);
  assert.match(result.code, /setAttribute\("data-kind","hero"\)/);
  assert.match(result.code, /ctx\.observe\?\.\("name"/);
  assert.match(result.code, /addEventListener\("click"/);
  assert.match(result.code, /sourceURL=counter\.mjs/);
  assert.equal(result.stats.nodeCount, 5);
  assert.equal(result.stats.attributeCount, 1);
  assert.equal(result.stats.eventBindingCount, 1);
  assert.equal(result.stats.reactiveBindingCount, 1);
  assert.equal(result.stats.estimatedRuntimeBytes, 0);
  assert.equal(result.checksum.length, 8);
});

test('transpileSinglePassAotDsl scanner remains linear for repeated nodes and hardened mode', () => {
  const source = new Array(80).fill('span.item[data-x="1"] "{{value}}"').join(';');
  const result = transpileSinglePassAotDsl(source, { minify: true, accessMode: 'hardened' });

  assert.ok(result.stats.scannerSteps <= source.length * 6);
  assert.ok(result.code.includes('const _'));
});
