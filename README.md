# Super Embaixadores — Gestão

App local de gestão do programa Super Embaixadores (OAB + ECJ), substituindo a planilha Google Sheets.

## Stack

- Next.js 16 + TypeScript + Tailwind
- SQLite + Prisma
- Auth local (dev) + Google OAuth (produção)

## Início rápido

```bash
cd est-super-gestao
cp .env.example .env   # depois cole DATABASE_AUTH_TOKEN do Turso
npm install
npm run verify         # testa conexão ao Turso
npm run dev
```

Abra http://localhost:3000 — **mesmo banco** que https://est-super-gestao.vercel.app

**Login padrão:**
- Admin: `admin@local` / `admin123`
- Chefe: `chefe@local` / `chefe123`

## Módulos

| Rota | Função |
|------|--------|
| `/` | Dashboard |
| `/contatos` | CRM de prospecção |
| `/parcerias` | Embaixadores e status |
| `/entregas` | Metas vs entregas do mês |
| `/financeiro` | Pagamentos e ações |
| `/campanhas` | Campanhas de divulgação |
| `/emails` | Gerador de e-mails |
| `/executive` | Painel da chefe |

## API compatível com iPhone Shortcuts

`POST /api/contatos` com mesmo payload do Apps Script `api_contatos.js`.

## Documentação

Ver pasta `docs/` (13 arquivos). Produção: `docs/13-producao.md`

## Integrações

- Apps Script bridge para e-mails: `APPS_SCRIPT_BRIDGE_URL`
- Google OAuth: `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET`
- Deploy: `docs/11-deploy-gratis.md`

## Projetos relacionados

- `est-appscript/super embaixadores/` — lógica legada
- `est-supers/` — templates de e-mail ricos
