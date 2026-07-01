import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isPartnershipActiveInMonth } from "@/lib/utils";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const monthRef = searchParams.get("monthRef") || new Date().toISOString().slice(0, 7);
  const program = searchParams.get("program");

  const controls = await prisma.monthlyControl.findMany({
    where: {
      monthRef,
      ...(program ? { ambassador: { program } } : {}),
    },
    include: { ambassador: { include: { partnership: true } } },
    orderBy: { ambassador: { fullName: "asc" } },
  });

  const active = controls.filter((c) =>
    isPartnershipActiveInMonth(c.ambassador.partnership, monthRef)
  );
  return NextResponse.json(active);
}
