# Deploy gratuito

## Recomendação

1. **Desenvolvimento:** SQLite local (`file:./super_gestao.db`)
2. **Produção:** Vercel + Turso (SQLite na nuvem) ou Supabase Postgres

## Opções

| Opção | Custo | Uso |
|-------|-------|-----|
| Vercel Hobby | Grátis | Next.js app + API routes |
| Turso | Grátis (limites) | SQLite remoto, compatível com Prisma |
| Supabase free | Grátis | Postgres + Auth (500MB) |
| Cloudflare Pages + D1 | Grátis | Alternativa SQLite |
| Tailscale | Grátis pessoal | Acesso ao Mac local sem deploy |
| ngrok | Grátis limitado | Teste rápido, URL temporária |

## Deploy Vercel + Turso

```bash
# 1. Criar DB Turso
turso db create super-gestao
turso db show super-gestao --url

# 2. Variáveis na Vercel
DATABASE_URL=libsql://...
AUTH_SECRET=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# 3. Deploy
vercel --prod
```

## Google OAuth (produção)

1. Google Cloud Console → Credentials → OAuth 2.0
2. Authorized redirect: `https://seu-dominio.vercel.app/api/auth/callback/google`
3. Restringir domínio `@estrategiavestibulares.com.br` no app

## Auth local (desenvolvimento)

Login simples com usuário/senha em `.env`:

```env
ADMIN_EMAIL=admin@local
ADMIN_PASSWORD=...
EXECUTIVE_EMAIL=chefe@local
EXECUTIVE_PASSWORD=...
```

## Checklist pré-deploy

- [ ] `AUTH_SECRET` gerado (`openssl rand -base64 32`)
- [ ] Migrations Prisma aplicadas na nuvem
- [ ] Import xlsx executado uma vez
- [ ] Bridge Apps Script URL configurada
- [ ] Testar login executive (somente leitura)

## Acesso remoto sem deploy

Rodar `npm run dev` no Mac + Tailscale na mesma rede = chefe acessa `http://100.x.x.x:3000`.
