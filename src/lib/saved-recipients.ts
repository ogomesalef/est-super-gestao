const STORAGE_KEY = "super-gestao:saved-email-recipients";
const LEGACY_KEY = "super-gestao:saved-test-emails";
const MAX_ITEMS = 20;

function normalize(email: string) {
  return email.trim().toLowerCase();
}

function readStorage(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((e) => typeof e === "string") : [];
  } catch {
    return [];
  }
}

function writeStorage(emails: string[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(emails.slice(0, MAX_ITEMS)));
}

export function loadSavedRecipients(): string[] {
  return readStorage();
}

export function persistSavedRecipients(emails: string[]) {
  writeStorage(emails);
}

export function addSavedRecipient(email: string): string[] {
  const trimmed = email.trim();
  if (!trimmed) return loadSavedRecipients();
  const key = normalize(trimmed);
  const rest = loadSavedRecipients().filter((e) => normalize(e) !== key);
  const next = [trimmed, ...rest].slice(0, MAX_ITEMS);
  writeStorage(next);
  return next;
}

export function removeSavedRecipient(email: string): string[] {
  const key = normalize(email);
  const next = loadSavedRecipients().filter((e) => normalize(e) !== key);
  writeStorage(next);
  return next;
}

export function rememberRecipient(email: string) {
  return addSavedRecipient(email);
}
