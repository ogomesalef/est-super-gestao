import { NextResponse } from "next/server";
import { loginLocal, setSession } from "@/lib/auth";

export async function POST(req: Request) {
  const { email, password } = await req.json();
  const user = await loginLocal(email, password);
  if (!user) {
    return NextResponse.json({ error: "Credenciais inválidas" }, { status: 401 });
  }
  await setSession(user);
  return NextResponse.json({ ok: true, role: user.role });
}
