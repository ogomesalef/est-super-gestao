import { NextResponse } from "next/server";
import { setSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

/** Callback OAuth Google — requer credenciais em produção */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/auth/google/callback`;

  if (!code || !clientId || !clientSecret) {
    return NextResponse.redirect(new URL("/login?error=oauth_not_configured", req.url));
  }

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });
  const tokens = await tokenRes.json();
  if (!tokens.access_token) {
    return NextResponse.redirect(new URL("/login?error=oauth_failed", req.url));
  }

  const profileRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  const profile = await profileRes.json();
  const email = profile.email as string;
  const allowedDomain = process.env.GOOGLE_ALLOWED_DOMAIN || "estrategiavestibulares.com.br";
  if (!email?.endsWith(`@${allowedDomain}`)) {
    return NextResponse.redirect(new URL("/login?error=domain_not_allowed", req.url));
  }

  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        name: profile.name || email,
        role: email.includes("chefe") ? "executive" : "admin",
        password: await bcrypt.hash(crypto.randomUUID(), 10),
      },
    });
  }

  await setSession({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role as "admin" | "executive",
  });

  return NextResponse.redirect(new URL(user.role === "executive" ? "/executive" : "/", req.url));
}
