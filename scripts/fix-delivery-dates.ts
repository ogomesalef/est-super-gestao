/**
 * Corrige postedAt/monthRef de entregas importadas de CSV (sheetSyncKey csv:ENTREGAS:N).
 * Uso: npm run fix:delivery-dates -- "/caminho/ENTREGAS.csv"
 */
import * as fs from "fs";
import * as path from "path";
import * as XLSX from "xlsx";
import { prisma } from "../src/lib/prisma";
import { recalcMonthlyControlsFor } from "../src/lib/delivery-calc";
import { parseDeliverySheetRow, type SheetRow } from "../src/lib/delivery-row";
import { csvToObjects } from "../src/lib/csv-parse";

function loadRows(filePath: string): SheetRow[] {
  const ext = path.extname(filePath).toLowerCase();
  if (!fs.existsSync(filePath)) throw new Error(`Arquivo não encontrado: ${filePath}`);

  if (ext === ".csv") {
    return csvToObjects(fs.readFileSync(filePath, "utf8")) as SheetRow[];
  }

  const wb = XLSX.readFile(filePath);
  const sheetName = wb.SheetNames.find((n) => n.toUpperCase() === "ENTREGAS") || wb.SheetNames[0];
  const sheet = wb.Sheets[sheetName];
  if (!sheet) throw new Error("Planilha vazia");
  return XLSX.utils.sheet_to_json(sheet, { defval: "", raw: true }) as SheetRow[];
}

async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error("Uso: npm run fix:delivery-dates -- /caminho/ENTREGAS.csv");
    process.exit(1);
  }

  const rows = loadRows(filePath);
  let updated = 0;
  let unchanged = 0;
  let missing = 0;
  const recalcPairs: Array<{ ambassadorId: string; monthRef: string }> = [];

  for (let i = 0; i < rows.length; i++) {
    const parsed = parseDeliverySheetRow(rows[i]);
    if (!parsed) continue;

    const sheetSyncKey = `csv:ENTREGAS:${i + 2}`;
    const existing = await prisma.delivery.findUnique({ where: { sheetSyncKey } });
    if (!existing) {
      missing++;
      continue;
    }

    const oldMonthRef = existing.monthRef;
    const newPostedAt = parsed.postedAt;
    const newMonthRef = parsed.monthRef;
    const samePosted =
      (!existing.postedAt && !newPostedAt) ||
      (existing.postedAt &&
        newPostedAt &&
        existing.postedAt.getTime() === newPostedAt.getTime());

    if (samePosted && oldMonthRef === newMonthRef) {
      unchanged++;
      continue;
    }

    await prisma.delivery.update({
      where: { id: existing.id },
      data: {
        postedAt: newPostedAt,
        submittedAt: parsed.submittedAt,
        monthRef: newMonthRef,
      },
    });
    updated++;

    if (existing.ambassadorId && oldMonthRef) {
      recalcPairs.push({ ambassadorId: existing.ambassadorId, monthRef: oldMonthRef });
    }
    if (existing.ambassadorId && newMonthRef) {
      recalcPairs.push({ ambassadorId: existing.ambassadorId, monthRef: newMonthRef });
    }
  }

  await recalcMonthlyControlsFor(recalcPairs);

  console.log(JSON.stringify({ rows: rows.length, updated, unchanged, missing, recalced: new Set(recalcPairs.map((p) => `${p.ambassadorId}:${p.monthRef}`)).size }, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
