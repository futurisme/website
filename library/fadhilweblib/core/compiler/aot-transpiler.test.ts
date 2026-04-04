import assert from 'node:assert/strict';
import test from 'node:test';

import { transpileSinglePassAotDsl } from './aot-transpiler';

test('transpileSinglePassAotDsl emits native ESM mount code with reactive and event bindings', () => {
  const source = 'div#app.shell "{{count}}"; button.primary@click=increment "Increment"';
  const result = transpileSinglePassAotDsl(source, { moduleName: 'counter' });

  assert.match(result.code, /export function mount\(target,ctx=\{\}\)/);
  assert.match(result.code, /document\.createElement\("div"\)/);
  assert.match(result.code, /ctx\.observe\?\.\("count"/);
  assert.match(result.code, /addEventListener\("click"/);
  assert.equal(result.stats.nodeCount, 2);
  assert.equal(result.stats.estimatedRuntimeBytes, 0);
});

test('transpileSinglePassAotDsl scanner remains linear for repeated nodes', () => {
  const source = new Array(50).fill('span.item "x"').join(';');
  const result = transpileSinglePassAotDsl(source, { minify: true });

  assert.ok(result.stats.scannerSteps <= source.length * 4);
});
