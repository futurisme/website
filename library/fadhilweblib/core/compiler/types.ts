export type CompilerCoreLanguage = 'zig' | 'rust';

export type CompilerCoreBackend = {
  name: string;
  language: CompilerCoreLanguage;
  version: string;
  compileTimeTargetMs: number;
  zeroRuntimeOverhead: true;
};

export type SovereignControlFlags = {
  headless: true;
  rendererAgnostic: true;
  runtimeAgnostic: true;
  protocolAgnostic: true;
};

export type HyperReactivityNode = {
  id: string;
  staticCost: number;
  dynamicCost: number;
  dependencies: string[];
  subscribers: string[];
};

export type HyperReactivityGraph = {
  nodes: Record<string, HyperReactivityNode>;
  topologicalOrder: string[];
  fanOutBudget: number;
};

export type TreeShakeModule = {
  id: string;
  symbols: string[];
  usedSymbols: string[];
  bytes: number;
  sideEffects?: boolean;
  aiPriorityScore?: number;
};

export type TreeShakeResult = {
  removedSymbols: Array<{ moduleId: string; symbol: string }>;
  removedBytes: number;
  keptBytes: number;
  footprintScore: number;
};

export type HmrProfile = {
  moduleCount: number;
  transformedBytes: number;
  propagationDepth: number;
  cacheHitRatio: number;
};

export type HmrReport = {
  latencyMs: number;
  sub5msCompliant: boolean;
  strategy: 'parallel-diff' | 'graph-prune' | 'cache-replay';
};

export type EdgeHydrationTarget = {
  id: string;
  priority: 'critical' | 'interactive' | 'background';
  estimatedCpuCost: number;
  estimatedNetworkCost: number;
};

export type EdgeHydrationPlan = {
  immediate: string[];
  deferred: string[];
  streamed: string[];
};

export type CompilerOverhaulReport = {
  backend: CompilerCoreBackend;
  sovereignty: SovereignControlFlags;
  reactivity: {
    graphNodeCount: number;
    averageFanOut: number;
  };
  treeShaking: TreeShakeResult;
  hmr: HmrReport;
  hydration: EdgeHydrationPlan;
};
