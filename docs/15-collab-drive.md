# Collab — Vídeos de referência (Drive)

## Pasta raiz

ID: `1AldzAn7qVJL7ZHkgiP7RkTI5CVWTYU48` (`DRIVE_ROOT_COLLAB_ID`)

O app **não renomeia** mais a pasta raiz — use o nome que preferir no Drive.

## Estrutura por campanha

```
Collabs (raiz)
  └── SNCJ 2026/                    ← nome editável no app ("Pasta no Drive")
        ├── _INBOX
        ├── 00 Referência           ← vídeo base (se não bater com embaixador)
        ├── ECJ — Matheus (@faverimatheus.adv)/
        ├── OAB — Amanda (@magisnameta)/
        └── …
```

## Nome dos vídeos (após organizar)

Embaixador:

`Collab — SNCJ 2026 — Matheus de Faveri Franco (@faverimatheus.adv).mp4`

Referência geral:

`Referência — SNCJ 2026.mp4`

## Fluxo

1. Configure collab + embaixadores + **Pasta no Drive** (ex. `SNCJ 2026`)
2. Coloque vídeos soltos na pasta da campanha **ou** cole o link do Drive no campo vídeo
3. **Salvar** → app cria pastas e move/renomeia automaticamente
4. Match por `@instagram` ou partes do nome no arquivo

## No app

- `/campanhas/[id]` → bloco collab → campo **Pasta no Drive**
- Migration: `npm run db:migrate-campaign-collab-folder-name`
