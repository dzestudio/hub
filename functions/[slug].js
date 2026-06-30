export async function onRequest(context) {
  const { slug } = context.params;
  const { SUPABASE_URL, SUPABASE_ANON } = context.env;

  // Reserva rotas de arquivos estáticos e funções conhecidas
  if (!slug || slug.includes('.') || slug === 'config') {
    return context.next();
  }

  // Busca o sistema no Supabase
  const params = new URLSearchParams({
    slug:   `eq.${slug}`,
    status: 'eq.ativo',
    select: 'slug,nome,descricao,url_base,ambiente,icone',
  });

  let sistema = null;
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/sistemas?${params}`, {
      headers: {
        apikey:           SUPABASE_ANON,
        Authorization:    `Bearer ${SUPABASE_ANON}`,
        'Accept-Profile': 'iam',
      },
    });
    if (res.ok) {
      const rows = await res.json();
      sistema = rows[0] ?? null;
    }
  } catch (_) {
    // deixa sistema null → 404
  }

  if (!sistema) {
    return new Response(page404(slug), {
      status: 404,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  if (!sistema.url_base) {
    return new Response(pageNoUrl(sistema), {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  return new Response(pageFrame(sistema), {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

// ── helpers ──

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
  );
}

const BADGE = { producao: 'PROD', staging: 'STG', desenvolvimento: 'DEV' };

function topBar(s, extraContent = '') {
  const badge = BADGE[s.ambiente] ?? s.ambiente;
  return `
    <style>
      *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
      :root{--canvas:#0A3D26;--canvas-mid:#1B7434;--cream:#EDE8D5;
            --ink-muted:rgba(237,232,213,.55);--hairline:rgba(237,232,213,.18)}
      body{font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;background:#0A3D26;color:#EDE8D5;height:100vh;display:flex;flex-direction:column}
      .bar{display:flex;align-items:center;gap:12px;padding:0 20px;height:40px;
           background:#111;border-bottom:1px solid var(--hairline);flex-shrink:0;z-index:100}
      .back{display:flex;align-items:center;gap:6px;color:var(--ink-muted);font-size:11px;
            font-weight:700;letter-spacing:.8px;text-transform:uppercase;text-decoration:none;
            transition:color .15s;flex-shrink:0}
      .back:hover{color:var(--cream)}
      .back-arrow{font-size:14px;line-height:1}
      .sep{color:var(--hairline);font-size:14px;flex-shrink:0}
      .brand{font-size:11px;font-weight:900;letter-spacing:.8px;text-transform:uppercase;
             color:var(--cream);flex-shrink:0}
      .sistema-name{font-size:12px;font-weight:700;letter-spacing:.3px;text-transform:uppercase;
                    color:var(--cream);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .badge{padding:2px 7px;font-size:9px;font-weight:700;letter-spacing:1px;
             text-transform:uppercase;background:var(--canvas-mid);color:var(--cream);flex-shrink:0}
      .spacer{flex:1}
      .open-btn{font-size:10px;font-weight:700;letter-spacing:.8px;text-transform:uppercase;
                color:var(--ink-muted);text-decoration:none;border:1px solid var(--hairline);
                padding:3px 10px;transition:all .15s;flex-shrink:0}
      .open-btn:hover{color:var(--cream);border-color:var(--cream)}
    </style>
    <div class="bar">
      <a class="back" href="/">
        <span class="back-arrow">&#8592;</span>
        <span>Hub</span>
      </a>
      <span class="sep">/</span>
      <span class="brand">DZ Est&uacute;dio</span>
      <span class="sep">/</span>
      <span class="sistema-name">${esc(s.nome)}</span>
      <span class="badge">${esc(badge)}</span>
      <span class="spacer"></span>
      ${extraContent}
    </div>`;
}

function pageFrame(s) {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${esc(s.nome)} &mdash; DZ Hub</title>
  <meta name="robots" content="noindex,nofollow">
  <style>
    iframe{flex:1;width:100%;border:none;display:block}
    .frame-error{display:none;flex:1;align-items:center;justify-content:center;
                 flex-direction:column;gap:16px;padding:40px;text-align:center}
    .frame-error.visible{display:flex}
    .frame-error p{font-size:13px;color:rgba(237,232,213,.6);max-width:400px;line-height:1.6}
    .frame-error a{padding:8px 24px;background:#1B7434;color:#EDE8D5;font-size:11px;
                   font-weight:700;letter-spacing:1px;text-transform:uppercase;text-decoration:none}
  </style>
</head>
<body>
  ${topBar(s, `<a class="open-btn" href="${esc(s.url_base)}" target="_blank" rel="noopener">Abrir direto &#8599;</a>`)}
  <iframe
    id="frame"
    src="${esc(s.url_base)}"
    title="${esc(s.nome)}"
    sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-downloads"
    onerror="showError()"
  ></iframe>
  <div class="frame-error" id="frame-error">
    <p>Este sistema n&atilde;o permite ser carregado em iframe.<br>Use o bot&atilde;o abaixo para abrir diretamente.</p>
    <a href="${esc(s.url_base)}" target="_blank" rel="noopener">Abrir ${esc(s.nome)} &#8599;</a>
  </div>
  <script>
    // Detecta bloqueio de iframe (X-Frame-Options / CSP)
    const frame = document.getElementById('frame');
    const errEl = document.getElementById('frame-error');
    frame.addEventListener('load', () => {
      try {
        // Acesso ao contentDocument levanta erro se bloqueado por CORS/XFO
        const _ = frame.contentDocument;
      } catch(e) {
        // cross-origin mas carregou — provavelmente OK
      }
    });
    // Timeout: se depois de 12s o iframe não carregou nada, mostra erro
    const t = setTimeout(() => {
      try {
        if (!frame.contentDocument || frame.contentDocument.readyState === 'complete') return;
        frame.style.display = 'none';
        errEl.classList.add('visible');
      } catch(_) {}
    }, 12000);
    frame.addEventListener('load', () => clearTimeout(t));
  </script>
</body>
</html>`;
}

function pageNoUrl(s) {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>${esc(s.nome)} &mdash; DZ Hub</title>
  <meta name="robots" content="noindex,nofollow">
</head>
<body>
  ${topBar(s)}
  <div style="flex:1;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:12px;padding:40px;text-align:center">
    <p style="font-size:13px;color:rgba(237,232,213,.6)">Este sistema ainda n&atilde;o tem URL configurada.</p>
    <a href="/" style="font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:rgba(237,232,213,.6);text-decoration:none">&#8592; Voltar ao Hub</a>
  </div>
</body>
</html>`;
}

function page404(slug) {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Sistema n&atilde;o encontrado &mdash; DZ Hub</title>
  <meta name="robots" content="noindex,nofollow">
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;background:#0A3D26;color:#EDE8D5;
         height:100vh;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:16px;padding:40px;text-align:center}
    h1{font-size:14px;font-weight:900;letter-spacing:1px;text-transform:uppercase}
    p{font-size:13px;color:rgba(237,232,213,.6);max-width:380px;line-height:1.6}
    a{padding:8px 24px;background:#1B7434;color:#EDE8D5;font-size:11px;font-weight:700;
      letter-spacing:1px;text-transform:uppercase;text-decoration:none;margin-top:8px}
  </style>
</head>
<body>
  <h1>Sistema n&atilde;o encontrado</h1>
  <p><code style="font-family:monospace;font-size:12px;opacity:.7">${esc(slug)}</code> n&atilde;o existe ou est&aacute; inativo.</p>
  <a href="/">&#8592; Voltar ao Hub</a>
</body>
</html>`;
}
