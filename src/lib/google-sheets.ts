import { getGoogleAccessToken } from "./google-oauth";

export function superSpreadsheetId(): string {
  return (
    process.env.SUPER_SPREADSHEET_ID ||
    process.env.SPREADSHEET_ID ||
    "1tM83rHEgFKb2_uLxoqeb_BPyYCxStCHlanWZeh8RdL4"
  );
}

export function entregasSheetName(): string {
  return process.env.ENTREGAS_SHEET_NAME || "ENTREGAS";
}

export async function fetchSheetValues(
  spreadsheetId: string,
  range: string
): Promise<string[][]> {
  const token = await getGoogleAccessToken();
  const url = new URL(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`
  );
  url.searchParams.set("valueRenderOption", "FORMATTED_VALUE");
  url.searchParams.set("dateTimeRenderOption", "FORMATTED_STRING");

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  const data = (await res.json()) as {
    values?: string[][];
    error?: { message?: string };
  };

  if (!res.ok) {
    throw new Error(data.error?.message || `Sheets API HTTP ${res.status}`);
  }

  return data.values || [];
}

export function isSheetsSyncConfigured(): boolean {
  const { clientId, clientSecret } = {
    clientId: process.env.GMAIL_CLIENT_ID || process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GMAIL_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET,
  };
  return Boolean(clientId && clientSecret && process.env.GMAIL_REFRESH_TOKEN);
}

/** Última linha com dado na coluna A (inclui cabeçalho = linha 1). */
export async function fetchSheetLastRow(spreadsheetId: string, sheetName: string): Promise<number> {
  const col = await fetchSheetValues(spreadsheetId, `'${sheetName}'!A:A`);
  return col.length;
}

export async function fetchEntregasHeaders(
  spreadsheetId: string,
  sheetName: string
): Promise<string[]> {
  const rows = await fetchSheetValues(spreadsheetId, `'${sheetName}'!1:1`);
  return (rows[0] || []).map((h) => String(h || "").trim());
}

export async function fetchEntregasRowsFrom(
  spreadsheetId: string,
  sheetName: string,
  startRow: number
): Promise<string[][]> {
  if (startRow < 2) startRow = 2;
  return fetchSheetValues(spreadsheetId, `'${sheetName}'!A${startRow}:ZZ`);
}
