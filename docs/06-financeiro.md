# Financeiro

## Arquivos

`financeiro.js`, `financeiro_v4.gs.js`, `financeiro_emails.js`, `termo financeiro.js`

## Aba FINANCEIRO

Uma linha por embaixador **Remuneração** + **Ativo** por mês.

### Colunas principais

MÊS REFERÊNCIA, STATUS PAGAMENTO, NOME, PROGRAMA, INSTAGRAM, % ENTREGAS, VALOR ACORDADO, VALOR A PAGAR, LINK TERMO, TERMO ASSINADO?, datas, FORM FINANCEIRO OK?, PGTO ENVIADO?, Gmail Thread ID, AÇÃO, LOG

### Cálculo

```
VALOR A PAGAR = VALOR ACORDADO × min(% ENTREGAS, 100%)
```

`VALOR ACORDADO TRAVADO?` impede sync de sobrescrever valor.

## Ações (coluna AÇÃO)

| Ação | E-mail |
|------|--------|
| Enviar fechamento do mês | email_fin_fechamento_mes.html |
| Enviar lembrete do termo | email_fin_lembrete_termo.html |
| Cobrar Form Financeiro | email_fin_cobrar_form_financeiro.html |
| Enviar solicitação ao Financeiro | email_fin_solicitacao_financeiro.html (interno) |
| Avisar pagamento solicitado | email_fin_aviso_pagamento_solicitado.html |
| Marcar como Pago | sem e-mail |
| Bloquear / Desbloquear | sem e-mail |

## Termos no Drive

Root: `1dSGeahfd6eyA3FBKN7L_BbwK-bxYY8Vp`

`FIN_ANEXAR_TERMO_NOVO` — anexa PDF assinado na linha selecionada.

## No app

- `/financeiro` — grid mensal com filtros
- Botões de ação (substituem dropdown AÇÃO)
- Bridge Apps Script para envio Gmail inicialmente
- Anexar termo via upload → Drive
