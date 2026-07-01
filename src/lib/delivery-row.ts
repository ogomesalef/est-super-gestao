import { parseSheetDate } from "./sheet-date";
import { normalizeHandle, monthRefFromDate } from "./utils";

export type SheetRow = Record<string, string>;

export function pickRow(row: SheetRow, ...keys: string[]): string {
  for (const k of keys) {
    const v = row[k];
    if (v !== undefined && v !== "") return String(v).trim();
  }
  return "";
}

export function sheetRowToObject(headers: string[], values: string[]): SheetRow {
  const out: SheetRow = {};
  headers.forEach((h, i) => {
    if (h) out[h.trim()] = values[i] ?? "";
  });
  return out;
}

export function buildSheetSyncKey(spreadsheetId: string, sheetName: string, rowNumber: number): string {
  return `${spreadsheetId}:${sheetName}:${rowNumber}`;
}

export type ParsedDeliveryRow = {
  program: string;
  instagram: string;
  fullName: string | null;
  email: string | null;
  deliveryType: string | null;
  postedAt: Date | null;
  submittedAt: Date;
  postLink: string | null;
  printUrl: string | null;
  storiesPrintUrl: string | null;
  videoLink: string | null;
  campaignName: string | null;
  driveStatus: string | null;
  driveOrganizedIn: string | null;
  campaignDriveStatus: string | null;
  monthRef: string | null;
};

export function parseDeliverySheetRow(row: SheetRow): ParsedDeliveryRow | null {
  const program = pickRow(row, "Programa");
  const instagram = normalizeHandle(pickRow(row, "Seu Instagram (@)", "Instagram"));
  const submittedAt =
    parseSheetDate(pickRow(row, "Carimbo de data/hora")) || new Date();
  const postedAt = parseSheetDate(pickRow(row, "Data da postagem"));
  const effectivePostedAt = postedAt ?? submittedAt;
  const monthRef = monthRefFromDate(effectivePostedAt);

  if (!program && !instagram) return null;
  if (!postedAt && !submittedAt) return null;

  const campaignName = pickRow(row, "Esta entrega faz parte de alguma campanha?") || null;

  return {
    program: program || "OAB",
    instagram: instagram || "",
    fullName: pickRow(row, "Seu nome completo") || null,
    email: pickRow(row, "Seu e-mail", "Endereço de e-mail") || null,
    deliveryType: pickRow(row, "Tipo de entrega") || null,
    postedAt: effectivePostedAt,
    submittedAt,
    postLink: pickRow(row, "Link da postagem") || null,
    printUrl: pickRow(row, "Print da postagem") || null,
    storiesPrintUrl: pickRow(row, "Print (Stories)") || null,
    videoLink: pickRow(row, "Link do vídeo") || null,
    campaignName,
    driveStatus: pickRow(row, "Drive status") || null,
    driveOrganizedIn: pickRow(row, "Drive organizado em") || null,
    campaignDriveStatus: pickRow(row, "Campanha Drive status") || null,
    monthRef,
  };
}
