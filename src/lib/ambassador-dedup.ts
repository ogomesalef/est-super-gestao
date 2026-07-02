import { prisma } from "./prisma";
import { normalizeHandle } from "./utils";
import {
  parseRespostasFromPayload,
  upsertAmbassadorFromRespostas,
  type UpsertRespostasOptions,
} from "./candidaturas-sync";

export function normalizeInstagram(instagram: string | null | undefined): string {
  return normalizeHandle(instagram);
}

export async function findAmbassadorByIg(program: string, instagram: string) {
  const ig = normalizeInstagram(instagram);
  if (!ig) return null;
  return prisma.ambassador.findUnique({
    where: { program_instagram: { program, instagram: ig } },
    include: { partnership: true, contact: true },
  });
}

export async function findContactByIg(vertical: string, instagram: string) {
  const ig = normalizeInstagram(instagram);
  if (!ig) return null;
  return prisma.contact.findFirst({
    where: { vertical, instagram: ig, ambassadorId: null },
  });
}

export async function findUnlinkedContactByIg(instagram: string, vertical?: string) {
  const ig = normalizeInstagram(instagram);
  if (!ig) return null;
  return prisma.contact.findFirst({
    where: {
      instagram: ig,
      ambassadorId: null,
      ...(vertical ? { vertical } : {}),
    },
  });
}

export async function linkContactToAmbassador(contactId: string, ambassadorId: string) {
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
  const contact = await findUnlinkedContactByIg(instagram, program);
  if (!contact) return null;

  const alreadyLinked = await prisma.contact.findFirst({
    where: { ambassadorId },
    select: { id: true },
  });
  if (alreadyLinked) return null;

  try {
    await linkContactToAmbassador(contact.id, ambassadorId);
    return contact.id;
  } catch {
    return null;
  }
}

export type UpsertCandidaturaInput = {
  program: string;
  fullName: string;
  email?: string | null;
  whatsapp?: string | null;
  instagram: string;
  tiktok?: string | null;
  youtube?: string | null;
  source?: string;
};

export async function upsertCandidaturaAmbassador(input: UpsertCandidaturaInput) {
  const ig = normalizeInstagram(input.instagram);
  if (!ig) throw new Error("Instagram obrigatório");

  const parsed = parseRespostasFromPayload(input.program, {
    program: input.program,
    "Seu Instagram (@)": ig,
    "Nome completo": input.fullName || ig,
    "E-mail": input.email || "",
    "WhatsApp com DDD": input.whatsapp || "",
    "Seu TikTok (@)": input.tiktok || "",
    YouTube: input.youtube || "",
  });

  if (!parsed) throw new Error("Candidatura inválida");

  const result = await upsertAmbassadorFromRespostas(parsed, {
    source: (input.source as UpsertRespostasOptions["source"]) || "formulario",
    markNeedsReview: true,
  });

  const ambassador = await prisma.ambassador.findUnique({
    where: { id: result.ambassadorId },
    include: { partnership: true },
  });

  if (!ambassador) throw new Error("Embaixador não encontrado após upsert");

  return {
    ambassador,
    created: result.created,
    linkedContactId: result.linkedContactId,
  };
}
