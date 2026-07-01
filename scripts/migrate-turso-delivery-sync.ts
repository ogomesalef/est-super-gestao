/**
 * Colunas de sync de entregas (Delivery).
 * Uso: npx tsx --env-file=.env scripts/migrate-turso-delivery-sync.ts
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
  "ALTER TABLE Delivery ADD COLUMN monthRef TEXT",
  "ALTER TABLE Delivery ADD COLUMN sheetSyncKey TEXT",
  "ALTER TABLE Delivery ADD COLUMN needsReview INTEGER NOT NULL DEFAULT 0",
  "ALTER TABLE Delivery ADD COLUMN syncedAt TEXT",
  "ALTER TABLE Delivery ADD COLUMN updatedAt TEXT",
  "CREATE UNIQUE INDEX IF NOT EXISTS Delivery_sheetSyncKey_key ON Delivery(sheetSyncKey)",
  "CREATE INDEX IF NOT EXISTS Delivery_monthRef_idx ON Delivery(monthRef)",
  "CREATE INDEX IF NOT EXISTS Delivery_needsReview_idx ON Delivery(needsReview)",
];

async function columnExists(table: string, column: string): Promise<boolean> {
  const rs = await client.execute(`PRAGMA table_info(${table})`);
  return rs.rows.some((r) => String(r.name) === column);
}

async function main() {
  for (const sql of statements) {
    const addCol = sql.match(/ADD COLUMN (\w+)/);
    if (addCol) {
      const col = addCol[1];
      if (await columnExists("Delivery", col)) {
        console.log(`skip Delivery.${col}`);
        continue;
      }
    }
    try {
      await client.execute(sql);
      console.log(`ok ${sql.slice(0, 80)}`);
    } catch (e) {
      const msg = String(e);
      if (msg.includes("duplicate column") || msg.includes("already exists")) {
        console.log(`skip (${msg.slice(0, 60)})`);
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
