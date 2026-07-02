/** Seções do formulário Respostas — ordem igual à planilha Google Forms. */

export type RespostasFormSection = {
  title: string;
  fields: string[];
};

const SHARED_CONTACT: RespostasFormSection = {
  title: "Contato e redes",
  fields: [
    "Nome completo",
    "Carimbo de data/hora",
    "Seu foco principal hoje é:",
    "E-mail",
    "WhatsApp com DDD",
    "Seu Instagram (@)",
    "Seu TikTok (@)",
    "Seu YouTube (@)",
    "Outras redes (X, Threads, etc.)",
  ],
};

const SHARED_AUDIENCE: RespostasFormSection = {
  title: "Audiência",
  fields: [
    "Quantos seguidores você tem hoje? (aprox.)",
    "Média de visualizações por vídeo (aprox.)",
  ],
};

const SHARED_PROFILE: RespostasFormSection = {
  title: "Perfil e motivação",
  fields: [
    "Em qual perfil você mais se encaixa hoje?",
    "Em poucas linhas, por que seu perfil se encaixa bem no Super Embaixadores?",
  ],
};

const SHARED_STUDENT: RespostasFormSection = {
  title: "Estratégia / embaixador",
  fields: [
    "Você é aluno(a) do Estratégia hoje?",
    "Se você for aluno(a): qual produto/curso você usa?",
    "Você já participa do Programa de Embaixadores (cupom)?",
    "Você já participou de algum programa de embaixadores? Se sim, com quais empresas?",
  ],
};

const SHARED_LAW_BASE: RespostasFormSection = {
  title: "Formação em Direito",
  fields: [
    "Você já se formou em Direito?",
    "Em que ano você se formou?",
    "Qual o ano previsto para sua formatura?",
  ],
};

const ECJ_CAREER: RespostasFormSection = {
  title: "Carreira jurídica (ECJ)",
  fields: [
    "Você atua na área jurídica hoje?",
    "Qual seu cargo/função?",
    "Sua atuação atual está alinhada com sua meta de carreira?",
    "Qual carreira jurídica é seu foco principal hoje?",
    "Em que etapa você está hoje na sua preparação para concursos?",
  ],
};

const OAB_PREP: RespostasFormSection = {
  title: "OAB",
  fields: [
    "Você já foi aprovado(a) na OAB?",
    "Em qual Exame você foi aprovado(a)?",
    "Você está estudando para a OAB atualmente?",
    "Qual Exame da OAB você pretende fazer (ou está se preparando)?",
  ],
};

const SHARED_DELIVERIES: RespostasFormSection = {
  title: "Entregas e conteúdo",
  fields: [
    "Você tem disponibilidade para entregas semanais?",
    "Quais formatos você consegue entregar com consistência?",
    "Frequência que você consegue manter hoje",
    "Você topa enviar as comprovações das entregas para validação (links, prints e/ou arquivo)?",
  ],
};

const ECJ_CONTENT: RespostasFormSection = {
  title: "Conteúdo ECJ",
  fields: [
    "Que tipo de conteúdo você faria para o Estratégia Carreiras Jurídicas (ECJ)?",
  ],
};

const OAB_CONTENT: RespostasFormSection = {
  title: "Conteúdo OAB",
  fields: ["Que tipo de conteúdo você faria para o Estratégia OAB?"],
};

const SHARED_INTEREST: RespostasFormSection = {
  title: "Interesse na parceria",
  fields: [
    "O que você mais busca com esse projeto?",
    "Qual curso/produto do Estratégia Carreira Jurídica você teria mais interesse em acessar?",
    "Qual curso/produto do Estratégia OAB você teria mais interesse em acessar?",
    "Deixe aqui qualquer informação pessoal ou profissional que você considere relevante",
    "Declaro que as informações enviadas são verdadeiras e estou ciente de que o envio não garante participação.",
  ],
};

export function respostasFormSections(program: string): RespostasFormSection[] {
  const isEcj = program === "ECJ";
  return [
    SHARED_CONTACT,
    SHARED_AUDIENCE,
    SHARED_PROFILE,
    SHARED_STUDENT,
    SHARED_LAW_BASE,
    isEcj ? ECJ_CAREER : OAB_PREP,
    {
      ...SHARED_DELIVERIES,
      fields: [
        ...SHARED_DELIVERIES.fields.slice(0, 3),
        ...(isEcj ? ECJ_CONTENT.fields : OAB_CONTENT.fields),
        SHARED_DELIVERIES.fields[3],
      ],
    },
    {
      title: SHARED_INTEREST.title,
      fields: isEcj
        ? SHARED_INTEREST.fields.filter((f) => !f.includes("Estratégia OAB"))
        : SHARED_INTEREST.fields.filter((f) => !f.includes("Carreira Jurídica")),
    },
  ];
}

export function groupFormDataBySections(
  form: Record<string, string>,
  program: string
): Array<{ title: string; entries: Array<{ label: string; value: string }> }> {
  const used = new Set<string>();
  const sections: Array<{ title: string; entries: Array<{ label: string; value: string }> }> = [];

  for (const section of respostasFormSections(program)) {
    const entries: Array<{ label: string; value: string }> = [];
    for (const label of section.fields) {
      const value = form[label]?.trim();
      if (value) {
        entries.push({ label, value });
        used.add(label);
      }
    }
    if (entries.length > 0) sections.push({ title: section.title, entries });
  }

  const extra = Object.entries(form)
    .filter(([k, v]) => v?.trim() && !used.has(k))
    .sort(([a], [b]) => a.localeCompare(b, "pt-BR"))
    .map(([label, value]) => ({ label, value: value.trim() }));

  if (extra.length > 0) {
    sections.push({ title: "Outros campos", entries: extra });
  }

  return sections;
}

export function countFormFields(form: Record<string, string> | null | undefined): number {
  if (!form) return 0;
  return Object.values(form).filter((v) => String(v || "").trim()).length;
}
