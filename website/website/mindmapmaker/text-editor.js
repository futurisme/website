const source = document.getElementById('source');
const statusEl = document.getElementById('status');
const mapId = Number((location.pathname.match(/\/mindmapmaker\/edit-text\/(\d+)/)||[])[1]||1);
document.getElementById('to-visual').href = `/mindmapmaker/edit/${mapId}`;

function aiNormalize(line){
  let s = line.trim().replace(/\s*[-–—>]\s*/g, ' > ').replace(/\s{2,}/g,' ');
  if(!s) return '';
  const parts = s.split('>').map(x=>x.trim()).filter(Boolean);
  if(parts.length===1) return `${parts[0]} > Detail`;
  if(parts.length>4) return parts.slice(0,4).join(' > ');
  return parts.join(' > ');
}

function parseToSnapshot(text){
  const lines = text.split(/\r?\n/).map(aiNormalize).filter(Boolean);
  const nodes=[{id:1,title:'Root',x:480,y:240}], links=[]; let id=2;
  const index=new Map([['Root',1]]);
  const levelY=[240,360,480,600,720];
  for(const ln of lines){
    const chain=['Root',...ln.split('>').map(x=>x.trim())];
    for(let i=1;i<chain.length;i++){
      const key=chain.slice(0,i+1).join('::');
      if(!index.has(key)){
        const parentKey=chain.slice(0,i).join('::'); const parentId=index.get(parentKey)||1;
        const siblingCount=nodes.filter(n=>n.y===levelY[i] && n.x>150).length;
        nodes.push({id,title:chain[i],x:180+siblingCount*220,y:levelY[i]||240+i*120});
        index.set(key,id); links.push({from:parentId,to:id}); id++;
      }
    }
  }
  return {version:1,nodes,links};
}

function saveSnapshot(snapshot){ localStorage.setItem(`mindmap:${mapId}`, JSON.stringify(snapshot)); }

document.getElementById('autofix').onclick=()=>{ source.value = source.value.split(/\r?\n/).map(aiNormalize).filter(Boolean).join('\n'); statusEl.textContent='AI auto-fix selesai.'; };
document.getElementById('submit').onclick=()=>{ const snap=parseToSnapshot(source.value); saveSnapshot(snap); statusEl.textContent=`Generated ${snap.nodes.length} nodes.`; location.href=`/mindmapmaker/edit/${mapId}`; };
