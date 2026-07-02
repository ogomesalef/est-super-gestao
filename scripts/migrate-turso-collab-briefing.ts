/**
 * Páginas públicas de briefing por embaixador + pedidos de vídeo.
 * Uso: npx tsx --env-file=.env scripts/migrate-turso-collab-briefing.ts
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

const assignmentCols = [
  "ALTER TABLE CampaignCollabAssignment ADD COLUMN publicSlug TEXT",
  "ALTER TABLE CampaignCollabAssignment ADD COLUMN driveUploadPublic INTEGER DEFAULT 0",
  "ALTER TABLE CampaignCollabAssignment ADD COLUMN updatedAt DATETIME",
];

async function columnExists(table: string, column: string): Promise<boolean> {
  const rs = await client.execute(`PRAGMA table_info(${table})`);
  return rs.rows.some((r) => String(r.name) === column);
}

async function tableExists(table: string): Promise<boolean> {
  const rs = await client.execute(
    `SELECT name FROM sqlite_master WHERE type='table' AND name='${table}'`
  );
  return rs.rows.length > 0;
}

async function main() {
  for (const sql of assignmentCols) {
    const col = sql.match(/ADD COLUMN (\w+)/)?.[1];
    const table = sql.match(/ALTER TABLE (\w+)/)?.[1];
    if (col && table && (await columnExists(table, col))) {
      console.log(`skip ${table}.${col}`);
      continue;
    }
    await client.execute(sql);
    console.log(`ok ${sql}`);
  }

  if (!(await tableExists("CampaignCollabRequest"))) {
    await client.execute(`
      CREATE TABLE CampaignCollabRequest (
        id TEXT NOT NULL PRIMARY KEY,
        assignmentId TEXT NOT NULL,
        sortOrder INTEGER NOT NULL DEFAULT 0,
        title TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'open',
        introText TEXT,
        scriptMarkdown TEXT,
        videoDueDate DATETIME,
        publishDueDate DATETIME,
        completedVideoUrl TEXT,
        driveFolderUrl TEXT,
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME NOT NULL,
        CONSTRAINT CampaignCollabRequest_assignmentId_fkey FOREIGN KEY (assignmentId) REFERENCES CampaignCollabAssignment (id) ON DELETE CASCADE ON UPDATE CASCADE
      )
    `);
    await client.execute(
      "CREATE INDEX IF NOT EXISTS CampaignCollabRequest_assignmentId_idx ON CampaignCollabRequest(assignmentId)"
    );
    console.log("ok CREATE TABLE CampaignCollabRequest");
  } else {
    console.log("skip CampaignCollabRequest (já existe)");
  }

  try {
    await client.execute(
      "CREATE UNIQUE INDEX IF NOT EXISTS CampaignCollabAssignment_publicSlug_key ON CampaignCollabAssignment(publicSlug)"
    );
  } catch {
    /* ok */
  }

  await client.execute(
    "UPDATE CampaignCollabAssignment SET updatedAt = COALESCE(updatedAt, createdAt, CURRENT_TIMESTAMP) WHERE updatedAt IS NULL"
  );

  console.log("Migration collab briefing concluída.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
