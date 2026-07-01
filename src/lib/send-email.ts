import { isGmailConfigured } from "@/lib/gmail-oauth";
import { sendViaGmail } from "@/lib/gmail-send";
import { sendViaAppsScriptBridge } from "@/lib/email-bridge";

export type SendEmailPayload = {
  action: string;
  ambassadorId?: string;
  financeId?: string;
  html?: string;
  subject?: string;
  to?: string;
  program?: string;
  cc?: string;
};

/** Gmail (cx@ + aliases) se configurado; senão tenta Apps Script bridge. */
export async function sendEmail(payload: SendEmailPayload) {
  if (isGmailConfigured()) {
    return sendViaGmail(payload);
  }
  return sendViaAppsScriptBridge(payload);
}

export function getEmailProvider(): "gmail" | "apps-script" | "none" {
  if (isGmailConfigured()) return "gmail";
  if (process.env.APPS_SCRIPT_BRIDGE_URL || process.env.APPS_SCRIPT_WEBAPP_URL) return "apps-script";
  return "none";
}
