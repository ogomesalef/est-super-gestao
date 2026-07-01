# Migração da planilha

## Arquivo fonte

`/Users/alefgomes/Downloads/Estratégia/SUPER EMBAIXADORES ECJ + OAB.xlsx`

## Abas importadas

| Aba | Destino |
|-----|---------|
| CONTATOS | Contact |
| BASE ATIVOS OAB | Ambassador + Partnership |
| BASE ATIVOS ECJ | Ambassador + Partnership |
| Respostas OAB | Ambassador (candidatura) |
| Respostas ECJ | Ambassador (candidatura) |
| CONTROLE ENTREGAS | MonthlyControl |
| FINANCEIRO | MonthlyFinance |
| ENTREGAS | Delivery |
| CAMPANHAS | Campaign |

Abas legado ignoradas: `* old`, `MASTER`, `EMBAIXADORES *`, `SUPER EMBAIXADORES *`, `PRESTAÇÃO DE CONTAS ECJ`.

## Script

```bash
npm run import:xlsx -- "/caminho/para/planilha.xlsx"
```

Arquivo: `scripts/import-xlsx.ts`

## Normalizações

### Instagram
- Sempre `@` minúsculo
- Remove espaços

### Mês referência
- Formatos aceitos: `2026-06`, `jun/2026`, Date object

### CONTATOS
| Coluna xlsx | Campo app |
|-------------|-----------|
| VERTICAL | vertical |
| STATUS PIPELINE | status |
| OBSERVAÇÕES | notes |
| CONTATADO POR | contactedBy |

### Booleanos planilha
`TRUE`/`FALSE`, `Sim`/`Não`, checkbox → boolean

## Pós-import

1. Validar contagem por aba no log do script
2. Conferir amostra de 5 embaixadores ativos
3. Planilha fica **read-only** (não mais fonte de verdade)
4. Data de corte registrada em `app_settings.migration_date`

## Reimport

Apagar `super_gestao.db` e rodar import novamente. Não há sync bidirecional.
