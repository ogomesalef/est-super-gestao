/**
 * Testa envio Gmail via API (requer GMAIL_REFRESH_TOKEN).
 * Uso: npm run test:gmail -- seu-email@exemplo.com
 */
import { sendViaGmail } from "../src/lib/gmail-send";
import { isGmailConfigured } from "../src/lib/gmail-oauth";

const to = process.argv[2] || process.env.TEST_EMAIL_TO;

if (!isGmailConfigured()) {
  console.error("GMAIL_REFRESH_TOKEN não configurado.");
  console.error("Conecte em /emails → Conectar Gmail (cx@) ou cole o token no .env");
  process.exit(1);
}

if (!to) {
  console.error("Uso: npm run test:gmail -- email@destino.com");
  process.exit(1);
}

sendViaGmail({
  to,
  subject: "Teste Super Gestão — Gmail API",
  html: "<p>E-mail de teste enviado pela conta <strong>cx@</strong> com alias OAB/ECJ.</p>",
  program: "OAB",
}).then((r) => {
  if (r.ok) {
    console.log("OK — enviado", r.messageId);
    process.exit(0);
  }
  console.error("FALHA:", r.error);
  process.exit(1);
});
