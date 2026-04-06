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

  static fromSnapshot(snapshot: LiteSnapshot): FadhilMindmapLite {
    const engine = new FadhilMindmapLite();
    if (Array.isArray(snapshot?.nodes) && snapshot.nodes.length > 0) {
      engine.nodes = snapshot.nodes.map((n) => ({ ...n }));
      engine.links = Array.isArray(snapshot.links) ? snapshot.links.map((l) => ({ ...l })) : [];
      engine.nextId = Math.max(...engine.nodes.map((n) => n.id), 1) + 1;
      engine.version = snapshot.version || 1;
    }
    return engine;
  }

  getSnapshot(): LiteSnapshot {
    const treeEdges = this.nodes.filter((n) => n.parentId !== null).map((n) => ({ from: n.parentId!, to: n.id, kind: 'tree' as const }));
    const linkEdges = this.links.map((l) => ({ ...l, kind: 'link' as const }));

    return {
      version: this.version,
      nodes: this.nodes.map((n) => ({ ...n })),
      links: this.links.map((l) => ({ ...l })),
      edges: [...treeEdges, ...linkEdges],
    };
  }

  addNode(parentId: number, title = 'New Node'): LiteNode {
    const parent = this.nodes.find((n) => n.id === parentId) ?? this.nodes[0];
    const siblings = this.nodes.filter((n) => n.parentId === parent.id);
    const node: LiteNode = {
      id: this.nextId++,
      title,
      parentId: parent.id,
      depth: parent.depth + 1,
      weight: 1,
      x: parent.x + 220,
      y: parent.y + siblings.length * 90,
    };
    this.nodes.push(node);
    this.version += 1;
    return node;
  }

  removeNode(id: number): boolean {
    if (id === 1) return false;
    const target = this.nodes.find((n) => n.id === id);
    if (!target) return false;
    const parentId = target.parentId ?? 1;

    this.nodes = this.nodes.filter((n) => n.id !== id).map((n) => (n.parentId === id ? { ...n, parentId } : n));
    this.links = this.links.filter((l) => l.from !== id && l.to !== id);
    this.version += 1;
    return true;
  }

  connect(from: number, to: number): boolean {
    if (from === to) return false;
    if (this.links.some((l) => l.from === from && l.to === to)) return false;
    this.links.push({ from, to });
    this.version += 1;
    return true;
  }

  hasConnectionFrom(id: number): boolean {
    return this.links.some((l) => l.from === id);
  }

  unconnectFrom(id: number): boolean {
    const before = this.links.length;
    this.links = this.links.filter((l) => l.from !== id);
    if (before !== this.links.length) {
      this.version += 1;
      return true;
    }
    return false;
  }

  updateNode(id: number, patch: Partial<Pick<LiteNode, 'title' | 'x' | 'y'>>): void {
    const node = this.nodes.find((n) => n.id === id);
    if (!node) return;
    Object.assign(node, patch);
    this.version += 1;
  }

  toCsv(): string {
    const head = 'id,title,parentId,x,y,depth,weight';
    const rows = this.nodes.map((n) => [n.id, quoteCsv(n.title), n.parentId ?? '', n.x, n.y, n.depth, n.weight].join(','));
    return [head, ...rows].join('\n');
  }
}

function quoteCsv(value: string): string {
  const escaped = value.replaceAll('"', '""');
  return `"${escaped}"`;
}
