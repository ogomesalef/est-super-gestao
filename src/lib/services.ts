import { prisma } from "./prisma";
import { displayName } from "./ambassador-name";
import { calcAmountDue, currentMonthRef, isPartnershipActiveInMonth, monthRefFromDate, monthsBetween, normalizeHandle } from "./utils";

export async function syncMonthlyRowsForAmbassador(ambassadorId: string) {
  const ambassador = await prisma.ambassador.findUnique({
    where: { id: ambassadorId },
    include: { partnership: true },
  });
  if (!ambassador || ambassador.status !== "Ativo") return;

  const start = ambassador.partnership?.startDate || new Date();
  const end = ambassador.partnership?.endDate || new Date();
  let monthList = monthsBetween(start, end > start ? end : new Date());

  const endRef = monthRefFromDate(ambassador.partnership?.endDate);
  if (endRef) {
    monthList = monthList.filter((m) => m < endRef);
  }

  for (const monthRef of monthList) {
    const existingCtrl = await prisma.monthlyControl.findUnique({
      where: { ambassadorId_monthRef: { ambassadorId, monthRef } },
    });
    if (!existingCtrl) {
      await prisma.monthlyControl.create({
        data: {
          ambassadorId,
          monthRef,
          metaFeed: ambassador.partnership?.metaFeed ?? 0,
          metaStories: ambassador.partnership?.metaStories ?? 0,
          metaTiktok: ambassador.partnership?.metaTiktok ?? 0,
          metaYoutube: ambassador.partnership?.metaYoutube ?? 0,
        },
      });
    }

    if (ambassador.partnership?.modality === "Remuneração") {
      const existingFin = await prisma.monthlyFinance.findUnique({
        where: { ambassadorId_monthRef: { ambassadorId, monthRef } },
      });
      if (!existingFin) {
        const agreed = ambassador.partnership?.agreedValue ?? 0;
        await prisma.monthlyFinance.create({
          data: {
            ambassadorId,
            monthRef,
            agreedValue: agreed,
            amountDue: 0,
            paymentStatus: "Pendente",
          },
        });
      }
    }
  }
}

export async function recalcFinanceAmount(ambassadorId: string, monthRef: string) {
  const fin = await prisma.monthlyFinance.findUnique({
    where: { ambassadorId_monthRef: { ambassadorId, monthRef } },
  });
  const ctrl = await prisma.monthlyControl.findUnique({
    where: { ambassadorId_monthRef: { ambassadorId, monthRef } },
  });
  if (!fin) return;

  const pct = ctrl?.pctDelivered ?? fin.pctDelivered;
  const amountDue = calcAmountDue(fin.agreedValue, pct);
  await prisma.monthlyFinance.update({
    where: { id: fin.id },
    data: { pctDelivered: pct, amountDue },
  });
}

export async function findOrCreateAmbassadorByIg(
  program: string,
  instagram: string,
  data?: { fullName?: string; email?: string }
) {
  const ig = normalizeHandle(instagram);
  let amb = await prisma.ambassador.findUnique({
    where: { program_instagram: { program, instagram: ig } },
  });
  if (!amb) {
    amb = await prisma.ambassador.create({
      data: {
        program,
        instagram: ig,
        fullName: data?.fullName || ig,
        email: data?.email,
        status: "Pendente",
        partnership: { create: {} },
      },
    });
  }
  return amb;
}

export async function getExecutiveSummary(monthRef?: string, program?: string) {
  const month = monthRef || currentMonthRef();
  const ambassadors = await prisma.ambassador.findMany({
    where: {
      ...(program ? { program } : {}),
      OR: [
        { status: "Ativo" },
        { monthlyControls: { some: { monthRef: month } } },
        { monthlyFinances: { some: { monthRef: month } } },
      ],
    },
    include: {
      partnership: true,
      monthlyControls: { where: { monthRef: month } },
      monthlyFinances: true,
    },
  });

  const byVertical = { OAB: 0, ECJ: 0 };
  const byModality = { "Assinatura + Cupom": 0, Remuneração: 0 };

  const rows = ambassadors
    .filter((a) => isPartnershipActiveInMonth(a.partnership, month))
    .map((a) => {
      byVertical[a.program as "OAB" | "ECJ"] = (byVertical[a.program as "OAB" | "ECJ"] || 0) + 1;
      const mod = a.partnership?.modality || "—";
      if (mod in byModality) byModality[mod as keyof typeof byModality]++;

      const paidTotal = a.monthlyFinances
        .filter((f) => f.paymentStatus === "Pago")
        .reduce((s, f) => s + (f.amountDue || 0), 0);

      const ctrl = a.monthlyControls[0];
      const fin = a.monthlyFinances.find((f) => f.monthRef === month);

      return {
        id: a.id,
        fullName: displayName(a),
        program: a.program,
        modality: a.partnership?.modality,
        courseName: a.partnership?.courseName,
        couponCode: a.partnership?.couponCode,
        agreedValue: a.partnership?.agreedValue,
        paidTotal,
        pctDelivered: ctrl?.pctDelivered ?? 0,
        paymentStatus: fin?.paymentStatus ?? "—",
      };
    });

  return { month, byVertical, byModality, rows };
}
