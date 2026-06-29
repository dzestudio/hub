const SUPABASE_URL  = 'https://omfvbifkyjstlpqeumgk.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9tZnZiaWZreWpzdGxwcWV1bWdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI1MjgyNjMsImV4cCI6MjA5ODEwNDI2M30.vc3amC8mAJNuT9CnH3CytzOabfS-v-FLliIctm-aaFc';

const BADGE_LABELS = { producao: 'Produção', staging: 'Staging', desenvolvimento: 'Dev' };

let allSystems = [];
let activeEnv  = 'all';

async function fetchSystems() {
  const params = new URLSearchParams({
    select: 'slug,nome,descricao,ambiente,url_base',
    status: 'eq.ativo',
    order:  'nome.asc',
  });
  const res = await fetch(`${SUPABASE_URL}/rest/v1/sistemas?${params}`, {
    headers: {
      'apikey':         SUPABASE_ANON,
      'Authorization':  `Bearer ${SUPABASE_ANON}`,
      'Accept-Profile': 'iam',
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function card(s) {
  const badgeClass = `badge badge-${s.ambiente}`;
  const badgeLabel = BADGE_LABELS[s.ambiente] ?? s.ambiente;
  const desc       = s.descricao
    ? `<p class="card-desc">${esc(s.descricao)}</p>`
    : `<p class="card-desc card-desc-empty">Sem descrição.</p>`;

  const action = s.url_base
    ? `<a class="card-btn" href="${esc(s.url_base)}" target="_blank" rel="noopener">Abrir</a>`
    : `<button class="card-btn disabled" disabled>Sem URL</button>`;

  return `
    <article class="card" data-env="${esc(s.ambiente)}">
      <div class="card-top">
        <span class="card-name">${esc(s.nome)}</span>
        <span class="${badgeClass}">${badgeLabel}</span>
      </div>
      ${desc}
      ${action}
    </article>`;
}

function esc(str) {
  return String(str ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

function render(query = '') {
  const q = query.trim().toLowerCase();
  const filtered = allSystems.filter(s => {
    const matchEnv   = activeEnv === 'all' || s.ambiente === activeEnv;
    const matchQuery = !q || s.nome.toLowerCase().includes(q)
      || (s.descricao ?? '').toLowerCase().includes(q);
    return matchEnv && matchQuery;
  });

  const grid  = document.getElementById('grid');
  const empty = document.getElementById('empty');
  grid.innerHTML = filtered.map(card).join('');
  empty.classList.toggle('hidden', filtered.length > 0);
}

async function init() {
  const loading = document.getElementById('loading');
  const errEl   = document.getElementById('error');
  const search  = document.getElementById('search');

  try {
    allSystems = await fetchSystems();
  } catch (e) {
    loading.classList.add('hidden');
    errEl.textContent = 'Erro ao carregar sistemas. Tente novamente.';
    errEl.classList.remove('hidden');
    console.error(e);
    return;
  }

  loading.classList.add('hidden');
  render();

  search.addEventListener('input', () => render(search.value));

  document.getElementById('filters').addEventListener('click', e => {
    const btn = e.target.closest('.filter-btn');
    if (!btn) return;
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeEnv = btn.dataset.env;
    render(search.value);
  });
}

init();
