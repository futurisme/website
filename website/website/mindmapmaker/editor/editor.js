const $ = (id) => document.getElementById(id);
const mapIdEl = $('map-id'), statusEl = $('status'), nodesLayer = $('nodes'), edgesLayer = $('edges'), viewport = $('viewport');
const gridCanvas = $('grid-canvas'), addNodeBtn = $('add-node'), removeNodeBtn = $('remove-node'), connectBtn = $('connect-node');
const saveCsvBtn = $('save-csv'), saveFdhlBtn = $('save-fdhl'), loadBtn = $('load-map'), loadInput = $('load-input');
const undoBtn = $('undo-node'), redoBtn = $('redo-node'), syncStatusDotEl = $('sync-status-dot');
const m = location.pathname.match(/\/mindmapmaker\/(?:edit|editor)\/(\d+)/); const safeMapId = Number(m?.[1] || 1); mapIdEl.textContent = String(safeMapId);

const STORAGE_KEY = `mindmap:${safeMapId}`; const GRID = 100;
let state = loadLocal() || { version: 1, nodes: [{ id: 1, title: 'Root', x: 400, y: 240 }], links: [] };
let selectedId = 1, connectSource = null, dragging = null, panning = null, cam = { x: 0, y: 0, scale: 1 };
const history = []; const future = []; let remoteSaveInFlight = false, remoteSaveQueued = false;
let framePending = false;

function loadLocal(){ try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||'null')}catch{return null} }
function saveLocal(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function setStatus(t){ statusEl.textContent = t; }
function setRemoteOnline(on){ syncStatusDotEl.dataset.online = String(!!on); }
function normalizeLinksUnique(data){ const seen=new Set(); data.links=(data.links||[]).filter(l=>{const k=`${Number(l.from)}->${Number(l.to)}`; if(Number(l.from)===Number(l.to)||seen.has(k)) return false; seen.add(k); return true;}).map(l=>({from:Number(l.from),to:Number(l.to)})); return data; }
function commit(next, msg){ history.push(JSON.stringify(state)); if(history.length>80)history.shift(); future.length=0; state=normalizeLinksUnique(next); state.version=(state.version||1)+1; saveLocal(); void pushRemote(); render(); setStatus(msg); syncHistory(); }
function syncHistory(){ undoBtn.disabled = history.length===0; redoBtn.disabled = future.length===0; }
function clone(){ return JSON.parse(JSON.stringify(state)); }

function drawGrid(){ const r=viewport.getBoundingClientRect(),dpr=devicePixelRatio||1,w=Math.max(1,r.width|0),h=Math.max(1,r.height|0); if(gridCanvas.width!==w*dpr||gridCanvas.height!==h*dpr){gridCanvas.width=w*dpr;gridCanvas.height=h*dpr;} const c=gridCanvas.getContext('2d'); c.setTransform(dpr,0,0,dpr,0,0); c.clearRect(0,0,w,h); c.fillStyle='#fff'; c.fillRect(0,0,w,h); const step=Math.max(24,GRID*cam.scale*0.5),ox=((cam.x%step)+step)%step,oy=((cam.y%step)+step)%step; c.strokeStyle='rgba(15,118,110,.12)'; for(let x=ox;x<w;x+=step){c.beginPath();c.moveTo(x,0);c.lineTo(x,h);c.stroke();} for(let y=oy;y<h;y+=step){c.beginPath();c.moveTo(0,y);c.lineTo(w,y);c.stroke();} }
function applyTransform(){ const t=`translate3d(${cam.x}px,${cam.y}px,0) scale(${cam.scale})`; nodesLayer.style.transform=t; edgesLayer.style.transform=t; const r=viewport.getBoundingClientRect(); const w=Math.max(1,r.width|0),h=Math.max(1,r.height|0); edgesLayer.setAttribute('viewBox',`0 0 ${w} ${h}`); edgesLayer.setAttribute('width',String(w)); edgesLayer.setAttribute('height',String(h)); edgesLayer.setAttribute('preserveAspectRatio','none'); drawGrid(); }
function orthogonalPath(from,to,rects){
  const r1=rects.get(from.id)||{x:from.x,y:from.y,w:160,h:80}, r2=rects.get(to.id)||{x:to.x,y:to.y,w:160,h:80};
  const c1x=r1.x+r1.w/2, c1y=r1.y+r1.h/2, c2x=r2.x+r2.w/2, c2y=r2.y+r2.h/2;
  const upper = (c1y<=c2y) ? {r:r1,cx:c1x} : {r:r2,cx:c2x};
  const lower = (c1y<=c2y) ? {r:r2,cx:c2x} : {r:r1,cx:c1x};
  if(Math.abs(upper.cx-lower.cx)<=0.5){
    return `M ${upper.cx} ${upper.r.y+upper.r.h} L ${lower.cx} ${lower.r.y}`;
  }
  const sy = upper.r.y + upper.r.h/2;
  const sx = lower.cx>upper.cx ? upper.r.x+upper.r.w : upper.r.x;
  return `M ${sx} ${sy} L ${lower.cx} ${sy} L ${lower.cx} ${lower.r.y}`;
}
function render(){ applyTransform(); nodesLayer.innerHTML=state.nodes.map(n=>`<button class="node" data-id="${n.id}" data-selected="${n.id===selectedId}" style="left:${n.x}px;top:${n.y}px">${escape(n.title)}<small>ID ${n.id}</small></button>`).join(''); const rects=new Map([...nodesLayer.querySelectorAll('.node')].map(el=>[Number(el.dataset.id),{x:el.offsetLeft,y:el.offsetTop,w:el.offsetWidth,h:el.offsetHeight}])); const byId = new Map(state.nodes.map(n=>[n.id,n])); edgesLayer.innerHTML=state.links.map(l=>{const a=byId.get(l.from),b=byId.get(l.to); if(!a||!b)return ''; return `<path class="edge-path edge-link" d="${orthogonalPath(a,b,rects)}"></path>`;}).join(''); connectBtn.textContent = connectSource ? 'Link→' : '🔗'; }
function scheduleRender(){ if(framePending) return; framePending=true; requestAnimationFrame(()=>{ framePending=false; render(); }); }
function escape(s){ return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m])); }
function snap(v){ return Math.round(v/GRID)*GRID; }

function addNode(){ const n=clone(); const id=Math.max(...n.nodes.map(x=>x.id))+1; const p=n.nodes.find(x=>x.id===selectedId)||n.nodes[0]; n.nodes.push({id,title:`Node ${id}`,x:snap(p.x+200),y:snap(p.y+120)}); commit(n,'Node ditambahkan.'); selectedId=id; render(); }
function removeNode(){ if(selectedId===1)return setStatus('Root tidak dapat dihapus.'); const n=clone(); n.nodes=n.nodes.filter(x=>x.id!==selectedId); n.links=n.links.filter(l=>l.from!==selectedId&&l.to!==selectedId); selectedId=1; commit(n,'Node dihapus.'); }
function doConnect(targetId){ if(!connectSource){ connectSource=selectedId; setStatus('Pilih node tujuan.'); render(); return; } if(connectSource===targetId){ connectSource=null; notify('Tidak bisa menghubungkan node ke dirinya sendiri.','danger',3000); render(); return; } const n=clone(); if(n.links.some(l=>l.from===connectSource&&l.to===targetId)){ connectSource=null; notify('Konektor ganda ditolak: child ini sudah terhubung.', 'danger', 3000); render(); return; } n.links.push({from:connectSource,to:targetId}); connectSource=null; commit(n,'Node terhubung.'); notify('Konektor berhasil ditambahkan.','success',3000); }
function undo(){ if(!history.length)return; future.push(JSON.stringify(state)); state=JSON.parse(history.pop()); saveLocal(); render(); syncHistory(); }
function redo(){ if(!future.length)return; history.push(JSON.stringify(state)); state=JSON.parse(future.pop()); saveLocal(); render(); syncHistory(); }

function notify(msg, mode='danger', ms=3000){const t=document.getElementById('toast'); if(!t)return; t.hidden=false; t.textContent=msg; t.className=`toast show ${mode}`; clearTimeout(notify._tm); notify._tm=setTimeout(()=>{t.className='toast'; setTimeout(()=>{t.hidden=true;},180);},ms);}
function notifyDanger(msg){ notify(msg,'danger',3000); }
async function pushRemote(){ if(remoteSaveInFlight){ remoteSaveQueued=true; return; } remoteSaveInFlight=true; try{ const r=await fetch(`/api/mindmapmaker?id=${safeMapId}`,{method:'PUT',headers:{'content-type':'application/json'},body:JSON.stringify({data:state})}); if(!r.ok) throw new Error('timeout'); setRemoteOnline(true);}catch{ setRemoteOnline(false); notifyDanger('Bahaya: database timeout/gagal simpan.'); } finally{ remoteSaveInFlight=false; if(remoteSaveQueued){remoteSaveQueued=false; void pushRemote();}} }
async function hydrateRemote(){ try{ const r=await fetch(`/api/mindmapmaker?id=${safeMapId}`,{cache:'no-store'}); if(!r.ok)return; const d=await r.json(); if(d?.data?.nodes){ state=normalizeLinksUnique(d.data); saveLocal(); render(); setRemoteOnline(true);} }catch{ setRemoteOnline(false);} }

viewport.addEventListener('pointerdown',(e)=>{ const node=e.target.closest('.node'); if(node){ const id=Number(node.dataset.id); selectedId=id; if(connectSource) { doConnect(id); return; } const src=state.nodes.find(n=>n.id===id); dragging={id,sx:e.clientX,sy:e.clientY,nx:src.x,ny:src.y}; } else { panning={sx:e.clientX,sy:e.clientY,cx:cam.x,cy:cam.y}; } viewport.setPointerCapture(e.pointerId); scheduleRender(); });
viewport.addEventListener('pointermove',(e)=>{ if(dragging){ const n=state.nodes.find(x=>x.id===dragging.id); n.x=snap(dragging.nx+(e.clientX-dragging.sx)/cam.scale); n.y=snap(dragging.ny+(e.clientY-dragging.sy)/cam.scale); scheduleRender(); } else if(panning){ cam.x=panning.cx+(e.clientX-panning.sx); cam.y=panning.cy+(e.clientY-panning.sy); scheduleRender(); }});
viewport.addEventListener('pointerup',()=>{ if(dragging){ commit(clone(),'Node dipindah.'); } dragging=null; panning=null; });
viewport.addEventListener('wheel',(e)=>{ e.preventDefault(); const next=Math.min(2.2,Math.max(.45,cam.scale+(e.deltaY>0?-0.05:0.05))); cam.scale=next; render(); },{passive:false});

addNodeBtn.onclick=addNode; removeNodeBtn.onclick=removeNode; connectBtn.onclick=()=>doConnect(selectedId); undoBtn.onclick=undo; redoBtn.onclick=redo;
saveCsvBtn.onclick=()=>download(`mindmap-${safeMapId}.csv`, toCsv(), 'text/csv;charset=utf-8');
saveFdhlBtn.onclick=()=>download(`mindmap-${safeMapId}.json`, JSON.stringify(state), 'application/json');
loadBtn.onclick=()=>loadInput.click(); loadInput.onchange=async()=>{const f=loadInput.files?.[0];if(!f)return;const t=await f.text();try{const n=f.name.endsWith('.csv')?fromCsv(t):JSON.parse(t); if(n?.nodes){commit(n,'Map dimuat.');}}catch{setStatus('Format file tidak valid.')}};
function download(n,c,m){const b=new Blob([c],{type:m}),u=URL.createObjectURL(b),a=document.createElement('a');a.href=u;a.download=n;a.click();URL.revokeObjectURL(u);} 
function toCsv(){const h='id,title,x,y\n';return h+state.nodes.map(n=>`${n.id},"${String(n.title).replaceAll('"','""')}",${n.x},${n.y}`).join('\n');}
function fromCsv(text){const lines=text.trim().split(/\r?\n/).slice(1);const nodes=lines.map(l=>{const p=l.split(',');return{id:Number(p[0]),title:p[1]?.replaceAll('"','')||'',x:Number(p[p.length-2]),y:Number(p[p.length-1])}}).filter(n=>n.id>0);return {version:(state.version||1)+1,nodes:nodes.length?nodes:[{id:1,title:'Root',x:400,y:240}],links:[]};}
window.addEventListener('resize', render);
render(); syncHistory(); void hydrateRemote();
document.addEventListener('selectstart',(e)=>e.preventDefault());
document.addEventListener('dragstart',(e)=>e.preventDefault());
document.addEventListener('contextmenu',(e)=>e.preventDefault());
document.addEventListener('copy',(e)=>e.preventDefault());
document.addEventListener('cut',(e)=>e.preventDefault());
document.addEventListener('keydown',(e)=>{ if((e.ctrlKey||e.metaKey)&&['c','x','s','u','p'].includes(e.key.toLowerCase())) e.preventDefault(); });
