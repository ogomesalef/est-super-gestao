import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: "admin" | "executive";
};

const SESSION_COOKIE = "super_session";

export async function ensureDefaultUsers() {
  const adminEmail = process.env.ADMIN_EMAIL || "admin@local";
  const adminPass = process.env.ADMIN_PASSWORD || "admin123";
  const execEmail = process.env.EXECUTIVE_EMAIL || "chefe@local";
  const execPass = process.env.EXECUTIVE_PASSWORD || "chefe123";

  const users = [
    { email: adminEmail, password: adminPass, name: "Admin", role: "admin" },
    { email: execEmail, password: execPass, name: "Chefe", role: "executive" },
  ];

  for (const u of users) {
    const exists = await prisma.user.findUnique({ where: { email: u.email } });
    if (!exists) {
      await prisma.user.create({
        data: {
          email: u.email,
          name: u.name,
          role: u.role,
          password: await bcrypt.hash(u.password, 10),
        },
      });
    }
  }
}

export async function loginLocal(email: string, password: string): Promise<SessionUser | null> {
  await ensureDefaultUsers();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return null;
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return null;
  return { id: user.id, email: user.email, name: user.name, role: user.role as SessionUser["role"] };
}

export async function setSession(user: SessionUser) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, JSON.stringify(user), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SessionUser;
  } catch {
    return null;
  }
}

export async function requireSession(roles?: Array<"admin" | "executive">): Promise<SessionUser> {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHORIZED");
  if (roles && !roles.includes(session.role)) throw new Error("FORBIDDEN");
  return session;
}
