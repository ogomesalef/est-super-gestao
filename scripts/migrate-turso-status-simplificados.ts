/**
 * Normaliza status de contatos e parcerias para os valores simplificados.
 * Uso: npx tsx --env-file=.env scripts/migrate-turso-status-simplificados.ts
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

const contactUpdates: Array<[string, string]> = [
  ["Em contato", "Trabalhando"],
  ["Aguardando resposta", "Trabalhando"],
  ["Interessado", "Trabalhando"],
  ["Não interessado", "Desinteressado"],
  ["Sem retorno", "Desinteressado"],
  ["Recusou", "Desinteressado"],
];

const ambassadorUpdates: Array<[string, string]> = [["Reprovado", "Desinteressado"]];

async function main() {
  for (const [from, to] of contactUpdates) {
    const r = await client.execute({
      sql: "UPDATE Contact SET status = ? WHERE status = ?",
      args: [to, from],
    });
    console.log(`Contact ${from} → ${to}: ${r.rowsAffected} linhas`);
  }

  for (const [from, to] of ambassadorUpdates) {
    const r = await client.execute({
      sql: "UPDATE Ambassador SET status = ? WHERE status = ?",
      args: [to, from],
    });
    console.log(`Ambassador ${from} → ${to}: ${r.rowsAffected} linhas`);
  }

  console.log("Migration status simplificados concluída.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
