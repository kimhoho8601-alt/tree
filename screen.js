const cfg = window.TREE_CONFIG;
const db = supabase.createClient(cfg.supabaseUrl, cfg.supabaseKey);
const fruitLayer = document.querySelector('#fruits');
const leafLayer = document.querySelector('#leaves');
const countEl = document.querySelector('#screenCount');
const latestMsg = document.querySelector('#latestMessage');
const latestName = document.querySelector('#latestName');
const finale = document.querySelector('#finale');
let lastCount = -1;

function rng(seed){ let t=seed+0x6D2B79F5; return () => { t=Math.imul(t^t>>>15,t|1); t^=t+Math.imul(t^t>>>7,t|61); return ((t^t>>>14)>>>0)/4294967296; }; }
function buildTree(){
  const r = rng(20260824);
  for(let i=0;i<270;i++){
    const a=r()*Math.PI*2, rr=Math.sqrt(r());
    const x=535 + Math.cos(a)*rr*360, y=270 + Math.sin(a)*rr*210;
    const e=document.createElementNS('http://www.w3.org/2000/svg','ellipse');
    e.setAttribute('cx',x); e.setAttribute('cy',y); e.setAttribute('rx',7+r()*7); e.setAttribute('ry',13+r()*8); e.setAttribute('transform',`rotate(${r()*180} ${x} ${y})`); e.setAttribute('class','leaf'); leafLayer.appendChild(e);
  }
  for(let i=1;i<=cfg.capacity;i++){
    const a=r()*Math.PI*2, rr=Math.sqrt(r());
    const x=535 + Math.cos(a)*rr*335, y=270 + Math.sin(a)*rr*185;
    const g=document.createElementNS('http://www.w3.org/2000/svg','g'); g.setAttribute('class','fruit-slot'); g.dataset.slot=i;
    const c=document.createElementNS('http://www.w3.org/2000/svg','circle'); c.setAttribute('cx',x); c.setAttribute('cy',y); c.setAttribute('r',10+r()*4);
    g.appendChild(c); fruitLayer.appendChild(g);
  }
}
async function refresh(){
  const { data, error } = await db.from('tree_workshop_public').select('slot_no,display_name,message,created_at').order('slot_no');
  if(error) return;
  const rows=data||[]; countEl.textContent=rows.length;
  document.querySelectorAll('.fruit-slot').forEach(n=>n.classList.remove('active','new'));
  rows.forEach(row=>{ const node=document.querySelector(`.fruit-slot[data-slot="${row.slot_no}"]`); if(node) node.classList.add('active'); });
  if(rows.length){ const latest=rows[rows.length-1]; latestMsg.textContent=`“${String(latest.message ?? '')}”`; latestName.textContent=String(latest.display_name ?? ''); }
  if(lastCount >= 0 && rows.length > lastCount){ const newest=rows[rows.length-1]; const node=document.querySelector(`.fruit-slot[data-slot="${newest.slot_no}"]`); if(node) node.classList.add('new'); }
  lastCount=rows.length;
  if(rows.length >= cfg.capacity) finale.classList.remove('hidden');
}
buildTree(); refresh(); setInterval(refresh,cfg.pollMs);
