# Validação manual — Super Gestão vs planilha

Use este checklist após `npm run import:xlsx` para garantir que o app reflete a planilha legada.

## Pré-requisitos

```bash
cd "/Users/alefgomes/Dev/estrategia/est-super-gestao"
npm run dev
# Login: admin@local / admin123
```

## Contagens por módulo

| Módulo | O que comparar | Planilha (aba) |
|--------|----------------|----------------|
| Contatos | Total por vertical OAB/ECJ | Contatos OAB / Contatos ECJ |
| Parcerias | Ativos + Proposta + Pendente | Embaixadores |
| Entregas | Linhas do mês atual | Controle mensal |
| Financeiro | Linhas do mês + status | Financeiro |
| Campanhas | Campanhas ativas | Campanhas |

## Views Notion (smoke test)

Para cada módulo com views (**Contatos, Parcerias, Entregas, Financeiro**):

- [ ] Alternar abas (Pipeline, Tabela, Cards…)
- [ ] Criar nova view com **+** e renomear
- [ ] Busca filtra em tempo real
- [ ] Filtro por status funciona
- [ ] Ordenação + direção (seta) altera ordem
- [ ] Agrupar por status / vertical muda os grupos
- [ ] Kanban: arrastar card atualiza status (Parcerias, Contatos, Financeiro)

## Integrações

- [ ] Bridge Apps Script: enviar e-mail de teste em `/emails`
- [ ] Webhook entregas: `POST /api/entregas/webhook` com secret
- [ ] API contatos (Shortcuts): `POST /api/contatos` com secret

## Config produção

Ver `.env.example` e `docs/11-deploy-gratis.md`:

- `APPS_SCRIPT_BRIDGE_URL`, `APPS_SCRIPT_SECRET`, `WEBHOOK_SECRET`
- `FINANCE_TEAM_EMAIL`, `FINANCE_CC_EMAIL`
- Apps Script: `SUPER_GESTAO_WEBHOOK_URL`

## Deploy (quando validado)

```bash
turso db create super-gestao
# DATABASE_URL na Vercel
vercel --prod
```

## Divergências conhecidas

- Views salvas ficam no **localStorage** do navegador (não sincronizam entre dispositivos).
- Entregas: kanban é visual; status vem do webhook/forms (não arrasta).
- Financeiro: arrastar no kanban altera `paymentStatus` direto (sem ação de e-mail).
