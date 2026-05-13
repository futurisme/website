const source = document.getElementById('source'); const statusEl = document.getElementById('status'); const preview = document.getElementById('preview');
const mapId = Number((location.pathname.match(/\/mindmapmaker\/edit-text\/(\d+)/)||[])[1]||1); document.getElementById('to-visual').href=`/mindmapmaker/edit/${mapId}`;
const TYPO = new Map([['markting','marketing'],['prodk','produk'],['fitur utma','fitur utama'],['reseach','riset'],['parrent','parent'],['chlid','child'],['silbing','sibling']]);
const GRID_SIZE=10, GRID_UNITS=120; let currentSnapshot = null; let drag = null;

function fixToken(v){const k=v.toLowerCase(); return TYPO.get(k)||k;}
function normalizeText(t){return t.split(/\s+/).map(fixToken).join(' ').replace(/\s{2,}/g,' ').trim();}
function aiNormalizeLine(line){let s=normalizeText(line.trim()); s=s.replace(/^\d+\.\s*/, ''); if(!s) return ''; s=s.replace(/[—–-]+/g,'>').replace(/\s*>\s*/g,' > ').replace(/\s*:\s*/g,': '); if(!/(parent:|child:|sibling:|node:)/.test(s) && !s.includes('>')) s=`child: ${s}`; return s;}

function parseXY(text){const m=String(text).match(/x\s*:\s*(-?\d+(?:\.\d+)?)\s*[,;]?\s*y\s*:\s*(-?\d+(?:\.\d+)?)/i); return m?{x:Number(m[1]),y:Number(m[2])}:null;}
function parseColor(text){const m=String(text).match(/color\s*:\s*(#[0-9a-f]{3,8})/i); return m?m[1]:'#1f2937';}

function parseAdvanced(text){
  const lines=text.split(/\r?\n/).map(aiNormalizeLine).filter(Boolean);
  const nodes=[{id:1,title:'Root',x:10.0,y:10.0,color:'#111827'}], links=[]; let id=2; let currentParent='Root';
  const idx=new Map([['root',1]]); const levelCount={1:0,2:0,3:0,4:0};
  const findByTitle=(t)=>nodes.find(n=>n.title.toLowerCase()===t.toLowerCase());
  const create=(title,level,parentId,color,xy)=>{const key=`${parentId}:${title.toLowerCase()}`; if(idx.has(key)) return idx.get(key); levelCount[level]=(levelCount[level]||0)+1; const x=xy?.x ?? (10+levelCount[level]*14), y=xy?.y ?? (10+level*14); nodes.push({id,title,x,y,color}); idx.set(key,id); links.push({from:parentId,to:id}); return id++;};

  for(const raw of lines){
    const xy=parseXY(raw), color=parseColor(raw); const line=raw.replace(/color\s*:\s*#[0-9a-f]{3,8}/ig,'').replace(/x\s*:[^,\s]+\s*,?\s*y\s*:[^\s]+/ig,'').trim();
    if(line.startsWith('parent:')){ currentParent=line.slice(7).trim(); create(currentParent,1,1,color,xy); continue; }
    if(line.startsWith('child:')){ const title=line.slice(6).trim(); const p=findByTitle(currentParent)?.id||1; create(title,2,p,color,xy); continue; }
    if(line.startsWith('sibling:')){ const title=line.slice(8).trim(); create(title,1,1,color,xy); continue; }
    if(line.startsWith('node:')){ const title=line.slice(5).trim(); create(title,1,1,color,xy); continue; }
    const chain=line.split('>').map(s=>s.trim()).filter(Boolean); let parent=1; for(let i=0;i<chain.length;i++) parent=create(chain[i],i+1,parent,color,xy&&i===chain.length-1?xy:null);
  }
  spreadOverlaps(nodes);
  return {version:1,nodes,links};
}

function spreadOverlaps(nodes){
  for(let i=0;i<nodes.length;i++) for(let j=i+1;j<nodes.length;j++){const a=nodes[i],b=nodes[j]; if(Math.abs(a.x-b.x)<14 && Math.abs(a.y-b.y)<6){ b.x = Number((b.x + 3.5).toFixed(1)); b.y = Number((b.y + 2.5).toFixed(1)); }}
}

function snapshotToText(s){
  const byParent = new Map();
  for(const l of s.links){ if(!byParent.has(l.from)) byParent.set(l.from,[]); byParent.get(l.from).push(l.to); }
  const byId = new Map(s.nodes.map(n=>[n.id,n]));
  const lines=[]; let seq=1;
  for(const n of s.nodes){ if(n.id===1) continue; const parentId=[...s.links].find(l=>l.to===n.id)?.from||1; const parent=byId.get(parentId); const kind=parentId===1?'parent':'child';
    lines.push(`${seq}. ${kind}: ${n.title} x:${n.x.toFixed(1)}, y:${n.y.toFixed(1)} color:${n.color||'#1f2937'}`); seq++; }
  return lines.join('\n');
}

function drawPreview(snapshot){
  const dpr=devicePixelRatio||1,w=GRID_UNITS*GRID_SIZE,h=GRID_UNITS*GRID_SIZE; preview.width=w*dpr; preview.height=h*dpr; const c=preview.getContext('2d'); c.setTransform(dpr,0,0,dpr,0,0);
  c.clearRect(0,0,w,h); c.fillStyle='#fff'; c.fillRect(0,0,w,h); c.strokeStyle='rgba(37,99,235,.22)'; for(let x=0;x<=w;x+=GRID_SIZE){c.beginPath();c.moveTo(x,0);c.lineTo(x,h);c.stroke();} for(let y=0;y<=h;y+=GRID_SIZE){c.beginPath();c.moveTo(0,y);c.lineTo(w,y);c.stroke();}
  const byId=new Map(snapshot.nodes.map(n=>[n.id,n])); c.strokeStyle='#0f766e'; c.lineWidth=1.5;
  for(const l of snapshot.links){const a=byId.get(l.from),b=byId.get(l.to); if(!a||!b)continue; const ax=a.x*GRID_SIZE, ay=a.y*GRID_SIZE, bx=b.x*GRID_SIZE, by=b.y*GRID_SIZE; c.beginPath(); c.moveTo(ax+75,ay+21); c.bezierCurveTo(ax+130,ay+21,bx+20,by+21,bx+75,by+21); c.stroke();}
  for(const n of snapshot.nodes){ const px=n.x*GRID_SIZE, py=n.y*GRID_SIZE; box(c,px,py,150,42,9,n.color||'#1f2937'); c.fillStyle='#fff'; c.font='12px Inter'; c.fillText(n.title,px+8,py+25); }
}
function box(c,x,y,w,h,r,color){c.fillStyle=color;c.strokeStyle='#dbeafe';c.beginPath();c.moveTo(x+r,y);c.lineTo(x+w-r,y);c.quadraticCurveTo(x+w,y,x+w,y+r);c.lineTo(x+w,y+h-r);c.quadraticCurveTo(x+w,y+h,x+w-r,y+h);c.lineTo(x+r,y+h);c.quadraticCurveTo(x,y+h,x,y+h-r);c.lineTo(x,y+r);c.quadraticCurveTo(x,y,x+r,y);c.closePath();c.fill();c.stroke();}

function nodeAt(x,y){ if(!currentSnapshot) return null; for(let i=currentSnapshot.nodes.length-1;i>=0;i--){const n=currentSnapshot.nodes[i]; const px=n.x*GRID_SIZE, py=n.y*GRID_SIZE; if(x>=px&&x<=px+150&&y>=py&&y<=py+42) return n;} return null; }
preview.addEventListener('pointerdown',(e)=>{const r=preview.getBoundingClientRect();const x=(e.clientX-r.left)*(preview.width/r.width)/(devicePixelRatio||1),y=(e.clientY-r.top)*(preview.height/r.height)/(devicePixelRatio||1);const n=nodeAt(x,y); if(!n) return; drag={id:n.id,dx:x-(n.x*GRID_SIZE),dy:y-(n.y*GRID_SIZE)}; preview.setPointerCapture(e.pointerId);});
preview.addEventListener('pointermove',(e)=>{ if(!drag||!currentSnapshot) return; const r=preview.getBoundingClientRect(); const x=(e.clientX-r.left)*(preview.width/r.width)/(devicePixelRatio||1),y=(e.clientY-r.top)*(preview.height/r.height)/(devicePixelRatio||1); const n=currentSnapshot.nodes.find(v=>v.id===drag.id); n.x=Number((((x-drag.dx)/GRID_SIZE)).toFixed(1)); n.y=Number((((y-drag.dy)/GRID_SIZE)).toFixed(1)); drawPreview(currentSnapshot); });
preview.addEventListener('pointerup',()=>{ if(!drag||!currentSnapshot) return; drag=null; spreadOverlaps(currentSnapshot.nodes); drawPreview(currentSnapshot); source.value=snapshotToText(currentSnapshot); statusEl.textContent='Posisi node diperbarui + text otomatis sinkron.'; });

function saveSnapshot(s){ localStorage.setItem(`mindmap:${mapId}`, JSON.stringify(s)); }
document.getElementById('autofix').onclick=()=>{ source.value=source.value.split(/\r?\n/).map(aiNormalizeLine).filter(Boolean).join('\n'); statusEl.textContent='AI auto-fix: typo + struktur + format koordinat.'; };
document.getElementById('render').onclick=()=>{ currentSnapshot=parseAdvanced(source.value); drawPreview(currentSnapshot); source.value=snapshotToText(currentSnapshot); statusEl.textContent=`Preview updated: ${currentSnapshot.nodes.length} nodes, ${currentSnapshot.links.length} links.`; };
document.getElementById('submit').onclick=()=>{ const snap=parseAdvanced(source.value); saveSnapshot(snap); location.href=`/mindmapmaker/edit/${mapId}`; };
window.addEventListener('resize',()=>{ if(currentSnapshot) drawPreview(currentSnapshot); });
document.getElementById('render').click();
