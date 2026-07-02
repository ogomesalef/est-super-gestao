/**
 * Campos de Drive para collab (pastas e vídeos organizados).
 * Uso: npx tsx --env-file=.env scripts/migrate-turso-campaign-collab-drive.ts
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
  "ALTER TABLE CampaignCollab ADD COLUMN driveFolderUrl TEXT",
  "ALTER TABLE CampaignCollab ADD COLUMN driveInboxUrl TEXT",
  "ALTER TABLE CampaignCollabAssignment ADD COLUMN driveFolderUrl TEXT",
  "ALTER TABLE CampaignCollabAssignment ADD COLUMN driveVideoUrl TEXT",
];

async function columnExists(table: string, column: string): Promise<boolean> {
  const rs = await client.execute(`PRAGMA table_info(${table})`);
  return rs.rows.some((r) => String(r.name) === column);
}

async function main() {
  for (const sql of statements) {
    const col = sql.match(/ADD COLUMN (\w+)/)?.[1];
    const table = sql.match(/ALTER TABLE (\w+)/)?.[1];
    if (col && table && (await columnExists(table, col))) {
      console.log(`skip ${table}.${col} (já existe)`);
      continue;
    }
    await client.execute(sql);
    console.log(`ok ${sql}`);
  }
  console.log("Migration collab drive concluída.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
