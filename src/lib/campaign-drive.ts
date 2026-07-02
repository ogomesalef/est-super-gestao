import { createFolder, driveFolderUrl, ensureFolderName, findChildFolder, isDriveConfigured } from "@/lib/drive-client";
import { withDriveToken } from "@/lib/drive-client";

const ROOT_FOLDER_ID =
  process.env.DRIVE_ROOT_ENTREGAS_ID || "1IjzxmHQi_T6z7Hgvu93w8Z1brFrk_v-C";
const CAMPAIGNS_PARENT = "_CAMPANHAS";

export function isCampaignDriveConfigured(): boolean {
  return isDriveConfigured() && Boolean(ROOT_FOLDER_ID);
}

export async function ensureCampaignDriveFolder(
  campaignName: string
): Promise<{ ok: boolean; folderUrl?: string; error?: string }> {
  try {
    const folderId = await withDriveToken(async (token) => {
      const campaignsRoot = await createFolder(token, ROOT_FOLDER_ID, CAMPAIGNS_PARENT);
      return createFolder(token, campaignsRoot, campaignName.trim());
    });
    return { ok: true, folderUrl: driveFolderUrl(folderId) };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

export async function findCampaignDriveFolder(campaignName: string): Promise<string | null> {
  try {
    return await withDriveToken(async (token) => {
      const campaignsRoot = await findChildFolder(token, ROOT_FOLDER_ID, CAMPAIGNS_PARENT);
      if (!campaignsRoot) return null;
      return findChildFolder(token, campaignsRoot, campaignName.trim());
    });
  } catch {
    return null;
  }
}
