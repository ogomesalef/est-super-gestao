import { displayName } from "@/lib/ambassador-name";
import { reconcileCrossProgramCandidacies, ensureContactsForUnlinkedFormAmbassadors } from "@/lib/candidaturas-link";
import { serializeQuickNote } from "@/lib/ambassador-quick-notes";
import { parseApplicationFormData } from "@/lib/respostas-row";
import { isContactStale } from "@/lib/contact-alerts";
import { isProposalStale, needsAnalysis } from "@/lib/partnership-alerts";
import { prisma } from "@/lib/prisma";
import type { ParceriaPartnership } from "@/components/parcerias/types";

export type PipelineStage = "Novo" | "Trabalhando" | "Pendente" | "Proposta" | "Desinteressado";

export type PipelineItem = {
  id: string;
  kind: "contact" | "ambassador";
  contactId: string | null;
  ambassadorId: string | null;
  stage: PipelineStage;
  vertical: string;
  instagram: string | null;
  tiktok: string | null;
  notes: string | null;
  contactAttempts: number;
  lastContactedAt: string | null;
  nextFollowUpAt: string | null;
  contactedBy: string | null;
  origin: string | null;
  needsLink: boolean;
  needsReview: boolean;
  staleContact: boolean;
  staleProposal: boolean;
  fullName: string | null;
  socialName: string | null;
  displayName: string;
  email: string | null;
  whatsapp: string | null;
  program: string;
  status: string;
  source: string | null;
  applicationReceivedAt: string | null;
  applicationFormData: Record<string, string> | null;
  respostasSheetName: string | null;
  respostasSheetRow: number | null;
  alerts: string | null;
  partnership: ParceriaPartnership | null;
  quickNotes?: ReturnType<typeof serializeQuickNote>[];
};

export type PipelineCounts = {
  sidebarTotal: number;
  pipeline: number;
  prospeccao: number;
  candidaturas: number;
  desinteressados: number;
  needsReview: number;
  staleContacts: number;
  staleProposals: number;
  needsLink: number;
  respostasPending: number;
};

function serializePartnership(p: {
  modality: string | null;
  agreedValue: number | null;
  valueLocked: boolean;
  courseName: string | null;
  courseReleased: boolean;
  couponCode: string | null;
  metaFeed: number;
  metaStories: number;
  metaTiktok: number;
  metaYoutube: number;
  startDate: Date | null;
  proposalSentAt: Date | null;
  proposalReminderSentAt: Date | null;
  legalCpf: string | null;
  legalAddress: string | null;
  bankDetails: string | null;
} | null): ParceriaPartnership | null {
  if (!p) return null;
  return {
    ...p,
    startDate: p.startDate?.toISOString() ?? null,
    proposalSentAt: p.proposalSentAt?.toISOString() ?? null,
    proposalReminderSentAt: p.proposalReminderSentAt?.toISOString() ?? null,
  };
}

function buildFromContact(
  c: {
    id: string;
    vertical: string | null;
    status: string;
    instagram: string | null;
    tiktok: string | null;
    notes: string | null;
    contactAttempts: number;
    lastContactedAt: Date | null;
    nextFollowUpAt: Date | null;
    contactedBy: string | null;
    origin: string | null;
  },
  stage: PipelineStage
): PipelineItem {
  const contactDetail = {
    status: c.status,
    lastContactedAt: c.lastContactedAt?.toISOString() ?? null,
    statusChangedAt: null as string | null,
  };

  return {
    id: c.id,
    kind: "contact",
    contactId: c.id,
    ambassadorId: null,
    stage,
    vertical: c.vertical || "OAB",
    instagram: c.instagram,
    tiktok: c.tiktok,
    notes: c.notes,
    contactAttempts: c.contactAttempts,
    lastContactedAt: c.lastContactedAt?.toISOString() ?? null,
    nextFollowUpAt: c.nextFollowUpAt?.toISOString() ?? null,
    contactedBy: c.contactedBy,
    origin: c.origin,
    needsLink: false,
    needsReview: false,
    staleContact: isContactStale(contactDetail),
    staleProposal: false,
    fullName: null,
    socialName: null,
    displayName: c.instagram || c.tiktok || "—",
    email: null,
    whatsapp: null,
    program: c.vertical || "OAB",
    status: stage,
    source: null,
    applicationReceivedAt: null,
    applicationFormData: null,
    respostasSheetName: null,
    respostasSheetRow: null,
    alerts: null,
    partnership: null,
  };
}

function buildFromAmbassador(
  a: {
    id: string;
    program: string;
    fullName: string;
    socialName: string | null;
    email: string | null;
    whatsapp: string | null;
    instagram: string;
    tiktok: string | null;
    status: string;
    source: string | null;
    applicationReceivedAt: Date | null;
    applicationFormData: string | null;
    respostasSheetName: string | null;
    respostasSheetRow: number | null;
    needsReview: boolean;
    alerts: string | null;
    partnership: Parameters<typeof serializePartnership>[0];
    quickNotes?: Array<{
      id: string;
      text: string;
      pinned: boolean;
      completed: boolean;
      createdAt: Date;
    }>;
  },
  contact: {
    id: string;
    notes: string | null;
    contactAttempts: number;
    lastContactedAt: Date | null;
    nextFollowUpAt: Date | null;
    contactedBy: string | null;
    origin: string | null;
    vertical: string | null;
    tiktok: string | null;
  } | null,
  needsLink: boolean
): PipelineItem {
  const stage = a.status as PipelineStage;
  const ambItem = {
    status: a.status,
    needsReview: a.needsReview,
    partnership: a.partnership
      ? {
          proposalSentAt: a.partnership.proposalSentAt?.toISOString() ?? null,
        }
      : null,
  };

  return {
    id: a.id,
    kind: "ambassador",
    contactId: contact?.id ?? null,
    ambassadorId: a.id,
    stage,
    vertical: a.program,
    instagram: a.instagram,
    tiktok: contact?.tiktok ?? a.tiktok,
    notes: contact?.notes ?? null,
    contactAttempts: contact?.contactAttempts ?? 0,
    lastContactedAt: contact?.lastContactedAt?.toISOString() ?? null,
    nextFollowUpAt: contact?.nextFollowUpAt?.toISOString() ?? null,
    contactedBy: contact?.contactedBy ?? null,
    origin: contact?.origin ?? null,
    needsLink,
    needsReview: a.needsReview,
    staleContact: false,
    staleProposal: isProposalStale(ambItem),
    fullName: a.fullName,
    socialName: a.socialName,
    displayName: displayName(a),
    email: a.email,
    whatsapp: a.whatsapp,
    program: a.program,
    status: a.status,
    source: a.source,
    applicationReceivedAt: a.applicationReceivedAt?.toISOString() ?? null,
    applicationFormData: parseApplicationFormData(a.applicationFormData),
    respostasSheetName: a.respostasSheetName,
    respostasSheetRow: a.respostasSheetRow,
    alerts: a.alerts,
    partnership: serializePartnership(a.partnership),
    quickNotes: a.quickNotes?.map((n) =>
      serializeQuickNote({
        ...n,
        ambassadorId: a.id,
        completedAt: "completedAt" in n ? (n as { completedAt: Date | null }).completedAt : null,
      })
    ),
  };
}

let lastCrossProgramReconcile = 0;

export async function getPipelineList(vertical: string): Promise<PipelineItem[]> {
  const now = Date.now();
  if (now - lastCrossProgramReconcile > 60_000) {
    lastCrossProgramReconcile = now;
    try {
      await reconcileCrossProgramCandidacies();
      await ensureContactsForUnlinkedFormAmbassadors();
    } catch {
      /* não bloqueia o pipeline */
    }
  }

  const linkedAmbassadorIds = new Set<string>();
  const items: PipelineItem[] = [];

  const contacts = await prisma.contact.findMany({
    where: { vertical },
    include: {
      ambassador: {
        include: {
          partnership: true,
          quickNotes: {
            where: { completed: false },
            orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
          },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  for (const c of contacts) {
    const amb = c.ambassador;
    if (amb) {
      if (amb.status === "Ativo" || amb.status === "Inativo") continue;
      linkedAmbassadorIds.add(amb.id);
      items.push(buildFromAmbassador(amb, c, false));
    } else if (c.status === "Desinteressado") {
      items.push(buildFromContact(c, "Desinteressado"));
    } else {
      items.push(buildFromContact(c, c.status as PipelineStage));
    }
  }

  const unlinkedAmbassadors = await prisma.ambassador.findMany({
    where: {
      program: vertical,
      status: { in: ["Pendente", "Proposta", "Desinteressado"] },
      ...(linkedAmbassadorIds.size > 0
        ? { id: { notIn: [...linkedAmbassadorIds] } }
        : {}),
    },
    include: {
      partnership: true,
      quickNotes: {
        where: { completed: false },
        orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
      },
    },
    orderBy: { fullName: "asc" },
  });

  for (const a of unlinkedAmbassadors) {
    items.push(buildFromAmbassador(a, null, a.status === "Pendente"));
  }

  return items.sort((a, b) => a.displayName.localeCompare(b.displayName, "pt-BR"));
}

export function filterPipelineByScope(
  items: PipelineItem[],
  scope: string | undefined
): PipelineItem[] {
  switch (scope) {
    case "__pipeline__":
      return items.filter((i) =>
        ["Novo", "Trabalhando", "Pendente", "Proposta"].includes(i.stage)
      );
    case "__prospeccao__":
      return items.filter((i) => i.stage === "Novo" || i.stage === "Trabalhando");
    case "__candidaturas__":
      return items.filter((i) => i.stage === "Pendente" || i.stage === "Proposta");
    case "__desinteressado__":
      return items.filter((i) => i.stage === "Desinteressado");
    case "__needsReview__":
      return items.filter((i) => needsAnalysis(i));
    case "__proposalStale__":
      return items.filter((i) => isProposalStale(i));
    case "__contactStale__":
      return items.filter((i) => i.staleContact);
    case "__needsLink__":
      return items.filter((i) => i.needsLink);
    default:
      if (scope && scope !== "") {
        return items.filter((i) => i.stage === scope);
      }
      return items.filter((i) =>
        ["Novo", "Trabalhando", "Pendente", "Proposta"].includes(i.stage)
      );
  }
}

export function countPipelineActions(items: PipelineItem[], scope: string): number {
  const filtered = filterPipelineByScope(items, scope);
  if (scope === "__prospeccao__") {
    return filtered.filter((i) => i.staleContact).length;
  }
  if (scope === "__candidaturas__") {
    return filtered.filter((i) => i.needsReview || i.staleProposal || i.needsLink).length;
  }
  if (scope === "__pipeline__") {
    return filtered.filter(
      (i) => i.needsReview || i.staleContact || i.staleProposal || i.needsLink
    ).length;
  }
  return 0;
}

export function computePipelineCountsFromItems(
  items: PipelineItem[],
  respostasPending = 0
): PipelineCounts {
  const pipelineItems = filterPipelineByScope(items, "__pipeline__");
  const candidaturaItems = filterPipelineByScope(items, "__candidaturas__");

  const needsReview = candidaturaItems.filter((i) => i.needsReview).length;
  const staleContacts = items.filter((i) => i.staleContact).length;
  const staleProposals = candidaturaItems.filter((i) => i.staleProposal).length;
  const needsLink = candidaturaItems.filter((i) => i.needsLink).length;

  const actionTotal =
    needsReview + staleContacts + staleProposals + needsLink + respostasPending;

  return {
    sidebarTotal: actionTotal,
    pipeline: pipelineItems.length,
    prospeccao: filterPipelineByScope(items, "__prospeccao__").length,
    candidaturas: candidaturaItems.length,
    desinteressados: filterPipelineByScope(items, "__desinteressado__").length,
    needsReview,
    staleContacts,
    staleProposals,
    needsLink,
    respostasPending,
  };
}

export async function getPipelineCounts(vertical: string): Promise<PipelineCounts> {
  const items = await getPipelineList(vertical);

  let respostasPending = 0;
  try {
    const { getCandidaturasSyncStatus } = await import("@/lib/candidaturas-sync");
    const sync = await getCandidaturasSyncStatus();
    const sheet = sync.sheets.find((s) => s.program === vertical);
    respostasPending = sheet?.pendingRows ?? 0;
  } catch {
    /* ignore */
  }

  return computePipelineCountsFromItems(items, respostasPending);
}

export function pipelineToParceriaItem(item: PipelineItem) {
  if (!item.ambassadorId) return null;
  return {
    id: item.ambassadorId,
    program: item.program,
    fullName: item.fullName || item.displayName,
    socialName: item.socialName,
    email: item.email,
    whatsapp: item.whatsapp,
    instagram: item.instagram || "",
    status: item.status,
    source: item.source,
    applicationReceivedAt: item.applicationReceivedAt,
    applicationFormData: item.applicationFormData,
    respostasSheetName: item.respostasSheetName,
    respostasSheetRow: item.respostasSheetRow,
    needsReview: item.needsReview,
    alerts: item.alerts,
    quickNotes: item.quickNotes,
    partnership: item.partnership,
    contact: item.contactId ? { id: item.contactId } : null,
  };
}
