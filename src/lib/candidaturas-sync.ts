import { prisma } from "./prisma";
import {
  ensureContactForFormAmbassador,
  linkContactByInstagram,
  resolveCrossProgramCandidacyDuplicate,
} from "./candidaturas-link";
import {
  fetchEntregasHeaders,
  fetchEntregasRowsFrom,
  fetchSheetLastRow,
  isSheetsSyncConfigured,
  superSpreadsheetId,
} from "./google-sheets";
import { getRespostasSyncState, setRespostasSyncState } from "./respostas-sync-state";
import { getCachedCandidaturasSyncStatus, invalidateCandidaturasSyncCache } from "./sync-status-cache";
import {
  buildRespostasSheetSyncKey,
  parseRespostasSheetRow,
  sheetRowToObject,
  type ParsedRespostasRow,
  type SheetRow,
} from "./respostas-row";

export const RESPOSTAS_SHEETS = [
  { sheetName: "Respostas OAB", program: "OAB" as const },
  { sheetName: "Respostas ECJ", program: "ECJ" as const },
];

const BOOTSTRAP_TAIL_ROWS = 200;

export type UpsertRespostasOptions = {
  source?: "formulario" | "import" | "sheets" | "manual";
  sheetSyncKey?: string;
  respostasSheetName?: string;
  respostasSheetRow?: number;
  /** Força needsReview mesmo se já existir (nova candidatura). */
  markNeedsReview?: boolean;
};

export type UpsertRespostasResult = {
  ambassadorId: string;
  created: boolean;
  linkedContactId: string | null;
};

function resolveNeedsReview(
  status: string,
  existing: { needsReview: boolean } | null,
  created: boolean,
  opts: UpsertRespostasOptions
): boolean {
  if (status !== "Pendente") return false;
  if (existing && !created) return existing.needsReview;
  if (opts.markNeedsReview || opts.source === "formulario") return true;
  return true;
}

export async function upsertAmbassadorFromRespostas(
  parsed: ParsedRespostasRow,
  opts: UpsertRespostasOptions = {}
): Promise<UpsertRespostasResult> {
  const source = opts.source || "sheets";
  const existing = await prisma.ambassador.findUnique({
    where: { program_instagram: { program: parsed.program, instagram: parsed.instagram } },
    include: { partnership: true },
  });

  const submittedAt = parsed.submittedAt ?? new Date();
  const created = !existing;
  const needsReview = resolveNeedsReview(parsed.status, existing, created, opts);

  const formJson = JSON.stringify(parsed.applicationFormData);
  const p = parsed.partnership;

  const status =
    existing?.status === "Ativo" || existing?.status === "Proposta"
      ? existing.status
      : parsed.status;

  const ambassadorData = {
    fullName: parsed.fullName,
    email: parsed.email,
    whatsapp: parsed.whatsapp,
    tiktok: parsed.tiktok,
    youtube: parsed.youtube,
    status,
    alerts: parsed.alerts,
    gmailThreadId: parsed.gmailThreadId ?? existing?.gmailThreadId ?? null,
    source: existing?.source || source,
    applicationReceivedAt: submittedAt,
    needsReview,
    applicationFormData: formJson,
    ...(opts.sheetSyncKey ? { sheetSyncKey: opts.sheetSyncKey } : {}),
    ...(opts.respostasSheetName ? { respostasSheetName: opts.respostasSheetName } : {}),
    ...(opts.respostasSheetRow ? { respostasSheetRow: opts.respostasSheetRow } : {}),
  };

  const partnershipData = {
    modality: p.modality ?? existing?.partnership?.modality ?? null,
    agreedValue: p.agreedValue ?? existing?.partnership?.agreedValue ?? null,
    courseName: p.courseName ?? existing?.partnership?.courseName ?? null,
    courseReleased: p.courseReleased || existing?.partnership?.courseReleased || false,
    courseReleaseDate: p.courseReleaseDate ?? existing?.partnership?.courseReleaseDate ?? null,
    metaFeed: p.metaFeed || existing?.partnership?.metaFeed || 0,
    metaStories: p.metaStories || existing?.partnership?.metaStories || 0,
    metaTiktok: p.metaTiktok || existing?.partnership?.metaTiktok || 0,
    metaYoutube: p.metaYoutube || existing?.partnership?.metaYoutube || 0,
    startDate: p.startDate ?? existing?.partnership?.startDate ?? null,
    endDate: p.endDate ?? existing?.partnership?.endDate ?? null,
    proposalSentAt: p.proposalSentAt ?? existing?.partnership?.proposalSentAt ?? null,
    formalizationSentAt: p.formalizationSentAt ?? existing?.partnership?.formalizationSentAt ?? null,
  };

  let ambassadorId: string;

  if (existing) {
    const amb = await prisma.ambassador.update({
      where: { id: existing.id },
      data: {
        ...ambassadorData,
        partnership: {
          upsert: {
            create: partnershipData,
            update: partnershipData,
          },
        },
      },
    });
    ambassadorId = amb.id;
  } else {
    const amb = await prisma.ambassador.create({
      data: {
        program: parsed.program,
        instagram: parsed.instagram,
        ...ambassadorData,
        partnership: { create: partnershipData },
      },
    });
    ambassadorId = amb.id;
  }

  let linkedContactId = await linkContactByInstagram(
    parsed.program,
    parsed.instagram,
    ambassadorId
  );

  const fromForm =
    opts.source === "formulario" ||
    Boolean(opts.respostasSheetName?.startsWith("Respostas "));

  if (!linkedContactId && fromForm) {
    linkedContactId = await ensureContactForFormAmbassador(
      ambassadorId,
      parsed.program,
      parsed.instagram,
      parsed.tiktok
    );
  }

  if (fromForm) {
    await resolveCrossProgramCandidacyDuplicate(parsed.program, parsed.instagram, ambassadorId);
  }

  return { ambassadorId, created, linkedContactId };
}

export async function upsertAmbassadorFromRespostasSheetRow(
  program: string,
  row: SheetRow,
  rowNumber: number,
  spreadsheetId: string,
  sheetName: string,
  source: UpsertRespostasOptions["source"] = "sheets"
): Promise<UpsertRespostasResult | null> {
  const parsed = parseRespostasSheetRow(row, program);
  if (!parsed) return null;
  return upsertAmbassadorFromRespostas(parsed, {
    source,
    sheetSyncKey: buildRespostasSheetSyncKey(spreadsheetId, sheetName, rowNumber),
    respostasSheetName: sheetName,
    respostasSheetRow: rowNumber,
  });
}

export type RespostasSheetSyncResult = {
  sheetName: string;
  program: string;
  mode: "incremental" | "bootstrap" | "full" | "noop";
  sheetLastRow: number;
  startRow: number;
  scannedRows: number;
  created: number;
  updated: number;
  skipped: number;
  pendingRows: number;
  lastSyncedAt: string;
  lastRow: number;
};

export type CandidaturasSyncResult = {
  spreadsheetId: string;
  sheets: RespostasSheetSyncResult[];
  totalCreated: number;
  totalUpdated: number;
  totalSkipped: number;
  totalPendingRows: number;
};

export type CandidaturasSyncStatus = {
  configured: boolean;
  spreadsheetId: string;
  sheets: Array<{
    sheetName: string;
    program: string;
    lastRow: number;
    sheetLastRow: number;
    pendingRows: number;
    lastSyncedAt: string | null;
  }>;
  totalPendingRows: number;
};

export async function getCandidaturasSyncStatus(): Promise<CandidaturasSyncStatus> {
  return getCachedCandidaturasSyncStatus(fetchCandidaturasSyncStatus);
}

async function fetchCandidaturasSyncStatus(): Promise<CandidaturasSyncStatus> {
  const spreadsheetId = superSpreadsheetId();
  const configured = isSheetsSyncConfigured();
  const sheets: CandidaturasSyncStatus["sheets"] = [];
  let totalPendingRows = 0;

  for (const { sheetName, program } of RESPOSTAS_SHEETS) {
    const state = await getRespostasSyncState(spreadsheetId, sheetName);
    let sheetLastRow = state.lastRow;
    if (configured) {
      try {
        sheetLastRow = await fetchSheetLastRow(spreadsheetId, sheetName);
      } catch {
        sheetLastRow = state.lastRow;
      }
    }
    const pendingRows = Math.max(0, sheetLastRow - state.lastRow);
    totalPendingRows += pendingRows;
    sheets.push({
      sheetName,
      program,
      lastRow: state.lastRow,
      sheetLastRow,
      pendingRows,
      lastSyncedAt: state.lastSyncedAt,
    });
  }

  return { configured, spreadsheetId, sheets, totalPendingRows };
}

async function syncRespostasSheet(
  spreadsheetId: string,
  sheetName: string,
  program: string,
  full: boolean
): Promise<RespostasSheetSyncResult> {
  const state = await getRespostasSyncState(spreadsheetId, sheetName);
  const sheetLastRow = await fetchSheetLastRow(spreadsheetId, sheetName);

  let mode: RespostasSheetSyncResult["mode"];
  let startRow: number;

  if (full) {
    mode = "full";
    startRow = 2;
  } else if (state.lastRow >= 2) {
    mode = "incremental";
    startRow = state.lastRow + 1;
  } else {
    mode = "bootstrap";
    startRow = Math.max(2, sheetLastRow - BOOTSTRAP_TAIL_ROWS + 1);
  }

  const pendingRows = Math.max(0, sheetLastRow - state.lastRow);

  if (sheetLastRow < 2 || startRow > sheetLastRow) {
    return {
      sheetName,
      program,
      mode: "noop",
      sheetLastRow,
      startRow,
      scannedRows: 0,
      created: 0,
      updated: 0,
      skipped: 0,
      pendingRows: 0,
      lastSyncedAt: state.lastSyncedAt || new Date().toISOString(),
      lastRow: state.lastRow,
    };
  }

  const [headers, dataRows] = await Promise.all([
    fetchEntregasHeaders(spreadsheetId, sheetName),
    fetchEntregasRowsFrom(spreadsheetId, sheetName, startRow),
  ]);

  let created = 0;
  let updated = 0;
  let skipped = 0;
  const now = new Date().toISOString();
  let maxRow = state.lastRow;

  for (let i = 0; i < dataRows.length; i++) {
    const rowNumber = startRow + i;
    const row = sheetRowToObject(headers, dataRows[i]);
    const result = await upsertAmbassadorFromRespostasSheetRow(
      program,
      row,
      rowNumber,
      spreadsheetId,
      sheetName,
      "sheets"
    );
    if (!result) {
      skipped++;
    } else if (result.created) {
      created++;
    } else {
      updated++;
    }
    maxRow = Math.max(maxRow, rowNumber);
  }

  const newLastRow = full || mode === "bootstrap" ? sheetLastRow : maxRow;
  await setRespostasSyncState(spreadsheetId, sheetName, {
    lastRow: newLastRow,
    lastSyncedAt: now,
  });

  return {
    sheetName,
    program,
    mode,
    sheetLastRow,
    startRow,
    scannedRows: dataRows.length,
    created,
    updated,
    skipped,
    pendingRows: Math.max(0, sheetLastRow - newLastRow),
    lastSyncedAt: now,
    lastRow: newLastRow,
  };
}

export async function syncCandidaturasFromSheets(opts?: { full?: boolean }): Promise<CandidaturasSyncResult> {
  const spreadsheetId = superSpreadsheetId();
  const full = opts?.full === true;
  const sheets: RespostasSheetSyncResult[] = [];

  for (const { sheetName, program } of RESPOSTAS_SHEETS) {
    sheets.push(await syncRespostasSheet(spreadsheetId, sheetName, program, full));
  }

  return {
    spreadsheetId,
    sheets,
    totalCreated: sheets.reduce((s, x) => s + x.created, 0),
    totalUpdated: sheets.reduce((s, x) => s + x.updated, 0),
    totalSkipped: sheets.reduce((s, x) => s + x.skipped, 0),
    totalPendingRows: sheets.reduce((s, x) => s + x.pendingRows, 0),
  };
}

/** Converte payload do webhook / objeto plano para ParsedRespostasRow. */
export function parseRespostasFromPayload(
  program: string,
  data: Record<string, unknown>
): ParsedRespostasRow | null {
  const row: SheetRow = {};
  for (const [k, v] of Object.entries(data)) {
    if (v != null && typeof v !== "object") row[k] = String(v);
  }
  return parseRespostasSheetRow(row, program);
}
