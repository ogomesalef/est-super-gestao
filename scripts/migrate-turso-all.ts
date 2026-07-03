/**
 * Executa todas as migrations Turso idempotentes (produção/preview na Vercel).
 * Ignora silenciosamente quando DATABASE_URL não é libsql:// (build local com SQLite).
 */
import { spawnSync } from "node:child_process";
import path from "node:path";

const url = process.env.DATABASE_URL ?? "";

if (!url.startsWith("libsql://")) {
  console.log("skip migrate-turso-all (DATABASE_URL não é Turso)");
  process.exit(0);
}

if (!process.env.DATABASE_AUTH_TOKEN) {
  console.error("DATABASE_AUTH_TOKEN ausente para migrate-turso-all");
  process.exit(1);
}

const scripts = [
  "migrate-turso-termo.ts",
  "migrate-turso-delivery-sync.ts",
  "migrate-turso-app-setting.ts",
  "migrate-turso-campaigns.ts",
  "migrate-turso-campaign-slug.ts",
  "migrate-turso-campaign-collab.ts",
  "migrate-turso-campaign-collab-drive.ts",
  "migrate-turso-collab-briefing.ts",
  "migrate-turso-collab-request-share.ts",
  "migrate-turso-campaign-collab-folder-name.ts",
  "migrate-turso-ambassador-quick-notes.ts",
  "migrate-turso-ambassador-social-name.ts",
  "migrate-turso-ambassador-report-slug.ts",
  "migrate-turso-contatos-parcerias.ts",
  "migrate-turso-respostas-sync.ts",
  "migrate-turso-status-simplificados.ts",
];

const root = path.join(import.meta.dirname, "..");

for (const script of scripts) {
  const file = path.join(root, "scripts", script);
  console.log(`\n==> ${script}`);
  const result = spawnSync("npx", ["tsx", file], {
    cwd: root,
    stdio: "inherit",
    env: process.env,
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

console.log("\nTodas as migrations Turso concluídas.");
