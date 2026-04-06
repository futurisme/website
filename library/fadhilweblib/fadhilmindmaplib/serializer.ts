import type { MindmapSnapshot } from './types';

/**
 * Compact serializer for network/storage transfer.
 * Keeps payload deterministic and easy to diff.
 */
export function serializeMindmap(snapshot: MindmapSnapshot): string {
  return JSON.stringify(snapshot);
}

export function deserializeMindmap(payload: string): MindmapSnapshot {
  const parsed = JSON.parse(payload) as MindmapSnapshot;
  if (!Array.isArray(parsed.nodes) || !Array.isArray(parsed.edges)) {
    throw new Error('Invalid mindmap payload.');
  }
  return parsed;
}
