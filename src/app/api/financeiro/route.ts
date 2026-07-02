import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildTermActivityText } from "@/lib/termo-data";
import { isPartnershipActiveInMonth } from "@/lib/utils";
import { ambassadorOpenQuickNotesQuery, serializeQuickNote } from "@/lib/ambassador-quick-notes";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const monthRef = searchParams.get("monthRef");
  const program = searchParams.get("program");

  const finances = await prisma.monthlyFinance.findMany({
    where: {
      ...(monthRef ? { monthRef } : {}),
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
    orderBy: [{ monthRef: "desc" }, { ambassador: { fullName: "asc" } }],
  });

  const ambassadorIds = [...new Set(finances.map((f) => f.ambassadorId))];
  const monthRefs = [...new Set(finances.map((f) => f.monthRef))];

  const controls = await prisma.monthlyControl.findMany({
    where: {
      ambassadorId: { in: ambassadorIds },
      monthRef: { in: monthRefs },
    },
  });
  const controlByKey = new Map(controls.map((c) => [`${c.ambassadorId}:${c.monthRef}`, c]));

  const enriched = finances
    .filter((fin) => isPartnershipActiveInMonth(fin.ambassador.partnership, fin.monthRef))
    .map((fin) => {
      const control = controlByKey.get(`${fin.ambassadorId}:${fin.monthRef}`) ?? null;
      const termActivityAuto = buildTermActivityText(fin.monthRef, control);
      return {
        ...fin,
        termActivityAuto,
        ambassador: {
          ...fin.ambassador,
          quickNotes: fin.ambassador.quickNotes.map(serializeQuickNote),
        },
      };
    });

  return NextResponse.json(enriched);
}
