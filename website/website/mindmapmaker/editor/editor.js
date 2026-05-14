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

function loadLocal(){ try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||'null')}catch{return null} }
function saveLocal(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function setStatus(t){ statusEl.textContent = t; }
function setRemoteOnline(on){ syncStatusDotEl.dataset.online = String(!!on); }
function commit(next, msg){ history.push(JSON.stringify(state)); if(history.length>80)history.shift(); future.length=0; state=next; state.version=(state.version||1)+1; saveLocal(); void pushRemote(); render(); setStatus(msg); syncHistory(); }
function syncHistory(){ undoBtn.disabled = history.length===0; redoBtn.disabled = future.length===0; }
function clone(){ return JSON.parse(JSON.stringify(state)); }

function drawGrid(){ const r=viewport.getBoundingClientRect(),dpr=devicePixelRatio||1,w=Math.max(1,r.width|0),h=Math.max(1,r.height|0); if(gridCanvas.width!==w*dpr||gridCanvas.height!==h*dpr){gridCanvas.width=w*dpr;gridCanvas.height=h*dpr;} const c=gridCanvas.getContext('2d'); c.setTransform(dpr,0,0,dpr,0,0); c.clearRect(0,0,w,h); c.fillStyle='#fff'; c.fillRect(0,0,w,h); const step=Math.max(24,GRID*cam.scale*0.5),ox=((cam.x%step)+step)%step,oy=((cam.y%step)+step)%step; c.strokeStyle='rgba(15,118,110,.12)'; for(let x=ox;x<w;x+=step){c.beginPath();c.moveTo(x,0);c.lineTo(x,h);c.stroke();} for(let y=oy;y<h;y+=step){c.beginPath();c.moveTo(0,y);c.lineTo(w,y);c.stroke();} }
function applyTransform(){ const t=`translate3d(${cam.x}px,${cam.y}px,0) scale(${cam.scale})`; nodesLayer.style.transform=t; edgesLayer.style.transform=t; drawGrid(); }
function orthogonalPath(from,to){
  const NODE_W=160,NODE_H=80,HALF_W=NODE_W/2,HALF_H=NODE_H/2;
  const a=(from.y<=to.y)?from:to,b=(from.y<=to.y)?to:from; // auto-adapt top node as parent visual
  const ax=a.x+HALF_W, ay=a.y+HALF_H, bx=b.x+HALF_W, by=b.y+HALF_H;
  const dx=bx-ax, dy=by-ay;
  if(Math.abs(dx)<=0.5){
    const sy=a.y+NODE_H, ty=b.y;
    return `M ${ax} ${sy} L ${ax} ${ty}`;
  }
  const sx=dx>0?a.x+NODE_W:a.x, sy=ay;
  const tx=bx, ty=dy>=0?b.y:b.y+NODE_H;
  return `M ${sx} ${sy} L ${tx} ${sy} L ${tx} ${ty}`;
}
function render(){ applyTransform(); const byId = new Map(state.nodes.map(n=>[n.id,n])); edgesLayer.innerHTML=state.links.map(l=>{const a=byId.get(l.from),b=byId.get(l.to); if(!a||!b)return ''; return `<path class="edge-path edge-link" d="${orthogonalPath(a,b)}"></path>`;}).join(''); nodesLayer.innerHTML=state.nodes.map(n=>`<button class="node" data-id="${n.id}" data-selected="${n.id===selectedId}" style="left:${n.x}px;top:${n.y}px">${escape(n.title)}<small>ID ${n.id}</small></button>`).join(''); connectBtn.textContent = connectSource ? 'Link→' : '🔗'; }
function escape(s){ return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m])); }
function snap(v){ return Math.round(v/GRID)*GRID; }

function addNode(){ const n=clone(); const id=Math.max(...n.nodes.map(x=>x.id))+1; const p=n.nodes.find(x=>x.id===selectedId)||n.nodes[0]; n.nodes.push({id,title:`Node ${id}`,x:snap(p.x+200),y:snap(p.y+120)}); commit(n,'Node ditambahkan.'); selectedId=id; render(); }
function removeNode(){ if(selectedId===1)return setStatus('Root tidak dapat dihapus.'); const n=clone(); n.nodes=n.nodes.filter(x=>x.id!==selectedId); n.links=n.links.filter(l=>l.from!==selectedId&&l.to!==selectedId); selectedId=1; commit(n,'Node dihapus.'); }
function doConnect(targetId){ if(!connectSource){ connectSource=selectedId; setStatus('Pilih node tujuan.'); render(); return; } if(connectSource===targetId){ connectSource=null; render(); return; } const n=clone(); if(!n.links.some(l=>l.from===connectSource&&l.to===targetId)) n.links.push({from:connectSource,to:targetId}); connectSource=null; commit(n,'Node terhubung.'); }
function undo(){ if(!history.length)return; future.push(JSON.stringify(state)); state=JSON.parse(history.pop()); saveLocal(); render(); syncHistory(); }
function redo(){ if(!future.length)return; history.push(JSON.stringify(state)); state=JSON.parse(future.pop()); saveLocal(); render(); syncHistory(); }

function notifyDanger(msg){const t=document.getElementById('toast'); if(!t)return; t.hidden=false; t.textContent=msg; t.className='toast show'; clearTimeout(notifyDanger._tm); notifyDanger._tm=setTimeout(()=>{t.className='toast';},2600);}
async function pushRemote(){ if(remoteSaveInFlight){ remoteSaveQueued=true; return; } remoteSaveInFlight=true; try{ const r=await fetch(`/api/mindmapmaker?id=${safeMapId}`,{method:'PUT',headers:{'content-type':'application/json'},body:JSON.stringify({data:state})}); if(!r.ok) throw new Error('timeout'); setRemoteOnline(true);}catch{ setRemoteOnline(false); notifyDanger('Bahaya: database timeout/gagal simpan.'); } finally{ remoteSaveInFlight=false; if(remoteSaveQueued){remoteSaveQueued=false; void pushRemote();}} }
async function hydrateRemote(){ try{ const r=await fetch(`/api/mindmapmaker?id=${safeMapId}`,{cache:'no-store'}); if(!r.ok)return; const d=await r.json(); if(d?.data?.nodes){ state=d.data; saveLocal(); render(); setRemoteOnline(true);} }catch{ setRemoteOnline(false);} }

viewport.addEventListener('pointerdown',(e)=>{ const node=e.target.closest('.node'); if(node){ const id=Number(node.dataset.id); selectedId=id; if(connectSource) { doConnect(id); return; } const src=state.nodes.find(n=>n.id===id); dragging={id,sx:e.clientX,sy:e.clientY,nx:src.x,ny:src.y}; } else { panning={sx:e.clientX,sy:e.clientY,cx:cam.x,cy:cam.y}; } viewport.setPointerCapture(e.pointerId); render(); });
viewport.addEventListener('pointermove',(e)=>{ if(dragging){ const n=state.nodes.find(x=>x.id===dragging.id); n.x=snap(dragging.nx+(e.clientX-dragging.sx)/cam.scale); n.y=snap(dragging.ny+(e.clientY-dragging.sy)/cam.scale); render(); } else if(panning){ cam.x=panning.cx+(e.clientX-panning.sx); cam.y=panning.cy+(e.clientY-panning.sy); render(); }});
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
