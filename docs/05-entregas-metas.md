# Entregas e metas

## Arquivos

`forms entregas.js`, `controle_entregas_calc.js`

## Abas

- `ENTREGAS` — cada submissão do Form de entregas
- `CONTROLE ENTREGAS` — agregado mensal por embaixador

## Form de entregas

Campos: Programa, Instagram, tipo de entrega, data, prints, campanha opcional.

Tipos: Feed/Reels, Stories, TikTok, YouTube (link apenas).

## Organização Drive

```
ROOT (1IjzxmHQi_T6z7Hgvu93w8Z1brFrk_v-C)
  └── yyyy-MM
        └── yyyy-MM | PROGRAMA | NOME | @ig
              └── yyyy-MM-dd | PROGRAMA | NOME | @ig | Tipo
```

## Cálculo CONTROLE (`CTRL_RECALCULAR_CONTROLE_ENTREGAS`)

Por mês + programa + @ig:

- Conta entregas por tipo (Feed/Reels, Stories, TikTok, YouTube)
- Compara com metas
- Status por formato: OK / Pendente
- `% ENTREGAS` = média proporcional das metas

## Flag META TRAVADA?

Se `true`, sync não sobrescreve metas vindas de Respostas.

## No app

- `/entregas` — painel do mês: quem entregou / quem não
- Drill-down por embaixador
- Campo observações por mês
- Webhook futuro: Form → API do app
