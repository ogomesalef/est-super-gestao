# Integrações Google

## Drive

| ID | Uso |
|----|-----|
| `1IjzxmHQi_T6z7Hgvu93w8Z1brFrk_v-C` | Entregas, comprovantes, campanhas |
| `1dSGeahfd6eyA3FBKN7L_BbwK-bxYY8Vp` | Termos financeiros |

Conta com acesso Drive (est-artes): `cx@estrategiavestibulares.com.br`

Padrão de upload: ver `est-artes/scripts/upload_drive.py` e `credentials.json`.

## Forms

| Form | ID / URL |
|------|----------|
| Entregas | `1FAIpQLScAfuntqtprs_jMG-WaxdIu-k4_9z_BGjKYxKV5rXaC6mUCcg` |
| Financeiro/Jurídico | `1FAIpQLSdDOLhSNxsbHjgTCjhjovomWhFgu1nynhf1PSoZ7PIN-Z2ISw` |
| Cupom OAB | Typeform embaixadoresoab |
| Cupom ECJ | forms.gle |

## Gmail

Aliases de envio:
- OAB: `embaixadores.oab@estrategia.com`
- ECJ: `embaixadores.ecj@estrategia.com`

Financeiro interno: `alefgomesandre+financeiro@gmail.com` (CC chefe)

## Apps Script Web App

- Contatos: `doPost` em `api_contatos.js`
- Bridge futuro: `sendEmail`, `syncDrive`, `recalcDeliveries`

Script ID: `1MhAX_2z7iSutJc4VjtOTnzRm2aZpuAv_2Fv_umfzWxB5g5prpxh794-f`

## Triggers legados

| Trigger | Handler |
|---------|---------|
| onEdit | V4_ONEDIT |
| Diário 6h | V4_DAILY |
| Form submit | onFormSubmit |

## Variáveis de ambiente do app

```env
DATABASE_URL="file:./super_gestao.db"
AUTH_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
APPS_SCRIPT_BRIDGE_URL=
APPS_SCRIPT_SECRET=
DRIVE_ROOT_ENTREGAS_ID=
DRIVE_ROOT_TERMOS_ID=
DRIVE_ROOT_COLLAB_ID=1AldzAn7qVJL7ZHkgiP7RkTI5CVWTYU48
```
