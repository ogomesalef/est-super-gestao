import { PROPOSAL_FOLLOWUP_DAYS } from "./constants";

export type PartnershipAlertItem = {
  status: string;
  needsReview?: boolean;
  partnership?: {
    proposalSentAt?: string | Date | null;
    proposalReminderSentAt?: string | Date | null;
  } | null;
};

export function daysSince(iso: string | Date | null | undefined): number | null {
  if (!iso) return null;
  const d = iso instanceof Date ? iso : new Date(iso);
  if (isNaN(d.getTime())) return null;
  const diff = Date.now() - d.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export function daysSinceProposalSent(item: PartnershipAlertItem): number | null {
  return daysSince(item.partnership?.proposalSentAt);
}

export function isProposalStale(
  item: PartnershipAlertItem,
  thresholdDays = PROPOSAL_FOLLOWUP_DAYS
): boolean {
  if (item.status !== "Proposta") return false;
  const days = daysSinceProposalSent(item);
  return days !== null && days >= thresholdDays;
}

export function proposalAlertLabel(item: PartnershipAlertItem): string | null {
  if (item.status === "Pendente" && item.needsReview) {
    return "Analisar candidatura";
  }
  if (!isProposalStale(item)) return null;
  const days = daysSinceProposalSent(item);
  if (days === null) return "Proposta sem data de envio";
  return `${days} dias sem retorno`;
}

export function needsAnalysis(item: PartnershipAlertItem): boolean {
  return item.status === "Pendente" && !!item.needsReview;
}
