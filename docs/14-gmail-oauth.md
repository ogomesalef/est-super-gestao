# E-mail via Gmail API (conta cx@)

Alternativa ao Apps Script Web App: o app envia e-mail **direto pela Gmail API**, autenticado como `cx@estrategiavestibulares.com.br`, usando os aliases:

- OAB: `embaixadores.oab@estrategia.com`
- ECJ: `embaixadores.ecj@estrategia.com`

## Pré-requisitos (Google Cloud — uma vez)

1. [Google Cloud Console](https://console.cloud.google.com/) → mesmo projeto do OAuth (ou novo)
2. **APIs e serviços** → **Biblioteca** → ativar **Gmail API**
3. **Credenciais** → OAuth 2.0 Client ID (tipo **Aplicativo da Web**)
4. **URIs de redirecionamento autorizados:**
   - `http://localhost:3000/api/gmail/callback`
   - `https://est-super-gestao.vercel.app/api/gmail/callback`
5. Copie `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` para `.env` e Vercel

## Conectar conta cx@ (uma vez)

1. No app, abra **E-mails**
2. Clique **Conectar Gmail (cx@)**
3. Faça login com **cx@estrategiavestibulares.com.br** e autorize
4. Copie o `GMAIL_REFRESH_TOKEN` exibido para:
   - `.env` local
   - Vercel → Environment Variables

## Variáveis

```env
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
GMAIL_REFRESH_TOKEN="..."          # após conectar
GMAIL_SENDER_EMAIL="cx@estrategiavestibulares.com.br"
GMAIL_FROM_OAB="embaixadores.oab@estrategia.com"
GMAIL_FROM_ECJ="embaixadores.ecj@estrategia.com"
```

## Testar

```bash
npm run test:gmail -- seu-email@gmail.com
```

## Aliases no Gmail

A conta **cx@** precisa ter os aliases OAB/ECJ configurados em Gmail → Configurações → Contas → **Enviar e-mail como**. O app usa esses endereços no campo `From:`.

## Prioridade de envio

1. **Gmail API** — se `GMAIL_REFRESH_TOKEN` estiver definido  
2. **Apps Script bridge** — fallback (se configurado)

Não é necessário acessar implantações do Apps Script para enviar e-mails.
