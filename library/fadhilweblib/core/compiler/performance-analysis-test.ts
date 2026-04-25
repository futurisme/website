import assert from 'node:assert/strict';
import test from 'node:test';

import { runCompilerBenchmark } from './performance-analysis.ts';

test('runCompilerBenchmark returns deterministic shape and sane ratios', () => {
  const result = runCompilerBenchmark({
    name: 'hero-layout',
    source: 'main.shell{h1 "{{title}}";p "Fast";button.primary@click=go "Open"}',
    runs: 20,
    options: { minify: true, accessMode: 'hardened' },
  });

  assert.equal(result.name, 'hero-layout');
  assert.equal(result.runs, 20);
  assert.ok(result.medianMs > 0);
  assert.ok(result.p95Ms >= result.medianMs);
  assert.ok(result.averageCharsPerMs > 0);
  assert.ok(result.averageScannerStepsPerChar > 0);
  assert.ok(result.outputBytesMedian > 0);
});

test('runCompilerBenchmark normalizes invalid run counts to a safe minimum', () => {
  const result = runCompilerBenchmark({
    name: 'normalized-runs',
    source: 'main.shell{p "Safe"}',
    runs: 0,
  });

  assert.equal(result.runs, 1);
  assert.ok(result.medianMs > 0);
});
