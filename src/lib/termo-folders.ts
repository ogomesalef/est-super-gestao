import { createFolder } from "@/lib/drive-client";
import type { Ambassador, MonthlyFinance } from "@prisma/client";

const ROOT_FOLDER_ID =
  process.env.DRIVE_ROOT_TERMOS_ID || "1dSGeahfd6eyA3FBKN7L_BbwK-bxYY8Vp";

export function sanitizeTermoPart(value: string): string {
  return String(value || "")
    .replace(/[/\\?%*:|"<>]/g, "-")
    .trim();
}

export function normalizeTermoIg(ig: string): string {
  const s = String(ig || "").trim();
  return s.startsWith("@") ? s : `@${s}`;
}

export function buildPersonFolderName(fin: MonthlyFinance, ambassador: Ambassador): string {
  const ig = normalizeTermoIg(ambassador.instagram);
  return `${fin.monthRef} | ${sanitizeTermoPart(ambassador.program)} | ${sanitizeTermoPart(ambassador.fullName)} | ${sanitizeTermoPart(ig)}`;
}

export function buildUnsignedTermBaseName(personFolderName: string): string {
  return `${personFolderName} | TERMO MENSAL (RPA)`;
}

export function buildSignedTermFileName(personFolderName: string): string {
  return `${personFolderName} | TERMO MENSAL (RPA) ASSINADO.pdf`;
}

export async function resolvePersonFolder(
  token: string,
  fin: MonthlyFinance,
  ambassador: Ambassador
): Promise<{ personFolderId: string; personFolderName: string }> {
  const monthFolderName = fin.monthRef;
  const personFolderName = buildPersonFolderName(fin, ambassador);
  const monthFolderId = await createFolder(token, ROOT_FOLDER_ID, monthFolderName);
  const personFolderId = await createFolder(token, monthFolderId, personFolderName);
  return { personFolderId, personFolderName };
}

export function getTermosRootFolderId(): string {
  return ROOT_FOLDER_ID;
}
