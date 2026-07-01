import { NextResponse } from "next/server";
import { getEmailProvider } from "@/lib/send-email";
import { isGmailConfigured, gmailOAuthCredentials } from "@/lib/gmail-oauth";

export async function GET() {
  const { clientId } = gmailOAuthCredentials();
  return NextResponse.json({
    provider: getEmailProvider(),
    gmail: {
      oauthConfigured: Boolean(clientId),
      refreshTokenSet: isGmailConfigured(),
      sender: process.env.GMAIL_SENDER_EMAIL || "cx@estrategiavestibulares.com.br",
      fromOab: process.env.GMAIL_FROM_OAB || "embaixadores.oab@estrategia.com",
      fromEcj: process.env.GMAIL_FROM_ECJ || "embaixadores.ecj@estrategia.com",
    },
    appsScript: {
      urlSet: Boolean(process.env.APPS_SCRIPT_BRIDGE_URL || process.env.APPS_SCRIPT_WEBAPP_URL),
    },
  });
}
