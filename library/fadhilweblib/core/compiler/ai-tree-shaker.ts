import type { TreeShakeModule, TreeShakeResult } from './types';

function estimatePriority(module: TreeShakeModule) {
  if (typeof module.aiPriorityScore === 'number') {
    return module.aiPriorityScore;
  }

  const usageRatio = module.symbols.length === 0 ? 1 : module.usedSymbols.length / module.symbols.length;
  return Math.min(1, usageRatio + (module.sideEffects ? 0.35 : 0));
}

export function runAiOptimizedTreeShaking(modules: TreeShakeModule[]): TreeShakeResult {
  let removedBytes = 0;
  let keptBytes = 0;
  const removedSymbols: Array<{ moduleId: string; symbol: string }> = [];

  for (const module of modules) {
    const priority = estimatePriority(module);
    const keptSymbols = new Set(module.usedSymbols);
    const removable = module.symbols.filter((symbol) => !keptSymbols.has(symbol));

    if (module.sideEffects && priority >= 0.5) {
      keptBytes += module.bytes;
      continue;
    }

    const symbolByteCost = module.symbols.length === 0 ? 0 : module.bytes / module.symbols.length;
    removedBytes += removable.length * symbolByteCost;
    keptBytes += module.bytes - removable.length * symbolByteCost;

    for (const symbol of removable) {
      removedSymbols.push({ moduleId: module.id, symbol });
    }
  }

  const totalBytes = removedBytes + keptBytes;
  const footprintScore = totalBytes === 0 ? 1 : keptBytes / totalBytes;

  return {
    removedSymbols,
    removedBytes: Math.round(removedBytes),
    keptBytes: Math.round(keptBytes),
    footprintScore,
  };
}
