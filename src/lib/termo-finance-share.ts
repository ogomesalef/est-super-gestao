import {
  extractDriveFileId,
  revokeFileShareForEmail,
  shareFileWithEmail,
  withDriveToken,
} from "@/lib/drive-client";
import { financeTeamShareEmails } from "@/lib/finance-recipients";

export async function shareSignedTermWithFinanceTeam(
  signedTermLink: string | null | undefined,
  ambassadorEmail?: string | null
): Promise<{ ok: boolean; error?: string }> {
  const fileId = extractDriveFileId(signedTermLink);
  if (!fileId) {
    return { ok: false, error: "Link do termo assinado inválido ou ausente" };
  }

  try {
    await withDriveToken(async (token) => {
      for (const email of financeTeamShareEmails()) {
        await shareFileWithEmail(token, fileId, email, "reader");
      }
      if (ambassadorEmail?.trim()) {
        await revokeFileShareForEmail(token, fileId, ambassadorEmail.trim());
      }
    });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}
