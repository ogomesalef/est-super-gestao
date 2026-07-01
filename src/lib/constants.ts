export const VERTICALS = ["OAB", "ECJ"] as const;
export type Vertical = (typeof VERTICALS)[number];

export const PARTNERSHIP_STATUSES = [
  "Pendente",
  "Proposta",
  "Ativo",
  "Inativo",
  "Reprovado",
] as const;

export const MODALITIES = ["Assinatura + Cupom", "Remuneração"] as const;

export const CONTACT_STATUSES = [
  "Novo",
  "Em contato",
  "Aguardando resposta",
  "Interessado",
  "Não interessado",
  "Sem retorno",
  "Recusou",
] as const;

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
  "Avisar embaixador: pagamento solicitado",
  "Marcar como Pago",
  "Bloquear pagamento",
  "Desbloquear pagamento",
] as const;

export const EMAIL_ACTIONS = [
  "Enviar proposta (Assinatura + Cupom)",
  "Enviar proposta (Remuneração)",
  "Enviar próximos passos (Assinatura + Cupom)",
  "Enviar formalização (Assinatura + Cupom)",
  "Enviar formalização (Remuneração)",
  "Enviar reprovação",
  "Enviar cancelamento de parceria",
] as const;

export const CANCELAMENTO_EMAIL_ACTION = "Enviar cancelamento de parceria" as const;

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
