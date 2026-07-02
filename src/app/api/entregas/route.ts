import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isPartnershipActiveInMonth } from "@/lib/utils";
import { ambassadorOpenQuickNotesQuery, serializeQuickNote } from "@/lib/ambassador-quick-notes";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const monthRef = searchParams.get("monthRef") || new Date().toISOString().slice(0, 7);
  const program = searchParams.get("program");

  const controls = await prisma.monthlyControl.findMany({
    where: {
      monthRef,
      ...(program ? { ambassador: { program } } : {}),
    },
    include: {
      ambassador: {
        include: {
          partnership: true,
          quickNotes: ambassadorOpenQuickNotesQuery,
        },
      },
    },
    orderBy: { ambassador: { fullName: "asc" } },
  });

  const active = controls
    .filter((c) => isPartnershipActiveInMonth(c.ambassador.partnership, monthRef))
    .map((c) => ({
      ...c,
      ambassador: {
        ...c.ambassador,
        quickNotes: c.ambassador.quickNotes.map(serializeQuickNote),
      },
    }));
  return NextResponse.json(active);
}
