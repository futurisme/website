import assert from 'node:assert/strict';
import test from 'node:test';

import { diagnoseSystemHealth } from './diagnostics.ts';
import { runDebugSession } from './debug-agent.ts';

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

test('diagnoseSystemHealth ignores non-finite weights and keeps stable score math', () => {
  const report = diagnoseSystemHealth([
    { key: 'latency', value: 0.25, weight: Number.NaN },
    { key: 'errors', value: 0.25, weight: Number.POSITIVE_INFINITY },
  ]);

  assert.equal(report.score, 0.25);
  assert.equal(report.riskBand, 'stable');
});
