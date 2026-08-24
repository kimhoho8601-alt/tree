const cfg = window.TREE_CONFIG;
const db = supabase.createClient(cfg.supabaseUrl, cfg.supabaseKey);
const tileGrid = document.querySelector('#tileGrid');
const countEl = document.querySelector('#screenCount');
const latestMsg = document.querySelector('#latestMessage');
const latestName = document.querySelector('#latestName');
const completeBadge = document.querySelector('#completeBadge');
let lastCount = -1;

function seededOrder(total, seed = 20260824) {
  const arr = Array.from({ length: total }, (_, i) => i);
  let t = seed >>> 0;
  const rnd = () => {
    t += 0x6D2B79F5;
    let x = t;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const revealOrder = seededOrder(cfg.capacity);

function buildGrid() {
  for (let i = 0; i < cfg.capacity; i++) {
    const tile = document.createElement('div');
    tile.className = 'reveal-tile';
    tile.dataset.index = String(i);
    tileGrid.appendChild(tile);
  }
}

function renderReveal(count) {
  const revealed = new Set(revealOrder.slice(0, Math.min(count, cfg.capacity)));
  document.querySelectorAll('.reveal-tile').forEach((tile, idx) => {
    const on = revealed.has(idx);
    tile.classList.toggle('revealed', on);
    tile.classList.remove('newly-revealed');
  });

  if (lastCount >= 0 && count > lastCount) {
    for (let i = lastCount; i < count && i < cfg.capacity; i++) {
      const idx = revealOrder[i];
      const tile = tileGrid.children[idx];
      if (tile) tile.classList.add('newly-revealed');
    }
  }
}

async function refresh() {
  const { data, error } = await db
    .from('tree_workshop_public')
    .select('slot_no,display_name,message,created_at')
    .order('slot_no');

  if (error) return;

  const rows = data || [];
  const count = rows.length;
  countEl.textContent = count;
  renderReveal(count);

  if (count) {
    const latest = rows[rows.length - 1];
    latestMsg.textContent = `“${String(latest.message ?? '')}”`;
    latestName.textContent = String(latest.display_name ?? '');
  }

  if (count >= cfg.capacity) completeBadge.classList.remove('hidden');
  else completeBadge.classList.add('hidden');

  lastCount = count;
}

buildGrid();
refresh();
setInterval(refresh, cfg.pollMs);
