import type { MindmapNodeSnapshot } from './types';

export interface LiteNode extends MindmapNodeSnapshot {
  x: number;
  y: number;
}

export interface LiteSnapshot {
  version: number;
  nodes: LiteNode[];
  links: Array<{ from: number; to: number }>;
  edges: Array<{ from: number; to: number; kind: 'tree' | 'link' }>;
}

/**
 * Browser-first minimal runtime used by static editor shells.
 * Optimized for tiny payload + touch interactions.
 */
export class FadhilMindmapLite {
  private version = 1;
  private nextId = 2;
  private nodes: LiteNode[] = [{ id: 1, title: 'Main Topic', parentId: null, depth: 0, weight: 1, x: 0, y: 0 }];
  private links: Array<{ from: number; to: number }> = [];
  private nodeIndexById = new Map<number, number>([[1, 0]]);
  private childIdsByParent = new Map<number, number[]>();
  private outgoingLinkCount = new Map<number, number>();
  private cachedSnapshot: LiteSnapshot | null = null;
  private dirtySnapshot = true;
  private history: LiteSnapshot[] = [];
  private historyIndex = -1;

  constructor() {
    this.recordHistory();
  }

  static fromSnapshot(snapshot: LiteSnapshot): FadhilMindmapLite {
    const engine = new FadhilMindmapLite();
    if (Array.isArray(snapshot?.nodes) && snapshot.nodes.length > 0) {
      engine.nodes = snapshot.nodes.map((n) => ({ ...n }));
      engine.links = Array.isArray(snapshot.links) ? snapshot.links.map((l) => ({ ...l })) : [];
      engine.nextId = Math.max(...engine.nodes.map((n) => n.id), 1) + 1;
      engine.version = snapshot.version || 1;
      engine.rebuildIndexes();
      engine.history = [];
      engine.historyIndex = -1;
      engine.recordHistory();
    }
    return engine;
  }

  getSnapshot(): LiteSnapshot {
    if (!this.dirtySnapshot && this.cachedSnapshot) {
      return this.cachedSnapshot;
    }

    const treeEdges = this.nodes.filter((n) => n.parentId !== null).map((n) => ({ from: n.parentId!, to: n.id, kind: 'tree' as const }));
    const linkEdges = this.links.map((l) => ({ ...l, kind: 'link' as const }));

    this.cachedSnapshot = {
      version: this.version,
      nodes: this.nodes.map((n) => ({ ...n })),
      links: this.links.map((l) => ({ ...l })),
      edges: [...treeEdges, ...linkEdges],
    };
    this.dirtySnapshot = false;
    return this.cachedSnapshot;
  }

  getNode(id: number): LiteNode | undefined {
    const index = this.nodeIndexById.get(id);
    if (index === undefined) {
      return undefined;
    }
    return this.nodes[index];
  }

  addNode(parentId: number, title = 'New Node'): LiteNode {
    const parent = this.getNode(parentId) ?? this.nodes[0];
    const siblings = this.childIdsByParent.get(parent.id) ?? [];
    const node: LiteNode = {
      id: this.nextId++,
      title,
      parentId: parent.id,
      depth: parent.depth + 1,
      weight: 1,
      x: parent.x + 220,
      y: parent.y + siblings.length * 90,
    };
    this.pushNode(node);
    this.bumpVersion();
    this.recordHistory();
    return node;
  }

  removeNode(id: number): boolean {
    if (id === 1) return false;
    const target = this.getNode(id);
    if (!target) return false;
    const parentId = target.parentId ?? 1;

    this.nodes = this.nodes.filter((n) => n.id !== id).map((n) => (n.parentId === id ? { ...n, parentId } : n));
    this.links = this.links.filter((l) => l.from !== id && l.to !== id);
    this.rebuildIndexes();
    this.bumpVersion();
    this.recordHistory();
    return true;
  }

  connect(from: number, to: number): boolean {
    if (from === to) return false;
    if (!this.nodeIndexById.has(from) || !this.nodeIndexById.has(to)) return false;
    if (this.links.some((l) => l.from === from && l.to === to)) return false;
    this.links.push({ from, to });
    this.outgoingLinkCount.set(from, (this.outgoingLinkCount.get(from) ?? 0) + 1);
    this.bumpVersion();
    this.recordHistory();
    return true;
  }

  hasConnectionFrom(id: number): boolean {
    return (this.outgoingLinkCount.get(id) ?? 0) > 0;
  }

  unconnectFrom(id: number): boolean {
    const count = this.outgoingLinkCount.get(id) ?? 0;
    if (count === 0) return false;
    this.links = this.links.filter((l) => l.from !== id);
    this.outgoingLinkCount.set(id, 0);
    this.bumpVersion();
    this.recordHistory();
    return true;
  }

  updateNode(id: number, patch: Partial<Pick<LiteNode, 'title' | 'x' | 'y'>>): void {
    const node = this.getNode(id);
    if (!node) return;
    const prevTitle = node.title;
    const prevX = node.x;
    const prevY = node.y;
    Object.assign(node, patch);
    if (node.title !== prevTitle || node.x !== prevX || node.y !== prevY) {
      this.bumpVersion();
      this.recordHistory();
    }
  }

  canUndo(): boolean {
    return this.historyIndex > 0;
  }

  canRedo(): boolean {
    return this.historyIndex >= 0 && this.historyIndex < this.history.length - 1;
  }

  undo(): boolean {
    if (!this.canUndo()) {
      return false;
    }
    this.historyIndex -= 1;
    this.applyHistorySnapshot(this.history[this.historyIndex]);
    return true;
  }

  redo(): boolean {
    if (!this.canRedo()) {
      return false;
    }
    this.historyIndex += 1;
    this.applyHistorySnapshot(this.history[this.historyIndex]);
    return true;
  }

  toCsv(): string {
    const head = 'id,title,parentId,x,y,depth,weight';
    const rows = this.nodes.map((n) => [n.id, quoteCsv(n.title), n.parentId ?? '', n.x, n.y, n.depth, n.weight].join(','));
    return [head, ...rows].join('\n');
  }

  private pushNode(node: LiteNode): void {
    const index = this.nodes.length;
    this.nodes.push(node);
    this.nodeIndexById.set(node.id, index);
    if (node.parentId !== null) {
      let children = this.childIdsByParent.get(node.parentId);
      if (!children) {
        children = [];
        this.childIdsByParent.set(node.parentId, children);
      }
      children.push(node.id);
    }
  }

  private rebuildIndexes(): void {
    this.nodeIndexById = new Map();
    this.childIdsByParent = new Map();
    this.outgoingLinkCount = new Map();
    for (let i = 0; i < this.nodes.length; i += 1) {
      const node = this.nodes[i];
      this.nodeIndexById.set(node.id, i);
      if (node.parentId !== null) {
        let children = this.childIdsByParent.get(node.parentId);
        if (!children) {
          children = [];
          this.childIdsByParent.set(node.parentId, children);
        }
        children.push(node.id);
      }
    }
    for (const link of this.links) {
      this.outgoingLinkCount.set(link.from, (this.outgoingLinkCount.get(link.from) ?? 0) + 1);
    }
    this.dirtySnapshot = true;
    this.cachedSnapshot = null;
  }

  private bumpVersion(): void {
    this.version += 1;
    this.dirtySnapshot = true;
    this.cachedSnapshot = null;
  }

  private recordHistory(): void {
    const snapshot = this.cloneSnapshot(this.getSnapshot());
    if (this.historyIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.historyIndex + 1);
    }
    this.history.push(snapshot);
    if (this.history.length > 120) {
      this.history.shift();
    }
    this.historyIndex = this.history.length - 1;
  }

  private applyHistorySnapshot(snapshot: LiteSnapshot): void {
    this.nodes = snapshot.nodes.map((node) => ({ ...node }));
    this.links = snapshot.links.map((link) => ({ ...link }));
    this.version = snapshot.version;
    this.nextId = Math.max(...this.nodes.map((node) => node.id), 1) + 1;
    this.rebuildIndexes();
  }

  private cloneSnapshot(snapshot: LiteSnapshot): LiteSnapshot {
    return {
      version: snapshot.version,
      nodes: snapshot.nodes.map((node) => ({ ...node })),
      links: snapshot.links.map((link) => ({ ...link })),
      edges: snapshot.edges.map((edge) => ({ ...edge })),
    };
  }
}

function quoteCsv(value: string): string {
  const escaped = value.replaceAll('"', '""');
  return `"${escaped}"`;
}

interface EdgePoint {
  x: number;
  y: number;
}

interface SmartEdgeOptions {
  tension?: number;
}

export function buildEdgePath(from: EdgePoint, to: EdgePoint, options: SmartEdgeOptions = {}): string {
  if (!Number.isFinite(from.x) || !Number.isFinite(from.y) || !Number.isFinite(to.x) || !Number.isFinite(to.y)) {
    return '';
  }

  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const distance = Math.hypot(dx, dy);
  const tension = options.tension ?? 0.35;
  const control = Math.max(28, Math.min(220, distance * tension));
  const adaptiveX = dx >= 0 ? control : Math.max(44, control * 1.4);
  const c1x = from.x + adaptiveX;
  const c2x = to.x - adaptiveX;
  return `M ${round3(from.x)} ${round3(from.y)} C ${round3(c1x)} ${round3(from.y)}, ${round3(c2x)} ${round3(to.y)}, ${round3(to.x)} ${round3(to.y)}`;
}

function round3(value: number): number {
  return Math.round(value * 1000) / 1000;
}
