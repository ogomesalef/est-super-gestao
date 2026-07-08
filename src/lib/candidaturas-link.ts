import { prisma } from "./prisma";
import { normalizeHandle } from "./utils";

function normalizeInstagram(instagram: string | null | undefined): string {
  return normalizeHandle(instagram);
}

async function findContactForPipelineLink(instagram: string, program?: string) {
  const ig = normalizeInstagram(instagram);
  if (!ig) return null;

  const baseWhere = {
    instagram: ig,
    ambassadorId: null,
    status: { in: ["Novo", "Trabalhando"] as string[] },
  };

  if (program) {
    const match = await prisma.contact.findFirst({
      where: { ...baseWhere, vertical: program },
      orderBy: { updatedAt: "desc" },
    });
    if (match) return match;
  }

  return prisma.contact.findFirst({
    where: baseWhere,
    orderBy: { updatedAt: "desc" },
  });
}

async function linkContactToAmbassador(contactId: string, ambassadorId: string) {
  return prisma.contact.update({
    where: { id: contactId },
    data: { ambassadorId },
  });
}

export async function linkContactByInstagram(
  program: string,
  instagram: string,
  ambassadorId: string
): Promise<string | null> {
  const existing = await prisma.contact.findFirst({
    where: { ambassadorId },
    select: { id: true },
  });
  if (existing) return existing.id;

  const contact = await findContactForPipelineLink(instagram, program);
  if (!contact) return null;

  try {
    await linkContactToAmbassador(contact.id, ambassadorId);
    return contact.id;
  } catch {
    return null;
  }
}

const RESPOSTAS_SHEET_BY_PROGRAM: Record<string, string> = {
  OAB: "Respostas OAB",
  ECJ: "Respostas ECJ",
};

function hasFormCandidacy(
  ambassador: {
    respostasSheetName: string | null;
    applicationFormData: string | null;
  },
  program: string
): boolean {
  const expectedSheet = RESPOSTAS_SHEET_BY_PROGRAM[program];
  if (!expectedSheet || ambassador.respostasSheetName !== expectedSheet) return false;
  const raw = ambassador.applicationFormData?.trim();
  return Boolean(raw && raw !== "{}" && raw !== "null");
}

/** Remove pendência fantasma na vertical errada quando a candidatura real está na outra. */
export async function resolveCrossProgramCandidacyDuplicate(
  program: string,
  instagram: string,
  keepAmbassadorId: string
): Promise<void> {
  const ig = normalizeInstagram(instagram);
  if (!ig || (program !== "OAB" && program !== "ECJ")) return;

  const otherProgram = program === "ECJ" ? "OAB" : "ECJ";
  const other = await prisma.ambassador.findUnique({
    where: { program_instagram: { program: otherProgram, instagram: ig } },
  });
  if (!other || other.id === keepAmbassadorId) return;
  if (!["Pendente", "Proposta"].includes(other.status)) return;
  if (hasFormCandidacy(other, otherProgram)) return;

  await prisma.ambassador.update({
    where: { id: other.id },
    data: {
      status: "Desinteressado",
      needsReview: false,
      alerts: [other.alerts, `Candidatura consolidada em ${program}`].filter(Boolean).join(" | "),
    },
  });
}

export async function reconcileCrossProgramCandidacies(): Promise<void> {
  for (const program of ["OAB", "ECJ"] as const) {
    const sheet = RESPOSTAS_SHEET_BY_PROGRAM[program];
    const confirmed = await prisma.ambassador.findMany({
      where: {
        program,
        respostasSheetName: sheet,
        applicationFormData: { not: null },
        status: { in: ["Pendente", "Proposta"] },
      },
      select: { id: true, instagram: true },
    });
    for (const amb of confirmed) {
      await resolveCrossProgramCandidacyDuplicate(program, amb.instagram, amb.id);
    }
  }
}

export async function ensureContactForFormAmbassador(
  ambassadorId: string,
  program: string,
  instagram: string,
  tiktok?: string | null
): Promise<string | null> {
  const linked = await linkContactByInstagram(program, instagram, ambassadorId);
  if (linked) return linked;

  const ig = normalizeInstagram(instagram);
  if (!ig) return null;

  const handle = ig.replace(/^@/, "");
  const contact = await prisma.contact.create({
    data: {
      vertical: program,
      status: "Trabalhando",
      instagram: ig,
      linkIg: `https://instagram.com/${handle}`,
      tiktok: tiktok || null,
      linkTiktok: tiktok ? `https://tiktok.com/@${tiktok.replace(/^@/, "")}` : null,
      origin: "Formulário",
      ambassadorId,
    },
  });
  return contact.id;
}

export async function ensureContactsForUnlinkedFormAmbassadors(): Promise<void> {
  const ambs = await prisma.ambassador.findMany({
    where: {
      status: { in: ["Pendente", "Proposta"] },
      contact: null,
      OR: [{ source: "formulario" }, { respostasSheetName: { startsWith: "Respostas " } }],
    },
    select: { id: true, program: true, instagram: true, tiktok: true },
  });
  for (const amb of ambs) {
    await ensureContactForFormAmbassador(amb.id, amb.program, amb.instagram, amb.tiktok);
  }
}
