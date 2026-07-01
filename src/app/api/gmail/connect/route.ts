import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { buildGmailAuthUrl } from "@/lib/gmail-oauth";

/** Inicia OAuth Gmail com a conta cx@ (admin logado). */
export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.redirect(new URL("/login", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"));
  }

  try {
    const url = buildGmailAuthUrl(session.id);
    return NextResponse.redirect(url);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
