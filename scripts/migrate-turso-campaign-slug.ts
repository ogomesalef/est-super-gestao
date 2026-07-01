/**
 * Adiciona publicSlug às campanhas + gera slugs para registros existentes.
 * Uso: npx tsx --env-file=.env scripts/migrate-turso-campaign-slug.ts
 */
import { createClient } from "@libsql/client";
import { randomBytes } from "crypto";

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

function slug(): string {
  return randomBytes(9).toString("base64url");
}

async function columnExists(table: string, column: string): Promise<boolean> {
  const rs = await client.execute(`PRAGMA table_info(${table})`);
  return rs.rows.some((r) => String(r.name) === column);
}

async function main() {
  if (!(await columnExists("Campaign", "publicSlug"))) {
    await client.execute("ALTER TABLE Campaign ADD COLUMN publicSlug TEXT");
    console.log("ok ALTER TABLE Campaign ADD COLUMN publicSlug");
    try {
      await client.execute("CREATE UNIQUE INDEX Campaign_publicSlug_key ON Campaign(publicSlug)");
    } catch {
      await client.execute("CREATE UNIQUE INDEX IF NOT EXISTS Campaign_publicSlug_idx ON Campaign(publicSlug)");
    }
  } else {
    console.log("skip Campaign.publicSlug (já existe)");
  }

  const rs = await client.execute("SELECT id FROM Campaign WHERE publicSlug IS NULL OR publicSlug = ''");
  for (const row of rs.rows) {
    const id = String(row.id);
    for (let attempt = 0; attempt < 5; attempt++) {
      const s = slug();
      try {
        await client.execute({
          sql: "UPDATE Campaign SET publicSlug = ? WHERE id = ?",
          args: [s, id],
        });
        console.log(`slug ok ${id} → /c/${s}`);
        break;
      } catch {
        /* collision */
      }
    }
  }

  console.log("Migration publicSlug concluída.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
