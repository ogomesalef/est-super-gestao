/** Cria tabela AppSetting se não existir. */
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
  if (await tableExists("AppSetting")) {
    console.log("skip AppSetting (já existe)");
    return;
  }
  await client.execute(`
    CREATE TABLE AppSetting (
      key TEXT NOT NULL PRIMARY KEY,
      value TEXT NOT NULL,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log("ok AppSetting criada");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
