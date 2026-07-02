/**
 * CORES DE STATUS — edite este arquivo para mudar as cores em todo o app.
 * Use classes Tailwind: "bg-... text-..." (e opcionalmente border-...).
 */

export const STATUS_COLORS: Record<string, string> = {
  // Parcerias
  Pendente: "bg-slate-100 text-slate-700",
  Proposta: "bg-sky-100 text-sky-800",
  Desinteressado: "bg-red-100 text-red-800",
  Ativo: "bg-emerald-100 text-emerald-800",
  Inativo: "bg-stone-100 text-stone-600",
  Reprovado: "bg-red-100 text-red-800",

  // Contatos
  Novo: "bg-violet-100 text-violet-800",
  Trabalhando: "bg-amber-100 text-amber-900",

  // Legado contatos (caso ainda exista no banco)
  "Em contato": "bg-blue-100 text-blue-800",
  "Aguardando resposta": "bg-amber-100 text-amber-900",
  Interessado: "bg-teal-100 text-teal-800",
  "Não interessado": "bg-stone-100 text-stone-600",
  "Sem retorno": "bg-orange-100 text-orange-900",
  Recusou: "bg-red-50 text-red-700",

  // Entregas
  OK: "bg-emerald-100 text-emerald-800",
  Parcial: "bg-amber-100 text-amber-900",
  "Sem atribuição": "bg-amber-100 text-amber-900",
  Atribuído: "bg-emerald-100 text-emerald-800",

  // Financeiro
  "Fechamento enviado": "bg-blue-100 text-blue-800",
  "Aguardando termo assinado": "bg-violet-100 text-violet-800",
  "Termo recebido": "bg-indigo-100 text-indigo-800",
  "Aguardando Form Financeiro": "bg-orange-100 text-orange-900",
  "Pronto para enviar ao Financeiro": "bg-teal-100 text-teal-800",
  "Solicitado ao Financeiro": "bg-cyan-100 text-cyan-900",
  "Pagamento confirmado ao embaixador": "bg-sky-100 text-sky-800",
  Pago: "bg-emerald-100 text-emerald-800",
  Bloqueado: "bg-red-100 text-red-800",
  Cancelado: "bg-stone-100 text-stone-600",

  // Campanhas
  Ativa: "bg-emerald-100 text-emerald-800",
  Inativa: "bg-stone-100 text-stone-600",
  Agendada: "bg-sky-100 text-sky-800",
  Encerrada: "bg-stone-100 text-stone-500",
};

export const MODALITY_COLORS: Record<string, string> = {
  "Assinatura + Cupom": "bg-purple-100 text-purple-800",
  Remuneração: "bg-amber-100 text-amber-900",
};

export const VERTICAL_HEADER_COLORS: Record<string, string> = {
  OAB: "bg-oab-light text-oab",
  ECJ: "bg-ecj-light text-ecj",
};

export function statusColor(label: string): string {
  return STATUS_COLORS[label] || "bg-surface text-body border border-hairline/80";
}

export function modalityColor(label: string): string {
  return MODALITY_COLORS[label] || "bg-surface text-body border border-hairline/80";
}

export function groupHeaderColor(key: string, groupBy: string): string {
  if (groupBy === "status" || groupBy === "payment") return statusColor(key);
  if (groupBy === "modality") return modalityColor(key);
  if (groupBy === "program" || groupBy === "vertical") {
    return VERTICAL_HEADER_COLORS[key] || "bg-surface text-body";
  }
  return "bg-surface text-body";
}
