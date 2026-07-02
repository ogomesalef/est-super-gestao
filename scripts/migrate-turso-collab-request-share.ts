/**
 * Colunas de compartilhamento editor por pedido de vídeo.
 * Uso: npx tsx --env-file=.env scripts/migrate-turso-collab-request-share.ts
 */
import { createClient } from "@libsql/client";

const url = process.env.DATABASE_URL;
const authToken = process.env.DATABASE_AUTH_TOKEN;

if (!url?.startsWith("libsql://") || !authToken) {
  console.error("DATABASE_URL (libsql) e DATABASE_AUTH_TOKEN são obrigatórios");
  process.exit(1);
}

const client = createClient({ url, authToken });

const cols = [
  "ALTER TABLE CampaignCollabRequest ADD COLUMN driveShareEmail TEXT",
  "ALTER TABLE CampaignCollabRequest ADD COLUMN driveSharePermissionId TEXT",
  "ALTER TABLE CampaignCollabRequest ADD COLUMN driveEditorShared INTEGER DEFAULT 0",
];

async function columnExists(table: string, column: string): Promise<boolean> {
  const rs = await client.execute(`PRAGMA table_info(${table})`);
  return rs.rows.some((r) => String(r.name) === column);
}

async function main() {
  for (const sql of cols) {
    const col = sql.match(/ADD COLUMN (\w+)/)?.[1];
    if (col && (await columnExists("CampaignCollabRequest", col))) {
      console.log(`skip CampaignCollabRequest.${col}`);
      continue;
    }
    await client.execute(sql);
    console.log(`ok ${sql}`);
  }
  console.log("Migration request share concluída.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
