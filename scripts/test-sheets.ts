/** Testa leitura da aba ENTREGAS. Uso: npx tsx --env-file=.env scripts/test-sheets.ts */
import { entregasSheetName, fetchSheetValues, superSpreadsheetId } from "../src/lib/google-sheets";

async function main() {
  const id = superSpreadsheetId();
  const sheet = entregasSheetName();
  const range = `'${sheet}'!A1:Z3`;
  console.log("Lendo", id, range);
  const rows = await fetchSheetValues(id, range);
  console.log("OK:", rows.length, "linhas,", rows[0]?.length, "colunas");
  console.log("Headers:", rows[0]?.slice(0, 6).join(" | "));
}

main().catch((e) => {
  console.error("ERRO:", e.message);
  process.exit(1);
});
