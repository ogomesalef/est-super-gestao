import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { findOrCreateAmbassadorByIg } from "@/lib/services";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  if (body.action === "promote") {
    const contact = await prisma.contact.findUnique({ where: { id } });
    if (!contact || !contact.instagram) {
      return NextResponse.json({ error: "Contato sem Instagram" }, { status: 400 });
    }
    const amb = await findOrCreateAmbassadorByIg(contact.vertical || "OAB", contact.instagram, {
      fullName: contact.instagram,
    });
    await prisma.contact.update({
      where: { id },
      data: { ambassadorId: amb.id, status: "Interessado" },
    });
    return NextResponse.json({ ok: true, ambassadorId: amb.id });
  }

  const contact = await prisma.contact.update({
    where: { id },
    data: {
      vertical: body.vertical,
      status: body.status,
      instagram: body.instagram,
      tiktok: body.tiktok,
      notes: body.notes,
      contactedBy: body.contactedBy,
      statusChangedAt: body.status ? new Date() : undefined,
    },
  });
  return NextResponse.json(contact);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.contact.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
