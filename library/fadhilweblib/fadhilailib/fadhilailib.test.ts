import assert from 'node:assert/strict';
import test from 'node:test';

import { runDebugSession } from './debug-agent';

test('runDebugSession creates incident repair plan for high-risk signals in fadhilailib', () => {
  const report = runDebugSession({
    signals: [
      { key: 'latency', value: 0.9, weight: 2 },
      { key: 'errors', value: 0.95, weight: 3 },
      { key: 'memory', value: 0.75, weight: 1 },
    ],
    context: {
      subsystem: 'compiler',
      releaseTag: '2026.04.05',
    },
  });

  assert.equal(report.contextLabel, 'compiler @ 2026.04.05');
  assert.equal(report.diagnostics.riskBand, 'failure');
  assert.equal(report.repairPlan.profile, 'incident');
  assert.ok(report.repairPlan.totalMinutes > 0);
  assert.ok(report.repairPlan.steps.some((step) => step.id === 'incident-repair'));
});
