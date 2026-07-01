/**
 * Testa a ponte Apps Script (e-mails).
 * Uso: npm run test:bridge
 */
import { pingAppsScriptBridge } from "../src/lib/email-bridge";

pingAppsScriptBridge().then((r) => {
  if (r.ok) {
    console.log("OK — bridge respondeu");
    process.exit(0);
  }
  console.error("FALHA:", r.error);
  process.exit(1);
});
