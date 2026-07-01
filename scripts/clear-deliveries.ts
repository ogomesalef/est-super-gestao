/**
 * Remove todas as entregas individuais e zera o ponteiro de sync da planilha.
 * Uso: npm run db:clear-deliveries
 */
import { prisma } from "../src/lib/prisma";
import { recalcAllMonthlyControls } from "../src/lib/delivery-calc";
import { superSpreadsheetId, entregasSheetName } from "../src/lib/google-sheets";

async function main() {
  const deleted = await prisma.delivery.deleteMany({});
  console.log(`Delivery: ${deleted.count} registros removidos`);

  const syncKey = `entregas_sync:${superSpreadsheetId()}:${entregasSheetName()}`;
  const removed = await prisma.appSetting.deleteMany({
    where: { key: { startsWith: "entregas_sync:" } },
  });
  console.log(`AppSetting sync: ${removed.count} chave(s) removida(s) (${syncKey})`);

  const recalced = await recalcAllMonthlyControls();
  console.log(`MonthlyControl: ${recalced} linhas recalculadas (% entregas zerado)`);

  console.log("Pronto. Importe o CSV com npm run import:entregas-csv -- caminho/arquivo.csv");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
