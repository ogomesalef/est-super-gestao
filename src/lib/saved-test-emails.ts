const STORAGE_KEY = "super-gestao:saved-test-emails";
const MAX_ITEMS = 12;

function normalize(email: string) {
  return email.trim().toLowerCase();
}

export function loadSavedTestEmails(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((e) => typeof e === "string") : [];
  } catch {
    return [];
  }
}

export function persistSavedTestEmails(emails: string[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(emails.slice(0, MAX_ITEMS)));
}

export function addSavedTestEmail(email: string): string[] {
  const trimmed = email.trim();
  if (!trimmed) return loadSavedTestEmails();
  const key = normalize(trimmed);
  const rest = loadSavedTestEmails().filter((e) => normalize(e) !== key);
  const next = [trimmed, ...rest].slice(0, MAX_ITEMS);
  persistSavedTestEmails(next);
  return next;
}

export function removeSavedTestEmail(email: string): string[] {
  const key = normalize(email);
  const next = loadSavedTestEmails().filter((e) => normalize(e) !== key);
  persistSavedTestEmails(next);
  return next;
}
