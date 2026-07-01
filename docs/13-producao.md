# Produção — referência rápida

## URLs

| Serviço | URL |
|---------|-----|
| **App** | https://est-super-gestao.vercel.app |
| **Login** | https://est-super-gestao.vercel.app/login |
| **Webhook entregas** | https://est-super-gestao.vercel.app/api/entregas/webhook |
| **API contatos** | https://est-super-gestao.vercel.app/api/contatos |
| **Apps Script bridge** | `https://script.google.com/macros/s/AKfycbzVIfLKSdQFtMrIG4R0l-_JHsN3JwUy14VO-c7s8BUpwCrklXak6rVxddnkKaNLfZen/exec` |
| **Turso dashboard** | https://turso.tech/app |

## Banco (compartilhado local + web)

- **Turso:** `super-gestao` (ogomesalef)
- Local e Vercel usam o **mesmo** `DATABASE_URL` + `DATABASE_AUTH_TOKEN` no `.env`

```bash
npm run verify   # testa conexão e contagens
```

## Login

| Papel | E-mail | Senha (padrão) |
|-------|--------|----------------|
| Admin | `admin@local` | `admin123` |
| Chefe | `chefe@local` | `chefe123` |

## Apps Script — propriedades

No projeto **super embaixadores** (Script Properties):

```
SUPER_GESTAO_WEBHOOK_URL = https://est-super-gestao.vercel.app/api/entregas/webhook
```

Secret do webhook = mesmo `API.SECRET` em `api_contatos.js`.

## Web App (e-mails + contatos) — IMPORTANTE

O erro `Rascunho: <!DOCTYPE html>...` significa que o **deploy está restrito** e a Vercel não consegue chamar o script (HTTP 401).

### Corrigir (2 minutos)

1. Abra o [Apps Script — super embaixadores](https://script.google.com/home/projects/1MhAX_2z7iSutJc4VjtOTnzRm2aZpuAv_2Fv_umfzWxB5g5prpxh794-f/edit)
2. **Implantar** → **Gerenciar implantações**
3. Edite a implantação do Web App (ícone lápis)
4. Configure:
   - **Executar como:** Eu
   - **Quem tem acesso:** **Qualquer pessoa** ← obrigatório para Vercel
5. **Implantar** e copie a nova URL `/exec`
6. Atualize `APPS_SCRIPT_BRIDGE_URL` no `.env` e na Vercel

### URL atual

```
https://script.google.com/macros/s/AKfycbzVIfLKSdQFtMrIG4R0l-_JHsN3JwUy14VO-c7s8BUpwCrklXak6rVxddnkKaNLfZen/exec
```

### Testar

```bash
npm run test:bridge
# deve imprimir: OK — bridge respondeu
```

## Comandos úteis

```bash
cd est-super-gestao
npm run dev          # local → mesmo banco Turso
npm run verify
npx vercel --prod    # redeploy
```

## Pendente (opcional)

- [ ] Google OAuth em produção (`GOOGLE_CLIENT_ID` / `SECRET`)
- [ ] Trocar senhas admin/chefe em produção
- [ ] Confirmar Web App Apps Script respondendo (ping `action: ping`)
