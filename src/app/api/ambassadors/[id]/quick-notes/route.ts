import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeQuickNote } from "@/lib/ambassador-quick-notes";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const ambassador = await prisma.ambassador.findUnique({ where: { id }, select: { id: true } });
  if (!ambassador) {
    return NextResponse.json({ error: "Embaixador não encontrado" }, { status: 404 });
  }

  const notes = await prisma.ambassadorQuickNote.findMany({
    where: { ambassadorId: id },
    orderBy: [{ completed: "asc" }, { pinned: "desc" }, { createdAt: "desc" }],
  });

  return NextResponse.json(notes.map(serializeQuickNote));
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const text = String(body.text || "").trim();

  if (!text) {
    return NextResponse.json({ error: "Texto da nota é obrigatório" }, { status: 400 });
  }

  const ambassador = await prisma.ambassador.findUnique({ where: { id }, select: { id: true } });
  if (!ambassador) {
    return NextResponse.json({ error: "Embaixador não encontrado" }, { status: 404 });
  }

  const note = await prisma.ambassadorQuickNote.create({
    data: {
      ambassadorId: id,
      text,
      pinned: Boolean(body.pinned),
    },
  });

  return NextResponse.json(serializeQuickNote(note));
}
