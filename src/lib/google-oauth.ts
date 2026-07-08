/** Escopos usados pelo app (Gmail + Drive + Docs para termos). */
export const GOOGLE_APP_SCOPES = [
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/drive",
  "https://www.googleapis.com/auth/documents",
  "https://www.googleapis.com/auth/spreadsheets.readonly",
];

export function googleOAuthCredentials() {
  const clientId = process.env.GMAIL_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GMAIL_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET;
  return { clientId, clientSecret };
}

let tokenCache: { token: string; expiresAt: number } | null = null;

export async function getGoogleAccessToken(): Promise<string> {
  const now = Date.now();
  if (tokenCache && now < tokenCache.expiresAt - 60_000) {
    return tokenCache.token;
  }

  const refreshToken = process.env.GMAIL_REFRESH_TOKEN;
  const { clientId, clientSecret } = googleOAuthCredentials();
  if (!refreshToken || !clientId || !clientSecret) {
    throw new Error("Google OAuth não configurado (GMAIL_REFRESH_TOKEN)");
  }

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  const data = (await res.json()) as {
    access_token?: string;
    expires_in?: number;
    error_description?: string;
  };
  if (!data.access_token) {
    throw new Error(data.error_description || "Não foi possível renovar o token Google");
  }

  tokenCache = {
    token: data.access_token,
    expiresAt: now + (data.expires_in ?? 3600) * 1000,
  };
  return data.access_token;
}
