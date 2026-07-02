export const VERTICALS = ["OAB", "ECJ"] as const;
export type Vertical = (typeof VERTICALS)[number];

export const PARTNERSHIP_STATUSES = [
  "Pendente",
  "Proposta",
  "Desinteressado",
  "Ativo",
  "Inativo",
] as const;

/** Status legados da planilha → status do app. */
export const PARTNERSHIP_STATUS_ALIASES: Record<string, (typeof PARTNERSHIP_STATUSES)[number]> = {
  Reprovado: "Desinteressado",
  "Não interessado": "Desinteressado",
  Recusou: "Desinteressado",
};

export const MODALITIES = ["Assinatura + Cupom", "Remuneração"] as const;

export const CONTACT_STATUSES = ["Novo", "Trabalhando", "Desinteressado"] as const;

/** Status legados de contatos → status do app. */
export const CONTACT_STATUS_ALIASES: Record<string, (typeof CONTACT_STATUSES)[number]> = {
  "Em contato": "Trabalhando",
  "Aguardando resposta": "Trabalhando",
  Interessado: "Trabalhando",
  "Não interessado": "Desinteressado",
  "Sem retorno": "Desinteressado",
  Recusou: "Desinteressado",
};

export const CONTACT_WORKING_STATUS = "Trabalhando" as const;

export const PAYMENT_STATUSES = [
  "Pendente",
  "Fechamento enviado",
  "Aguardando termo assinado",
  "Termo recebido",
  "Aguardando Form Financeiro",
  "Pronto para enviar ao Financeiro",
  "Solicitado ao Financeiro",
  "Pagamento confirmado ao embaixador",
  "Pago",
  "Bloqueado",
  "Cancelado",
] as const;

export const FINANCE_PIPELINE_STAGES = [
  {
    key: "fechamento",
    label: "Realizar fechamento do mês",
    statuses: ["Pendente", "Fechamento enviado"],
    dropStatus: "Pendente",
    pillStatus: "Pendente",
  },
  {
    key: "termo",
    label: "Aguardando termo assinado",
    statuses: ["Aguardando termo assinado"],
    dropStatus: "Aguardando termo assinado",
    pillStatus: "Aguardando termo assinado",
  },
  {
    key: "pronto-financeiro",
    label: "Pronto para enviar ao Financeiro",
    statuses: ["Termo recebido", "Aguardando Form Financeiro", "Pronto para enviar ao Financeiro"],
    dropStatus: "Pronto para enviar ao Financeiro",
    pillStatus: "Pronto para enviar ao Financeiro",
  },
  {
    key: "pagamento-solicitado",
    label: "Pagamento solicitado",
    statuses: [
      "Solicitado ao Financeiro",
      "Pagamento confirmado ao embaixador",
      "Pago",
    ],
    dropStatus: "Solicitado ao Financeiro",
    pillStatus: "Solicitado ao Financeiro",
  },
] as const;

export const FINANCE_PIPELINE_BLOCKED = "Bloqueado";
export const FINANCE_PIPELINE_HIDDEN = ["Cancelado"] as const;

export const POST_ASSIGNMENT_STATUSES = ["Sem atribuição", "Atribuído"] as const;

export const DELIVERY_TYPE_GROUPS = [
  "Feed/Reels",
  "Stories",
  "TikTok",
  "YouTube",
  "Outro",
] as const;

export const FINANCE_ACTIONS = [
  "Enviar fechamento do mês (com termo)",
  "Enviar lembrete do termo",
  "Cobrar Form Financeiro",
  "Enviar solicitação ao Financeiro",
  "Reenviar solicitação ao Financeiro",
  "Avisar embaixador: pagamento solicitado",
  "Marcar como Pago",
  "Bloquear pagamento",
  "Desbloquear pagamento",
] as const;

export const FINANCE_REQUEST_ACTION = "Enviar solicitação ao Financeiro" as const;
export const FINANCE_RESEND_REQUEST_ACTION = "Reenviar solicitação ao Financeiro" as const;

export const PROPOSAL_FOLLOWUP_DAYS = 7;
export const CONTACT_FOLLOWUP_DAYS = 5;

export const PROPOSTA_ASSINATURA_ACTION = "Enviar proposta (Assinatura + Cupom)" as const;
export const PROPOSTA_REMUNERACAO_ACTION = "Enviar proposta (Remuneração)" as const;
export const PROPOSTA_LEMBRETE_ACTION = "Enviar lembrete de proposta" as const;

export const PROPOSTA_EMAIL_ACTIONS = new Set([
  PROPOSTA_ASSINATURA_ACTION,
  PROPOSTA_REMUNERACAO_ACTION,
]);

export function resolvePropostaAction(modality: string | null | undefined): string {
  return modality === "Remuneração" ? PROPOSTA_REMUNERACAO_ACTION : PROPOSTA_ASSINATURA_ACTION;
}

export const EMAIL_ACTIONS = [
  PROPOSTA_ASSINATURA_ACTION,
  PROPOSTA_REMUNERACAO_ACTION,
  PROPOSTA_LEMBRETE_ACTION,
  "Enviar próximos passos (Assinatura + Cupom)",
  "Enviar formalização (Assinatura + Cupom)",
  "Enviar formalização (Remuneração)",
  "Enviar reprovação",
  "Enviar cancelamento de parceria",
  "Enviar pedido de vídeo (collab campanha)",
] as const;

export const CANCELAMENTO_EMAIL_ACTION = "Enviar cancelamento de parceria" as const;

export const COLLAB_PEDIDO_EMAIL_ACTION = "Enviar pedido de vídeo (collab campanha)" as const;

export const FORMALIZACAO_ASSINATURA_ACTION = "Enviar formalização (Assinatura + Cupom)" as const;
export const FORMALIZACAO_REMUNERACAO_ACTION = "Enviar formalização (Remuneração)" as const;

export function resolveFormalizacaoAction(modality: string | null | undefined): string {
  return modality === "Remuneração"
    ? FORMALIZACAO_REMUNERACAO_ACTION
    : FORMALIZACAO_ASSINATURA_ACTION;
}

export const FORMALIZACAO_EMAIL_ACTIONS = new Set([
  FORMALIZACAO_ASSINATURA_ACTION,
  FORMALIZACAO_REMUNERACAO_ACTION,
]);

/** Ações visíveis no select de e-mail, conforme modalidade da parceria. */
export function filterAmbassadorEmailActions(
  modality: string,
  actions: readonly string[] = EMAIL_ACTIONS
): string[] {
  return actions.filter((a) => {
    if (a === CANCELAMENTO_EMAIL_ACTION) return true;
    if (a === COLLAB_PEDIDO_EMAIL_ACTION) return true;
    if (a === PROPOSTA_LEMBRETE_ACTION) return true;
    if (modality === "Remuneração") {
      return a.includes("Remuneração") || a === "Enviar reprovação";
    }
    return a.includes("Assinatura + Cupom") || a === "Enviar reprovação";
  });
}

export const VERTICAL_CONFIG = {
  OAB: {
    color: "#6B0A09",
    handle: "@estrategiaoab",
    emailFrom: "embaixadores.oab@estrategia.com",
    catalogUrl: "https://oab.estrategia.com",
    cupomFormUrl: "https://estrategiaeducacional.typeform.com/embaixadoresoab",
  },
  ECJ: {
    color: "#D08C00",
    handle: "@estrategiacarreirajuridica",
    emailFrom: "embaixadores.ecj@estrategia.com",
    catalogUrl: "https://cj.estrategia.com",
    cupomFormUrl: "https://forms.gle/wK3AxRsWy2YAZgFk7",
  },
} as const;

export const NAV_ITEMS: Array<{ href: string; label: string; roles: Array<"admin" | "executive"> }> = [
  { href: "/", label: "Dashboard", roles: ["admin", "executive"] },
  { href: "/contatos", label: "Contatos", roles: ["admin"] },
  { href: "/parcerias", label: "Parcerias", roles: ["admin"] },
  { href: "/entregas", label: "Entregas", roles: ["admin"] },
  { href: "/financeiro", label: "Financeiro", roles: ["admin"] },
  { href: "/campanhas", label: "Campanhas", roles: ["admin"] },
  { href: "/emails", label: "E-mails", roles: ["admin"] },
  { href: "/executive", label: "Painel Chefe", roles: ["admin", "executive"] },
];
