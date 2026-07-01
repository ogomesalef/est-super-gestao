import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function normalizeHandle(v: string | null | undefined): string {
  const s = String(v || "").trim();
  if (!s) return "";
  return "@" + s.replace(/^@+/, "").toLowerCase();
}

export function buildAmbassadorKey(program: string, instagram: string): string {
  return `${program}|${normalizeHandle(instagram)}`;
}

export function firstName(fullName: string): string {
  return String(fullName || "").trim().split(/\s+/)[0] || "";
}

export function parseMonthRef(v: unknown): string | null {
  if (!v) return null;
  if (v instanceof Date && !isNaN(v.getTime())) {
    const y = v.getFullYear();
    const m = String(v.getMonth() + 1).padStart(2, "0");
    return `${y}-${m}`;
  }
  const s = String(v).trim();
  const iso = s.match(/^(\d{4})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}`;
  return s || null;
}

export function parseBool(v: unknown): boolean {
  if (typeof v === "boolean") return v;
  const s = String(v || "").trim().toLowerCase();
  return s === "true" || s === "sim" || s === "yes" || s === "1";
}

export function parseNumber(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  if (typeof v === "number" && !isNaN(v)) return v;
  const n = parseFloat(String(v).replace(/[^\d.,-]/g, "").replace(",", "."));
  return isNaN(n) ? null : n;
}

export function parseDate(v: unknown): Date | null {
  return parseDateBr(v);
}

/** Datas do Forms/planilha BR: dd/mm/yyyy e dd/mm/yyyy hh:mm:ss */
export function parseDateBr(v: unknown): Date | null {
  if (!v) return null;
  if (v instanceof Date && !isNaN(v.getTime())) return v;

  const s = String(v).trim();
  if (!s) return null;

  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T\s].*)?$/);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12, 0, 0);

  m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]), 12, 0, 0);

  m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2})$/);
  if (m) {
    const yy = Number(m[3]);
    const year = yy >= 50 ? 1900 + yy : 2000 + yy;
    return new Date(year, Number(m[2]) - 1, Number(m[1]), 12, 0, 0);
  }

  m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (m) {
    return new Date(
      Number(m[3]),
      Number(m[2]) - 1,
      Number(m[1]),
      Number(m[4]),
      Number(m[5]),
      Number(m[6] || 0)
    );
  }

  m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (m) {
    const yy = Number(m[3]);
    const year = yy >= 50 ? 1900 + yy : 2000 + yy;
    return new Date(year, Number(m[2]) - 1, Number(m[1]), Number(m[4]), Number(m[5]), Number(m[6] || 0));
  }

  if (!s.includes("/")) {
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  }

  return null;
}

export function calcAmountDue(agreedValue: number | null, pctDelivered: number): number {
  if (!agreedValue) return 0;
  const pct = Math.min(Math.max(pctDelivered, 0), 100);
  return Math.round((agreedValue * pct) / 100 * 100) / 100;
}

export function currentMonthRef(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function monthsBetween(start: Date, end: Date): string[] {
  const months: string[] = [];
  const cur = new Date(start.getFullYear(), start.getMonth(), 1);
  const last = new Date(end.getFullYear(), end.getMonth(), 1);
  while (cur <= last) {
    months.push(`${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, "0")}`);
    cur.setMonth(cur.getMonth() + 1);
  }
  return months;
}

const MONTH_NAMES_PT = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

export function formatMonthRefLong(ym: string): string {
  if (!ym || !/^\d{4}-\d{2}$/.test(ym)) return String(ym || "");
  const year = parseInt(ym.substring(0, 4), 10);
  const month = parseInt(ym.substring(5, 7), 10);
  const name = MONTH_NAMES_PT[month - 1];
  return name ? `${name} de ${year}` : ym;
}

export function monthRefFromDate(d: Date | string | null | undefined): string | null {
  if (!d) return null;
  const date = d instanceof Date ? d : new Date(d);
  if (isNaN(date.getTime())) return null;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function monthNameFromRef(ym: string): string {
  if (!ym || !/^\d{4}-\d{2}$/.test(ym)) return String(ym || "");
  const month = parseInt(ym.substring(5, 7), 10);
  return MONTH_NAMES_PT[month - 1] || ym;
}

export function endDateFromMonthRef(monthRef: string): Date {
  const [y, m] = monthRef.split("-").map(Number);
  return new Date(y, m - 1, 1, 12, 0, 0);
}

export function isPartnershipActiveInMonth(
  partnership:
    | { startDate?: Date | string | null; endDate?: Date | string | null }
    | null
    | undefined,
  monthRef: string
): boolean {
  if (!monthRef || !/^\d{4}-\d{2}$/.test(monthRef)) return true;

  const startRef = monthRefFromDate(partnership?.startDate);
  if (startRef && monthRef < startRef) return false;

  const endRef = monthRefFromDate(partnership?.endDate);
  if (endRef && monthRef >= endRef) return false;

  return true;
}

export function recentMonthRefs(pastMonths = 18, futureMonths = 1): string[] {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - pastMonths, 1);
  const end = new Date(now.getFullYear(), now.getMonth() + futureMonths, 1);
  return monthsBetween(start, end).reverse();
}

/** yyyy-MM-dd no fuso America/Sao_Paulo */
export function dateKeyBr(d: Date): string {
  return d.toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
}

export function isTodayBr(d: Date): boolean {
  return dateKeyBr(d) === dateKeyBr(new Date());
}
