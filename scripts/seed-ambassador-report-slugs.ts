/**
 * Gera slugs de relatório público para embaixadores ativos.
 * Uso: npx tsx --env-file=.env scripts/seed-ambassador-report-slugs.ts
 */
import { ensureReportSlugsForActiveAmbassadors } from "../src/lib/ambassador-report";

async function main() {
  const results = await ensureReportSlugsForActiveAmbassadors();
  console.log(`\n${results.length} relatórios públicos:\n`);
  for (const r of results) {
    console.log(`${r.fullName}`);
    console.log(`  ${r.reportUrl}`);
    console.log(`  slug: ${r.reportSlug}`);
    console.log();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
