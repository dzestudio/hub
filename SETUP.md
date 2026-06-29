# Hub — Setup

Portal público de sistemas da DZ Estudio. Lê dados do Supabase (projeto MDM) e exibe em cards com filtro e busca.

## Pré-requisitos

- Node.js (qualquer versão moderna — só para dev server e Wrangler)
- Conta Cloudflare com acesso ao projeto `hub`
- Acesso ao projeto MDM (Supabase) para gerenciar os dados

## Rodar localmente

```bash
npm install
npm run dev
# Abre em http://localhost:3000
```

Não há variáveis de ambiente necessárias — as credenciais do Supabase estão em `app.js` (anon key pública, protegida por RLS).

## Deploy

```bash
npm run deploy
```

Isso executa `wrangler pages deploy . --commit-dirty=true` e publica direto no Cloudflare Pages.

Primeiro deploy ou novo ambiente: autenticar primeiro com `npx wrangler login`.

## Estrutura de dados (Supabase)

O Hub lê do schema `iam`, tabela `sistemas`, no Supabase do projeto MDM.

### Schema esperado

```sql
CREATE TABLE iam.sistemas (
  slug        TEXT PRIMARY KEY,
  nome        TEXT NOT NULL,
  descricao   TEXT,
  ambiente    TEXT NOT NULL,  -- 'producao' | 'staging' | 'desenvolvimento'
  url_base    TEXT,
  status      TEXT NOT NULL   -- 'ativo' | 'inativo'
);
```

### RLS

A leitura pública é habilitada via migration `20260629000001_hub_public_rls.sql` no projeto MDM. Se a tabela retornar vazia ou 401, verificar se essa migration foi aplicada.

## Adicionar/editar sistemas

Use o MDM (`mdm.dzestudio.com.br`) — o Hub não tem interface de admin própria.

1. Acesse MDM → Sistemas
2. Crie ou edite o sistema
3. O Hub reflete as mudanças automaticamente (sem cache, sem redeploy)

## Variáveis de configuração

Não há variáveis de ambiente no Cloudflare Pages para este projeto. As credenciais estão em `app.js`:

```js
const SUPABASE_URL  = 'https://omfvbifkyjstlpqeumgk.supabase.co';
const SUPABASE_ANON = '...';
```

A anon key é pública por design do Supabase — o RLS garante que apenas `status = 'ativo'` seja acessível sem autenticação.
