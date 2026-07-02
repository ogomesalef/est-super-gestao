/**
 * Tabelas de vídeo collab por campanha.
 * Uso: npx tsx --env-file=.env scripts/migrate-turso-campaign-collab.ts
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
  `CREATE TABLE IF NOT EXISTS CampaignCollab (
    id TEXT NOT NULL PRIMARY KEY,
    campaignId TEXT NOT NULL,
    title TEXT,
    videoUrl TEXT NOT NULL,
    notes TEXT,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL,
    CONSTRAINT CampaignCollab_campaignId_fkey FOREIGN KEY (campaignId) REFERENCES Campaign (id) ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  "CREATE UNIQUE INDEX IF NOT EXISTS CampaignCollab_campaignId_key ON CampaignCollab(campaignId)",
  `CREATE TABLE IF NOT EXISTS CampaignCollabAssignment (
    id TEXT NOT NULL PRIMARY KEY,
    collabId TEXT NOT NULL,
    ambassadorId TEXT NOT NULL,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT CampaignCollabAssignment_collabId_fkey FOREIGN KEY (collabId) REFERENCES CampaignCollab (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT CampaignCollabAssignment_ambassadorId_fkey FOREIGN KEY (ambassadorId) REFERENCES Ambassador (id) ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  "CREATE UNIQUE INDEX IF NOT EXISTS CampaignCollabAssignment_collabId_ambassadorId_key ON CampaignCollabAssignment(collabId, ambassadorId)",
  "CREATE INDEX IF NOT EXISTS CampaignCollabAssignment_ambassadorId_idx ON CampaignCollabAssignment(ambassadorId)",
];

async function main() {
  for (const sql of statements) {
    await client.execute(sql);
    console.log(`ok ${sql.split("\n")[0]}…`);
  }
  console.log("Migration campaign collab concluída.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
