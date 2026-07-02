import { CONTACT_FOLLOWUP_DAYS, CONTACT_WORKING_STATUS } from "./constants";

export type ContactAlertItem = {
  status: string;
  statusChangedAt?: string | Date | null;
  lastContactedAt?: string | Date | null;
};

function contactStaleReferenceDate(contact: ContactAlertItem): Date | null {
  const ref = contact.lastContactedAt || contact.statusChangedAt;
  if (!ref) return null;
  const d = ref instanceof Date ? ref : new Date(ref);
  return isNaN(d.getTime()) ? null : d;
}

export function daysSinceContactActivity(contact: ContactAlertItem): number | null {
  const ref = contactStaleReferenceDate(contact);
  if (!ref) return null;
  return Math.floor((Date.now() - ref.getTime()) / (1000 * 60 * 60 * 24));
}

export function isContactStale(
  contact: ContactAlertItem,
  thresholdDays = CONTACT_FOLLOWUP_DAYS
): boolean {
  if (contact.status !== CONTACT_WORKING_STATUS) return false;
  const days = daysSinceContactActivity(contact);
  if (days === null) return true;
  return days >= thresholdDays;
}

export function contactAlertLabel(contact: ContactAlertItem): string | null {
  if (!isContactStale(contact)) return null;
  const days = daysSinceContactActivity(contact);
  if (days === null) return "Refazer contato";
  return `${days} dias sem retorno`;
}

/** Ao mover para este status, abre o modal de outreach. */
export function isOutreachStatus(status: string): boolean {
  return status === CONTACT_WORKING_STATUS;
}

export const CONTACT_REFOLLOW_STATUSES = [CONTACT_WORKING_STATUS] as const;
