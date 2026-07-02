/** Textos base SNCJ 2026 — reutilizados nos pedidos de vídeo. */

export type CampaignMaterial = {
  title: string;
  url: string;
  description: string;
};

export type CampaignBrief = {
  name: string;
  shortName: string;
  program: "OAB" | "ECJ";
  tagline: string;
  lede: string;
  description: string;
  highlights: string[];
  careers?: string[];
  materials: CampaignMaterial[];
};

export const SNCJ_CAMPAIGN_BRIEF = {
  name: "Semana Nacional dos Concursos Jurídicos 2026",
  shortName: "SNCJ 2026",
  program: "ECJ" as const,
  tagline: "De espectador a protagonista.",
  lede:
    "A maior entrega gratuita do ano para concurseiros jurídicos: maratona + competição nacional com a Liga, plano de estudos personalizado e lives com quiz ao vivo.",
  description: `A **Semana Nacional dos Concursos Jurídicos 2026** transforma a maior maratona gratuita de concursos jurídicos em uma **arena de competição**: o aluno deixa de ser espectador e passa a participar ativamente.

**Os maiores juristas do país** + a preparação gratuita que faz você **sair da plateia e estudar de verdade, todos os dias**, para delegado, promotor, cartórios, magistratura, procuradorias e defensorias.

### O que torna 2026 diferente

- **Liga dos Concursos Jurídicos** — missões diárias, ranking por carreira e Simulado Nacional como grande final
- **Plano de estudos personalizado** — formulário de nivelamento + cronograma sob medida para a sua carreira
- **Masterclasses gratuitas** — conteúdo com os maiores nomes do Direito
- **Quiz ao vivo** durante as transmissões

### Carreiras atendidas

Delegado · Promotor · Cartórios · Magistratura · Procuradorias · Defensorias`,
  highlights: [
    "Liga dos Concursos Jurídicos — missões diárias, ranking e Simulado Nacional",
    "Plano de estudos personalizado por carreira",
    "Masterclasses com os maiores juristas do país",
    "Quiz ao vivo durante as transmissões",
  ],
  careers: ["Delegado", "Promotor", "Cartórios", "Magistratura", "Procuradorias", "Defensorias"],
  materials: [
    {
      title: "Página oficial SNCJ 2026",
      url: "https://mkt.estrategia.com/cj/semana-nacional-dos-concursos-juridicos-2026/",
      description: "Landing page da campanha com inscrição e detalhes oficiais.",
    },
    {
      title: "Documento completo SNCJ 2026",
      url: "/materiais/sncj-2026.html",
      description: "Briefing analítico com todos os detalhes da campanha — abre direto no navegador.",
    },
  ] satisfies CampaignMaterial[],
} satisfies CampaignBrief;

export const OAB47_CAMPAIGN_BRIEF = {
  name: "OAB 47 para Desesperados",
  shortName: "OAB 47",
  program: "OAB" as const,
  tagline: "O plano na medida para você ser aprovado.",
  lede: "Preparação gratuita na reta final — cronograma e ebook do que mais cai, só se inscrever.",
  description: `O **OAB 47 para Desesperados** é a preparação gratuita do Estratégia OAB para quem quer encarar o **último exame do ano** com método — sem improviso, sem material solto, sem correria desorganizada.

No seu vídeo, você apresenta a proposta de forma natural e ajuda quem está na reta final da OAB 47.`,
  highlights: [
    "Cronograma de estudos na medida certa",
    "Ebook do que mais cai liberado",
    "Inscrição gratuita — é só se cadastrar",
    "Foco no último exame do ano",
  ],
  materials: [],
} satisfies CampaignBrief;

export type BriefingKind = "sncj" | "oab47" | "generic";

export function resolveBriefingKind(campaignName: string, program: string | null): BriefingKind {
  const name = campaignName.toLowerCase();
  if (name.includes("semana nacional")) return "sncj";
  if (name.includes("desesperados")) return "oab47";
  return program === "OAB" ? "oab47" : "generic";
}

export function getCampaignBrief(campaignName: string, program: string | null): CampaignBrief {
  const kind = resolveBriefingKind(campaignName, program);
  if (kind === "sncj") return SNCJ_CAMPAIGN_BRIEF;
  if (kind === "oab47") return OAB47_CAMPAIGN_BRIEF;
  return {
    name: campaignName,
    shortName: campaignName,
    program: program === "OAB" ? "OAB" : "ECJ",
    tagline: "",
    lede: "",
    description: "",
    highlights: [],
    materials: [],
  };
}

export function collabScriptMarkdown(): string {
  return `## Sobre a campanha

A **SNCJ 2026** transforma a maior maratona gratuita de concursos jurídicos em uma **arena de competição**: o aluno deixa de ser espectador e passa a participar ativamente.

### Mensagem principal

> Os maiores juristas do país + a preparação gratuita que faz você **sair da plateia e estudar de verdade, todos os dias**, para as seis carreiras jurídicas.

### O que destacar no vídeo

1. **A virada** — não é só mais um evento para assistir; é competição, hábito e evolução
2. **A Liga** — missões diárias, ranking por carreira, Simulado Nacional como grande final
3. **Plano personalizado** — formulário de nivelamento + cronograma sob medida
4. **Gratuito e de alto valor** — masterclasses, atualização jurisprudencial, 20 questões mais cobradas

### Sugestão de estrutura (Reels / TikTok)

- **Gancho (3s):** pergunta ou afirmação forte sobre concursos jurídicos
- **Contexto (10s):** o que é a SNCJ e por que é diferente em 2026
- **Destaque (15s):** um motor que mais combina com seu público (Liga, plano ou live)
- **CTA (5s):** convite para se inscrever / link na bio / comentário fixado

### Tom

Autêntico, no seu estilo. Pode ser mais motivacional, mais técnico ou mais storytelling — o importante é transmitir **entusiasmo real** com a proposta da Semana.

### Evitar

- Prometer aprovação ou resultado garantido
- Comparar negativamente concorrentes
- Ler o roteiro como teleprompter (prefira naturalidade)`;
}

export function promoScriptMarkdown(): string {
  return `## Pedido — Reels promocional SNCJ 2026

Queremos um **novo vídeo curto** (Reels / TikTok) focado em **divulgar a Semana** e puxar audiência para a inscrição.

### Objetivo

Gerar curiosidade e cliques: mostrar que a SNCJ 2026 não é "mais uma semana de aulas", e sim uma **experiência gamificada** com Liga, prêmios e Simulado Nacional.

### Roteiro sugerido

**Abertura**
- "Se você tá na reta final de concurso jurídico, para tudo."
- Ou: "A Semana Nacional dos Concursos Jurídicos voltou — e esse ano mudou o jogo."

**Meio**
- Mencione **1 ou 2** destes pontos (não precisa de todos):
  - Competição nacional por carreira (Liga)
  - Missões diárias + ranking
  - Plano de estudos personalizado gratuito
  - Simulado Nacional como grande final
  - Conteúdo com grandes nomes do Direito

**Fechamento**
- CTA claro: "Link na bio" / "Comenta SNCJ que te mando" / "Corre se inscrever"

### Formato

- Vertical 9:16
- 30–60 segundos
- Legendas recomendadas (muita gente assiste no mudo)
- Pode usar cortes rápidos, texto na tela, B-roll de estudo

### Prazo

Envie o vídeo bruto pela pasta abaixo. Depois avaliamos para possível repost ou collab no perfil oficial do ECJ.`;
}

/** Roteiro promo — Amanda (magisnameta), texto do briefing. */
export function amandaPromoScriptMarkdown(): string {
  return `### Entrega

* 1 Reels

### Referência

https://www.instagram.com/p/DWWnvH4xbhm/

### O que fazer

fazer um vídeo com takes de quando foi para o estratégia, contando da experiência e os diferenciais do curso.

### CTA

Incluir o CTA que o **Estratégia Carreira Jurídica** está com promoção com mais de três mil reais de desconto em materiais completos para concursos de todas as áreas. Acesso estendido e acompanhamento personalizado pra você não ficar perdido em nenhum momento.`;
}

/** Roteiro promo — Camila (vou.serjuiza), texto do briefing. */
export function camilaPromoScriptMarkdown(): string {
  return `### Entrega

* 1 Reels

### Referência

https://www.tiktok.com/@vouserjuiza/video/7610515253142523157

### O que fazer

Fazer vídeo nesse estilo, arrumando a mesa, com narração

fazer tipo continuação do video anterior

### Narração

> Organizar as coisas ao meu redor — o cantinho de estudo, o cronograma, a rotina — era só metade do caminho. Porque de nada adianta o ambiente perfeito se o material que você tá usando não acompanha o nível do que a prova vai cobrar.

> E quando a gente fala de concursos que exigem várias disciplinas, jurisprudência pesada e atualização constante... não dá pra marcar bobeira. Não dá pra estudar por material desatualizado, não dá pra depender só de resumo achado por aí, e não dá pra ficar sem saber se o que você tá lendo ainda vale pra prova de hoje.

> Foi aí que eu parei de improvisar e fui atrás de um material que fosse à altura da preparação que eu queria ter. E o que o **Estratégia Carreira Jurídica** tem pra oferecer faz muito sentido pra quem tá nessa fase.

> São materiais completos pra concursos de todas as áreas jurídicas, com mais de **três mil reais de desconto** — no material que você vai usar do primeiro dia de estudo até a véspera da prova oral.

> Tem **acesso estendido**, então você não fica com aquela pressão de prazo acabando no meio da preparação. E tem **acompanhamento personalizado** — porque cada um tem suas particularidades, e o plano de estudo também precisa acompanhar isso.

### Fechamento

Aproveite, porque essa promo vai durar poucos dias!`;
}

/** Roteiro promo — Matheus (faverimatheus.adv), Top 5 métodos. */
export function matheusPromoScriptMarkdown(): string {
  return `### Entrega

* 1 Reels

### Referência

https://www.instagram.com/p/DZh9sQGxPx6/

### [0:00 – 0:05] Gancho

> Top 5 métodos de estudo para concursos jurídicos que realmente funcionam. Fica até o final porque o número um vai te surpreender.

### 5º Lugar — Audiobooks

> Está no trânsito, na academia ou lavando a louça? Coloca um audiobook da matéria e transforma o tempo morto em horas líquidas de estudo.

cast.png
https://drive.google.com/file/d/1wUgBR6DkvFPSDWbu4FKMx3x4qI9vW_ZK/view?usp=sharing

### 4º Lugar — Simulados

> Treino difícil, jogo fácil. Fazer simulados cronometrados te prepara física e mentalmente para o dia da prova.

Simulado ENAM 2026.1.png
https://drive.google.com/file/d/1F7sgRMG3ruJlE6j5-zuJPFXB8NCag0us/view?usp=drive_link

### CTA promocional — antes do Top 3

Quebra de padrão: zoom in ou mudança de iluminação. Texto na tela:

> Ah, não sei se você está sabendo, mas o **Estratégia Carreira Jurídica** está com promoção com mais de três mil reais de desconto em materiais completos para concursos de todas as áreas. Acesso estendido e acompanhamento personalizado pra você não ficar perdido em nenhum momento. Voltando ao ranking...

### 3º Lugar — Jurisprudência

> Não adianta só ler a lei seca. Dominar os informativos e as súmulas do STF e STJ é o que separa quem passa de quem fica na fila.

jurisprudência 2025.png
https://drive.google.com/file/d/1TibXHasnAxjzOMZB7Q_I0sjzya53HEhe/view?usp=drive_link

### 2º Lugar — Sistema de Questões

> É resolvendo milhares de questões que você aprende o padrão da banca, para de cair em pegadinhas e ganha velocidade na prova.

SistemasDeQuestoes_v6.png
https://drive.google.com/file/d/1yJzsj1JbcGhzJow0UkJENg3xl184pAIO/view?usp=drive_link

### 1º Lugar — Livro Digital Interativo

> Marcações, anotações, leitura ativa e revisão integrada em um só lugar. Quem estuda com o LDI aprende mais rápido, retém mais e ganha muito tempo de estudo.

ldi.png
https://drive.google.com/file/d/1FqdclFGZt-lH_KSY9WloH-GZGOQGS60u/view?usp=drive_link

### CTA final

> Comenta aqui qual desses métodos você já usa na sua rotina. E não esquece: os mais de três mil reais de desconto no Estratégia Carreira Jurídica. Aproveite.`;
}

export function promoScriptMarkdownFor(instagram: string): string {
  const handle = String(instagram || "")
    .trim()
    .replace(/^@+/, "")
    .toLowerCase();
  if (handle === "magisnameta") return amandaPromoScriptMarkdown();
  if (handle === "vou.serjuiza") return camilaPromoScriptMarkdown();
  if (handle === "faverimatheus.adv") return matheusPromoScriptMarkdown();
  return promoScriptMarkdown();
}

/** Roteiro — Catarina (catarina_mvogmann), OAB 47 para Desesperados. */
export function catarinaOab47ScriptMarkdown(): string {
  return `### Pedido

Queremos pedir **sua colaboração** neste vídeo. Vamos avaliar para uma possível **collab no perfil do Estratégia OAB**, com boa visibilidade para você.

### Importante

* Envie o vídeo bruto; a gente **avalia collab** depois

### Entrega

* 1 Reels

### Referência

https://www.instagram.com/catarina_mvogmann

### O que fazer

Fazer um vídeo na cozinha, como se estivesse preparando um bolo.

Jogar ingredientes num bowl enquanto fala.

### Narração

> Estudar para OAB é tipo receita de bolo: precisa dos ingredientes certos, na medida certa, para a aprovação chegar.

> Se colocar só questões sem base teórica, reprova.

> Se estudar só teoria, sem treinar, já era também.

> Se colocar tudo certinho, mas não ter a cabeça no lugar, passa do ponto também!

> Por isso o **Estratégia OAB** vai lançar o **OAB 47 para Desesperados** — o plano na medida para você ser aprovado no último exame do ano, com cronograma e ebook do que mais cai liberados! Vai ser de graça, só se inscrever!`;
}

export function oab47ScriptMarkdownFor(instagram: string): string {
  const handle = String(instagram || "")
    .trim()
    .replace(/^@+/, "")
    .toLowerCase();
  if (handle === "catarina_mvogmann") return catarinaOab47ScriptMarkdown();
  return collabScriptMarkdown();
}
