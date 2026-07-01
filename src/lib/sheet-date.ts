import * as XLSX from "xlsx";
import { parseDateBr } from "./utils";

/** Converte valor de célula (string, serial Excel ou Date) para Date BR. */
export function parseSheetDate(v: unknown): Date | null {
  if (v === null || v === undefined || v === "") return null;

  if (typeof v === "number" && Number.isFinite(v)) {
    const parsed = XLSX.SSF.parse_date_code(v);
    if (parsed?.y) {
      return new Date(parsed.y, parsed.m - 1, parsed.d, parsed.H || 12, parsed.M || 0, parsed.S || 0);
    }
  }

  if (v instanceof Date && !isNaN(v.getTime())) {
    return new Date(v.getFullYear(), v.getMonth(), v.getDate(), 12, 0, 0);
  }

  return parseDateBr(v);
}
