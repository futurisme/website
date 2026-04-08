const { Pool } = require('pg');

const DEFAULT_DATA = Object.freeze({
  appTitle: 'ShareIdeas',
  categories: [{ id: 'category-1', name: 'Kategori 1', folders: [] }],
});

const RECORD_KEY = '__SYSTEM__SHARE_IDEAS_V1';
const ID_PATTERN = /^[a-zA-Z0-9_-]{1,96}$/;

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

const connectionString = resolveDatabaseUrl();
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

const normalizedConnectionString = normalizeConnectionString(connectionString);
const pool = normalizedConnectionString
  ? new Pool({
      connectionString: normalizedConnectionString,
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

function sanitizeId(value, fallback) {
  if (typeof value !== 'string') return fallback;
  const cleaned = value.trim().slice(0, 96);
  return cleaned || fallback;
}

function sanitizeTitle(input) {
  if (typeof input !== 'string') return 'ShareIdeas';
  const cleaned = input.trim().slice(0, 40);
  return cleaned || 'ShareIdeas';
}

function sanitizeData(input) {
  const root = input && typeof input === 'object' ? input : {};
  const appTitle = sanitizeTitle(root.appTitle);
  const rawCategories = Array.isArray(root.categories) ? root.categories : [];
  const fallbackFolders = Array.isArray(root.folders) ? root.folders : [];

  const categories = (rawCategories.length ? rawCategories : [{ id: 'category-1', name: 'Kategori 1', folders: fallbackFolders }])
    .map((category, categoryIndex) => {
      if (!category || typeof category !== 'object') return null;
      const categoryId = sanitizeId(category.id, `category-${categoryIndex + 1}`);
      const categoryName = typeof category.name === 'string' && category.name.trim()
        ? category.name.trim().slice(0, 80)
        : `Kategori ${categoryIndex + 1}`;

      const folders = (Array.isArray(category.folders) ? category.folders : [])
        .map((folder, folderIndex) => {
          if (!folder || typeof folder !== 'object') return null;
          const name = typeof folder.name === 'string' ? folder.name.trim().slice(0, 80) : '';
          if (!name) return null;
          const folderId = sanitizeId(folder.id, `folder-${categoryId}-${folderIndex + 1}`);

          const cards = (Array.isArray(folder.cards) ? folder.cards : [])
            .map((card, cardIndex) => {
              if (!card || typeof card !== 'object') return null;
              const title = typeof card.title === 'string' ? card.title.trim().slice(0, 120) : '';
              if (!title) return null;
              const description = typeof card.description === 'string' ? card.description.trim().slice(0, 6000) : '';
              return {
                id: sanitizeId(card.id, `card-${folderId}-${cardIndex + 1}`),
                title,
                description,
              };
            })
            .filter(Boolean)
            .slice(0, 1000);

          return { id: folderId, name, cards };
        })
        .filter(Boolean)
        .slice(0, 300);

      return { id: categoryId, name: categoryName, folders };
    })
    .filter(Boolean)
    .slice(0, 64);

  return {
    appTitle,
    categories: categories.length ? categories : DEFAULT_DATA.categories,
  };
}

async function ensureSchema() {
  if (!pool) return;
  if (!schemaReadyPromise) {
    schemaReadyPromise = pool.query(`
      CREATE TABLE IF NOT EXISTS shareideas_state (
        key TEXT PRIMARY KEY,
        version INTEGER NOT NULL DEFAULT 1,
        data JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
  }
  await schemaReadyPromise;
}

async function getStateByKey(workspaceKey) {
  await ensureSchema();
  const result = await pool.query(
    'SELECT version, data, updated_at FROM shareideas_state WHERE key = $1 LIMIT 1',
    [workspaceKey]
  );

  if (result.rowCount === 0) {
    const seeded = sanitizeData(DEFAULT_DATA);
    const insertResult = await pool.query(
      'INSERT INTO shareideas_state(key, version, data) VALUES($1, 1, $2::jsonb) RETURNING version, data, updated_at',
      [workspaceKey, JSON.stringify(seeded)]
    );
    return insertResult.rows[0];
  }

  return result.rows[0];
}

async function updateState(workspaceKey, payload, expectedVersion) {
  const sanitized = sanitizeData(payload);
  await ensureSchema();

  if (Number.isFinite(expectedVersion)) {
    const optimistic = await pool.query(
      `UPDATE shareideas_state
       SET data = $1::jsonb, version = version + 1, updated_at = NOW()
       WHERE key = $2 AND version = $3
       RETURNING version, data, updated_at`,
      [JSON.stringify(sanitized), workspaceKey, expectedVersion]
    );

    if (optimistic.rowCount > 0) return { conflict: false, row: optimistic.rows[0] };

    const latest = await getStateByKey(workspaceKey);
    return { conflict: true, row: latest };
  }

  const forced = await pool.query(
    `INSERT INTO shareideas_state(key, version, data)
     VALUES($1, 1, $2::jsonb)
     ON CONFLICT (key)
     DO UPDATE SET data = EXCLUDED.data, version = shareideas_state.version + 1, updated_at = NOW()
     RETURNING version, data, updated_at`,
    [workspaceKey, JSON.stringify(sanitized)]
  );

  return { conflict: false, row: forced.rows[0] };
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
      error: 'Database belum terkonfigurasi. Set DATABASE_PUBLIC_URL atau DATABASE_URL_PUBLIC di Vercel.',
    });
  }

  const url = new URL(req.url, 'https://localhost');
  const workspaceId = url.searchParams.get('id') || 'default';
  if (!ID_PATTERN.test(workspaceId)) {
    return json(res, 400, { error: 'Invalid workspace id' });
  }
  const workspaceKey = `${RECORD_KEY}:${workspaceId}`;

  try {
    if (req.method === 'GET') {
      const row = await getStateByKey(workspaceKey);
      return json(res, 200, {
        data: sanitizeData(row.data),
        version: row.version,
        updatedAt: row.updated_at,
      });
    }

    if (req.method === 'PUT') {
      const body = req.body && typeof req.body === 'object' ? req.body : {};
      const expectedVersion = typeof body.expectedVersion === 'number' ? body.expectedVersion : null;
      const result = await updateState(workspaceKey, body.data, expectedVersion);

      if (result.conflict) {
        return json(res, 409, {
          error: 'Data conflict. Server has a newer version.',
          conflict: true,
          data: sanitizeData(result.row.data),
          version: result.row.version,
          updatedAt: result.row.updated_at,
        });
      }

      return json(res, 200, {
        data: sanitizeData(result.row.data),
        version: result.row.version,
        updatedAt: result.row.updated_at,
      });
    }

    res.setHeader('Allow', 'GET, PUT');
    return json(res, 405, { error: 'Method not allowed' });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return json(res, 500, {
      error: 'Failed to process shareideas request',
      message,
    });
  }
};
