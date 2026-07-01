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
