import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
  Pendente: "bg-slate-100 text-slate-700",
  Proposta: "bg-sky-100 text-sky-800",
  Ativo: "bg-emerald-100 text-emerald-800",
  Inativo: "bg-stone-100 text-stone-600",
  Reprovado: "bg-red-100 text-red-800",
  Novo: "bg-violet-100 text-violet-800",
  "Em contato": "bg-blue-100 text-blue-800",
  "Aguardando resposta": "bg-amber-100 text-amber-900",
  Interessado: "bg-teal-100 text-teal-800",
  "Não interessado": "bg-stone-100 text-stone-600",
  "Sem retorno": "bg-orange-100 text-orange-900",
  Recusou: "bg-red-50 text-red-700",
  OK: "bg-emerald-100 text-emerald-800",
  Parcial: "bg-amber-100 text-amber-900",
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
  "Sem atribuição": "bg-amber-100 text-amber-900",
  Atribuído: "bg-emerald-100 text-emerald-800",
  Ativa: "bg-emerald-100 text-emerald-800",
  Inativa: "bg-stone-100 text-stone-600",
  Agendada: "bg-sky-100 text-sky-800",
  Encerrada: "bg-stone-100 text-stone-500",
};

const MODALITY_STYLES: Record<string, string> = {
  "Assinatura + Cupom": "bg-purple-100 text-purple-800",
  Remuneração: "bg-amber-100 text-amber-900",
};

export function NotionPill({
  children,
  kind = "default",
  className,
}: {
  children: React.ReactNode;
  kind?: "status" | "modality" | "vertical" | "payment" | "default";
  className?: string;
}) {
  const label = String(children);
  let style = "bg-surface text-body border border-hairline/80";

  if ((kind === "status" || kind === "payment") && STATUS_STYLES[label]) {
    style = STATUS_STYLES[label];
  }
  if (kind === "modality" && MODALITY_STYLES[label]) style = MODALITY_STYLES[label];
  if (kind === "vertical") {
    style =
      label === "ECJ"
        ? "bg-ecj-light text-ecj border border-ecj/30"
        : "bg-oab-light text-oab border border-oab/30";
  }

  return (
    <span
      className={cn(
        "inline-flex max-w-full truncate rounded px-2 py-0.5 text-xs font-medium",
        style,
        className
      )}
    >
      {children}
    </span>
  );
}

export function groupHeaderColor(key: string, groupBy: string): string {
  if (groupBy === "status") return STATUS_STYLES[key] || "bg-surface text-body";
  if (groupBy === "modality") return MODALITY_STYLES[key] || "bg-surface text-body";
  if (groupBy === "program" || groupBy === "vertical") {
    return key === "ECJ" ? "bg-ecj-light text-ecj" : "bg-oab-light text-oab";
  }
  return "bg-surface text-body";
}
