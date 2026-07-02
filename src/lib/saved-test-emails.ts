import {
  addSavedRecipient,
  loadSavedRecipients,
  removeSavedRecipient,
} from "@/lib/saved-recipients";

export {
  addSavedRecipient as addSavedTestEmail,
  loadSavedRecipients as loadSavedTestEmails,
  removeSavedRecipient as removeSavedTestEmail,
  rememberRecipient as rememberTestEmail,
} from "@/lib/saved-recipients";

const STORAGE_KEY = "super-gestao:saved-test-emails";

/** @deprecated Use loadSavedRecipients */
export function loadSavedTestEmailsLegacy(): string[] {
  return loadSavedRecipients();
}

export function persistSavedTestEmails(emails: string[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(emails));
}
