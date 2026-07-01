/** Recalcula % entregas de todo MonthlyControl a partir das Delivery atuais. */
import { prisma } from "../src/lib/prisma";
import { recalcAllMonthlyControls } from "../src/lib/delivery-calc";

async function main() {
  const n = await recalcAllMonthlyControls();
  console.log(`Recalculado: ${n} linhas de controle mensal`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
