const source = document.getElementById('source'); const statusEl = document.getElementById('status'); const preview = document.getElementById('preview');
const mapId = Number((location.pathname.match(/\/mindmapmaker\/edit-text\/(\d+)/)||[])[1]||1); document.getElementById('to-visual').href=`/mindmapmaker/edit/${mapId}`;
const TYPO = new Map([['markting','marketing'],['prodk','produk'],['fitur utma','fitur utama'],['reseach','riset'],['seo0','seo']]);

function normalizeWord(w){const x=w.toLowerCase();return TYPO.get(x)||x;}
function normalizeText(t){return t.split(/\s+/).map(normalizeWord).join(' ').replace(/\s{2,}/g,' ').trim();}
function aiNormalizeLine(line){let s=line.trim(); if(!s) return ''; s=s.replace(/[—–-]+/g,'>').replace(/\s*>\s*/g,' > ').replace(/\s*:\s*/g,': '); s=normalizeText(s); if(/^parrent:/.test(s)) s=s.replace(/^parrent:/,'parent:'); if(/^chlid:/.test(s)) s=s.replace(/^chlid:/,'child:'); if(/^silbing:/.test(s)) s=s.replace(/^silbing:/,'sibling:'); return s;}

function parseAdvanced(text){
  const lines=text.split(/\r?\n/).map(aiNormalizeLine).filter(Boolean);
  const nodes=[{id:1,title:'Root',x:460,y:220,color:'#111827'}], links=[]; let id=2;
  let currentParent='Root'; let siblingAnchor='Root';
  const idx=new Map([['root',1]]); const lvlCount=[0,0,0,0,0,0];
  const getOrCreate=(title,level,parentId,color='#1f2937')=>{const key=`${parentId}:${title.toLowerCase()}`; if(idx.has(key)) return idx.get(key); lvlCount[level]=(lvlCount[level]||0)+1; const nx=40+lvlCount[level]*190, ny=40+level*110; nodes.push({id,title,x:nx,y:ny,color}); idx.set(key,id); links.push({from:parentId,to:id}); return id++;};
  for(const raw of lines){
    const colorMatch=raw.match(/color:\s*(#[0-9a-f]{3,8})/i); const color=colorMatch?.[1]||'#1f2937';
    const line=raw.replace(/color:\s*#[0-9a-f]{3,8}/ig,'').trim();
    if(line.startsWith('parent:')){ currentParent=line.slice(7).trim(); const pid=getOrCreate(currentParent,1,1,color); siblingAnchor=currentParent; continue; }
    if(line.startsWith('child:')){ const title=line.slice(6).trim(); const pid=[...nodes].find(n=>n.title.toLowerCase()===currentParent.toLowerCase())?.id||1; getOrCreate(title,2,pid,color); continue; }
    if(line.startsWith('sibling:')){ const title=line.slice(8).trim(); const pid=1; getOrCreate(title,1,pid,color); siblingAnchor=title; continue; }
    const chain=line.split('>').map(s=>s.trim()).filter(Boolean);
    let parentId=1; for(let i=0;i<chain.length;i++){ parentId=getOrCreate(chain[i],i+1,parentId,color); }
  }
  return {version:1,nodes,links};
}

function drawPreview(snapshot){
  const dpr=devicePixelRatio||1,w=1400,h=900; preview.width=w*dpr; preview.height=h*dpr;
  const c=preview.getContext('2d'); c.setTransform(dpr,0,0,dpr,0,0); c.clearRect(0,0,w,h); c.fillStyle='#ffffff'; c.fillRect(0,0,w,h);
  c.strokeStyle='rgba(37,99,235,.22)'; for(let x=0;x<w;x+=42){c.beginPath();c.moveTo(x,0);c.lineTo(x,h);c.stroke();} for(let y=0;y<h;y+=42){c.beginPath();c.moveTo(0,y);c.lineTo(w,y);c.stroke();}

  const nodes = snapshot.nodes || []; if(!nodes.length) return;
  const scale=1; const tx=(x)=>x; const ty=(y)=>y;

  const byId=new Map(nodes.map(n=>[n.id,n])); c.strokeStyle='#0f766e'; c.lineWidth=Math.max(1,1.4*scale);
  for(const l of snapshot.links||[]){const a=byId.get(l.from),b=byId.get(l.to); if(!a||!b)continue; c.beginPath(); c.moveTo(tx(a.x+75),ty(a.y+21)); c.bezierCurveTo(tx(a.x+130),ty(a.y+21),tx(b.x+20),ty(b.y+21),tx(b.x+75),ty(b.y+21)); c.stroke();}

  for(const n of nodes){ const x=tx(n.x), y=ty(n.y), rw=150*scale, rh=42*scale, rr=Math.max(4,8*scale);
    c.fillStyle=n.color||'#1f2937'; c.strokeStyle='#dbeafe'; c.lineWidth=1;
    roundRectPath(c,x,y,rw,rh,rr); c.fill(); c.stroke();
    c.fillStyle='#ffffff'; c.font=`${Math.max(10,12*scale)}px Inter`; c.fillText(n.title, x+8*scale, y+24*scale);
  }
}

function roundRectPath(c,x,y,w,h,r){
  const rr=Math.min(r,w/2,h/2); c.beginPath();
  c.moveTo(x+rr,y); c.lineTo(x+w-rr,y); c.quadraticCurveTo(x+w,y,x+w,y+rr);
  c.lineTo(x+w,y+h-rr); c.quadraticCurveTo(x+w,y+h,x+w-rr,y+h);
  c.lineTo(x+rr,y+h); c.quadraticCurveTo(x,y+h,x,y+h-rr);
  c.lineTo(x,y+rr); c.quadraticCurveTo(x,y,x+rr,y); c.closePath();
}

function saveSnapshot(s){ localStorage.setItem(`mindmap:${mapId}`, JSON.stringify(s)); }
document.getElementById('autofix').onclick=()=>{ source.value=source.value.split(/\r?\n/).map(aiNormalizeLine).filter(Boolean).join('\n'); statusEl.textContent='AI auto-fix: typo + format selesai.'; };
document.getElementById('render').onclick=()=>{ const snap=parseAdvanced(source.value); drawPreview(snap); statusEl.textContent=`Preview: ${snap.nodes.length} nodes, ${snap.links.length} links.`; };
document.getElementById('submit').onclick=()=>{ const snap=parseAdvanced(source.value); saveSnapshot(snap); location.href=`/mindmapmaker/edit/${mapId}`; };
window.addEventListener('resize',()=>{ try{drawPreview(parseAdvanced(source.value));}catch{} });
document.getElementById('render').click();
