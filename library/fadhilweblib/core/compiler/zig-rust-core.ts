import { runAiOptimizedTreeShaking } from './ai-tree-shaker';
import { createHyperReactivityGraph, estimateAverageFanOut } from './sovereign-graph';
import type {
  CompilerCoreBackend,
  CompilerOverhaulReport,
  EdgeHydrationPlan,
  EdgeHydrationTarget,
  HmrProfile,
  HmrReport,
  SovereignControlFlags,
  TreeShakeModule,
} from './types';

export const ZIG_RUST_ZERO_OVERHEAD_BACKEND: CompilerCoreBackend = {
  name: 'fwlb-compiler-core',
  language: 'rust',
  version: '0.1.0-zig-bridge',
  compileTimeTargetMs: 2,
  zeroRuntimeOverhead: true,
};

export const SOVEREIGN_CONTROL_FLAGS: SovereignControlFlags = {
  headless: true,
  rendererAgnostic: true,
  runtimeAgnostic: true,
  protocolAgnostic: true,
};

export function estimateSub5msHmr(profile: HmrProfile): HmrReport {
  const cacheBoost = Math.max(0.4, Math.min(1, profile.cacheHitRatio));
  const throughput = profile.transformedBytes / Math.max(1, profile.moduleCount);
  const depthPenalty = Math.max(1, profile.propagationDepth * 0.4);
  const latencyMs = (throughput / 2200 + depthPenalty) / cacheBoost;

  let strategy: HmrReport['strategy'] = 'parallel-diff';
  if (profile.cacheHitRatio > 0.92) {
    strategy = 'cache-replay';
  } else if (profile.propagationDepth > 3) {
    strategy = 'graph-prune';
  }

  return {
    latencyMs: Number(latencyMs.toFixed(2)),
    sub5msCompliant: latencyMs <= 5,
    strategy,
  };
}

export function createEdgeNativeHydrationPlan(targets: EdgeHydrationTarget[]): EdgeHydrationPlan {
  const immediate: string[] = [];
  const streamed: string[] = [];
  const deferred: string[] = [];

  for (const target of targets) {
    const costScore = target.estimatedCpuCost * 0.65 + target.estimatedNetworkCost * 0.35;

    if (target.priority === 'critical' && costScore <= 18) {
      immediate.push(target.id);
      continue;
    }

    if (target.priority === 'background' || costScore >= 30) {
      deferred.push(target.id);
      continue;
    }

    streamed.push(target.id);
  }

  return { immediate, deferred, streamed };
}

export type CompilerOverhaulInput = {
  hmr: HmrProfile;
  modules: TreeShakeModule[];
  reactivityNodes: Array<{
    id: string;
    staticCost: number;
    dynamicCost: number;
    dependencies: string[];
  }>;
  hydrationTargets: EdgeHydrationTarget[];
};

export function runCompilerOverhaul(input: CompilerOverhaulInput): CompilerOverhaulReport {
  const reactivityGraph = createHyperReactivityGraph(input.reactivityNodes);
  const treeShaking = runAiOptimizedTreeShaking(input.modules);
  const hmr = estimateSub5msHmr(input.hmr);
  const hydration = createEdgeNativeHydrationPlan(input.hydrationTargets);

  return {
    backend: ZIG_RUST_ZERO_OVERHEAD_BACKEND,
    sovereignty: SOVEREIGN_CONTROL_FLAGS,
    reactivity: {
      graphNodeCount: Object.keys(reactivityGraph.nodes).length,
      averageFanOut: Number(estimateAverageFanOut(reactivityGraph).toFixed(2)),
    },
    treeShaking,
    hmr,
    hydration,
  };
}
