# Hub — CLAUDE.md

Portal público de sistemas da DZ Estudio. Lista todos os sistemas cadastrados no MDM com filtro por ambiente e busca.

## Stack

- **Frontend:** HTML + Vanilla JS + CSS puro (sem framework, sem bundler)
- **Deploy:** Cloudflare Pages (arquivos estáticos — `pages_build_output_dir = "."`)
- **Dados:** Supabase REST API (schema `iam`, tabela `sistemas`)
- **Admin dos dados:** projeto MDM — o Hub só lê, nunca escreve

## Arquivos

| Arquivo | Papel |
|---------|-------|
| `index.html` | Estrutura HTML: header com busca, grid de cards, filtros, footer |
| `app.js` | Toda a lógica: fetch Supabase, render cards, filtro por ambiente, busca |
| `style.css` | Design system: CSS variables, grid responsivo, badges, hover |
| `wrangler.toml` | Configuração Cloudflare Pages |

## Supabase

- URL e anon key estão em texto puro no topo de `app.js` — isso é **intencional**. A anon key do Supabase é pública por design; o RLS controla o acesso.
- Schema: `iam` (via header `Accept-Profile: iam`)
- Tabela: `sistemas`
- Campos lidos: `slug`, `nome`, `descricao`, `ambiente`, `url_base`
- Filtro fixo: `status = 'ativo'`, ordenação `nome asc`
- A RLS que permite leitura pública foi aplicada via migration `20260629000001_hub_public_rls.sql` no projeto MDM

## Ambientes de sistema

Os valores possíveis para `ambiente` na tabela:

| Valor DB | Badge |
|----------|-------|
| `producao` | Produção (verde) |
| `staging` | Staging (amarelo) |
| `desenvolvimento` | Dev (cinza) |

## Comandos

```bash
npm run dev      # servidor local na porta 3000
npm run deploy   # deploy Cloudflare Pages
```

## Convenções

- Sem TypeScript, sem build step, sem dependências de runtime
- Escape de HTML via função `esc()` em `app.js` — usá-la em todo conteúdo dinâmico
- CSS variables em `:root` no `style.css` — não usar valores hardcoded de cor/espaçamento
- O Hub não tem backend próprio; qualquer dado novo vai no MDM
