import { serializeMindmap, deserializeMindmap } from '../serializer';
import type { MindmapRecord, MindmapRepository, PostgresRepositoryOptions, QueryExecutor } from './types';

const DEFAULT_SCHEMA = 'public';
const DEFAULT_TABLE = 'fadhil_mindmaps';

export function createPostgresMindmapRepository(query: QueryExecutor, options: PostgresRepositoryOptions = {}): MindmapRepository {
  const schema = options.schema ?? DEFAULT_SCHEMA;
  const table = options.table ?? DEFAULT_TABLE;
  const fqtn = `${quoteIdent(schema)}.${quoteIdent(table)}`;

  return {
    async save(mapId, snapshot) {
      const payload = serializeMindmap(snapshot);
      await query(
        `
        INSERT INTO ${fqtn} (map_id, version, payload)
        VALUES ($1, $2, $3::jsonb)
        ON CONFLICT (map_id)
        DO UPDATE SET
          version = EXCLUDED.version,
          payload = EXCLUDED.payload,
          updated_at = NOW()
        `,
        [mapId, snapshot.version, payload],
      );
    },

    async get(mapId) {
      const result = await query<{ map_id: number; version: number; payload: unknown; updated_at: Date }>(
        `SELECT map_id, version, payload, updated_at FROM ${fqtn} WHERE map_id = $1 LIMIT 1`,
        [mapId],
      );

      const row = result.rows[0];
      if (!row) {
        return null;
      }

      return {
        mapId: row.map_id,
        version: row.version,
        payload: deserializeMindmap(JSON.stringify(row.payload)),
        updatedAt: new Date(row.updated_at),
      } as MindmapRecord;
    },
  };
}

export const postgresRailwaySchemaSql = `
CREATE TABLE IF NOT EXISTS public.fadhil_mindmaps (
  map_id BIGINT PRIMARY KEY,
  version BIGINT NOT NULL,
  payload JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_fadhil_mindmaps_updated_at ON public.fadhil_mindmaps(updated_at DESC);
`;

export interface RailwayPostgresRuntimeConfig {
  connectionString: string;
  ssl: 'require' | 'prefer' | 'disable';
  maxConnections: number;
}

export function resolveRailwayPostgresConfig(env: Record<string, string | undefined> = process.env): RailwayPostgresRuntimeConfig {
  const connectionString =
    env.DATABASE_PUBLIC_URL ??
    env.DATABASE_URL_PUBLIC ??
    env.POSTGRES_PRISMA_URL ??
    env.POSTGRES_URL_NON_POOLING ??
    env.POSTGRES_URL ??
    env.DATABASE_URL ??
    '';

  if (!connectionString) {
    throw new Error('Missing PostgreSQL connection string (Railway-compatible vars not found).');
  }

  const ssl = (env.PGSSLMODE as RailwayPostgresRuntimeConfig['ssl']) || 'require';
  const maxConnections = Number(env.PGPOOL_MAX_CONNECTIONS ?? 10);

  return { connectionString, ssl, maxConnections: Number.isFinite(maxConnections) ? maxConnections : 10 };
}

function quoteIdent(name: string): string {
  return `"${name.replaceAll('"', '""')}"`;
}
