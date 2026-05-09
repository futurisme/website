const DEFAULT_DATA = Object.freeze({ appTitle: 'ShareIdeas', categories: [{ id: 'category-1', name: 'Kategori 1', folders: [] }] });
const RECORD_KEY = '__SYSTEM__SHARE_IDEAS_V1';
const ID_PATTERN = /^[1-9][0-9]{0,95}$/;
let pool, schemaShare, schemaMap;

async function getPool(env) {
  if (pool) return pool;
  const cs = env.DATABASE_PUBLIC_URL || env.DATABASE_URL_PUBLIC || env.POSTGRES_PRISMA_URL || env.POSTGRES_URL_NON_POOLING || env.POSTGRES_URL || env.DATABASE_URL;
  if (!cs) return null;
  try {
    const { Pool } = await import('pg');
    pool = new Pool({ connectionString: cs, ssl: 'require', max: 2 });
    return pool;
  } catch {
    return null;
  }
}

const json = (obj, s = 200) => new Response(JSON.stringify(obj), { status: s, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });

async function handleShareIdeas(req, env) { /* unchanged */
  const p = await getPool(env); if (!p) return json({ ok: false, error: 'Database is not configured.' }, 500); if (!schemaShare) { schemaShare = p.query(`CREATE TABLE IF NOT EXISTS shareideas_state (key TEXT PRIMARY KEY,version INTEGER NOT NULL DEFAULT 1,data JSONB NOT NULL,updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW());CREATE TABLE IF NOT EXISTS shareideas_meta (id INTEGER PRIMARY KEY CHECK (id = 1),next_id BIGINT NOT NULL);INSERT INTO shareideas_meta(id,next_id) VALUES (1,1) ON CONFLICT (id) DO NOTHING;`); } await schemaShare; const u = new URL(req.url); const id = u.pathname.split('/').filter(Boolean)[2] || null; if (req.method === 'POST' && u.pathname === '/api/shareideas') { const c = await p.connect(); try { await c.query('BEGIN'); const cur = await c.query('SELECT next_id FROM shareideas_meta WHERE id=1 FOR UPDATE'); const nextId = Number(cur.rows[0]?.next_id ?? 1); const wid = String(nextId); await c.query('INSERT INTO shareideas_state(key,version,data) VALUES($1,1,$2::jsonb)', [`${RECORD_KEY}:${wid}`, JSON.stringify(DEFAULT_DATA)]); await c.query('UPDATE shareideas_meta SET next_id=$1 WHERE id=1', [nextId + 1]); await c.query('COMMIT'); return json({ ok: true, id: wid }, 201); } catch (e) { await c.query('ROLLBACK'); return json({ ok: false, error: String(e) }, 500); } finally { c.release(); } }
  if (!id || !ID_PATTERN.test(id)) return json({ ok: false, error: 'Invalid workspace id.' }, 400); const key = `${RECORD_KEY}:${id}`; if (req.method === 'GET') { const r = await p.query('SELECT version,data,updated_at FROM shareideas_state WHERE key=$1 LIMIT 1', [key]); if (!r.rowCount) return json({ ok: false, error: 'Workspace not found.' }, 404); const row = r.rows[0]; return json({ ok: true, id, version: Number(row.version), data: row.data, updatedAt: row.updated_at }); }
  if (req.method === 'PUT') { const body = await req.json().catch(() => ({})); const expected = Number.isInteger(Number(body.expectedVersion)) ? Number(body.expectedVersion) : null; const data = body.data ?? DEFAULT_DATA; if (expected !== null) { const up = await p.query('UPDATE shareideas_state SET data=$1::jsonb,version=version+1,updated_at=NOW() WHERE key=$2 AND version=$3 RETURNING version,data,updated_at', [JSON.stringify(data), key, expected]); if (!up.rowCount) { const latest = await p.query('SELECT version,data,updated_at FROM shareideas_state WHERE key=$1 LIMIT 1', [key]); return json({ ok: false, conflict: true, latest: latest.rows[0] ?? null }, 409); } const row = up.rows[0]; return json({ ok: true, id, version: Number(row.version), data: row.data, updatedAt: row.updated_at }); }
    const up = await p.query('INSERT INTO shareideas_state(key,version,data) VALUES($1,1,$2::jsonb) ON CONFLICT (key) DO UPDATE SET data=EXCLUDED.data,version=shareideas_state.version+1,updated_at=NOW() RETURNING version,data,updated_at', [key, JSON.stringify(data)]); const row = up.rows[0]; return json({ ok: true, id, version: Number(row.version), data: row.data, updatedAt: row.updated_at }); }
  return json({ ok: false, error: 'Method not allowed.' }, 405);
}

async function handleMindmap(req, env) { /* unchanged */
  const p = await getPool(env); if (!p) return json({ ok: false, error: 'Database is not configured.' }, 500); if (!schemaMap) { schemaMap = p.query('CREATE TABLE IF NOT EXISTS mindmapmaker_state (id BIGINT PRIMARY KEY, version INTEGER NOT NULL DEFAULT 1, data JSONB NOT NULL, updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())'); } await schemaMap; const id = Number(new URL(req.url).searchParams.get('id')); if (!Number.isInteger(id) || id < 1) return json({ ok: false, error: 'Invalid map id.' }, 400); if (req.method === 'GET') { const r = await p.query('SELECT id,version,data,updated_at FROM mindmapmaker_state WHERE id=$1::bigint LIMIT 1', [String(id)]); if (!r.rowCount) return json({ ok: false, error: 'Map not found.' }, 404); const row = r.rows[0]; return json({ ok: true, mapId: Number(row.id), version: Number(row.version), data: row.data, updatedAt: row.updated_at }); }
  if (req.method === 'PUT') { const body = await req.json().catch(() => ({})); const data = body.data ?? {}; const expected = Number.isInteger(Number(body.expectedVersion)) ? Number(body.expectedVersion) : null; if (expected !== null) { const r = await p.query('UPDATE mindmapmaker_state SET data=$1::jsonb,version=version+1,updated_at=NOW() WHERE id=$2::bigint AND version=$3 RETURNING id,version,data,updated_at', [JSON.stringify(data), String(id), expected]); if (!r.rowCount) return json({ ok: false, conflict: true }, 409); const row = r.rows[0]; return json({ ok: true, mapId: Number(row.id), version: Number(row.version), data: row.data, updatedAt: row.updated_at }); }
    const r = await p.query('INSERT INTO mindmapmaker_state(id,version,data) VALUES($1::bigint,1,$2::jsonb) ON CONFLICT (id) DO UPDATE SET data=EXCLUDED.data,version=mindmapmaker_state.version+1,updated_at=NOW() RETURNING id,version,data,updated_at', [String(id), JSON.stringify(data)]); const row = r.rows[0]; return json({ ok: true, mapId: Number(row.id), version: Number(row.version), data: row.data, updatedAt: row.updated_at }); }
  return json({ ok: false, error: 'Method not allowed.' }, 405);
}

const ROOT_ROUTES = new Map([
  ['/', '/website/portfolio/index.html'],
  ['/home', '/website/home/index.html'],
  ['/shareideas', '/website/shareideas/index.html'],
  ['/archives', '/website/archives/index.html'],
  ['/mindmapmaker', '/website/mindmapmaker/index.html'],
  ['/daily-streak', '/website/daily-streak/index.html'],
  ['/hype', '/games/hype/index.html'],
  ['/dreambusiness', '/games/dreambusiness/index.html'],
  ['/rpg', '/games/rpg/index.html']
]);

const STATIC_PREFIXES = [
  ['/home/', '/website/home/'],
  ['/shareideas/', '/website/shareideas/'],
  ['/archives/', '/website/archives/'],
  ['/mindmapmaker/', '/website/mindmapmaker/'],
  ['/daily-streak/', '/website/daily-streak/'],
  ['/hype/', '/games/hype/'],
  ['/dreambusiness/', '/games/dreambusiness/'],
  ['/rpg/', '/games/rpg/'],
  ['/assets/public/images/', '/assets/public/images/']
];

function mapPath(path) {
  const clean = path.endsWith('/') && path !== '/' ? path.slice(0, -1) : path;
  if (ROOT_ROUTES.has(clean)) return { type: 'asset', value: ROOT_ROUTES.get(clean) };
  const legacyRootMap = {
    '/website/portfolio': '/',
    '/website/portfolio/': '/',
    '/website/home': '/home',
    '/website/home/': '/home',
    '/website/shareideas': '/shareideas',
    '/website/shareideas/': '/shareideas',
    '/website/archives': '/archives',
    '/website/archives/': '/archives',
    '/website/mindmapmaker': '/mindmapmaker',
    '/website/mindmapmaker/': '/mindmapmaker',
    '/website/daily-streak': '/daily-streak',
    '/website/daily-streak/': '/daily-streak',
    '/games/hype': '/hype',
    '/games/hype/': '/hype',
    '/games/dreambusiness': '/dreambusiness',
    '/games/dreambusiness/': '/dreambusiness',
    '/games/rpg': '/rpg',
    '/games/rpg/': '/rpg'
  };
  if (legacyRootMap[path]) return { type: 'redirect', value: legacyRootMap[path] };
  for (const [from, to] of STATIC_PREFIXES) if (clean.startsWith(from)) return { type: 'asset', value: to + clean.slice(from.length) };
  const rootAssets = {
    '/robots.txt': '/website/robots.txt', '/sitemap.xml': '/website/sitemap.xml', '/site.webmanifest': '/website/site.webmanifest', '/fadhil.svg': '/website/fadhil.svg',
    '/fadhil-512x512.png': '/website/fadhil-512x512.png', '/favicon.ico': '/website/fadhil-512x512.png', '/favicon.png': '/website/fadhil-512x512.png', '/favicon.svg': '/website/fadhil.svg',
    '/apple-touch-icon.png': '/website/fadhil-512x512.png', '/portfolio.webp': '/assets/public/images/portfolio.webp'
  };
  if (rootAssets[clean]) return { type: 'asset', value: rootAssets[clean] };
  return { type: 'deny' };
}

function withPerfHeaders(response, pathname) {
  const h = new Headers(response.headers);
  h.set('X-Content-Type-Options', 'nosniff');
  h.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  const isHtml = pathname.endsWith('.html') || !pathname.includes('.');
  const isAsset = /\.(css|js|mjs|png|jpg|jpeg|webp|avif|svg|woff2?|ico|txt|xml)$/i.test(pathname);
  if (isHtml) h.set('Cache-Control', 'public, max-age=0, must-revalidate');
  else if (isAsset) h.set('Cache-Control', 'public, max-age=31536000, immutable');
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers: h });
}

export default {
  async fetch(req, env) {
    try {
      const u = new URL(req.url);
      if (u.pathname.startsWith('/api/shareideas')) return handleShareIdeas(req, env);
      if (u.pathname.startsWith('/api/mindmapmaker')) return handleMindmap(req, env);
      const r = mapPath(u.pathname);
      if (r.type === 'redirect') return Response.redirect(`${u.origin}${r.value}${u.search}`, 308);
      if (r.type === 'deny') return new Response('Not Found', { status: 404, headers: { 'cache-control': 'no-store' } });
      const assetFetcher = env?.ASSETS?.fetch;
      if (typeof assetFetcher !== 'function') {
        return new Response('Asset binding ASSETS is missing. Re-add the ASSETS binding in Cloudflare Workers & Pages.', {
          status: 503,
          headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' }
        });
      }
      const url = new URL(req.url); url.pathname = r.value;
      const res = await assetFetcher(new Request(url.toString(), req));
      return withPerfHeaders(res, r.value);
    } catch (error) {
      return new Response(`Worker runtime error: ${error instanceof Error ? error.message : String(error)}`, {
        status: 500,
        headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' }
      });
    }
  }
};
