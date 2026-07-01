# Super Gestão — Progresso

Última atualização: 2026-07-01

## Concluído

### App base
- [x] Scaffold Next.js + Prisma + SQLite/Turso
- [x] Docs (`docs/` — 13 arquivos)
- [x] Import xlsx (`npm run import:xlsx`)
- [x] Módulos: contatos, parcerias, entregas, financeiro, campanhas, e-mails, executive
- [x] Auth local + rotas Google OAuth (esqueleto)
- [x] Build passando

### Integrações
- [x] API contatos compatível com iPhone Shortcuts
- [x] Ponte Apps Script (`api_bridge.js`) — e-mails via Gmail + CC
- [x] Webhook entregas (`POST /api/entregas/webhook`) — com validação de secret
- [x] Encaminhamento Forms → app (`ENTREGAS_forwardToSuperGestao_`)
- [x] Edição completa de parcerias (modal)
- [x] Export CSV no painel chefe
- [x] Templates HTML + motor de e-mails

### Design + Views Notion
- [x] Design tokens, App shell, seletor OAB/ECJ
- [x] Views Notion em Contatos, Parcerias, Entregas, Financeiro
- [x] Toolbar: busca, filtro, ordenação, kanban

### Deploy produção
- [x] **Vercel:** https://est-super-gestao.vercel.app
- [x] **Turso:** `super-gestao` com dados importados
- [x] **Local = Turso** (mesmo banco que a web)
- [x] Env vars na Vercel (DB, secrets, financeiro, bridge)
- [x] `npm run verify` — testa conexão ao banco
- [x] `docs/13-producao.md` — referência de URLs

## Pendente (opcional)

- [ ] **Web App Apps Script** — se POST retornar 404, redeploy manual (ver `docs/13-producao.md`)
- [ ] Google OAuth em produção
- [ ] Trocar senhas admin/chefe em produção
- [ ] Dark mode

## Comandos

```bash
cd "/Users/alefgomes/Dev/estrategia/est-super-gestao"
npm run dev      # local → Turso (mesmo banco da web)
npm run verify
npm run build
```
