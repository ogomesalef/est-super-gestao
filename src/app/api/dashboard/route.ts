import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentMonthRef, isPartnershipActiveInMonth } from "@/lib/utils";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const program = searchParams.get("program") || "OAB";
  const month = currentMonthRef();

  const [contacts, ambassadors, controls, finances] = await Promise.all([
    prisma.contact.count({ where: { vertical: program } }),
    prisma.ambassador.findMany({
      where: { status: "Ativo", program },
      include: { partnership: true },
    }),
    prisma.monthlyControl.findMany({
      where: { monthRef: month, ambassador: { program } },
      include: { ambassador: { include: { partnership: true } } },
    }),
    prisma.monthlyFinance.findMany({
      where: {
        monthRef: month,
        ambassador: { program },
        paymentStatus: { notIn: ["Pago", "Cancelado"] },
      },
      include: { ambassador: { include: { partnership: true } } },
    }),
  ]);

  const actives = ambassadors.filter((a) => isPartnershipActiveInMonth(a.partnership, month)).length;
  const pendingDeliveries = controls.filter(
    (c) =>
      isPartnershipActiveInMonth(c.ambassador.partnership, month) &&
      (c.statusFeed === "Pendente" || c.statusStories === "Pendente")
  ).length;
  const pendingFinance = finances.filter((f) =>
    isPartnershipActiveInMonth(f.ambassador.partnership, month)
  ).length;

  return NextResponse.json({
    program,
    month,
    contacts,
    actives,
    pendingDeliveries,
    pendingFinance,
  });
}
