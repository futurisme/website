import type { HyperReactivityGraph, HyperReactivityNode } from './types';

export type HyperReactivityConfig = {
  fanOutBudget?: number;
};

function visit(
  id: string,
  nodes: Record<string, HyperReactivityNode>,
  temporary: Set<string>,
  permanent: Set<string>,
  output: string[]
) {
  if (permanent.has(id)) {
    return;
  }

  if (temporary.has(id)) {
    throw new Error(`Cycle detected in hyper-reactivity graph at "${id}".`);
  }

  const node = nodes[id];
  if (!node) {
    throw new Error(`Unknown hyper-reactivity node "${id}".`);
  }

  temporary.add(id);
  for (const dependency of node.dependencies) {
    visit(dependency, nodes, temporary, permanent, output);
  }
  temporary.delete(id);
  permanent.add(id);
  output.push(id);
}

export function createHyperReactivityGraph(
  nodeDefinitions: Array<Omit<HyperReactivityNode, 'subscribers'>>,
  config: HyperReactivityConfig = {}
): HyperReactivityGraph {
  const nodes: Record<string, HyperReactivityNode> = {};

  for (const node of nodeDefinitions) {
    nodes[node.id] = { ...node, subscribers: [] };
  }

  for (const node of Object.values(nodes)) {
    for (const dependency of node.dependencies) {
      const dependencyNode = nodes[dependency];
      if (!dependencyNode) {
        throw new Error(`Missing dependency "${dependency}" for node "${node.id}".`);
      }

      dependencyNode.subscribers.push(node.id);
    }
  }

  const output: string[] = [];
  const temporary = new Set<string>();
  const permanent = new Set<string>();

  for (const id of Object.keys(nodes)) {
    visit(id, nodes, temporary, permanent, output);
  }

  return {
    nodes,
    topologicalOrder: output,
    fanOutBudget: config.fanOutBudget ?? 16,
  };
}

export function estimateAverageFanOut(graph: HyperReactivityGraph) {
  const entries = Object.values(graph.nodes);
  if (entries.length === 0) {
    return 0;
  }

  const total = entries.reduce((sum, node) => sum + node.subscribers.length, 0);
  return total / entries.length;
}
