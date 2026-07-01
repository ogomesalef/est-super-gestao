/** Sync ENTREGAS da planilha. Uso: npx tsx --env-file=.env scripts/sync-entregas.ts */
import { syncDeliveriesFromSheet } from "../src/lib/delivery-sync";

async function main() {
  const result = await syncDeliveriesFromSheet();
  console.log(JSON.stringify(result, null, 2));
}

main().catch((e) => {
  console.error("ERRO:", e.message);
  process.exit(1);
});
