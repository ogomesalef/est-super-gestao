/**
 * Adiciona reportSlug ao cadastro de embaixadores.
 * Uso: npx tsx --env-file=.env scripts/migrate-turso-ambassador-report-slug.ts
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

async function columnExists(table: string, column: string): Promise<boolean> {
  const rs = await client.execute(`PRAGMA table_info(${table})`);
  return rs.rows.some((r) => String(r.name) === column);
}

async function main() {
  if (await columnExists("Ambassador", "reportSlug")) {
    console.log("skip Ambassador.reportSlug (já existe)");
    return;
  }
  await client.execute("ALTER TABLE Ambassador ADD COLUMN reportSlug TEXT");
  console.log("ok ALTER TABLE Ambassador ADD COLUMN reportSlug");
  try {
    await client.execute("CREATE UNIQUE INDEX Ambassador_reportSlug_key ON Ambassador(reportSlug)");
  } catch {
    await client.execute("CREATE UNIQUE INDEX IF NOT EXISTS Ambassador_reportSlug_idx ON Ambassador(reportSlug)");
  }
  console.log("Migration reportSlug concluída.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
