import {
  listChildFiles,
  trashFile,
  uploadPdf,
  withDriveToken,
} from "@/lib/drive-client";
import {
  buildSignedTermFileName,
  buildUnsignedTermBaseName,
  resolvePersonFolder,
} from "@/lib/termo-folders";
import type { Ambassador, MonthlyFinance } from "@prisma/client";

type FinanceBundle = MonthlyFinance & { ambassador: Ambassador };

function isUnsignedTermFile(name: string): boolean {
  const upper = name.toUpperCase();
  return upper.includes("TERMO MENSAL (RPA)") && !upper.includes("ASSINADO");
}

function isSignedTermFile(name: string): boolean {
  return name.toUpperCase().includes("TERMO MENSAL (RPA) ASSINADO");
}

async function cleanupTermFiles(
  token: string,
  personFolderId: string,
  options: { removeSigned?: boolean }
): Promise<void> {
  const files = await listChildFiles(token, personFolderId);
  for (const file of files) {
    const shouldTrash =
      isUnsignedTermFile(file.name) || (options.removeSigned && isSignedTermFile(file.name));
    if (shouldTrash) {
      await trashFile(token, file.id);
    }
  }
}

export type UploadSignedTermoResult = {
  ok: boolean;
  signedTermLink?: string;
  fileId?: string;
  error?: string;
};

export async function uploadSignedTermo(
  fin: FinanceBundle,
  pdfBuffer: ArrayBuffer | Buffer,
  _originalFilename?: string
): Promise<UploadSignedTermoResult> {
  try {
    return await withDriveToken(async (token) => {
      const { personFolderId, personFolderName } = await resolvePersonFolder(
        token,
        fin,
        fin.ambassador
      );

      await cleanupTermFiles(token, personFolderId, { removeSigned: true });

      const signedName = buildSignedTermFileName(personFolderName);
      const unsignedBase = buildUnsignedTermBaseName(personFolderName);

      const files = await listChildFiles(token, personFolderId);
      for (const file of files) {
        if (
          file.name === unsignedBase ||
          file.name === `${unsignedBase}.pdf` ||
          isUnsignedTermFile(file.name)
        ) {
          await trashFile(token, file.id);
        }
      }

      const pdf = await uploadPdf(token, personFolderId, signedName, pdfBuffer);
      const signedTermLink =
        pdf.webViewLink ||
        pdf.webContentLink ||
        `https://drive.google.com/file/d/${pdf.id}/view`;

      return { ok: true, signedTermLink, fileId: pdf.id };
    });
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

export function isSignedTermoUploadConfigured(): boolean {
  return Boolean(process.env.GMAIL_REFRESH_TOKEN);
}
