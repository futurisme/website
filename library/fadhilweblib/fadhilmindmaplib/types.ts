export type MindmapNodeId = number;

export interface MindmapNodeInput {
  id?: MindmapNodeId;
  title: string;
  parentId?: MindmapNodeId | null;
  weight?: number;
}

export interface MindmapEdge {
  from: MindmapNodeId;
  to: MindmapNodeId;
}

export interface MindmapNodeSnapshot {
  id: MindmapNodeId;
  title: string;
  parentId: MindmapNodeId | null;
  depth: number;
  weight: number;
}

export interface MindmapSnapshot {
  version: number;
  rootId: MindmapNodeId | null;
  nodes: MindmapNodeSnapshot[];
  edges: MindmapEdge[];
}

export interface LayoutNode {
  id: MindmapNodeId;
  x: number;
  y: number;
  depth: number;
  radius: number;
}

export interface LayoutResult {
  width: number;
  height: number;
  nodes: LayoutNode[];
}

export interface LayoutOptions {
  horizontalGap?: number;
  verticalGap?: number;
  nodeRadius?: number;
  padding?: number;
}

export interface CommandResult<T = void> {
  ok: boolean;
  value?: T;
  reason?: string;
}
