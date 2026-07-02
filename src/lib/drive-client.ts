import { getGoogleAccessToken } from "@/lib/google-oauth";

export async function driveFetch(path: string, init: RequestInit & { token: string }) {
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

export function driveFolderUrl(folderId: string): string {
  return `https://drive.google.com/drive/folders/${folderId}`;
}

export function driveFileUrl(fileId: string): string {
  return `https://drive.google.com/file/d/${fileId}/view`;
}

export function extractFolderId(url: string | null | undefined): string | null {
  if (!url) return null;
  const m = url.match(/\/folders\/([^/?]+)/);
  return m?.[1] ?? null;
}

export function extractDriveFileId(url: string | null | undefined): string | null {
  if (!url) return null;
  const m = url.match(/\/file\/d\/([^/]+)/) || url.match(/[?&]id=([^&]+)/);
  return m?.[1] ?? null;
}

export async function findChildFolders(
  token: string,
  parentId: string,
  name: string
): Promise<Array<{ id: string; name: string }>> {
  const safeName = name.replace(/'/g, "\\'");
  const q = encodeURIComponent(
    `mimeType='application/vnd.google-apps.folder' and '${parentId}' in parents and name='${safeName}' and trashed=false`
  );
  const data = (await driveFetch(`/files?q=${q}&fields=files(id,name)&supportsAllDrives=true`, {
    token,
  })) as { files?: Array<{ id: string; name: string }> };
  return data.files || [];
}

export async function findChildFolder(token: string, parentId: string, name: string): Promise<string | null> {
  const folders = await findChildFolders(token, parentId, name);
  return folders[0]?.id || null;
}

export async function createFolder(token: string, parentId: string, name: string): Promise<string> {
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

export async function ensureFolderName(token: string, folderId: string, name: string): Promise<void> {
  const data = (await driveFetch(`/files/${folderId}?fields=name&supportsAllDrives=true`, {
    token,
  })) as { name?: string };
  if (data.name === name) return;
  await driveFetch(`/files/${folderId}?supportsAllDrives=true`, {
    token,
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
}

export type DriveFile = { id: string; name: string; mimeType?: string; parents?: string[] };

export async function listChildFiles(token: string, parentId: string): Promise<DriveFile[]> {
  const q = encodeURIComponent(`'${parentId}' in parents and trashed=false`);
  const data = (await driveFetch(
    `/files?q=${q}&fields=files(id,name,mimeType,parents)&supportsAllDrives=true&pageSize=200`,
    { token }
  )) as { files?: DriveFile[] };
  return data.files || [];
}

export async function moveFile(token: string, fileId: string, newParentId: string, oldParentId: string) {
  await driveFetch(
    `/files/${fileId}?addParents=${newParentId}&removeParents=${oldParentId}&supportsAllDrives=true`,
    { token, method: "PATCH" }
  );
}

export async function renameFile(token: string, fileId: string, name: string) {
  await driveFetch(`/files/${fileId}?supportsAllDrives=true`, {
    token,
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
}

type DrivePermission = { id: string; type: string; role: string; emailAddress?: string };

export async function listFilePermissions(
  token: string,
  fileId: string
): Promise<DrivePermission[]> {
  const data = (await driveFetch(
    `/files/${fileId}/permissions?fields=permissions(id,type,role,emailAddress)&supportsAllDrives=true`,
    { token }
  )) as { permissions?: DrivePermission[] };
  return data.permissions || [];
}

export async function shareFileWithEmail(
  token: string,
  fileId: string,
  email: string,
  role: "reader" | "writer" = "reader"
): Promise<void> {
  const normalized = email.trim().toLowerCase();
  const existing = (await listFilePermissions(token, fileId)).find(
    (p) => p.type === "user" && p.emailAddress?.toLowerCase() === normalized
  );
  if (existing?.role === role) return;

  await driveFetch(`/files/${fileId}/permissions?supportsAllDrives=true&sendNotificationEmail=false`, {
    token,
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role, type: "user", emailAddress: normalized }),
  });
}

export async function revokeFileShareForEmail(
  token: string,
  fileId: string,
  email: string
): Promise<boolean> {
  const normalized = email.trim().toLowerCase();
  const match = (await listFilePermissions(token, fileId)).find(
    (p) => p.type === "user" && p.emailAddress?.toLowerCase() === normalized
  );
  if (!match) return false;
  await driveFetch(`/files/${fileId}/permissions/${match.id}?supportsAllDrives=true`, {
    token,
    method: "DELETE",
  });
  return true;
}

export async function trashFile(token: string, fileId: string): Promise<void> {
  await driveFetch(`/files/${fileId}?supportsAllDrives=true`, {
    token,
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ trashed: true }),
  });
}

export async function uploadPdf(
  token: string,
  parentId: string,
  name: string,
  pdf: ArrayBuffer | Buffer
): Promise<{ id: string; webViewLink?: string; webContentLink?: string }> {
  const bytes = Buffer.isBuffer(pdf) ? pdf : Buffer.from(pdf);
  const metadata = JSON.stringify({ name, parents: [parentId], mimeType: "application/pdf" });
  const boundary = `sg_${Date.now()}`;
  const body = Buffer.concat([
    Buffer.from(`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n`),
    Buffer.from(`--${boundary}\r\nContent-Type: application/pdf\r\n\r\n`),
    bytes,
    Buffer.from(`\r\n--${boundary}--`),
  ]);

  const res = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true&fields=id,webViewLink,webContentLink",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body,
    }
  );
  const data = (await res.json()) as {
    id?: string;
    webViewLink?: string;
    webContentLink?: string;
    error?: { message?: string };
  };
  if (!res.ok || !data.id) throw new Error(data.error?.message || "Upload PDF falhou");
  return data as { id: string; webViewLink?: string; webContentLink?: string };
}

export async function withDriveToken<T>(fn: (token: string) => Promise<T>): Promise<T> {
  const token = await getGoogleAccessToken();
  return fn(token);
}

export function isDriveConfigured(): boolean {
  return Boolean(process.env.GMAIL_REFRESH_TOKEN);
}

export async function listFolderPermissions(
  token: string,
  folderId: string
): Promise<DrivePermission[]> {
  const data = (await driveFetch(
    `/files/${folderId}/permissions?fields=permissions(id,type,role,emailAddress)&supportsAllDrives=true`,
    { token }
  )) as { permissions?: DrivePermission[] };
  return data.permissions || [];
}

/** Compartilha pasta com e-mail específico como editor (writer). */
export async function shareFolderWithEmail(
  token: string,
  folderId: string,
  email: string,
  options?: { notify?: boolean }
): Promise<{ permissionId: string; email: string }> {
  const normalized = email.trim().toLowerCase();
  const existing = (await listFolderPermissions(token, folderId)).find(
    (p) => p.type === "user" && p.emailAddress?.toLowerCase() === normalized && p.role === "writer"
  );
  if (existing) {
    return { permissionId: existing.id, email: normalized };
  }

  const created = (await driveFetch(
    `/files/${folderId}/permissions?supportsAllDrives=true&sendNotificationEmail=${options?.notify ? "true" : "false"}`,
    {
      token,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "user",
        role: "writer",
        emailAddress: normalized,
      }),
    }
  )) as { id: string };

  return { permissionId: created.id, email: normalized };
}

/** Remove acesso de editor de um e-mail na pasta. */
export async function revokeFolderShareForEmail(
  token: string,
  folderId: string,
  email: string
): Promise<boolean> {
  const normalized = email.trim().toLowerCase();
  const permissions = await listFolderPermissions(token, folderId);
  const match = permissions.find(
    (p) => p.type === "user" && p.emailAddress?.toLowerCase() === normalized
  );
  if (!match) return false;
  await driveFetch(`/files/${folderId}/permissions/${match.id}?supportsAllDrives=true`, {
    token,
    method: "DELETE",
  });
  return true;
}

export async function setFolderPublicUpload(
  token: string,
  folderId: string,
  enable: boolean
): Promise<void> {
  const data = (await driveFetch(
    `/files/${folderId}/permissions?fields=permissions(id,type,role)&supportsAllDrives=true`,
    { token }
  )) as { permissions?: DrivePermission[] };

  const anyoneWriter = data.permissions?.find((p) => p.type === "anyone" && p.role === "writer");

  if (enable && !anyoneWriter) {
    await driveFetch(`/files/${folderId}/permissions?supportsAllDrives=true`, {
      token,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "anyone", role: "writer" }),
    });
    return;
  }

  if (!enable && anyoneWriter) {
    await driveFetch(
      `/files/${folderId}/permissions/${anyoneWriter.id}?supportsAllDrives=true`,
      { token, method: "DELETE" }
    );
  }
}

export async function folderHasPublicUpload(token: string, folderId: string): Promise<boolean> {
  const data = (await driveFetch(
    `/files/${folderId}/permissions?fields=permissions(type,role)&supportsAllDrives=true`,
    { token }
  )) as { permissions?: DrivePermission[] };
  return Boolean(data.permissions?.some((p) => p.type === "anyone" && p.role === "writer"));
}
