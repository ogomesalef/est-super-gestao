import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const ambassadorId = searchParams.get("ambassadorId");
    const monthRef = searchParams.get("monthRef");
    const program = searchParams.get("program");
    const unassignedOnly = searchParams.get("unassigned") === "1";
    const limit = Math.min(Number(searchParams.get("limit") || 500), 1000);

    const deliveries = await prisma.delivery.findMany({
      where: {
        ...(ambassadorId ? { ambassadorId } : {}),
        ...(monthRef ? { monthRef } : {}),
        ...(program ? { program } : {}),
        ...(unassignedOnly ? { needsReview: true } : {}),
      },
      include: {
        ambassador: {
          select: { id: true, fullName: true, instagram: true, program: true },
        },
        campaign: { select: { id: true, name: true } },
      },
      orderBy: [{ submittedAt: "desc" }],
      take: limit,
    });

    const unassignedCount = await prisma.delivery.count({ where: { needsReview: true } });

    return NextResponse.json({ deliveries, unassignedCount });
  } catch (e) {
    console.error("GET /api/entregas/deliveries", e);
    const message = e instanceof Error ? e.message : "Erro ao listar entregas";
    return NextResponse.json({ error: message, deliveries: [], unassignedCount: 0 }, { status: 500 });
  }
}
