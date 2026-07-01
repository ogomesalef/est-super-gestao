# Contatos e pipeline

## Arquivo Apps Script

`pipeline.js`, `api_contatos.js`

## Aba CONTATOS

Colunas esperadas pelo script (podem variar na exportação):

- ID, DATA PROSPECÇÃO, ORIGEM DO CONTATO, INDICADO POR
- VERTICAL (SUGESTÃO), INSTAGRAM (@), LINK IG, TIKTOK (@), LINK TIKTOK
- STATUS CAPTAÇÃO, datas de mudança, OBS / HISTÓRICO

## Comportamento automático (`PIPE_onEdit`)

Ao digitar Instagram/TikTok:
- Normaliza @ minúsculo
- Gera ID sequencial
- Preenche DATA PROSPECÇÃO e status `Novo`
- Gera links IG/TikTok

Ao mudar STATUS CAPTAÇÃO:
- Atualiza DATA MUDANÇA STATUS

## API Web (`api_contatos.js`)

**POST** no Web App com JSON:

```json
{
  "secret": "<token>",
  "type": "instagram",
  "vertical": "OAB",
  "handle": "@usuario",
  "obs": "opcional"
}
```

Cria linha com origem `Prospecção própria`, status `Novo`.

## No app

- CRUD completo em `/contatos`
- API `POST /api/contatos` compatível com o payload acima
- Filtros: vertical, status, busca por @
- Ação: promover a candidato → cria Ambassador com status `Pendente`
