# Campanhas e Drive

## Arquivo

`campanhas.js`

## Aba CAMPANHAS

| Coluna | Descrição |
|--------|-----------|
| NOME | Nome da campanha (ex: Semana Nacional dos Concursos) |
| STATUS | Ativa / Inativa |
| LINK PASTA | URL da pasta no Drive |

## Drive

```
ROOT (1IjzxmHQi_T6z7Hgvu93w8Z1brFrk_v-C)
  └── _CAMPANHAS
        └── {nome da campanha}
              └── cópias dos prints das entregas
```

## Form de entregas

Pergunta: `Esta entrega faz parte de alguma campanha?`

Opções sincronizadas via `CAM_SYNC_FORM_CHOICES` a partir de campanhas ativas + `Não se aplica / Nenhuma campanha`.

Form edit ID salvo em Script Property `CAM_FORM_EDIT_ID`.

## Fluxo

1. Cadastrar campanha ativa → cria pasta
2. Embaixador seleciona campanha no Form
3. Script organiza print na pasta do embaixador + copia para pasta da campanha
4. Coluna `Campanha Drive status` na aba ENTREGAS

## No app

- `/campanhas` — CRUD
- Ao ativar: registrar pasta Drive (manual ou API futura)
- Broadcast: gerar e-mail est-supers para ativos
