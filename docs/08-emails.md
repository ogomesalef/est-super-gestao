# E-mails

## Dois sistemas de templates

### 1. Apps Script (`super embaixadores/email_*.html`)

Templates com placeholders `{{firstName}}`, `{{cursoNome}}`, etc.

Usados por `emails.js` e `financeiro_emails.js` via Gmail API.

### 2. est-supers (`est-supers/`)

HTML rico por candidato + regras em Markdown:

| Passo | Pasta | Uso |
|-------|-------|-----|
| Proposta | `proposta/` | Convite com produto, comissão, entregas |
| Formalização | `formalizacao/` | Curso liberado + cupom ativo |
| Campanha | `campanhas/` | Divulgação de evento |

Regras: `regras-gerais/regras-gerais.md`, `regras-proposta.md`, etc.

## Cores por vertical

| Vertical | Cor | Handle |
|----------|-----|--------|
| OAB | #6B0A09 | @estrategiaoab |
| ECJ | #D08C00 | @estrategiacarreirajuridica |

## Comissão (proposta est-supers)

- 20% até R$ 10.000/mês
- 15% acima

## Gmail Thread ID

Persistido na planilha para manter conversa. O app deve guardar em `EmailLog` e `MonthlyFinance.gmailThreadId`.

## No app

- `/emails` — gerador com preview
- Config importada de est-supers
- Envio via bridge Apps Script → depois Gmail API direto

## Links a alinhar

- Cupom ECJ: est-supers usa `forms.gle/FkUgVntiSHN47pti9`; Apps Script usa `forms.gle/wK3AxRsWy2YAZgFk7`
