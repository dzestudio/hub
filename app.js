const BADGE_LABELS = { producao: 'Produção', staging: 'Staging', desenvolvimento: 'Dev' };

const toIconifyId = icone => icone
  ? (icone.includes(':') ? icone : 'lucide:' + icone)
  : '';

let allSystems = [];
let allGroups  = [];
let activeEnv  = 'all';

async function getConfig() {
  const res = await fetch('/config');
  if (!res.ok) throw new Error(`Config HTTP ${res.status}`);
  return res.json();
}

async function fetchGroups(supabaseUrl, supabaseAnon) {
  const params = new URLSearchParams({
    select: 'id,nome,descricao,icone,ordem',
    order:  'ordem.asc',
  });
  const res = await fetch(`${supabaseUrl}/rest/v1/grupos_sistemas?${params}`, {
    headers: {
      'apikey':         supabaseAnon,
      'Authorization':  `Bearer ${supabaseAnon}`,
      'Accept-Profile': 'iam',
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function fetchSystems(supabaseUrl, supabaseAnon) {
  const params = new URLSearchParams({
    select:         'slug,nome,descricao,ambiente,url_base,icone,grupo_id,ordem',
    status:         'eq.ativo',
    mostrar_no_hub: 'eq.true',
    order:          'ordem.asc',
  });
  const res = await fetch(`${supabaseUrl}/rest/v1/sistemas?${params}`, {
    headers: {
      'apikey':         supabaseAnon,
      'Authorization':  `Bearer ${supabaseAnon}`,
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

  const iconHtml = s.icone
    ? `<div class="card-icon"><iconify-icon icon="${esc(toIconifyId(s.icone))}" width="24" height="24"></iconify-icon></div>`
    : '';

  return `
    <article class="card" data-env="${esc(s.ambiente)}">
      ${iconHtml}
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

function grupoSection(grupo, systems) {
  const iconHtml = grupo.icone
    ? `<iconify-icon icon="${esc(toIconifyId(grupo.icone))}" width="18" height="18" style="flex-shrink:0"></iconify-icon>`
    : '';
  return `
    <section class="grupo-section">
      <div class="grupo-header">
        ${iconHtml}
        <div class="grupo-info">
          <span class="grupo-nome">${esc(grupo.nome)}</span>
          ${grupo.descricao ? `<span class="grupo-desc">${esc(grupo.descricao)}</span>` : ''}
        </div>
      </div>
      <div class="grupo-cards">
        ${systems.map(card).join('')}
      </div>
    </section>`;
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

  if (!filtered.length) {
    grid.innerHTML = '';
    empty.classList.remove('hidden');
    return;
  }
  empty.classList.add('hidden');

  // Build groups
  const byGrupo = new Map();
  allGroups.forEach(g => byGrupo.set(g.id, []));
  byGrupo.set('', []);

  filtered.forEach(s => {
    const key = s.grupo_id ?? '';
    if (!byGrupo.has(key)) byGrupo.set(key, []);
    byGrupo.get(key).push(s);
  });

  let html = '';

  // Named groups (in order)
  allGroups.forEach(g => {
    const sArr = byGrupo.get(g.id) ?? [];
    if (sArr.length) html += grupoSection(g, sArr);
  });

  // Ungrouped
  const ungrouped = byGrupo.get('') ?? [];
  if (ungrouped.length) {
    if (html) {
      // Show ungrouped systems without a header if there are named groups
      html += `<section class="grupo-section grupo-section-plain"><div class="grupo-cards">${ungrouped.map(card).join('')}</div></section>`;
    } else {
      // All systems are ungrouped — just show the flat grid
      html = `<div class="grupo-cards">${ungrouped.map(card).join('')}</div>`;
    }
  }

  grid.innerHTML = html;
}

async function init() {
  const loading = document.getElementById('loading');
  const errEl   = document.getElementById('error');
  const search  = document.getElementById('search');

  try {
    const { url, anon } = await getConfig();
    [allGroups, allSystems] = await Promise.all([
      fetchGroups(url, anon),
      fetchSystems(url, anon),
    ]);
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
