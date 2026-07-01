import { getGoogleAccessToken } from "@/lib/google-oauth";

const ROOT_FOLDER_ID =
  process.env.DRIVE_ROOT_ENTREGAS_ID || "1IjzxmHQi_T6z7Hgvu93w8Z1brFrk_v-C";
const CAMPAIGNS_PARENT = "_CAMPANHAS";

async function driveFetch(path: string, init: RequestInit & { token: string }) {
  const { token, ...rest } = init;
  const res = await fetch(`https://www.googleapis.com/drive/v3${path}`, {
    ...rest,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(rest.headers || {}),
    },
  });
  const text = await res.text();
  let json: Record<string, unknown> = {};
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = { raw: text };
  }
  if (!res.ok) {
    const err = (json as { error?: { message?: string } }).error?.message || text || res.statusText;
    throw new Error(`Drive API: ${err}`);
  }
  return json;
}

async function findChildFolder(token: string, parentId: string, name: string): Promise<string | null> {
  const safeName = name.replace(/'/g, "\\'");
  const q = encodeURIComponent(
    `mimeType='application/vnd.google-apps.folder' and '${parentId}' in parents and name='${safeName}' and trashed=false`
  );
  const data = (await driveFetch(`/files?q=${q}&fields=files(id,name)&supportsAllDrives=true`, {
    token,
  })) as { files?: Array<{ id: string }> };
  return data.files?.[0]?.id || null;
}

async function createFolder(token: string, parentId: string, name: string): Promise<string> {
  const existing = await findChildFolder(token, parentId, name);
  if (existing) return existing;

  const data = (await driveFetch("/files?supportsAllDrives=true", {
    token,
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name,
      mimeType: "application/vnd.google-apps.folder",
      parents: [parentId],
    }),
  })) as { id: string };
  return data.id;
}

function folderUrl(folderId: string): string {
  return `https://drive.google.com/drive/folders/${folderId}`;
}

export function isCampaignDriveConfigured(): boolean {
  return Boolean(process.env.GMAIL_REFRESH_TOKEN && ROOT_FOLDER_ID);
}

export async function ensureCampaignDriveFolder(
  campaignName: string
): Promise<{ ok: boolean; folderUrl?: string; error?: string }> {
  try {
    const token = await getGoogleAccessToken();
    const campaignsRoot = await createFolder(token, ROOT_FOLDER_ID, CAMPAIGNS_PARENT);
    const folderId = await createFolder(token, campaignsRoot, campaignName.trim());
    return { ok: true, folderUrl: folderUrl(folderId) };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}
