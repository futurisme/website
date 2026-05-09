import { Pool } from 'pg';

const DEFAULT_DATA = Object.freeze({ appTitle: 'ShareIdeas', categories: [{ id: 'category-1', name: 'Kategori 1', folders: [] }] });
const RECORD_KEY = '__SYSTEM__SHARE_IDEAS_V1';
const ID_PATTERN = /^[1-9][0-9]{0,95}$/;
let pool;
let schemaShare;
let schemaMap;
function getPool(env){ if(pool) return pool; const cs=env.DATABASE_PUBLIC_URL||env.DATABASE_URL_PUBLIC||env.POSTGRES_PRISMA_URL||env.POSTGRES_URL_NON_POOLING||env.POSTGRES_URL||env.DATABASE_URL; if(!cs) return null; pool=new Pool({connectionString:cs,ssl:'require',max:2}); return pool; }
const json=(obj,s=200)=>new Response(JSON.stringify(obj),{status:s,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}});

async function handleShareIdeas(req, env){ const p=getPool(env); if(!p) return json({ok:false,error:'Database is not configured.'},500); if(!schemaShare){ schemaShare=p.query(`CREATE TABLE IF NOT EXISTS shareideas_state (key TEXT PRIMARY KEY,version INTEGER NOT NULL DEFAULT 1,data JSONB NOT NULL,updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW());CREATE TABLE IF NOT EXISTS shareideas_meta (id INTEGER PRIMARY KEY CHECK (id = 1),next_id BIGINT NOT NULL);INSERT INTO shareideas_meta(id,next_id) VALUES (1,1) ON CONFLICT (id) DO NOTHING;`);} await schemaShare;
 const u=new URL(req.url); const parts=u.pathname.split('/').filter(Boolean); const id=parts[2]||null;
 if(req.method==='POST' && u.pathname==='/api/shareideas'){ const c=await p.connect(); try{ await c.query('BEGIN'); const cur=await c.query('SELECT next_id FROM shareideas_meta WHERE id=1 FOR UPDATE'); const nextId=Number(cur.rows[0]?.next_id??1); const wid=String(nextId); await c.query('INSERT INTO shareideas_state(key,version,data) VALUES($1,1,$2::jsonb)', [`${RECORD_KEY}:${wid}`, JSON.stringify(DEFAULT_DATA)]); await c.query('UPDATE shareideas_meta SET next_id=$1 WHERE id=1',[nextId+1]); await c.query('COMMIT'); return json({ok:true,id:wid},201);} catch(e){await c.query('ROLLBACK'); return json({ok:false,error:String(e)},500);} finally{c.release();}}
 if(!id || !ID_PATTERN.test(id)) return json({ok:false,error:'Invalid workspace id.'},400);
 const key=`${RECORD_KEY}:${id}`;
 if(req.method==='GET'){ const r=await p.query('SELECT version,data,updated_at FROM shareideas_state WHERE key=$1 LIMIT 1',[key]); if(!r.rowCount) return json({ok:false,error:'Workspace not found.'},404); const row=r.rows[0]; return json({ok:true,id,version:Number(row.version),data:row.data,updatedAt:row.updated_at}); }
 if(req.method==='PUT'){ const body=await req.json().catch(()=>({})); const expected=Number.isInteger(Number(body.expectedVersion))?Number(body.expectedVersion):null; const data=body.data??DEFAULT_DATA; if(expected!==null){ const up=await p.query('UPDATE shareideas_state SET data=$1::jsonb,version=version+1,updated_at=NOW() WHERE key=$2 AND version=$3 RETURNING version,data,updated_at',[JSON.stringify(data),key,expected]); if(!up.rowCount){const latest=await p.query('SELECT version,data,updated_at FROM shareideas_state WHERE key=$1 LIMIT 1',[key]); return json({ok:false,conflict:true,latest:latest.rows[0]??null},409);} const row=up.rows[0]; return json({ok:true,id,version:Number(row.version),data:row.data,updatedAt:row.updated_at}); }
 const up=await p.query('INSERT INTO shareideas_state(key,version,data) VALUES($1,1,$2::jsonb) ON CONFLICT (key) DO UPDATE SET data=EXCLUDED.data,version=shareideas_state.version+1,updated_at=NOW() RETURNING version,data,updated_at',[key,JSON.stringify(data)]); const row=up.rows[0]; return json({ok:true,id,version:Number(row.version),data:row.data,updatedAt:row.updated_at}); }
 return json({ok:false,error:'Method not allowed.'},405);
}
async function handleMindmap(req,env){ const p=getPool(env); if(!p) return json({ok:false,error:'Database is not configured.'},500); if(!schemaMap){schemaMap=p.query('CREATE TABLE IF NOT EXISTS mindmapmaker_state (id BIGINT PRIMARY KEY, version INTEGER NOT NULL DEFAULT 1, data JSONB NOT NULL, updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())');} await schemaMap; const u=new URL(req.url); const id=Number(u.searchParams.get('id')); if(!Number.isInteger(id)||id<1) return json({ok:false,error:'Invalid map id.'},400); if(req.method==='GET'){ const r=await p.query('SELECT id,version,data,updated_at FROM mindmapmaker_state WHERE id=$1::bigint LIMIT 1',[String(id)]); if(!r.rowCount) return json({ok:false,error:'Map not found.'},404); const row=r.rows[0]; return json({ok:true,mapId:Number(row.id),version:Number(row.version),data:row.data,updatedAt:row.updated_at}); }
 if(req.method==='PUT'){ const body=await req.json().catch(()=>({})); const data=body.data??{}; const expected=Number.isInteger(Number(body.expectedVersion))?Number(body.expectedVersion):null; if(expected!==null){ const r=await p.query('UPDATE mindmapmaker_state SET data=$1::jsonb,version=version+1,updated_at=NOW() WHERE id=$2::bigint AND version=$3 RETURNING id,version,data,updated_at',[JSON.stringify(data),String(id),expected]); if(!r.rowCount) return json({ok:false,conflict:true},409); const row=r.rows[0]; return json({ok:true,mapId:Number(row.id),version:Number(row.version),data:row.data,updatedAt:row.updated_at}); }
 const r=await p.query('INSERT INTO mindmapmaker_state(id,version,data) VALUES($1::bigint,1,$2::jsonb) ON CONFLICT (id) DO UPDATE SET data=EXCLUDED.data,version=mindmapmaker_state.version+1,updated_at=NOW() RETURNING id,version,data,updated_at',[String(id),JSON.stringify(data)]); const row=r.rows[0]; return json({ok:true,mapId:Number(row.id),version:Number(row.version),data:row.data,updatedAt:row.updated_at}); }
 return json({ok:false,error:'Method not allowed.'},405);
}

function mapPath(path){
  if (path.startsWith('/website/')) {
    const stripped = path.slice('/website'.length) || '/';
    return mapPath(stripped);
  }

  const exact = new Map([
    ['/', '/website/portfolio/index.html'],
    ['/portfolio', '/website/portfolio/index.html'],
    ['/portfolio/', '/website/portfolio/index.html'],
    ['/home', '/website/home/index.html'],
    ['/home/', '/website/home/index.html'],
    ['/shareideas', '/website/shareideas/index.html'],
    ['/shareideas/', '/website/shareideas/index.html'],
    ['/archives', '/website/archives/index.html'],
    ['/archives/', '/website/archives/index.html'],
    ['/mindmapmaker', '/website/website/mindmapmaker/index.html'],
    ['/mindmapmaker/', '/website/website/mindmapmaker/index.html'],
    ['/books', '/website/website/books/index.html'],
    ['/books/', '/website/website/books/index.html'],
    ['/robots.txt', '/website/robots.txt'],
    ['/sitemap.xml', '/website/sitemap.xml'],
    ['/site.webmanifest', '/website/site.webmanifest'],
    ['/fadhil.svg', '/website/fadhil.svg'],
    ['/fadhil-512x512.png', '/website/fadhil-512x512.png'],
    ['/favicon.ico', '/website/fadhil-512x512.png'],
    ['/favicon.png', '/website/fadhil-512x512.png'],
    ['/favicon.svg', '/website/fadhil.svg'],
    ['/apple-touch-icon.png', '/website/fadhil-512x512.png'],
    ['/portfolio.webp', '/assets/public/images/portfolio.webp'],
  ]);
  if (exact.has(path)) return exact.get(path);

  const prefixes = [
    ['/portfolio/testing/', '/website/portfolio/testing/'],
    ['/home/', '/website/home/'],
    ['/shareideas/', '/website/shareideas/'],
    ['/archives/', '/website/archives/'],
    ['/mindmapmaker/', '/website/website/mindmapmaker/'],
    ['/books/', '/website/website/books/'],
    ['/library/', '/library/'],
    ['/games/', '/games/'],
    ['/extension/', '/extension/'],
    ['/assets/public/images/', '/assets/public/images/'],
    ['/daily-streak/', '/website/daily-streak/'],
  ];

  for (const [from, to] of prefixes) {
    if (path.startsWith(from)) return to + path.slice(from.length);
  }

  return path;
}

export default { async fetch(req, env){ const u=new URL(req.url); if(u.pathname.startsWith('/api/shareideas')) return handleShareIdeas(req,env); if(u.pathname.startsWith('/api/mindmapmaker')) return handleMindmap(req,env); const mapped=mapPath(u.pathname); if(mapped!==u.pathname){ u.pathname=mapped; return env.ASSETS.fetch(new Request(u.toString(), req)); } return env.ASSETS.fetch(req);} };
