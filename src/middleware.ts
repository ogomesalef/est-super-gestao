import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC = [
  "/login",
  "/c/",
  "/api/auth/login",
  "/api/auth/logout",
  "/api/auth/google",
  "/api/auth/google/callback",
  "/api/gmail/callback",
  "/api/contatos",
  "/api/entregas/webhook",
  "/api/public/",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (PUBLIC.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }
  const session = request.cookies.get("super_session");
  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
