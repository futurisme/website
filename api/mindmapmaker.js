const { Pool } = require('pg');

function resolveDatabaseUrl() {
  const candidates = [
    process.env.DATABASE_PUBLIC_URL,
    process.env.DATABASE_URL_PUBLIC,
    process.env.POSTGRES_PRISMA_URL,
    process.env.POSTGRES_URL_NON_POOLING,
    process.env.POSTGRES_URL,
    process.env.DATABASE_URL,
  ].filter((value) => typeof value === 'string' && value.trim().length > 0);

  return candidates[0] || null;
}

function normalizeConnectionString(input) {
  if (!input) return null;
  try {
    const parsed = new URL(input);
    parsed.searchParams.delete('sslmode');
    parsed.searchParams.delete('ssl');
    parsed.searchParams.delete('sslcert');
    parsed.searchParams.delete('sslkey');
    parsed.searchParams.delete('sslrootcert');
    parsed.searchParams.delete('uselibpqcompat');
    return parsed.toString();
  } catch {
    return input;
  }
}

const connectionString = normalizeConnectionString(resolveDatabaseUrl());
const pool = connectionString
  ? new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false, requestCert: false },
      max: 2,
      connectionTimeoutMillis: 8000,
      idleTimeoutMillis: 10_000,
      keepAlive: true,
    })
  : null;

let schemaReadyPromise = null;

function json(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(payload));
}

function sanitizeMapId(rawId) {
  const id = Number(rawId);
  if (!Number.isInteger(id) || id < 1 || id > Number.MAX_SAFE_INTEGER) return null;
  return id;
}

function sanitizeNode(raw, fallbackId) {
  if (!raw || typeof raw !== 'object') return null;
  const id = Number(raw.id);
  const x = Number(raw.x);
  const y = Number(raw.y);
  if (!Number.isFinite(id) || !Number.isFinite(x) || !Number.isFinite(y)) return null;
  const title = typeof raw.title === 'string' ? raw.title.trim().slice(0, 180) : '';
  return {
    id: Number.isInteger(id) && id > 0 ? id : fallbackId,
    title: title || `Node ${fallbackId}`,
    x,
    y,
    parentId: Number.isInteger(raw.parentId) ? raw.parentId : null,
    depth: Number.isFinite(Number(raw.depth)) ? Number(raw.depth) : 0,
    weight: Number.isFinite(Number(raw.weight)) ? Number(raw.weight) : 1,
  };
}

function sanitizeLink(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const from = Number(raw.from);
  const to = Number(raw.to);
  if (!Number.isInteger(from) || !Number.isInteger(to) || from < 1 || to < 1 || from === to) return null;
  return { from, to };
}

function sanitizeSnapshot(raw) {
  const root = raw && typeof raw === 'object' ? raw : {};
  const nodesRaw = Array.isArray(root.nodes) ? root.nodes : [];
  const linksRaw = Array.isArray(root.links) ? root.links : [];
  const edgesRaw = Array.isArray(root.edges) ? root.edges : [];

  const nodes = nodesRaw.map((node, index) => sanitizeNode(node, index + 1)).filter(Boolean).slice(0, 3000);
  const nodeIds = new Set(nodes.map((node) => node.id));
  const links = linksRaw
    .map(sanitizeLink)
    .filter((link) => link && nodeIds.has(link.from) && nodeIds.has(link.to))
    .slice(0, 12000);
  const edges = edgesRaw
    .map(sanitizeLink)
    .filter((edge) => edge && nodeIds.has(edge.from) && nodeIds.has(edge.to))
    .slice(0, 12000);

  return {
    version: Number.isFinite(Number(root.version)) ? Number(root.version) : 1,
    nodes,
    links,
    edges,
  };
}

async function ensureSchema() {
  if (!pool) return;
  if (!schemaReadyPromise) {
    schemaReadyPromise = pool.query(`
      CREATE TABLE IF NOT EXISTS mindmapmaker_state (
        id BIGINT PRIMARY KEY,
        version INTEGER NOT NULL DEFAULT 1,
        data JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
  }
  await schemaReadyPromise;
}

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.setHeader('Allow', 'GET, PUT, OPTIONS');
    res.setHeader('Cache-Control', 'no-store');
    res.end();
    return;
  }

  if (!pool) {
    return json(res, 500, {
      ok: false,
      error: 'Database is not configured. Set DATABASE_PUBLIC_URL or DATABASE_URL_PUBLIC.',
    });
  }

  const url = new URL(req.url, 'https://localhost');
  const mapId = sanitizeMapId(url.searchParams.get('id'));
  if (!mapId) {
    return json(res, 400, { ok: false, error: 'Invalid map id.' });
  }

  try {
    await ensureSchema();

    if (req.method === 'GET') {
      const result = await pool.query(
        'SELECT id, version, data, updated_at FROM mindmapmaker_state WHERE id = $1::bigint LIMIT 1',
        [String(mapId)],
      );
      if (result.rowCount === 0) {
        return json(res, 404, { ok: false, error: 'Map not found.' });
      }
      const row = result.rows[0];
      return json(res, 200, {
        ok: true,
        mapId: Number(row.id),
        version: Number(row.version),
        data: row.data,
        updatedAt: row.updated_at,
      });
    }

    if (req.method === 'PUT') {
      const body = req.body && typeof req.body === 'object' ? req.body : {};
      const snapshot = sanitizeSnapshot(body.data);
      const expectedVersion = Number.isInteger(Number(body.expectedVersion)) ? Number(body.expectedVersion) : null;

      if (expectedVersion !== null) {
        const optimistic = await pool.query(
          `UPDATE mindmapmaker_state
           SET data = $1::jsonb, version = version + 1, updated_at = NOW()
           WHERE id = $2::bigint AND version = $3
           RETURNING id, version, data, updated_at`,
          [JSON.stringify(snapshot), String(mapId), expectedVersion],
        );
        if (optimistic.rowCount === 0) {
          const latest = await pool.query(
            'SELECT id, version, data, updated_at FROM mindmapmaker_state WHERE id = $1::bigint LIMIT 1',
            [String(mapId)],
          );
          return json(res, 409, {
            ok: false,
            conflict: true,
            latest: latest.rowCount ? latest.rows[0] : null,
          });
        }
        const row = optimistic.rows[0];
        return json(res, 200, { ok: true, mapId: Number(row.id), version: Number(row.version), data: row.data, updatedAt: row.updated_at });
      }

      const upsert = await pool.query(
        `INSERT INTO mindmapmaker_state(id, version, data)
         VALUES($1::bigint, 1, $2::jsonb)
         ON CONFLICT (id)
         DO UPDATE SET data = EXCLUDED.data, version = mindmapmaker_state.version + 1, updated_at = NOW()
         RETURNING id, version, data, updated_at`,
        [String(mapId), JSON.stringify(snapshot)],
      );
      const row = upsert.rows[0];
      return json(res, 200, { ok: true, mapId: Number(row.id), version: Number(row.version), data: row.data, updatedAt: row.updated_at });
    }

    return json(res, 405, { ok: false, error: 'Method not allowed.' });
  } catch (error) {
    return json(res, 500, {
      ok: false,
      error: 'Failed to process mindmapmaker request.',
      details: error instanceof Error ? error.message : String(error),
    });
  }
};
