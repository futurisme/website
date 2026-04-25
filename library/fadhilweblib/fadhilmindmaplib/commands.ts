import { MindmapGraphStore } from './graph-store';
import { computeMindmapLayout } from './layout-fast';
import type { CommandResult, LayoutOptions, LayoutResult, MindmapNodeId, MindmapNodeInput, MindmapSnapshot } from './types';

export class FadhilMindmapEngine {
  private store = new MindmapGraphStore();

  createRoot(title: string): CommandResult<MindmapNodeId> {
    return this.store.addNode({ title, parentId: null });
  }

  addNode(input: MindmapNodeInput): CommandResult<MindmapNodeId> {
    return this.store.addNode(input);
  }

  renameNode(id: MindmapNodeId, title: string): CommandResult {
    return this.store.renameNode(id, title);
  }

  getSnapshot(): MindmapSnapshot {
    return this.store.getSnapshot();
  }

  computeLayout(options?: LayoutOptions): LayoutResult {
    return computeMindmapLayout(this.store.getSnapshot(), options);
  }

  replaceSnapshot(snapshot: MindmapSnapshot): void {
    const next = new MindmapGraphStore();
    if (snapshot.rootId !== null) {
      const root = snapshot.nodes.find((n) => n.id === snapshot.rootId);
      next.addNode({ id: snapshot.rootId, title: root?.title ?? 'Root', parentId: null, weight: root?.weight ?? 1 });
    }

    const nonRoot = snapshot.nodes
      .filter((node) => node.id !== snapshot.rootId)
      .sort((a, b) => a.depth - b.depth);

    for (const node of nonRoot) {
      next.addNode({
        id: node.id,
        title: node.title,
        parentId: node.parentId ?? undefined,
        weight: node.weight,
      });
    }

    this.store = next;
  }
}
