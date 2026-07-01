import { GOOGLE_APP_SCOPES, googleOAuthCredentials } from "@/lib/google-oauth";

const GMAIL_SCOPES = GOOGLE_APP_SCOPES;

export { googleOAuthCredentials as gmailOAuthCredentials } from "@/lib/google-oauth";

export function gmailRedirectUri(appUrl?: string) {
  const base = appUrl || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `${base.replace(/\/$/, "")}/api/gmail/callback`;
}

export function isGmailConfigured() {
  const { clientId, clientSecret } = googleOAuthCredentials();
  return Boolean(clientId && clientSecret && process.env.GMAIL_REFRESH_TOKEN);
}

export function buildGmailAuthUrl(state?: string) {
  const { clientId } = googleOAuthCredentials();
  if (!clientId) throw new Error("GOOGLE_CLIENT_ID não configurado");

  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", gmailRedirectUri());
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", GMAIL_SCOPES.join(" "));
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");
  url.searchParams.set("login_hint", process.env.GMAIL_SENDER_EMAIL || "cx@estrategiavestibulares.com.br");
  if (state) url.searchParams.set("state", state);
  return url.toString();
}

export async function exchangeGmailCode(code: string) {
  const { clientId, clientSecret } = googleOAuthCredentials();
  if (!clientId || !clientSecret) throw new Error("Credenciais OAuth não configuradas");

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: gmailRedirectUri(),
      grant_type: "authorization_code",
    }),
  });

  const data = (await res.json()) as {
    access_token?: string;
    refresh_token?: string;
    error?: string;
    error_description?: string;
  };

  if (!data.refresh_token && !data.access_token) {
    throw new Error(data.error_description || data.error || "Falha ao obter tokens");
  }

  return data;
}

export async function getGmailAccessToken(): Promise<string> {
  const { getGoogleAccessToken } = await import("@/lib/google-oauth");
  return getGoogleAccessToken();
}
