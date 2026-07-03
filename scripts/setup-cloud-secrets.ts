#!/usr/bin/env tsx
/**
 * Copia variáveis do .env local para a área de transferência (formato KEY=VALUE)
 * e abre o dashboard de Cloud Agents para colar na aba Secrets.
 *
 * Uso: npm run setup:cloud-secrets
 */
import { readFileSync, existsSync } from "fs";
import { execSync } from "child_process";
import { resolve } from "path";

const ROOT = resolve(import.meta.dirname, "..");
const ENV_PATH = resolve(ROOT, ".env");

/** Variáveis que o cloud agent precisa para operar como o ambiente local. */
const CLOUD_KEYS = [
  "DATABASE_URL",
  "DATABASE_AUTH_TOKEN",
  "AUTH_SECRET",
  "ADMIN_EMAIL",
  "ADMIN_PASSWORD",
  "EXECUTIVE_EMAIL",
  "EXECUTIVE_PASSWORD",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "GMAIL_REFRESH_TOKEN",
  "GMAIL_SENDER_EMAIL",
  "GMAIL_FROM_OAB",
  "GMAIL_FROM_ECJ",
  "APPS_SCRIPT_BRIDGE_URL",
  "APPS_SCRIPT_WEBAPP_URL",
  "APPS_SCRIPT_SECRET",
  "WEBHOOK_SECRET",
  "CANDIDATURAS_WEBHOOK_SECRET",
  "FINANCE_TEAM_EMAIL",
  "FINANCE_CC_EMAIL",
  "DRIVE_ROOT_ENTREGAS_ID",
  "DRIVE_ROOT_TERMOS_ID",
  "DRIVE_ROOT_COLLAB_ID",
  "TERM_TEMPLATE_DOC_ID",
  "NEXT_PUBLIC_APP_URL",
  "SUPER_SPREADSHEET_ID",
  "SPREADSHEET_ID",
];

function parseEnv(content: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const line of content.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    const key = t.slice(0, eq).trim();
    let val = t.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

function main() {
  if (!existsSync(ENV_PATH)) {
    console.error("Arquivo .env não encontrado em", ENV_PATH);
    process.exit(1);
  }

  const env = parseEnv(readFileSync(ENV_PATH, "utf8"));
  const lines: string[] = [];
  const missing: string[] = [];

  for (const key of CLOUD_KEYS) {
    const val = env[key];
    if (val) lines.push(`${key}=${val}`);
    else missing.push(key);
  }

  if (lines.length === 0) {
    console.error("Nenhuma variável encontrada no .env");
    process.exit(1);
  }

  const payload = lines.join("\n");
  execSync("pbcopy", { input: payload });

  console.log(`✓ ${lines.length} variáveis copiadas para a área de transferência.`);
  if (missing.length) {
    console.log(`⚠ Ausentes no .env (opcionais): ${missing.join(", ")}`);
  }
  console.log("\nPróximo passo no dashboard:");
  console.log("1. Cloud Agents → Environment do repo est-super-gestao");
  console.log("2. Aba Secrets → adicionar cada variável (ou bulk se disponível)");
  console.log("3. Tokens sensíveis: tipo Runtime Secret");
  console.log("4. URLs/IDs públicos: Environment Variable");

  try {
    execSync('open "https://cursor.com/dashboard?tab=cloud-agents"');
    console.log("\n✓ Dashboard aberto no navegador.");
  } catch {
    console.log("\nAbra manualmente: https://cursor.com/dashboard?tab=cloud-agents");
  }
}

main();
