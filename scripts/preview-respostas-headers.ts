/** Uso: npx tsx --env-file=.env scripts/preview-respostas-headers.ts */
import { fetchSheetLastRow, fetchSheetValues, superSpreadsheetId } from "../src/lib/google-sheets";

async function main() {
  const id = superSpreadsheetId();
  for (const sheet of ["Respostas OAB", "Respostas ECJ"]) {
    const rows = await fetchSheetValues(id, `'${sheet}'!1:2`);
    const lastRow = await fetchSheetLastRow(id, sheet);
    console.log(`\n=== ${sheet} (${lastRow} linhas) ===`);
    console.log(rows[0]?.join("\n") || "(sem headers)");
    if (rows[1]) {
      console.log("\n--- linha 2 (amostra) ---");
      rows[0].forEach((h, i) => {
        if (rows[1][i]) console.log(`${h}: ${rows[1][i]}`);
      });
    }
  }
}

main().catch((e) => {
  console.error("ERRO:", e.message);
  process.exit(1);
});
