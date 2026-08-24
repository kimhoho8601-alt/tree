const cfg = window.TREE_CONFIG;
const db = supabase.createClient(cfg.supabaseUrl, cfg.supabaseKey);
const tileGrid = document.querySelector('#tileGrid');
const pledgeWall = document.querySelector('#pledgeWall');
const countEl = document.querySelector('#screenCount');
const completeBadge = document.querySelector('#completeBadge');
const resetBtn = document.querySelector('#resetBtn');
const photoFrame = document.querySelector('#photoFrame');
const revealPhoto = document.querySelector('#revealPhoto');
const MAX_BUBBLES = 48;
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
  tileGrid.innerHTML = '';
  for (let i = 0; i < cfg.capacity; i++) {
    const tile = document.createElement('div');
    tile.className = 'reveal-tile';
    tile.dataset.index = String(i);
    tileGrid.appendChild(tile);
  }
}

function syncGridToImage() {
  if (!photoFrame || !revealPhoto || !revealPhoto.naturalWidth || !revealPhoto.naturalHeight) return;

  const frameW = photoFrame.clientWidth;
  const frameH = photoFrame.clientHeight;
  const imageRatio = revealPhoto.naturalWidth / revealPhoto.naturalHeight;
  const frameRatio = frameW / frameH;

  let drawW;
  let drawH;
  let left;
  let top;

  if (imageRatio > frameRatio) {
    drawW = frameW;
    drawH = frameW / imageRatio;
    left = 0;
    top = (frameH - drawH) / 2;
  } else {
    drawH = frameH;
    drawW = frameH * imageRatio;
    top = 0;
    left = (frameW - drawW) / 2;
  }

  tileGrid.style.left = `${left}px`;
  tileGrid.style.top = `${top}px`;
  tileGrid.style.width = `${drawW}px`;
  tileGrid.style.height = `${drawH}px`;
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

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderPledges(rows) {
  if (!pledgeWall) return;

  if (!rows.length) {
    pledgeWall.innerHTML = `
      <article class="pledge-bubble pledge-bubble--empty">
        <div class="bubble-body">첫 번째 다짐을 기다리고 있어요.</div>
        <div class="bubble-meta">지금 휴대폰으로 참여해보세요.</div>
      </article>`;
    return;
  }

  const latestRows = rows.slice(-MAX_BUBBLES).reverse();
  pledgeWall.innerHTML = latestRows.map((row, index) => {
    const isNewest = index === 0;
    return `
      <article class="pledge-bubble${isNewest ? ' pledge-bubble--newest' : ''}">
        <div class="bubble-body">“${escapeHtml(row.message)}”</div>
        <div class="bubble-meta">${escapeHtml(row.display_name)} <span>#${row.slot_no}</span></div>
      </article>`;
  }).join('');
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
  renderPledges(rows);

  if (count >= cfg.capacity) completeBadge.classList.remove('hidden');
  else completeBadge.classList.add('hidden');

  lastCount = count;
}

resetBtn?.addEventListener('click', async () => {
  const confirmation = prompt('전체 참여 기록을 초기화하려면 RESET-200 을 입력하세요.');
  if (confirmation !== 'RESET-200') return;

  const ok = confirm('정말 0 / 200 상태로 초기화할까요? 이 작업은 되돌릴 수 없습니다.');
  if (!ok) return;

  resetBtn.disabled = true;
  resetBtn.textContent = '초기화 중...';

  const { error } = await db.rpc('reset_tree_workshop_entries', {
    p_confirmation: 'RESET-200'
  });

  if (error) {
    alert(`초기화에 실패했습니다. ${error.message || ''}`.trim());
  } else {
    lastCount = -1;
    await refresh();
    alert('초기화되었습니다.');
  }

  resetBtn.disabled = false;
  resetBtn.textContent = '초기화';
});

buildGrid();
if (revealPhoto.complete) syncGridToImage();
revealPhoto.addEventListener('load', syncGridToImage);
window.addEventListener('resize', syncGridToImage);
refresh();
setInterval(refresh, cfg.pollMs);
