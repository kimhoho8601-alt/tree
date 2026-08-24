const cfg = window.TREE_CONFIG;
const db = supabase.createClient(cfg.supabaseUrl, cfg.supabaseKey);
const form = document.querySelector('#pledgeForm');
const nameEl = document.querySelector('#name');
const msgEl = document.querySelector('#message');
const btn = document.querySelector('#submitBtn');
const countEl = document.querySelector('#count');
const bar = document.querySelector('#progressBar');
const success = document.querySelector('#successCard');
const charCount = document.querySelector('#charCount');
let deviceId = localStorage.getItem('tree_device_id');
if (!deviceId) { deviceId = crypto.randomUUID(); localStorage.setItem('tree_device_id', deviceId); }

msgEl.addEventListener('input', () => charCount.textContent = msgEl.value.length);

async function refreshCount(){
  const { count, error } = await db.from('tree_workshop_public').select('*', { count: 'exact', head: true });
  if (!error) {
    const n = count || 0;
    countEl.textContent = n;
    bar.style.width = `${Math.min(100, n / cfg.capacity * 100)}%`;
    if (n >= cfg.capacity) { btn.disabled = true; btn.textContent = '200개의 열매가 모두 채워졌습니다'; }
  }
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const displayName = nameEl.value.trim();
  const message = msgEl.value.trim();
  if (!displayName || !message) return;
  btn.disabled = true; btn.textContent = '열매를 달고 있어요...';
  const { data, error } = await db.rpc('submit_tree_workshop_entry', {
    p_display_name: displayName,
    p_message: message,
    p_device_id: deviceId
  });
  if (error) {
    const m = String(error.message || '');
    alert(m.includes('WORKSHOP_FULL') ? '200개의 열매가 모두 채워졌습니다.' : '잠시 후 다시 시도해주세요.');
    btn.disabled = false; btn.textContent = '나무에 열매 달기';
    return;
  }
  const row = Array.isArray(data) ? data[0] : data;
  document.querySelector('#slotLabel').textContent = `#${row?.slot_no ?? ''}`;
  form.classList.add('hidden'); success.classList.remove('hidden');
  refreshCount();
});

refreshCount();
