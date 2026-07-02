/**
 * Contatos sem parceria → status Trabalhando.
 * Uso: npx tsx --env-file=.env scripts/fix-contatos-trabalhando.ts
 */
import { createClient } from "@libsql/client";

const url = process.env.DATABASE_URL;
const authToken = process.env.DATABASE_AUTH_TOKEN;

if (!url?.startsWith("libsql://")) {
  console.error("DATABASE_URL deve apontar para Turso (libsql://)");
  process.exit(1);
}
if (!authToken) {
  console.error("DATABASE_AUTH_TOKEN ausente");
  process.exit(1);
}

const client = createClient({ url, authToken });

async function main() {
  const r = await client.execute(
    `UPDATE Contact SET status = 'Trabalhando', statusChangedAt = CURRENT_TIMESTAMP
     WHERE ambassadorId IS NULL AND status != 'Desinteressado' AND status != 'Trabalhando'`
  );
  console.log(`${r.rowsAffected} contato(s) atualizado(s) para Trabalhando.`);

  const counts = await client.execute(
    "SELECT status, COUNT(*) as n FROM Contact GROUP BY status ORDER BY status"
  );
  console.log("Contagem por status:");
  for (const row of counts.rows) {
    console.log(`  ${row.status}: ${row.n}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
