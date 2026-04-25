import assert from 'node:assert/strict';
import test from 'node:test';

import { runCompilerOverhaul } from './zig-rust-core';

test('runCompilerOverhaul produces a sovereign report with sub-5ms HMR compliance', () => {
  const report = runCompilerOverhaul({
    hmr: {
      moduleCount: 12,
      transformedBytes: 3200,
      propagationDepth: 2,
      cacheHitRatio: 0.95,
    },
    modules: [
      {
        id: 'ui-shell',
        bytes: 2200,
        symbols: ['mountShell', 'legacyHydrate', 'designTokens'],
        usedSymbols: ['mountShell', 'designTokens'],
      },
      {
        id: 'router',
        bytes: 800,
        symbols: ['prefetch', 'hydratePath'],
        usedSymbols: ['prefetch'],
      },
    ],
    reactivityNodes: [
      { id: 'store', staticCost: 0.1, dynamicCost: 0.5, dependencies: [] },
      { id: 'route', staticCost: 0.2, dynamicCost: 0.2, dependencies: ['store'] },
      { id: 'shell', staticCost: 0.4, dynamicCost: 0.4, dependencies: ['route'] },
    ],
    hydrationtargets: [
      { id: 'nav', priority: 'critical', estimatedCpuCost: 4, estimatedNetworkCost: 3 },
      { id: 'feed', priority: 'interactive', estimatedCpuCost: 14, estimatedNetworkCost: 8 },
      { id: 'insights', priority: 'background', estimatedCpuCost: 18, estimatedNetworkCost: 20 },
    ],
  });

  assert.equal(report.backend.zeroRuntimeOverhead, true);
  assert.equal(report.sovereignty.headless, true);
  assert.equal(report.hmr.sub5msCompliant, true);
  assert.deepEqual(report.hydration.immediate, ['nav']);
  assert.deepEqual(report.hydration.deferred, ['insights']);
  assert.ok(report.treeShaking.removedBytes > 0);
});
