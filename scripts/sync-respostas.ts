/** Sync Respostas OAB/ECJ da planilha. Uso: npx tsx --env-file=.env scripts/sync-respostas.ts [--full] */
import { syncCandidaturasFromSheets } from "../src/lib/candidaturas-sync";

async function main() {
  const full = process.argv.includes("--full");
  const result = await syncCandidaturasFromSheets({ full });
  console.log(JSON.stringify(result, null, 2));
}

main().catch((e) => {
  console.error("ERRO:", e instanceof Error ? e.message : e);
  process.exit(1);
});
