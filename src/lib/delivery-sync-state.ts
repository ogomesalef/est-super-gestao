import { prisma } from "./prisma";

export type EntregasSyncState = {
  lastRow: number;
  lastSyncedAt: string | null;
};

function stateKey(spreadsheetId: string, sheetName: string): string {
  return `entregas_sync:${spreadsheetId}:${sheetName}`;
}

export async function getEntregasSyncState(
  spreadsheetId: string,
  sheetName: string
): Promise<EntregasSyncState> {
  const row = await prisma.appSetting.findUnique({
    where: { key: stateKey(spreadsheetId, sheetName) },
  });
  if (!row) return { lastRow: 1, lastSyncedAt: null };
  try {
    return JSON.parse(row.value) as EntregasSyncState;
  } catch {
    return { lastRow: 1, lastSyncedAt: null };
  }
}

export async function setEntregasSyncState(
  spreadsheetId: string,
  sheetName: string,
  state: EntregasSyncState
): Promise<void> {
  const key = stateKey(spreadsheetId, sheetName);
  const value = JSON.stringify(state);
  await prisma.appSetting.upsert({
    where: { key },
    create: { key, value },
    update: { value },
  });
}
