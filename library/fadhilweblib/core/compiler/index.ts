export { runCompilerBenchmark, runCompilerBenchmarks } from './performance-analysis';
export type { CompilerBenchmarkResult, CompilerBenchmarkSample } from './performance-analysis';

export { transpileSinglePassAotDsl } from './aot-transpiler';
export type { AotCompileOptions, AotCompileResult, AotCompileStats } from './aot-transpiler';

export { createHyperReactivityGraph, estimateAverageFanOut } from './sovereign-graph';
export type { HyperReactivityConfig } from './sovereign-graph';

export { runAiOptimizedTreeShaking } from './ai-tree-shaker';

export {
  createEdgeNativeHydrationPlan,
  estimateSub5msHmr,
  runCompilerOverhaul,
  SOVEREIGN_CONTROL_FLAGS,
  ZIG_RUST_ZERO_OVERHEAD_BACKEND,
} from './zig-rust-core';
export type { CompilerOverhaulInput } from './zig-rust-core';

export type {
  CompilerCoreBackend,
  CompilerCoreLanguage,
  CompilerOverhaulReport,
  EdgeHydrationPlan,
  EdgeHydrationTarget,
  HmrProfile,
  HmrReport,
  HyperReactivityGraph,
  HyperReactivityNode,
  SovereignControlFlags,
  TreeShakeModule,
  TreeShakeResult,
} from './types';
