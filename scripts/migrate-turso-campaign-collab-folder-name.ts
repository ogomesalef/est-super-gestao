/**
 * Campo driveFolderName no collab.
 * Uso: npx tsx --env-file=.env scripts/migrate-turso-campaign-collab-folder-name.ts
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
  const sql = "ALTER TABLE CampaignCollab ADD COLUMN driveFolderName TEXT";
  if (await columnExists("CampaignCollab", "driveFolderName")) {
    console.log("skip CampaignCollab.driveFolderName (já existe)");
  } else {
    await client.execute(sql);
    console.log(`ok ${sql}`);
  }
  console.log("Migration driveFolderName concluída.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
