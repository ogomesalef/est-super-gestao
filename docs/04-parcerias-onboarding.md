# Parcerias e onboarding

## Abas

- `Respostas OAB`, `Respostas ECJ` — candidaturas via Google Forms
- `BASE ATIVOS OAB`, `BASE ATIVOS ECJ` — snapshot de ativos

## Campos do Forms

Nome, e-mail, WhatsApp, Instagram, TikTok, YouTube, aluno Estratégia, formatos, frequência.

## Colunas operacionais (Respostas)

Status, datas início/fim, modalidade, valor proposta, metas por rede, OBS, Ação, Gmail Thread ID, curso liberado, etc.

## Fluxo de status

```
Pendente → Proposta → Ativo
                  → Reprovado
Ativo → Inativo (data fim)
```

## Ações de e-mail (`emails.js`)

Disparadas pela coluna `Ação` em Respostas:

| Ação | Template |
|------|----------|
| Enviar proposta (Assinatura + Cupom) | email_proposta_assinatura.html |
| Enviar proposta (Remuneração) | email_proposta_remuneracao.html |
| Enviar próximos passos | email_proximos_passos_assinatura.html |
| Enviar formalização (Assinatura) | email_formalizacao_assinatura.html |
| Enviar formalização (Remuneração) | email_formalizacao_remuneracao.html |
| Enviar reprovação | email_reprovacao.html |

**From:** `embaixadores.oab@estrategia.com` ou `embaixadores.ecj@estrategia.com`

## Sync mensal (`V4_syncControleHistorico_`)

Ao ativar embaixador, cria linhas em CONTROLE e FINANCEIRO para cada mês desde data início até mês atual.

## No app

- `/parcerias` — kanban/tabela por status
- Encerrar parceria = data fim + status Inativo
- Sync mensal via botão ou automático ao ativar

## Webhook de candidaturas (Forms → app)

**POST** `{APP_URL}/api/candidaturas/webhook` com JSON:

```json
{
  "secret": "<CANDIDATURAS_WEBHOOK_SECRET ou WEBHOOK_SECRET>",
  "program": "OAB",
  "fullName": "Maria Silva",
  "email": "maria@email.com",
  "whatsapp": "11999999999",
  "instagram": "@mariaadv",
  "tiktok": "@mariaadv",
  "youtube": ""
}
```

Comportamento:
- Cria ou atualiza `Ambassador` com `status: Pendente`, `needsReview: true`, `source: formulario`
- Vincula `Contact` existente com o mesmo `@instagram` (status `Interessado`)
- Retorna `{ ok, ambassadorId, created, linkedContactId }`

### Apps Script (`onFormSubmit`)

```javascript
function onFormSubmit(e) {
  var responses = e.namedValues;
  var url = "https://SEU-DOMINIO/api/candidaturas/webhook";
  UrlFetchApp.fetch(url, {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify({
      secret: PropertiesService.getScriptProperties().getProperty("WEBHOOK_SECRET"),
      program: "OAB", // ou ECJ conforme o form
      fullName: responses["Seu nome completo"][0],
      email: responses["Seu e-mail"][0],
      whatsapp: responses["WhatsApp com DDD"][0],
      instagram: responses["Seu Instagram (@)"][0],
      tiktok: responses["Seu TikTok (@)"][0] || "",
      youtube: responses["Seu YouTube"][0] || ""
    }),
    muteHttpExceptions: true
  });
}
```

Import xlsx (`npm run import:xlsx`) continua como fallback para abas `Respostas OAB` / `Respostas ECJ`.
