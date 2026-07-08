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
    await prisma.ambassador.update({
      where: { id: amb.id },
      data: {
        status: "Pendente",
        needsReview: true,
        source: amb.source || "prospeccao",
      },
    });
    await prisma.contact.update({
      where: { id },
      data: { ambassadorId: amb.id },
    });
    return NextResponse.json({ ok: true, ambassadorId: amb.id });
  }

  if (body.action === "outreach") {
    const contact = await prisma.contact.findUnique({ where: { id } });
    if (!contact) return NextResponse.json({ error: "Contato não encontrado" }, { status: 404 });

    const noteAppend = body.notes ? String(body.notes).trim() : "";
    const mergedNotes = noteAppend
      ? [contact.notes, noteAppend].filter(Boolean).join("\n")
      : contact.notes;

    const updated = await prisma.contact.update({
      where: { id },
      data: {
        lastContactedAt: new Date(),
        contactAttempts: { increment: 1 },
        nextFollowUpAt: body.nextFollowUpAt ? new Date(body.nextFollowUpAt) : undefined,
        notes: mergedNotes,
        status: body.status || contact.status,
        statusChangedAt: body.status && body.status !== contact.status ? new Date() : undefined,
      },
    });
    return NextResponse.json(updated);
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
      lastContactedAt: body.lastContactedAt ? new Date(body.lastContactedAt) : undefined,
      nextFollowUpAt: body.nextFollowUpAt ? new Date(body.nextFollowUpAt) : body.nextFollowUpAt === null ? null : undefined,
      contactAttempts: body.contactAttempts,
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
