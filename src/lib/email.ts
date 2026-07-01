export { sendViaAppsScriptBridge } from "./email-bridge";
export { sendViaGmail } from "./gmail-send";
export { sendEmail, getEmailProvider } from "./send-email";
export { isGmailConfigured, buildGmailAuthUrl } from "./gmail-oauth";
export { renderSimpleEmail, renderAmbassadorEmail, renderFinanceEmail, resolveAmbassadorEmailAction } from "./email-templates";
