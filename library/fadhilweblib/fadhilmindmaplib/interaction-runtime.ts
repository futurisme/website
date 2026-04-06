import { FadhilMindmapEngine } from './commands';
import type { CommandResult, MindmapNodeId, MindmapSnapshot } from './types';

export type InteractionCommand =
  | { type: 'create_root'; title: string }
  | { type: 'add_node'; parentId: MindmapNodeId; title: string; id?: MindmapNodeId }
  | { type: 'rename_node'; id: MindmapNodeId; title: string };

export interface InteractionPatch {
  version: number;
  snapshot: MindmapSnapshot;
}

/**
 * High-throughput interaction runtime:
 * - batched command processing per microtask
 * - minimal observer notifications (one patch per flush)
 * - bounded history ring buffer for low memory overhead
 */
export class MindmapInteractionRuntime {
  private engine = new FadhilMindmapEngine();
  private readonly observers = new Set<(patch: InteractionPatch) => void>();
  private readonly queue: InteractionCommand[] = [];
  private readonly history: MindmapSnapshot[] = [];
  private readonly maxHistory: number;
  private scheduled = false;

  constructor(maxHistory = 40) {
    this.maxHistory = Math.max(1, maxHistory);
    this.pushHistory(this.engine.getSnapshot());
  }

  enqueue(command: InteractionCommand): void {
    this.queue.push(command);
    if (!this.scheduled) {
      this.scheduled = true;
      queueMicrotask(() => this.flush());
    }
  }

  subscribe(fn: (patch: InteractionPatch) => void): () => void {
    this.observers.add(fn);
    return () => this.observers.delete(fn);
  }

  snapshot(): MindmapSnapshot {
    return this.engine.getSnapshot();
  }

  undo(): CommandResult {
    if (this.history.length <= 1) {
      return { ok: false, reason: 'No history to undo.' };
    }

    this.history.pop();
    const prev = this.history[this.history.length - 1];
    this.engine.replaceSnapshot(prev);
    this.emit();
    return { ok: true };
  }

  private flush(): void {
    this.scheduled = false;
    if (this.queue.length === 0) {
      return;
    }

    while (this.queue.length > 0) {
      const command = this.queue.shift()!;
      switch (command.type) {
        case 'create_root':
          this.engine.createRoot(command.title);
          break;
        case 'add_node':
          this.engine.addNode({ id: command.id, parentId: command.parentId, title: command.title });
          break;
        case 'rename_node':
          this.engine.renameNode(command.id, command.title);
          break;
      }
    }

    this.pushHistory(this.engine.getSnapshot());
    this.emit();
  }

  private pushHistory(snapshot: MindmapSnapshot): void {
    this.history.push(snapshot);
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }
  }

  private emit(): void {
    const snapshot = this.engine.getSnapshot();
    const patch: InteractionPatch = {
      version: snapshot.version,
      snapshot,
    };
    for (const observer of this.observers) {
      observer(patch);
    }
  }
}
