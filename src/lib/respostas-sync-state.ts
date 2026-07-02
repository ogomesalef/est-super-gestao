import { prisma } from "./prisma";

export type RespostasSyncState = {
  lastRow: number;
  lastSyncedAt: string | null;
};

function stateKey(spreadsheetId: string, sheetName: string): string {
  return `respostas_sync:${spreadsheetId}:${sheetName}`;
}

export async function getRespostasSyncState(
  spreadsheetId: string,
  sheetName: string
): Promise<RespostasSyncState> {
  const row = await prisma.appSetting.findUnique({
    where: { key: stateKey(spreadsheetId, sheetName) },
  });
  if (!row) return { lastRow: 1, lastSyncedAt: null };
  try {
    return JSON.parse(row.value) as RespostasSyncState;
  } catch {
    return { lastRow: 1, lastSyncedAt: null };
  }
}

export async function setRespostasSyncState(
  spreadsheetId: string,
  sheetName: string,
  state: RespostasSyncState
): Promise<void> {
  const key = stateKey(spreadsheetId, sheetName);
  const value = JSON.stringify(state);
  await prisma.appSetting.upsert({
    where: { key },
    create: { key, value },
    update: { value },
  });
}
