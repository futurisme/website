const $ = (id) => document.getElementById(id);
const mapIdEl = $('map-id'), statusEl = $('status'), nodesLayer = $('nodes'), edgesLayer = $('edges'), viewport = $('viewport');
const gridCanvas = $('grid-canvas'), addNodeBtn = $('add-node'), renameNodeBtn = $('rename-node'), removeNodeBtn = $('remove-node'), connectBtn = $('connect-node');
const saveCsvBtn = $('save-csv'), saveFdhlBtn = $('save-fdhl'), loadBtn = $('load-map'), loadInput = $('load-input');
const undoBtn = $('undo-node'), redoBtn = $('redo-node'), syncStatusDotEl = $('sync-status-dot');
const renameModal = $('rename-modal'), renameInput = $('rename-input'), renameConfirmBtn = $('rename-confirm'), renameCancelBtn = $('rename-cancel');
const renameWidthInput = $('rename-width'), renameHeightInput = $('rename-height'), renameColorInput = $('rename-color');
const m = location.pathname.match(/\/mindmapmaker\/(?:edit|editor)\/(\d+)/); const safeMapId = Number(m?.[1] || 1); if (mapIdEl) mapIdEl.textContent = String(safeMapId);

const STORAGE_KEY = `mindmap:${safeMapId}`; const GRID = 100;
let state = loadLocal() || { version: 1, nodes: [{ id: 1, title: 'Root', x: 400, y: 240 }], links: [] };
let selectedId = 1, selectedIds = new Set([1]), connectSource = null, dragging = null, panning = null, cam = { x: 0, y: 0, scale: 1 };
let multiSelectMode = false, selectionRect = null;
const history = []; const future = []; let remoteSaveInFlight = false, remoteSaveQueued = false;
let framePending = false;
const activePointers = new Map(); let pinch = null;

function loadLocal(){ try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||'null')}catch{return null} }
function saveLocal(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function setStatus(t){ if(statusEl) statusEl.textContent = t; }
function setRemoteOnline(on){ syncStatusDotEl.dataset.online = String(!!on); }
function normalizeLinksUnique(data){ const seen=new Set(); data.links=(data.links||[]).filter(l=>{const k=`${Number(l.from)}->${Number(l.to)}`; if(Number(l.from)===Number(l.to)||seen.has(k)) return false; seen.add(k); return true;}).map(l=>({from:Number(l.from),to:Number(l.to)})); return data; }
function commit(next, msg){ history.push(JSON.stringify(state)); if(history.length>80)history.shift(); future.length=0; state=normalizeLinksUnique(next); state.version=(state.version||1)+1; saveLocal(); void pushRemote(); pruneSelection(); render(); setStatus(msg); syncHistory(); }
function syncHistory(){ undoBtn.disabled = history.length===0; redoBtn.disabled = future.length===0; }
function clone(){ return JSON.parse(JSON.stringify(state)); }
function pruneSelection(){
  const ids=new Set(state.nodes.map(n=>n.id));
  selectedIds=new Set([...selectedIds].filter(id=>ids.has(id)));
  if(!selectedIds.size){ selectedIds.add(1); }
  if(!selectedIds.has(selectedId)){ selectedId=[...selectedIds][0]; }
}

function drawGrid(){ const r=viewport.getBoundingClientRect(),dpr=devicePixelRatio||1,w=Math.max(1,r.width|0),h=Math.max(1,r.height|0); if(gridCanvas.width!==w*dpr||gridCanvas.height!==h*dpr){gridCanvas.width=w*dpr;gridCanvas.height=h*dpr;} const c=gridCanvas.getContext('2d'); c.setTransform(dpr,0,0,dpr,0,0); c.clearRect(0,0,w,h); c.fillStyle='#000'; c.fillRect(0,0,w,h); }
function applyTransform(){ const t=`translate3d(${cam.x}px,${cam.y}px,0) scale(${cam.scale})`; nodesLayer.style.transform=t; edgesLayer.style.transform=t; const r=viewport.getBoundingClientRect(); const w=Math.max(1,r.width|0),h=Math.max(1,r.height|0); edgesLayer.setAttribute('viewBox',`0 0 ${w} ${h}`); edgesLayer.setAttribute('width',String(w)); edgesLayer.setAttribute('height',String(h)); edgesLayer.setAttribute('preserveAspectRatio','none'); drawGrid(); }
function orthogonalPath(from,to,rects){
  const r1=rects.get(from.id)||{x:from.x,y:from.y,w:140,h:64}, r2=rects.get(to.id)||{x:to.x,y:to.y,w:140,h:64};
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
function computeNodeSize(node){
  const text=String(node?.title||'');
  const chars=Math.max(1,[...text].length);
  const widthWeight=0.7, heightWeight=0.3;
  const rawWidth=140 + chars*6.8*widthWeight;
  const autoW=Math.max(140,Math.min(520,Math.round(rawWidth)));
  const perLine=Math.max(10,Math.floor((autoW-18)/7));
  const lines=Math.ceil(chars/perLine);
  const rawHeight=58 + (lines*14) + (chars*0.08*heightWeight);
  const autoH=Math.max(64,Math.min(260,Math.round(rawHeight)));
  const customW=Number(node?.w);
  const customH=Number(node?.h);
  const w=Number.isFinite(customW)&&customW>=80?Math.round(customW):autoW;
  const h=Number.isFinite(customH)&&customH>=48?Math.round(customH):autoH;
  return {w,h};
}
function sanitizeHexColor(value){
  const v=String(value||'').trim().toUpperCase();
  if(!v) return '';
  const c=v.startsWith('#')?v:`#${v}`;
  return /^#[0-9A-F]{6}$/.test(c)?c:'';
}
function render(){ applyTransform(); nodesLayer.innerHTML=state.nodes.map(n=>{const s=computeNodeSize(n); const fill=sanitizeHexColor(n.fill)||'#FFFFFF'; return `<button class="node" data-id="${n.id}" data-selected="${selectedIds.has(n.id)}" style="left:${n.x}px;top:${n.y}px;width:${s.w}px;height:${s.h}px;--node-fill:${fill}">${escape(n.title)}</button>`;}).join(''); const rects=new Map([...nodesLayer.querySelectorAll('.node')].map(el=>[Number(el.dataset.id),{x:el.offsetLeft,y:el.offsetTop,w:el.offsetWidth,h:el.offsetHeight}])); const byId = new Map(state.nodes.map(n=>[n.id,n])); edgesLayer.innerHTML=state.links.map(l=>{const a=byId.get(l.from),b=byId.get(l.to); if(!a||!b)return ''; return `<path class="edge-path edge-link" d="${orthogonalPath(a,b,rects)}"></path>`;}).join(''); connectBtn.textContent = connectSource ? 'Link→' : '🔗';
  drawSelectionRect();
 }
function scheduleRender(){ if(framePending) return; framePending=true; requestAnimationFrame(()=>{ framePending=false; render(); }); }
function escape(s){ return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m])); }
function snap(v){ const step=Math.max(10,GRID/4); return Math.round(v/step)*step; }

function addNode(){ const n=clone(); const id=Math.max(...n.nodes.map(x=>x.id))+1; const p=n.nodes.find(x=>x.id===selectedId)||n.nodes[0]; n.nodes.push({id,title:`Node ${id}`,x:snap(p.x+200),y:snap(p.y+120)}); updateSelection([id],id); commit(n,'Node ditambahkan & terpilih.'); notify('Node baru dibuat dan dipilih otomatis.','success',2200); }
function removeNode(){ const targets=[...selectedIds].filter(id=>id!==1); if(!targets.length){ setStatus('Root tidak dapat dihapus.'); return; } const n=clone(); n.nodes=n.nodes.filter(x=>!targets.includes(x.id)); n.links=n.links.filter(l=>!targets.includes(l.from)&&!targets.includes(l.to)); updateSelection([1],1); commit(n,targets.length>1?'Node terpilih dihapus massal.':'Node dihapus.'); notify(targets.length>1?`Berhasil hapus ${targets.length} node.`:'Node berhasil dihapus.','success',2500); }
function askRenamePayload(initial){
  return new Promise((resolve)=>{
    if(!renameModal||!renameInput) return resolve(null);
    renameModal.hidden=false;
    renameInput.value=initial.title||'';
    renameWidthInput.value=initial.width||'';
    renameHeightInput.value=initial.height||'';
    renameColorInput.value=initial.fill||'';
    renameInput.focus();
    const done=(val)=>{
      renameModal.hidden=true;
      renameConfirmBtn?.removeEventListener('click',ok);
      renameCancelBtn?.removeEventListener('click',cancel);
      resolve(val);
    };
    const ok=()=>done({title:renameInput.value,width:renameWidthInput.value,height:renameHeightInput.value,fill:renameColorInput.value});
    const cancel=()=>done(null);
    renameConfirmBtn?.addEventListener('click',ok,{once:true});
    renameCancelBtn?.addEventListener('click',cancel,{once:true});
  });
}
async function renameNode(){
  const n=clone();
  const targetIds=[...selectedIds];
  const nodes=n.nodes.filter(x=>targetIds.includes(x.id));
  if(!nodes.length){ notify('Node tidak ditemukan.','danger',3000); return; }
  const first=nodes[0];
  const payload=await askRenamePayload({title:nodes.length===1?first.title:'',width:first.w||'',height:first.h||'',fill:first.fill||''});
  if(payload===null) return;
  const title=String(payload.title||'');
  const widthRaw=String(payload.width||'').trim();
  const heightRaw=String(payload.height||'').trim();
  const fillRaw=String(payload.fill||'').trim();
  if(nodes.length===1 && !title.trim()){ notify('Nama node tidak boleh kosong.','danger',3000); return; }
  const parsedW=widthRaw===''?null:Number(widthRaw);
  const parsedH=heightRaw===''?null:Number(heightRaw);
  if(parsedW!==null && (!Number.isFinite(parsedW)||parsedW<80||parsedW>1200)){ notify('Width harus 80-1200 px.','danger',3000); return; }
  if(parsedH!==null && (!Number.isFinite(parsedH)||parsedH<48||parsedH>900)){ notify('Height harus 48-900 px.','danger',3000); return; }
  const color=fillRaw===''?'':sanitizeHexColor(fillRaw);
  if(fillRaw!==''&&!color){ notify('HEX color harus format #RRGGBB.','danger',3000); return; }
  for (const node of nodes){
    if(title.trim()) node.title=title;
    if(parsedW===null) delete node.w; else node.w=Math.round(parsedW);
    if(parsedH===null) delete node.h; else node.h=Math.round(parsedH);
    if(fillRaw==='') delete node.fill; else node.fill=color;
  }
  commit(n,nodes.length>1?'Node terpilih diperbarui.':'Nama node diperbarui.');
  notify('Perubahan berhasil disimpan.','success',3000);
}
function doConnect(targetId){
  if(!connectSource){ connectSource=selectedId; setStatus('Pilih node tujuan.'); render(); return; }
  if(connectSource===targetId){ connectSource=null; notify('Tidak bisa menghubungkan node ke dirinya sendiri.','danger',3000); render(); return; }
  const n=clone();
  const hasPair = n.links.some(l=>(l.from===connectSource&&l.to===targetId)||(l.from===targetId&&l.to===connectSource));
  if(hasPair){
    n.links=n.links.filter(l=>!((l.from===connectSource&&l.to===targetId)||(l.from===targetId&&l.to===connectSource)));
    connectSource=null; commit(n,'Konektor diputus.'); notify('Konektor pasangan node diputus.','success',3000); return;
  }
  n.links.push({from:connectSource,to:targetId}); connectSource=null; commit(n,'Node terhubung.'); notify('Konektor berhasil ditambahkan.','success',3000);
}
function undo(){ if(!history.length)return; future.push(JSON.stringify(state)); state=JSON.parse(history.pop()); saveLocal(); render(); syncHistory(); }
function redo(){ if(!future.length)return; history.push(JSON.stringify(state)); state=JSON.parse(future.pop()); saveLocal(); render(); syncHistory(); }

function notify(msg, mode='danger', ms=3000){const t=document.getElementById('toast'); if(!t)return; t.hidden=false; t.textContent=msg; t.className=`toast show ${mode}`; clearTimeout(notify._tm); notify._tm=setTimeout(()=>{t.className='toast'; setTimeout(()=>{t.hidden=true;},180);},ms);}
function notifyDanger(msg){ notify(msg,'danger',3000); }
let lastSyncToastAt=0;
async function pushRemote(){ if(remoteSaveInFlight){ remoteSaveQueued=true; return; } remoteSaveInFlight=true; const ctl=new AbortController(); const tm=setTimeout(()=>ctl.abort('timeout'),7000); try{ const r=await fetch(`/api/mindmapmaker?id=${safeMapId}`,{method:'PUT',headers:{'content-type':'application/json'},body:JSON.stringify({data:state}),signal:ctl.signal}); if(!r.ok) throw new Error('bad_status'); setRemoteOnline(true); const now=Date.now(); if(now-lastSyncToastAt>10000){ notify('Sinkronisasi database berhasil.','success',1800); lastSyncToastAt=now; } }catch{ setRemoteOnline(false); notifyDanger('Bahaya: save DB gagal / timeout. Progress lokal aman dan akan retry otomatis.'); } finally{ clearTimeout(tm); remoteSaveInFlight=false; if(remoteSaveQueued){remoteSaveQueued=false; void pushRemote();}} }
async function hydrateRemote(){ try{ const r=await fetch(`/api/mindmapmaker?id=${safeMapId}`,{cache:'no-store'}); if(!r.ok)return; const d=await r.json(); if(d?.data?.nodes){ state=normalizeLinksUnique(d.data); saveLocal(); render(); setRemoteOnline(true);} }catch{ setRemoteOnline(false);} }

function updateSelection(ids, anchorId=null){
  selectedIds=new Set(ids);
  if(anchorId!==null) selectedId=anchorId;
  if(!selectedIds.has(selectedId)){ selectedId=selectedIds.values().next().value||1; }
}
function clientToWorld(cx,cy){
  const r=viewport.getBoundingClientRect();
  return {x:(cx-r.left-cam.x)/cam.scale,y:(cy-r.top-cam.y)/cam.scale};
}
function drawSelectionRect(){
  let el=document.getElementById('selection-rect');
  if(!selectionRect){ if(el) el.remove(); return; }
  if(!el){ el=document.createElement('div'); el.id='selection-rect'; el.className='selection-rect'; viewport.appendChild(el); }
  const x=selectionRect.x*cam.scale+cam.x, y=selectionRect.y*cam.scale+cam.y, w=selectionRect.w*cam.scale, h=selectionRect.h*cam.scale;
  el.style.left=`${x}px`; el.style.top=`${y}px`; el.style.width=`${w}px`; el.style.height=`${h}px`;
}

viewport.addEventListener('pointerdown',(e)=>{ activePointers.set(e.pointerId,{x:e.clientX,y:e.clientY}); const node=e.target.closest('.node'); if(activePointers.size===2){ const [a,b]=[...activePointers.values()]; pinch={dist:Math.hypot(a.x-b.x,a.y-b.y),scale:cam.scale}; dragging=null; panning=null; scheduleRender(); return; } if(node){ const id=Number(node.dataset.id); if(!selectedIds.has(id)) updateSelection([id],id); if(connectSource) { doConnect(id); return; } const src=state.nodes.find(n=>n.id===id); const targets=state.nodes.filter(n=>selectedIds.has(n.id)).map(n=>({id:n.id,x:n.x,y:n.y})); dragging={sx:e.clientX,sy:e.clientY,targets}; } else if(multiSelectMode&&matchMedia('(pointer:fine)').matches){ const s=clientToWorld(e.clientX,e.clientY); selectionRect={startX:s.x,startY:s.y,x:s.x,y:s.y,w:0,h:0}; } else { panning={sx:e.clientX,sy:e.clientY,cx:cam.x,cy:cam.y}; } viewport.setPointerCapture(e.pointerId); scheduleRender(); });
viewport.addEventListener('pointermove',(e)=>{ if(activePointers.has(e.pointerId)) activePointers.set(e.pointerId,{x:e.clientX,y:e.clientY}); if(activePointers.size===2&&pinch){ const [a,b]=[...activePointers.values()]; const d=Math.hypot(a.x-b.x,a.y-b.y); cam.scale=Math.min(2.2,Math.max(.45,pinch.scale*(d/Math.max(1,pinch.dist)))); scheduleRender(); return; } if(dragging){ const dx=(e.clientX-dragging.sx)/cam.scale, dy=(e.clientY-dragging.sy)/cam.scale; for(const t of dragging.targets){ const n=state.nodes.find(x=>x.id===t.id); if(!n) continue; n.x=snap(t.x+dx); n.y=snap(t.y+dy);} scheduleRender(); } else if(selectionRect){ const p=clientToWorld(e.clientX,e.clientY); const x1=Math.min(selectionRect.startX,p.x),y1=Math.min(selectionRect.startY,p.y),x2=Math.max(selectionRect.startX,p.x),y2=Math.max(selectionRect.startY,p.y); selectionRect.x=x1; selectionRect.y=y1; selectionRect.w=x2-x1; selectionRect.h=y2-y1; const ids=state.nodes.filter(n=>{ const s=computeNodeSize(n); const cx=n.x+s.w/2,cy=n.y+s.h/2; return cx>=x1&&cx<=x2&&cy>=y1&&cy<=y2; }).map(n=>n.id); updateSelection(ids.length?ids:[selectedId],ids[0]??selectedId); scheduleRender(); } else if(panning){ cam.x=panning.cx+(e.clientX-panning.sx); cam.y=panning.cy+(e.clientY-panning.sy); scheduleRender(); }});
function endPointer(e){ activePointers.delete(e.pointerId); if(activePointers.size<2) pinch=null; if(dragging){ commit(clone(),selectedIds.size>1?'Node dipindah massal.':'Node dipindah.'); } dragging=null; panning=null; selectionRect=null; render(); }
viewport.addEventListener('pointerup',endPointer);
viewport.addEventListener('pointercancel',endPointer);
viewport.addEventListener('wheel',(e)=>{ e.preventDefault(); const next=Math.min(2.2,Math.max(.45,cam.scale+(e.deltaY>0?-0.05:0.05))); cam.scale=next; render(); },{passive:false});

addNodeBtn.onclick=addNode; renameNodeBtn.onclick=renameNode; removeNodeBtn.onclick=removeNode; connectBtn.onclick=()=>doConnect(selectedId); undoBtn.onclick=undo; redoBtn.onclick=redo;
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
document.addEventListener('keydown',(e)=>{ if(e.repeat) return; if(e.shiftKey&&e.key.toLowerCase()==='a'&&matchMedia('(pointer:fine)').matches){ e.preventDefault(); addNode(); notify('Shortcut Shift+A: node ditambahkan.','success',3000); return; } if(e.shiftKey&&e.key.toLowerCase()==='e'&&matchMedia('(pointer:fine)').matches){ e.preventDefault(); multiSelectMode=!multiSelectMode; selectionRect=null; render(); notify(multiSelectMode?'Mode multi-select aktif: drag area untuk pilih.':'Mode multi-select nonaktif.','success',2200); }});
window.addEventListener('offline',()=>notifyDanger('Offline: progress disimpan lokal otomatis.'));
window.addEventListener('online',()=>notify('Online kembali: sinkronisasi dilanjutkan.','success',3000));
