# Modelo de dados

## Entidades do app (`est-super-gestao`)

### Contact
CRM de prospecção. Origem: aba `CONTATOS`.

### Ambassador
Embaixador (ativo ou histórico). Origem: `BASE ATIVOS OAB/ECJ` + `Respostas OAB/ECJ`.

### Partnership
Dados da parceria: modalidade, metas, curso, cupom, valor, datas.

### MonthlyControl
Controle de entregas por mês. Origem: `CONTROLE ENTREGAS`.

### MonthlyFinance
Pagamentos por mês. Origem: `FINANCEIRO`.

### Delivery
Entrega individual (print). Origem: `ENTREGAS`.

### Campaign
Campanha de divulgação. Origem: `CAMPANHAS`.

### EmailLog
Histórico de e-mails enviados (thread Gmail).

## Mapeamento aba → tabela

| Aba planilha | Tabela app |
|--------------|------------|
| CONTATOS | Contact |
| Respostas OAB / ECJ | Ambassador + Partnership (candidatura) |
| BASE ATIVOS OAB / ECJ | Ambassador + Partnership |
| CONTROLE ENTREGAS | MonthlyControl |
| FINANCEIRO | MonthlyFinance |
| ENTREGAS | Delivery |
| CAMPANHAS | Campaign |

## Enums importantes

### Status captação (Contact)
`Novo`, `Em contato`, `Aguardando resposta`, `Interessado`, `Não interessado`, etc.

### Status parceria (Ambassador)
`Pendente`, `Proposta`, `Ativo`, `Inativo`, `Reprovado`

### Modalidade
`Assinatura + Cupom`, `Remuneração`

### Status pagamento (MonthlyFinance)
`Pendente` → `Fechamento enviado` → `Aguardando termo assinado` → `Termo recebido` → `Aguardando Form Financeiro` → `Pronto para enviar ao Financeiro` → `Solicitado ao Financeiro` → `Pagamento confirmado ao embaixador` → `Pago`

## Índices únicos

- `MonthlyControl`: `(ambassadorId, monthRef)`
- `MonthlyFinance`: `(ambassadorId, monthRef)`
- `Ambassador`: `(program, instagram)` quando ativo

## Divergências planilha vs código

A exportação xlsx da aba CONTATOS usa colunas diferentes do Apps Script:

| Planilha exportada | Apps Script |
|--------------------|-------------|
| VERTICAL | VERTICAL (SUGESTÃO) |
| STATUS PIPELINE | STATUS CAPTAÇÃO |
| OBSERVAÇÕES | OBS / HISTÓRICO |
| CONTATADO POR | INDICADO POR |

O import normaliza esses nomes.
