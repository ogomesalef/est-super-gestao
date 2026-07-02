/** Cria tabela AmbassadorQuickNote se não existir. */
import { createClient } from "@libsql/client";

const url = process.env.DATABASE_URL;
const authToken = process.env.DATABASE_AUTH_TOKEN;

if (!url?.startsWith("libsql://") || !authToken) {
  console.error("DATABASE_URL / DATABASE_AUTH_TOKEN ausentes");
  process.exit(1);
}

const client = createClient({ url, authToken });

async function tableExists(name: string): Promise<boolean> {
  const rs = await client.execute(
    `SELECT name FROM sqlite_master WHERE type='table' AND name='${name.replace(/'/g, "''")}'`
  );
  return rs.rows.length > 0;
}

async function main() {
  if (await tableExists("AmbassadorQuickNote")) {
    console.log("skip AmbassadorQuickNote (já existe)");
    return;
  }
  await client.execute(`
    CREATE TABLE AmbassadorQuickNote (
      id TEXT NOT NULL PRIMARY KEY,
      ambassadorId TEXT NOT NULL,
      text TEXT NOT NULL,
      pinned INTEGER NOT NULL DEFAULT 0,
      completed INTEGER NOT NULL DEFAULT 0,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      completedAt DATETIME,
      CONSTRAINT AmbassadorQuickNote_ambassadorId_fkey
        FOREIGN KEY (ambassadorId) REFERENCES Ambassador(id) ON DELETE CASCADE ON UPDATE CASCADE
    )
  `);
  await client.execute(
    `CREATE INDEX AmbassadorQuickNote_ambassadorId_idx ON AmbassadorQuickNote(ambassadorId)`
  );
  await client.execute(
    `CREATE INDEX AmbassadorQuickNote_ambassadorId_pinned_idx ON AmbassadorQuickNote(ambassadorId, pinned)`
  );
  await client.execute(
    `CREATE INDEX AmbassadorQuickNote_ambassadorId_completed_idx ON AmbassadorQuickNote(ambassadorId, completed)`
  );
  console.log("ok AmbassadorQuickNote criada");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
