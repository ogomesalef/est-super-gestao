/**
 * Importa aba ENTREGAS de CSV ou XLSX exportado da planilha.
 * Uso: npm run import:entregas-csv -- "/caminho/ENTREGAS.csv"
 */
import * as fs from "fs";
import * as path from "path";
import * as XLSX from "xlsx";
import { prisma } from "../src/lib/prisma";
import { recalcMonthlyControlsFor } from "../src/lib/delivery-calc";
import { parseDeliverySheetRow, type SheetRow } from "../src/lib/delivery-row";
import { csvToObjects } from "../src/lib/csv-parse";
import { normalizeHandle } from "../src/lib/utils";
import { setEntregasSyncState } from "../src/lib/delivery-sync-state";
import { superSpreadsheetId, entregasSheetName } from "../src/lib/google-sheets";

function loadRows(filePath: string): SheetRow[] {
  const ext = path.extname(filePath).toLowerCase();
  if (!fs.existsSync(filePath)) throw new Error(`Arquivo não encontrado: ${filePath}`);

  if (ext === ".csv") {
    const content = fs.readFileSync(filePath, "utf8");
    return csvToObjects(content) as SheetRow[];
  }

  const wb = XLSX.readFile(filePath);
  const sheetName = wb.SheetNames.find((n) => n.toUpperCase() === "ENTREGAS") || wb.SheetNames[0];
  const sheet = wb.Sheets[sheetName];
  if (!sheet) throw new Error("Planilha vazia");

  return XLSX.utils.sheet_to_json(sheet, { defval: "", raw: true }) as SheetRow[];
}

async function resolveAmbassadorId(program: string, instagram: string, email: string | null) {
  const ig = normalizeHandle(instagram);
  if (!ig || ig === "@") return null;

  const amb = await prisma.ambassador.findUnique({
    where: { program_instagram: { program, instagram: ig } },
  });
  if (amb) return amb.id;

  if (email) {
    const byEmail = await prisma.ambassador.findFirst({ where: { program, email } });
    if (byEmail) return byEmail.id;
  }
  return null;
}

async function resolveCampaignId(campaignName: string | null) {
  if (!campaignName) return null;
  const lower = campaignName.toLowerCase();
  if (lower.includes("não se aplica") || lower === "nenhuma") return null;
  const camp = await prisma.campaign.findFirst({ where: { name: campaignName } });
  return camp?.id ?? null;
}

async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error("Uso: npm run import:entregas-csv -- /caminho/ENTREGAS.csv");
    process.exit(1);
  }

  const rows = loadRows(filePath);
  console.log(`Lendo ${rows.length} linhas de ${filePath}`);

  let created = 0;
  let skipped = 0;
  let unassigned = 0;
  const recalcPairs: Array<{ ambassadorId: string; monthRef: string }> = [];
  const now = new Date();

  for (let i = 0; i < rows.length; i++) {
    const parsed = parseDeliverySheetRow(rows[i]);
    if (!parsed) {
      skipped++;
      continue;
    }

    const ambassadorId = await resolveAmbassadorId(
      parsed.program,
      parsed.instagram,
      parsed.email
    );
    const campaignId = await resolveCampaignId(parsed.campaignName);
    const needsReview = !ambassadorId;
    if (needsReview) unassigned++;

    const sheetSyncKey = `csv:ENTREGAS:${i + 2}`;

    await prisma.delivery.create({
      data: {
        sheetSyncKey,
        ambassadorId,
        campaignId,
        needsReview,
        monthRef: parsed.monthRef,
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
        syncedAt: now,
      },
    });
    created++;

    if (ambassadorId && parsed.monthRef) {
      recalcPairs.push({ ambassadorId, monthRef: parsed.monthRef });
    }
  }

  await recalcMonthlyControlsFor(recalcPairs);

  const lastRow = rows.length + 1;
  await setEntregasSyncState(superSpreadsheetId(), entregasSheetName(), {
    lastRow,
    lastSyncedAt: now.toISOString(),
  });

  console.log(
    JSON.stringify(
      { created, skipped, unassigned, recalced: new Set(recalcPairs.map((p) => `${p.ambassadorId}:${p.monthRef}`)).size, lastRow },
      null,
      2
    )
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
