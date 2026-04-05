import assert from 'node:assert/strict';
import test from 'node:test';

import { runQualityTest } from './qualitytest';

test('runQualityTest executes debug + optimization pass in one run', () => {
  const report = runQualityTest({
    scope: 'major-change',
    telemetry: {
      latencyRisk: 0.4,
      errorRisk: 0.2,
      memoryRisk: 0.3,
    },
  });

  assert.equal(report.scope, 'major-change');
  assert.ok(report.runtimeBudgetMs >= 0);
  assert.ok(report.benchmark.runs >= 40);
  assert.ok(report.corrections.length >= 3);
  assert.ok(report.corrections.some((item) => item.id === 'fix-001'));
});
