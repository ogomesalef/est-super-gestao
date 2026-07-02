import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CONTACT_FOLLOWUP_DAYS, PROPOSAL_FOLLOWUP_DAYS } from "@/lib/constants";
import { currentMonthRef, isPartnershipActiveInMonth } from "@/lib/utils";
import { getCandidaturasSyncStatus } from "@/lib/candidaturas-sync";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const program = searchParams.get("program") || "OAB";
  const month = currentMonthRef();
  const proposalCutoff = new Date();
  proposalCutoff.setDate(proposalCutoff.getDate() - PROPOSAL_FOLLOWUP_DAYS);
  const contactCutoff = new Date();
  contactCutoff.setDate(contactCutoff.getDate() - CONTACT_FOLLOWUP_DAYS);

  const [contacts, ambassadors, controls, finances, needsReview, staleProposals, staleContacts, respostasSync] =
    await Promise.all([
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
      prisma.ambassador.count({
        where: { program, status: "Pendente", needsReview: true },
      }),
      prisma.ambassador.count({
        where: {
          program,
          status: "Proposta",
          partnership: { proposalSentAt: { lte: proposalCutoff } },
        },
      }),
      prisma.contact.count({
        where: {
          vertical: program,
          status: "Trabalhando",
          OR: [
            { lastContactedAt: { lte: contactCutoff } },
            { lastContactedAt: null, statusChangedAt: { lte: contactCutoff } },
            { lastContactedAt: null, statusChangedAt: null },
          ],
        },
      }),
      getCandidaturasSyncStatus(),
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

  const respostasPending =
    respostasSync.sheets.find((s) => s.program === program)?.pendingRows ?? 0;

  return NextResponse.json({
    program,
    month,
    contacts,
    actives,
    pendingDeliveries,
    pendingFinance,
    needsReview,
    staleProposals,
    staleContacts,
    respostasPending,
    respostasSyncConfigured: respostasSync.configured,
  });
}
