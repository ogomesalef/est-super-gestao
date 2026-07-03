<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Cursor Cloud — instruções

Ambiente definido em `.cursor/environment.json`. Secrets vêm da aba **Cloud Agents → Secrets** (não commitar `.env`).

Comandos úteis no cloud:
- `npm run validate:respostas` — valida sync Respostas + Turso
- `npm run sync:respostas -- --full` — reimporta planilha Google Forms
- `npm run db:migrate-respostas-sync` — colunas de candidatura no Turso
- `npm run dev` — app em `:3000`

Para operar parcerias/candidaturas, o agent precisa de `DATABASE_*`, `GMAIL_REFRESH_TOKEN`, `GOOGLE_CLIENT_*` e `WEBHOOK_SECRET`/`APPS_SCRIPT_SECRET` nos secrets do environment.

### Notas de setup (para agents futuros)

- **Banco compartilhado**: `DATABASE_URL` aponta para o Turso de **produção** (mesmo banco do app na Vercel, `libsql://...`). Leituras são seguras; **evite writes destrutivos em testes** (criar/editar/apagar registros afeta produção). `npm run verify` confirma a conexão.
- **Prisma exige `DATABASE_URL` no ambiente do processo**: o dev server (`next dev`) falha com `Environment variable not found: DATABASE_URL` se iniciado por um shell que não herdou os secrets injetados. Ao rodar via `tmux` (ou qualquer shell detached), inicie o servidor tmux a partir de um shell que já tenha os secrets (ou `kill-server` e recrie), senão o `PrismaClient` não inicializa mesmo usando o adapter libsql.
- **Login local**: as credenciais padrão (admin e executive) estão no `README.md`. Os usuários são criados automaticamente no primeiro login via `ensureDefaultUsers()`; podem ser sobrescritos pelos secrets `ADMIN_EMAIL`/`ADMIN_PASSWORD`/`EXECUTIVE_EMAIL`/`EXECUTIVE_PASSWORD`.
- **Lint**: `npm run lint` reporta erros pré-existentes (regras `react-hooks/set-state-in-effect` do Next 16). Não bloqueiam `npm run dev`.

