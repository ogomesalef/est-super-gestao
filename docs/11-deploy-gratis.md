# Deploy gratuito — passo a passo

## Recomendação

1. **Desenvolvimento:** SQLite local (`file:./prisma/super_gestao.db`)
2. **Produção:** Vercel + Turso (SQLite na nuvem)

## Pré-requisitos

```bash
# Turso CLI
curl -sSfL https://get.tur.so/install.sh | bash
turso auth login

# Vercel CLI
npm i -g vercel
vercel login
```

## 1. Banco Turso

```bash
turso db create super-gestao
turso db show super-gestao --url
# libsql://super-gestao-SEUUSER.turso.io

turso db tokens create super-gestao
# guarde o token como DATABASE_AUTH_TOKEN
```

## 2. Schema + usuários + import

No seu Mac, apontando para o Turso:

```bash
cd est-super-gestao

export DATABASE_URL="libsql://super-gestao-SEUUSER.turso.io"
export DATABASE_AUTH_TOKEN="eyJ..."

npm run db:push
npm run db:bootstrap
npm run import:xlsx -- "/caminho/SUPER EMBAIXADORES ECJ + OAB.xlsx"
```

## 3. Variáveis na Vercel

Em **Project → Settings → Environment Variables** (Production):

| Variável | Exemplo |
|----------|---------|
| `DATABASE_URL` | `libsql://super-gestao-....turso.io` |
| `DATABASE_AUTH_TOKEN` | token do `turso db tokens create` |
| `AUTH_SECRET` | `openssl rand -base64 32` |
| `ADMIN_EMAIL` | e-mail admin produção |
| `ADMIN_PASSWORD` | senha forte |
| `EXECUTIVE_EMAIL` | e-mail da chefe |
| `EXECUTIVE_PASSWORD` | senha forte |
| `APPS_SCRIPT_BRIDGE_URL` | URL do Web App Apps Script |
| `APPS_SCRIPT_SECRET` | mesmo secret da API contatos |
| `WEBHOOK_SECRET` | igual ao secret acima |
| `FINANCE_TEAM_EMAIL` | time financeiro |
| `FINANCE_CC_EMAIL` | CC solicitação pagamento |

Opcional (Google OAuth):

| `GOOGLE_CLIENT_ID` | Console Google Cloud |
| `GOOGLE_CLIENT_SECRET` | Console Google Cloud |

## 4. Deploy

```bash
vercel link          # primeira vez
vercel --prod
```

O build na Vercel roda `vercel-build`: `prisma db push` + `next build`.

Região padrão: **gru1** (São Paulo) — ver `vercel.json`.

## 5. Pós-deploy

1. Abrir URL da Vercel e testar login admin + chefe
2. Conferir módulos (contagens vs planilha) — `docs/12-validacao-manual.md`
3. Configurar Apps Script:
   - `SUPER_GESTAO_WEBHOOK_URL` → `https://SEU-APP.vercel.app/api/entregas/webhook`
4. Testar envio de e-mail em `/emails`

## Google OAuth (produção)

1. Google Cloud Console → Credentials → OAuth 2.0
2. Authorized redirect: `https://SEU-APP.vercel.app/api/auth/google/callback`
3. Restringir domínio `@estrategiavestibulares.com.br` no app

## Auth local (desenvolvimento)

```env
ADMIN_EMAIL=admin@local
ADMIN_PASSWORD=admin123
EXECUTIVE_EMAIL=chefe@local
EXECUTIVE_PASSWORD=chefe123
```

## Checklist pré-deploy

- [ ] `AUTH_SECRET` gerado (`openssl rand -base64 32`)
- [ ] Schema aplicado no Turso (`npm run db:push`)
- [ ] Usuários criados (`npm run db:bootstrap`)
- [ ] Import xlsx executado uma vez
- [ ] Bridge Apps Script URL configurada na Vercel
- [ ] Testar login executive (somente leitura)

## Script auxiliar

```bash
chmod +x scripts/deploy-prep.sh
./scripts/deploy-prep.sh
```

## Acesso remoto sem deploy

Rodar `npm run dev` no Mac + Tailscale = chefe acessa `http://100.x.x.x:3000`.
