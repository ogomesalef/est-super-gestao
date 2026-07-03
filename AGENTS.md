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

