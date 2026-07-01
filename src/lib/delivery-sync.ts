import { prisma } from "./prisma";
import { recalcMonthlyControlsFor } from "./delivery-calc";
import { getEntregasSyncState, setEntregasSyncState } from "./delivery-sync-state";
import {
  buildSheetSyncKey,
  parseDeliverySheetRow,
  sheetRowToObject,
  type SheetRow,
} from "./delivery-row";
import {
  entregasSheetName,
  fetchEntregasHeaders,
  fetchEntregasRowsFrom,
  fetchSheetLastRow,
  superSpreadsheetId,
} from "./google-sheets";
import { isTodayBr, normalizeHandle } from "./utils";

const BOOTSTRAP_TAIL_ROWS = 300;

export type DeliverySyncOptions = {
  /** Reimporta desde a linha 2 (lento). */
  full?: boolean;
};

export type DeliverySyncResult = {
  spreadsheetId: string;
  sheetName: string;
  mode: "incremental" | "bootstrap_today" | "full" | "noop";
  sheetLastRow: number;
  startRow: number;
  scannedRows: number;
  created: number;
  updated: number;
  skipped: number;
  filteredOut: number;
  unassigned: number;
  recalced: number;
  lastSyncedAt: string;
  lastRow: number;
};

type AmbassadorCache = Map<string, string | null>;

function ambCacheKey(program: string, instagram: string): string {
  return `${program}|${normalizeHandle(instagram)}`;
}

async function resolveAmbassadorId(
  program: string,
  instagram: string,
  fullName: string | null | undefined,
  email: string | null | undefined,
  cache: AmbassadorCache
): Promise<string | null> {
  const key = ambCacheKey(program, instagram);
  if (cache.has(key)) return cache.get(key) ?? null;

  const ig = normalizeHandle(instagram);
  if (!ig || ig === "@") {
    cache.set(key, null);
    return null;
  }

  const amb = await prisma.ambassador.findUnique({
    where: { program_instagram: { program, instagram: ig } },
  });
  if (amb) {
    cache.set(key, amb.id);
    return amb.id;
  }

  if (email) {
    const byEmail = await prisma.ambassador.findFirst({ where: { program, email } });
    if (byEmail) {
      cache.set(key, byEmail.id);
      return byEmail.id;
    }
  }

  cache.set(key, null);
  return null;
}

async function resolveCampaignId(campaignName: string | null): Promise<string | null> {
  if (!campaignName) return null;
  const lower = campaignName.toLowerCase();
  if (lower.includes("não se aplica") || lower === "nenhuma") return null;
  const camp = await prisma.campaign.findFirst({ where: { name: campaignName } });
  return camp?.id ?? null;
}

async function upsertDeliveryFromSheetRow(
  spreadsheetId: string,
  sheetName: string,
  rowNumber: number,
  row: SheetRow,
  now: Date,
  cache: AmbassadorCache
): Promise<
  | { action: "skipped" }
  | { action: "created" | "updated"; ambassadorId: string | null; monthRef: string | null }
> {
  const parsed = parseDeliverySheetRow(row);
  if (!parsed) return { action: "skipped" };

  const sheetSyncKey = buildSheetSyncKey(spreadsheetId, sheetName, rowNumber);
  const existing = await prisma.delivery.findUnique({ where: { sheetSyncKey } });

  let ambassadorId: string | null = null;
  if (existing?.ambassadorId && !existing.needsReview) {
    ambassadorId = existing.ambassadorId;
  } else {
    ambassadorId = await resolveAmbassadorId(
      parsed.program,
      parsed.instagram,
      parsed.fullName,
      parsed.email,
      cache
    );
  }

  const campaignId = await resolveCampaignId(parsed.campaignName);
  const needsReview = !ambassadorId;
  const data = {
    program: parsed.program,
    instagram: parsed.instagram || null,
    fullName: parsed.fullName,
    email: parsed.email,
    deliveryType: parsed.deliveryType,
    postedAt: parsed.postedAt,
    submittedAt: parsed.submittedAt,
    postLink: parsed.postLink,
    printUrl: parsed.printUrl,
    storiesPrintUrl: parsed.storiesPrintUrl,
    videoLink: parsed.videoLink,
    campaignName: parsed.campaignName,
    driveStatus: parsed.driveStatus,
    driveOrganizedIn: parsed.driveOrganizedIn,
    campaignDriveStatus: parsed.campaignDriveStatus,
    monthRef: parsed.monthRef,
    ambassadorId,
    campaignId,
    needsReview,
    sheetSyncKey,
    syncedAt: now,
  };

  if (existing) {
    await prisma.delivery.update({ where: { id: existing.id }, data });
    return { action: "updated", ambassadorId, monthRef: parsed.monthRef };
  }

  await prisma.delivery.create({ data });
  return { action: "created", ambassadorId, monthRef: parsed.monthRef };
}

export async function syncDeliveriesFromSheet(
  options: DeliverySyncOptions = {}
): Promise<DeliverySyncResult> {
  const spreadsheetId = superSpreadsheetId();
  const sheetName = entregasSheetName();
  const state = await getEntregasSyncState(spreadsheetId, sheetName);
  const full = Boolean(options.full);

  let mode: DeliverySyncResult["mode"];
  let startRow: number;
  let todayOnly = false;
  let sheetLastRow = state.lastRow;

  if (full) {
    mode = "full";
    startRow = 2;
    const col = await fetchSheetLastRow(spreadsheetId, sheetName);
    sheetLastRow = col;
  } else if (state.lastRow >= 2) {
    mode = "incremental";
    startRow = state.lastRow + 1;
  } else {
    mode = "bootstrap_today";
    todayOnly = true;
    sheetLastRow = await fetchSheetLastRow(spreadsheetId, sheetName);
    startRow = Math.max(2, sheetLastRow - BOOTSTRAP_TAIL_ROWS + 1);
  }

  if (sheetLastRow < 2 || startRow > sheetLastRow) {
    return {
      spreadsheetId,
      sheetName,
      mode: "noop",
      sheetLastRow,
      startRow,
      scannedRows: 0,
      created: 0,
      updated: 0,
      skipped: 0,
      filteredOut: 0,
      unassigned: await prisma.delivery.count({ where: { needsReview: true } }),
      recalced: 0,
      lastSyncedAt: state.lastSyncedAt || new Date().toISOString(),
      lastRow: state.lastRow,
    };
  }

  const [headers, dataRows] = await Promise.all([
    fetchEntregasHeaders(spreadsheetId, sheetName),
    fetchEntregasRowsFrom(spreadsheetId, sheetName, startRow),
  ]);

  if (!dataRows.length) {
    return {
      spreadsheetId,
      sheetName,
      mode: "noop",
      sheetLastRow: state.lastRow,
      startRow,
      scannedRows: 0,
      created: 0,
      updated: 0,
      skipped: 0,
      filteredOut: 0,
      unassigned: await prisma.delivery.count({ where: { needsReview: true } }),
      recalced: 0,
      lastSyncedAt: state.lastSyncedAt || new Date().toISOString(),
      lastRow: state.lastRow,
    };
  }

  sheetLastRow = startRow + dataRows.length - 1;

  const now = new Date();
  const lastSyncedAt = now.toISOString();
  let created = 0;
  let updated = 0;
  let skipped = 0;
  let filteredOut = 0;
  const recalcPairs: Array<{ ambassadorId: string; monthRef: string }> = [];
  const cache: AmbassadorCache = new Map();

  for (let i = 0; i < dataRows.length; i++) {
    const row = sheetRowToObject(headers, dataRows[i]);
    const rowNumber = startRow + i;
    const parsed = parseDeliverySheetRow(row);

    if (todayOnly && parsed && !isTodayBr(parsed.submittedAt)) {
      filteredOut++;
      continue;
    }

    const result = await upsertDeliveryFromSheetRow(
      spreadsheetId,
      sheetName,
      rowNumber,
      row,
      now,
      cache
    );

    if (result.action === "skipped") {
      skipped++;
      continue;
    }
    if (result.action === "created") created++;
    else updated++;

    if (result.ambassadorId && result.monthRef) {
      recalcPairs.push({ ambassadorId: result.ambassadorId, monthRef: result.monthRef });
    }
  }

  await recalcMonthlyControlsFor(recalcPairs);

  const newLastRow = startRow + dataRows.length - 1;
  await setEntregasSyncState(spreadsheetId, sheetName, {
    lastRow: newLastRow,
    lastSyncedAt,
  });

  const unassigned = await prisma.delivery.count({ where: { needsReview: true } });

  return {
    spreadsheetId,
    sheetName,
    mode,
    sheetLastRow,
    startRow,
    scannedRows: dataRows.length,
    created,
    updated,
    skipped,
    filteredOut,
    unassigned,
    recalced: recalcPairs.length,
    lastSyncedAt,
    lastRow: newLastRow,
  };
}

export async function getDeliveriesSyncStatus() {
  const spreadsheetId = superSpreadsheetId();
  const sheetName = entregasSheetName();
  const state = await getEntregasSyncState(spreadsheetId, sheetName);
  return { spreadsheetId, sheetName, ...state };
}
