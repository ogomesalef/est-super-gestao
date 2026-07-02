import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeQuickNote } from "@/lib/ambassador-quick-notes";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; noteId: string }> }
) {
  const { id, noteId } = await params;
  const body = await req.json();

  const existing = await prisma.ambassadorQuickNote.findFirst({
    where: { id: noteId, ambassadorId: id },
  });

  if (!existing) {
    return NextResponse.json({ error: "Nota não encontrada" }, { status: 404 });
  }

  const data: {
    text?: string;
    pinned?: boolean;
    completed?: boolean;
    completedAt?: Date | null;
  } = {};

  if (body.text !== undefined) {
    const text = String(body.text).trim();
    if (!text) {
      return NextResponse.json({ error: "Texto da nota é obrigatório" }, { status: 400 });
    }
    data.text = text;
  }

  if (body.pinned !== undefined) {
    data.pinned = Boolean(body.pinned);
  }

  if (body.completed !== undefined) {
    const completed = Boolean(body.completed);
    data.completed = completed;
    data.completedAt = completed ? new Date() : null;
  }

  const note = await prisma.ambassadorQuickNote.update({
    where: { id: noteId },
    data,
  });

  return NextResponse.json(serializeQuickNote(note));
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; noteId: string }> }
) {
  const { id, noteId } = await params;

  const existing = await prisma.ambassadorQuickNote.findFirst({
    where: { id: noteId, ambassadorId: id },
  });

  if (!existing) {
    return NextResponse.json({ error: "Nota não encontrada" }, { status: 404 });
  }

  await prisma.ambassadorQuickNote.delete({ where: { id: noteId } });
  return NextResponse.json({ ok: true });
}
