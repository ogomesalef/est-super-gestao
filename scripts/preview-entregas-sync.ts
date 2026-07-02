/** Preview do sync ENTREGAS (sem gravar no banco). Uso: npm run preview:entregas */
import { previewDeliveriesFromSheet } from "../src/lib/delivery-sync";

async function main() {
  const result = await previewDeliveriesFromSheet();
  console.log(JSON.stringify(result, null, 2));
}

main().catch((e) => {
  console.error("ERRO:", e.message);
  process.exit(1);
});
