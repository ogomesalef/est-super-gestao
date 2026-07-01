import { NextResponse } from "next/server";

/** Google OAuth — configurar GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET */
export async function GET() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({
      configured: false,
      message: "Configure GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET — ver docs/11-deploy-gratis.md",
    });
  }
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/auth/google/callback`;
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "select_account");
  return NextResponse.redirect(url.toString());
}
