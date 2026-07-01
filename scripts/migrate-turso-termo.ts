/**
 * Adiciona colunas do termo de parceria (Partnership + MonthlyFinance).
 * Uso: npx tsx --env-file=.env scripts/migrate-turso-termo.ts
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

const statements = [
  "ALTER TABLE Partnership ADD COLUMN legalCpf TEXT",
  "ALTER TABLE Partnership ADD COLUMN legalAddress TEXT",
  "ALTER TABLE Partnership ADD COLUMN bankDetails TEXT",
  "ALTER TABLE MonthlyFinance ADD COLUMN termDocLink TEXT",
  "ALTER TABLE MonthlyFinance ADD COLUMN termActivity TEXT",
];

async function columnExists(table: string, column: string): Promise<boolean> {
  const rs = await client.execute(`PRAGMA table_info(${table})`);
  return rs.rows.some((r) => String(r.name) === column);
}

async function main() {
  for (const sql of statements) {
    const col = sql.match(/ADD COLUMN (\w+)/)?.[1];
    const table = sql.includes("Partnership") ? "Partnership" : "MonthlyFinance";
    if (col && (await columnExists(table, col))) {
      console.log(`skip ${table}.${col} (já existe)`);
      continue;
    }
    try {
      await client.execute(sql);
      console.log(`ok ${sql}`);
    } catch (e) {
      const msg = String(e);
      if (msg.includes("duplicate column")) {
        console.log(`skip ${col} (duplicate)`);
      } else {
        throw e;
      }
    }
  }
  console.log("Migration concluída.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
