import type { MindmapSnapshot } from '../types';

export interface MindmapRecord {
  mapId: number;
  version: number;
  payload: MindmapSnapshot;
  updatedAt: Date;
}

export interface QueryExecutor {
  <T = unknown>(sql: string, params?: readonly unknown[]): Promise<{ rows: T[] }>;
}

export interface MindmapRepository {
  save(mapId: number, snapshot: MindmapSnapshot): Promise<void>;
  get(mapId: number): Promise<MindmapRecord | null>;
}

export interface PostgresRepositoryOptions {
  schema?: string;
  table?: string;
}
