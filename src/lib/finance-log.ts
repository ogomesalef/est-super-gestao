export function appendFinanceLog(current: string | null | undefined, entry: string): string {
  const lines = (current || "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  lines.push(entry);
  return lines.slice(-30).join("\n");
}

export function formatMoneyBr(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  return `R$ ${value.toFixed(2)}`;
}

export function formatValueChangeLog(
  oldValue: number | null | undefined,
  newValue: number | null | undefined,
  note?: string
): string {
  const ts = new Date().toISOString();
  const detail = note?.trim() ? ` — ${note.trim()}` : "";
  return `${ts} — Valor acordado: ${formatMoneyBr(oldValue)} → ${formatMoneyBr(newValue)}${detail}`;
}

export function parseLogLines(log: string | null | undefined): string[] {
  return (log || "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}
