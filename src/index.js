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

async function handleMindmap(req, env) {
  try {
    const p = await getPool(env);
    if (!p) {
      return json({ ok: false, error: 'Database is not configured. Set DATABASE_PUBLIC_URL (or DATABASE_URL) to your Supabase Postgres connection string.' }, 500);
    }

    if (!schemaMap) {
      schemaMap = p.query('CREATE TABLE IF NOT EXISTS mindmapmaker_state (id BIGINT PRIMARY KEY, version INTEGER NOT NULL DEFAULT 1, data JSONB NOT NULL, updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())');
    }
    await schemaMap;

    const id = Number(new URL(req.url).searchParams.get('id'));
    if (!Number.isInteger(id) || id < 1) return json({ ok: false, error: 'Invalid map id.' }, 400);

    if (req.method === 'GET') {
      const r = await p.query('SELECT id,version,data,updated_at FROM mindmapmaker_state WHERE id=$1::bigint LIMIT 1', [String(id)]);
      if (!r.rowCount) return json({ ok: false, error: 'Map not found.' }, 404);
      const row = r.rows[0];
      return json({ ok: true, mapId: Number(row.id), version: Number(row.version), data: row.data, updatedAt: row.updated_at });
    }

    if (req.method === 'PUT') {
      const body = await req.json().catch(() => ({}));
      const data = body?.data ?? body ?? {};
      const expected = Number.isInteger(Number(body?.expectedVersion)) ? Number(body.expectedVersion) : null;
      if (expected !== null) {
        const r = await p.query('UPDATE mindmapmaker_state SET data=$1::jsonb,version=version+1,updated_at=NOW() WHERE id=$2::bigint AND version=$3 RETURNING id,version,data,updated_at', [JSON.stringify(data), String(id), expected]);
        if (!r.rowCount) return json({ ok: false, conflict: true }, 409);
        const row = r.rows[0];
        return json({ ok: true, mapId: Number(row.id), version: Number(row.version), data: row.data, updatedAt: row.updated_at });
      }
      const r = await p.query('INSERT INTO mindmapmaker_state(id,version,data) VALUES($1::bigint,1,$2::jsonb) ON CONFLICT (id) DO UPDATE SET data=EXCLUDED.data,version=mindmapmaker_state.version+1,updated_at=NOW() RETURNING id,version,data,updated_at', [String(id), JSON.stringify(data)]);
      const row = r.rows[0];
      return json({ ok: true, mapId: Number(row.id), version: Number(row.version), data: row.data, updatedAt: row.updated_at });
    }

    return json({ ok: false, error: 'Method not allowed.' }, 405);
  } catch (error) {
    return json({ ok: false, error: `Mindmap API failure: ${error instanceof Error ? error.message : String(error)}` }, 500);
  }
}


function handleMindmapAuthConfig(req, env) {
  if (req.method !== 'GET') return json({ ok: false, error: 'Method not allowed.' }, 405);
  const supabaseUrl = env.SUPABASE_URL || env.PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = env.SUPABASE_ANON_KEY || env.PUBLIC_SUPABASE_ANON_KEY || '';
  if (!supabaseUrl || !supabaseAnonKey) return json({ ok: false, error: 'Supabase auth config is missing on the server.' }, 503);
  return json({ ok: true, supabaseUrl, supabaseAnonKey });
}

const ROUTES = new Map([
  ['/', '/website/portfolio/index.html'],
  ['/home', '/website/home/index.html'],
  ['/shareideas', '/website/shareideas/index.html'],
  ['/archives', '/website/archives/index.html'],
  ['/academia', '/academia/index.html'],
  ['/mindmapmaker', '/website/website/mindmapmaker/index.html'],
  ['/books', '/website/website/books/index.html'],
  ['/daily-streak', '/website/daily-streak/index.html'],
  ['/hype', '/hype/index.html'],
  ['/dreambusiness', '/dreambusiness/index.html'],
  ['/rpg', '/rpg/index.html']
]);

const STATIC_PREFIXES = [
  ['/home/', '/website/home/'],
  ['/shareideas/', '/website/shareideas/'],
  ['/archives/', '/website/archives/'],
  ['/academia/', '/academia/'],
  ['/mindmapmaker/', '/website/website/mindmapmaker/'],
  ['/books/', '/website/website/books/'],
  ['/daily-streak/', '/website/daily-streak/'],
  ['/hype/', '/hype/'],
  ['/dreambusiness/', '/dreambusiness/'],
  ['/rpg/', '/rpg/'],
  ['/assets/public/', '/assets/public/'],
  ['/portfolio/', '/website/portfolio/']
];

const ROOT_ASSETS = Object.freeze({
  '/robots.txt': '/website/robots.txt',
  '/sitemap.xml': '/website/sitemap.xml',
  '/site.webmanifest': '/website/site.webmanifest',
  '/fadhil.svg': '/website/fadhil.svg',
  '/fadhil-512x512.png': '/website/fadhil-512x512.png',
  '/favicon.ico': '/website/fadhil-512x512.png',
  '/favicon.png': '/website/fadhil-512x512.png',
  '/favicon.svg': '/website/fadhil.svg',
  '/apple-touch-icon.png': '/website/fadhil-512x512.png',
  '/portfolio.webp': '/assets/public/images/portfolio.webp'
});

function normalizePath(pathname) {
  let path = pathname.replace(/\/+/g, '/');
  if (path.length > 1 && path.endsWith('/')) path = path.slice(0, -1);
  return path || '/';
}

function appendSearch(target, search) {
  return `${target}${search || ''}`;
}

function canonicalPath(pathname) {
  let path = normalizePath(pathname);
  const original = path;

  path = path.replace(/^\/website(?:\/website)?\/(portfolio|home|shareideas|archives|academia|mindmapmaker|books|daily-streak)(?=\/|$)/, (_, section) => `/${section}`) || '/';
  path = path.replace(/^\/games\/(hype|dreambusiness|rpg)(?=\/|$)/, '/$1');
  path = normalizePath(path);

  if (path.endsWith('/index.html')) path = path.slice(0, -'/index.html'.length) || '/';
  else if (path.endsWith('/index')) path = path.slice(0, -'/index'.length) || '/';
  else if (path.endsWith('.html')) path = path.slice(0, -'.html'.length) || '/';

  path = normalizePath(path);
  if (path === '/portfolio') path = '/';
  return path === original ? null : path;
}

function mappedAsset(pathname) {
  if (pathname === '/portfolio') return '/website/portfolio/index.html';
  if (ROUTES.has(pathname)) return ROUTES.get(pathname);
  if (/^\/shareideas\/page\/[^/]+$/.test(pathname)) return '/website/shareideas/workspace.html';
  if (/^\/archives\/[^/.]+$/.test(pathname)) return '/website/archives/workspace.html';
  if (/^\/mindmapmaker\/edit\/editor\.css$/i.test(pathname)) return '/website/website/mindmapmaker/editor/editor.css';
  if (/^\/mindmapmaker\/edit\/editor\.js$/i.test(pathname)) return '/website/website/mindmapmaker/editor/editor.js';
  if (/^\/mindmapmaker\/edit-text(?:\/[^/]+)?$/.test(pathname)) return '/website/website/mindmapmaker/text-editor.html';
  if (/^\/mindmapmaker\/(?:edit|editor)(?:\/[^/]+)?$/.test(pathname)) return '/website/website/mindmapmaker/editor/index.html';
  if (/^\/books\/editor(?:\/[^/]+)?$/.test(pathname)) return '/website/website/books/editor/index.html';
  for (const [from, to] of STATIC_PREFIXES) if (pathname.startsWith(from)) return to + pathname.slice(from.length);
  return ROOT_ASSETS[pathname] || null;
}

function mapPath(pathname) {

  if (/^\/mindmapmaker\/editor(?:\/|$)/.test(pathname)) {
    const suffix = pathname.slice('/mindmapmaker/editor'.length);
    return { type: 'redirect', value: `/mindmapmaker/edit${suffix || ''}` };
  }
  const canonical = canonicalPath(pathname);
  if (canonical) return { type: 'redirect', value: canonical };
  const asset = mappedAsset(normalizePath(pathname));
  return asset ? { type: 'asset', value: asset } : { type: 'deny' };
}

function ensureSeoHtml(html, pathname) {
  if (typeof html !== 'string' || !html) return html;
  const canonical = `https://fadhil.dev${pathname === '/' ? '/' : pathname}`;
  const description = 'Fadhil Akbar Cariearsa official page and projects hub.';
  const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
  const title = (titleMatch?.[1] || 'Fadhil.dev').trim();
  let next = html;
  const headInsert = [];
  if (!/<meta[^>]+name=["']description["']/i.test(next)) headInsert.push(`<meta name="description" content="${description}" />`);
  if (!/<link[^>]+rel=["']canonical["']/i.test(next)) headInsert.push(`<link rel="canonical" href="${canonical}" />`);
  if (!/<meta[^>]+property=["']og:title["']/i.test(next)) headInsert.push(`<meta property="og:title" content="${title}" />`);
  if (!/<meta[^>]+property=["']og:description["']/i.test(next)) headInsert.push(`<meta property="og:description" content="${description}" />`);
  if (!/<meta[^>]+name=["']twitter:card["']/i.test(next)) headInsert.push('<meta name="twitter:card" content="summary_large_image" />');
  if (!/<script[^>]+type=["']application\/ld\+json["']/i.test(next)) {
    headInsert.push(`<script type="application/ld+json">{"@context":"https://schema.org","@type":"WebPage","name":${JSON.stringify(title)},"url":${JSON.stringify(canonical)},"description":${JSON.stringify(description)}}</script>`);
  }
  if (headInsert.length) next = next.replace(/<\/head>/i, `${headInsert.join('\n')}\n</head>`);
  if (!/<h1\b/i.test(next)) {
    next = next.replace(/<body([^>]*)>/i, `<body$1><h1 style="position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden;">${title}</h1>`);
  }
  return next;
}

async function withPerfHeaders(response, pathname) {
  const h = new Headers(response.headers);
  h.set('X-Content-Type-Options', 'nosniff');
  h.set('Vary', 'Accept-Encoding');
  h.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  h.set('Content-Security-Policy', "default-src 'self' https: data: blob:; img-src 'self' https: data: blob:; media-src 'self' https: data: blob:; frame-src https:; script-src 'self' 'unsafe-inline' https:; style-src 'self' 'unsafe-inline' https:; connect-src 'self' https:; object-src 'none'; base-uri 'self'; frame-ancestors 'self'");
  h.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  const isHtml = pathname.endsWith('.html') || !pathname.includes('.');
  const isAsset = /\.(css|js|mjs|png|jpg|jpeg|webp|avif|svg|woff2?|ico|txt|xml)$/i.test(pathname);
  const filename = pathname.split('/').pop() || '';
  const hasContentHash = /(?:^|[.\-_])[a-f0-9]{8,}(?:[.\-_]|$)/i.test(filename);
  if (isHtml) {
    // Always revalidate documents so refresh/open-tab shows latest deploy without hard refresh.
    // Keep edge fast via short shared cache + stale-while-revalidate.
    h.set('Cache-Control', 'public, max-age=0, must-revalidate, s-maxage=120, stale-while-revalidate=600, stale-if-error=86400');
  } else if (isAsset && hasContentHash) {
    // Long browser caching only for fingerprinted assets.
    h.set('Cache-Control', 'public, max-age=31536000, immutable');
  } else if (/\/website\/website\/mindmapmaker\/editor\/(editor\.css|editor\.js)$/i.test(pathname)) {
    // Force fresh editor assets to avoid stale UI on mobile CDN/browser cache.
    h.set('Cache-Control', 'no-store, max-age=0');
  } else if (isAsset) {
    // Non-fingerprinted assets must revalidate to avoid stale copies after deploys.
    h.set('Cache-Control', 'public, max-age=3600, s-maxage=2592000, stale-while-revalidate=604800, stale-if-error=604800');
  }
  const shouldRewriteHtml = isHtml && (pathname === '/website/portfolio/index.html' || pathname === '/website/daily-streak/index.html' || pathname === '/website/website/mindmapmaker/editor/index.html');
  if (shouldRewriteHtml) {
    const text = ensureSeoHtml(await response.text(), pathname);
    h.set('content-type', 'text/html; charset=utf-8');
    return new Response(text, { status: response.status, statusText: response.statusText, headers: h });
  }
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers: h });
}

export default {
  async fetch(req, env) {
    try {
      const u = new URL(req.url);
      if (u.pathname.startsWith('/api/shareideas')) return handleShareIdeas(req, env);
      if (u.pathname === '/api/mindmapmaker/auth-config') return handleMindmapAuthConfig(req, env);
      if (u.pathname.startsWith('/api/mindmapmaker')) return handleMindmap(req, env);
      const r = mapPath(u.pathname);
      if (r.type === 'redirect') return Response.redirect(`${u.origin}${appendSearch(r.value, u.search)}`, 308);
      if (r.type === 'deny') return new Response('Not Found', { status: 404, headers: { 'cache-control': 'no-store' } });
      if (typeof env?.ASSETS?.fetch !== 'function') {
        return new Response('Asset binding ASSETS is missing. Re-add the ASSETS binding in Cloudflare Workers & Pages.', {
          status: 503,
          headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' }
        });
      }
      const url = new URL(req.url);
      url.pathname = r.value;
      const res = await env.ASSETS.fetch(new Request(url.toString(), req));
      return await withPerfHeaders(res, r.value);
    } catch (error) {
      return new Response(`Worker runtime error: ${error instanceof Error ? error.message : String(error)}`, {
        status: 500,
        headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' }
      });
    }
  }
};
