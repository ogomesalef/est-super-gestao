/**
 * Adiciona campos de agendamento e vertical em Campaign.
 * Uso: npx tsx --env-file=.env scripts/migrate-turso-campaigns.ts
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
  "ALTER TABLE Campaign ADD COLUMN program TEXT",
  "ALTER TABLE Campaign ADD COLUMN startDate DATETIME",
  "ALTER TABLE Campaign ADD COLUMN endDate DATETIME",
  "CREATE INDEX IF NOT EXISTS Campaign_status_idx ON Campaign(status)",
  "CREATE INDEX IF NOT EXISTS Campaign_program_idx ON Campaign(program)",
];

async function columnExists(table: string, column: string): Promise<boolean> {
  const rs = await client.execute(`PRAGMA table_info(${table})`);
  return rs.rows.some((r) => String(r.name) === column);
}

async function main() {
  for (const sql of statements) {
    if (sql.startsWith("ALTER TABLE")) {
      const col = sql.match(/ADD COLUMN (\w+)/)?.[1];
      if (col && (await columnExists("Campaign", col))) {
        console.log(`skip Campaign.${col} (já existe)`);
        continue;
      }
    }
    try {
      await client.execute(sql);
      console.log(`ok ${sql}`);
    } catch (e) {
      const msg = String(e);
      if (msg.includes("duplicate column") || msg.includes("already exists")) {
        console.log(`skip ${sql}`);
      } else {
        throw e;
      }
    }
  }

  // Semana Nacional dos Concursos Jurídicos → ECJ
  const rs = await client.execute({
    sql: `UPDATE Campaign SET program = 'ECJ' WHERE name LIKE '%Semana Nacional%' OR name LIKE '%Concursos Jurídicos%'`,
    args: [],
  });
  console.log(`Semana Nacional → ECJ: ${rs.rowsAffected} linha(s)`);

  console.log("Migration campanhas concluída.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
