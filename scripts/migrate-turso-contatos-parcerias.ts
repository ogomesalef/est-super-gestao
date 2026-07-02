/**
 * Campos de follow-up (Contact), origem/análise (Ambassador) e lembrete de proposta.
 * Uso: npx tsx --env-file=.env scripts/migrate-turso-contatos-parcerias.ts
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
  "ALTER TABLE Contact ADD COLUMN lastContactedAt DATETIME",
  "ALTER TABLE Contact ADD COLUMN nextFollowUpAt DATETIME",
  "ALTER TABLE Contact ADD COLUMN contactAttempts INTEGER NOT NULL DEFAULT 0",
  "ALTER TABLE Ambassador ADD COLUMN source TEXT",
  "ALTER TABLE Ambassador ADD COLUMN applicationReceivedAt DATETIME",
  "ALTER TABLE Ambassador ADD COLUMN needsReview INTEGER NOT NULL DEFAULT 0",
  "ALTER TABLE Partnership ADD COLUMN proposalReminderSentAt DATETIME",
  "CREATE INDEX IF NOT EXISTS Ambassador_needsReview_idx ON Ambassador(needsReview)",
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
  console.log("Migration contatos/parcerias concluída.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
