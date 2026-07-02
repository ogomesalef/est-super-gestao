import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeHandle } from "@/lib/utils";

/** Compatível com api_contatos.js do Apps Script */
export async function POST(req: Request) {
  const data = await req.json();
  const secret = process.env.APPS_SCRIPT_SECRET || process.env.API_CONTACTS_SECRET;
  if (secret && data.secret !== secret) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const type = String(data.type || "").toLowerCase();
  const vertical = String(data.vertical || "OAB").toUpperCase();
  const handleRaw = String(data.handle || "").trim();
  const obs = String(data.obs || "").trim();

  if (!handleRaw) return NextResponse.json({ ok: false, error: "missing handle" }, { status: 400 });
  if (type !== "instagram" && type !== "tiktok") {
    return NextResponse.json({ ok: false, error: "invalid type" }, { status: 400 });
  }
  if (vertical !== "OAB" && vertical !== "ECJ") {
    return NextResponse.json({ ok: false, error: "invalid vertical" }, { status: 400 });
  }

  const handle = type === "instagram" ? normalizeHandle(handleRaw) : handleRaw;

  if (type === "instagram") {
    const existing = await prisma.contact.findFirst({
      where: { vertical, instagram: handle },
    });
    if (existing) {
      return NextResponse.json({
        ok: true,
        duplicate: true,
        row: existing.id,
        handle,
        vertical,
        type,
      });
    }
  }

  const contact = await prisma.contact.create({
    data: {
      vertical,
      status: "Novo",
      origin: "Prospecção própria",
      notes: obs || undefined,
      prospectedAt: new Date(),
      ...(type === "instagram"
        ? { instagram: handle, linkIg: `https://instagram.com/${handle.replace("@", "")}` }
        : { tiktok: handle, linkTiktok: `https://tiktok.com/${handle.replace("@", "")}` }),
    },
  });

  return NextResponse.json({
    ok: true,
    row: contact.id,
    handle,
    vertical,
    type,
  });
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const vertical = searchParams.get("vertical");
  const status = searchParams.get("status");
  const q = searchParams.get("q");

  const contacts = await prisma.contact.findMany({
    where: {
      ...(vertical ? { vertical } : {}),
      ...(status ? { status } : {}),
      ...(q
        ? {
            OR: [
              { instagram: { contains: q } },
              { tiktok: { contains: q } },
              { notes: { contains: q } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return NextResponse.json(contacts);
}
