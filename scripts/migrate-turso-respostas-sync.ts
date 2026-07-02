/**
 * Campos de sync Respostas (form completo + chave da planilha).
 * Uso: npx tsx --env-file=.env scripts/migrate-turso-respostas-sync.ts
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
  "ALTER TABLE Ambassador ADD COLUMN applicationFormData TEXT",
  "ALTER TABLE Ambassador ADD COLUMN sheetSyncKey TEXT",
  "ALTER TABLE Ambassador ADD COLUMN respostasSheetName TEXT",
  "ALTER TABLE Ambassador ADD COLUMN respostasSheetRow INTEGER",
  "CREATE UNIQUE INDEX IF NOT EXISTS Ambassador_sheetSyncKey_key ON Ambassador(sheetSyncKey)",
];

async function main() {
  for (const sql of statements) {
    try {
      await client.execute(sql);
      console.log(`ok ${sql}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes("duplicate column") || msg.includes("already exists")) {
        console.log(`skip ${sql}`);
      } else {
        throw e;
      }
    }
  }
  console.log("Migration respostas sync concluída.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
