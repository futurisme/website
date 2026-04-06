import type { CommandResult, MindmapEdge, MindmapNodeId, MindmapNodeInput, MindmapNodeSnapshot, MindmapSnapshot } from './types';

const ROOT_PARENT = -1;

/**
 * Struct-of-arrays store for high-frequency mindmap operations.
 *
 * Performance goals:
 * - O(1) id lookup via dense index table
 * - Low GC pressure by reusing typed arrays where possible
 * - Fast adjacency traversal via children map
 */
export class MindmapGraphStore {
  private nextId: MindmapNodeId = 1;
  private version = 1;
  private rootId: MindmapNodeId | null = null;

  private ids: MindmapNodeId[] = [];
  private titles: string[] = [];
  private parents: Int32Array = new Int32Array(16);
  private depths: Uint16Array = new Uint16Array(16);
  private weights: Float32Array = new Float32Array(16);

  private indexById = new Map<MindmapNodeId, number>();
  private childrenById = new Map<MindmapNodeId, MindmapNodeId[]>();

  addNode(input: MindmapNodeInput): CommandResult<MindmapNodeId> {
    const id = input.id ?? this.nextId++;
    if (this.indexById.has(id)) {
      return { ok: false, reason: `Node ${id} already exists.` };
    }

    const parentId = input.parentId ?? null;
    if (parentId !== null && !this.indexById.has(parentId)) {
      return { ok: false, reason: `Parent ${parentId} not found.` };
    }

    const index = this.ids.length;
    this.ensureCapacity(index + 1);

    this.ids.push(id);
    this.titles.push(input.title);
    this.parents[index] = parentId ?? ROOT_PARENT;
    this.depths[index] = parentId === null ? 0 : this.depths[this.indexById.get(parentId)!] + 1;
    this.weights[index] = input.weight ?? 1;

    this.indexById.set(id, index);
    this.childrenById.set(id, []);

    if (parentId === null) {
      if (this.rootId !== null) {
        return { ok: false, reason: 'Mindmap already has a root.' };
      }
      this.rootId = id;
    } else {
      this.childrenById.get(parentId)!.push(id);
    }

    this.version += 1;
    return { ok: true, value: id };
  }

  renameNode(id: MindmapNodeId, title: string): CommandResult {
    const index = this.indexById.get(id);
    if (index === undefined) {
      return { ok: false, reason: `Node ${id} not found.` };
    }
    this.titles[index] = title;
    this.version += 1;
    return { ok: true };
  }

  getChildren(id: MindmapNodeId): readonly MindmapNodeId[] {
    return this.childrenById.get(id) ?? [];
  }

  getSnapshot(): MindmapSnapshot {
    const nodes: MindmapNodeSnapshot[] = new Array(this.ids.length);
    for (let i = 0; i < this.ids.length; i += 1) {
      nodes[i] = {
        id: this.ids[i],
        title: this.titles[i],
        parentId: this.parents[i] === ROOT_PARENT ? null : this.parents[i],
        depth: this.depths[i],
        weight: this.weights[i],
      };
    }

    const edges: MindmapEdge[] = [];
    for (const node of nodes) {
      if (node.parentId !== null) {
        edges.push({ from: node.parentId, to: node.id });
      }
    }

    return {
      version: this.version,
      rootId: this.rootId,
      nodes,
      edges,
    };
  }

  private ensureCapacity(min: number): void {
    if (min <= this.parents.length) {
      return;
    }

    let next = this.parents.length;
    while (next < min) {
      next *= 2;
    }

    const parents = new Int32Array(next);
    parents.set(this.parents);
    this.parents = parents;

    const depths = new Uint16Array(next);
    depths.set(this.depths);
    this.depths = depths;

    const weights = new Float32Array(next);
    weights.set(this.weights);
    this.weights = weights;
  }
}
