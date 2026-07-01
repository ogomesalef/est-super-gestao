import { getGoogleAccessToken } from "@/lib/google-oauth";
import { buildTermoReplacements } from "@/lib/termo-data";
import type { Ambassador, MonthlyControl, MonthlyFinance, Partnership } from "@prisma/client";

const TEMPLATE_DOC_ID =
  process.env.TERM_TEMPLATE_DOC_ID || "1CnGLIh3CvVv3agBLH582Rp1WfYusABnxPgM_eQSmhlU";
const ROOT_FOLDER_ID =
  process.env.DRIVE_ROOT_TERMOS_ID || "1dSGeahfd6eyA3FBKN7L_BbwK-bxYY8Vp";

const GOOGLE_DOC_MIME = "application/vnd.google-apps.document";

type FinanceBundle = MonthlyFinance & {
  ambassador: Ambassador & { partnership: Partnership | null };
};

type ControlBundle = MonthlyControl | null;

function sanitizePart(value: string): string {
  return String(value || "")
    .replace(/[/\\?%*:|"<>]/g, "-")
    .trim();
}

function normalizeIg(ig: string): string {
  const s = String(ig || "").trim();
  return s.startsWith("@") ? s : `@${s}`;
}

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

async function docsBatchUpdate(docId: string, token: string, requests: object[]) {
  if (!requests.length) return;
  const res = await fetch(`https://docs.googleapis.com/v1/documents/${docId}:batchUpdate`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ requests }),
  });
  const data = (await res.json()) as { error?: { message?: string } };
  if (!res.ok) throw new Error(data.error?.message || "Docs API batchUpdate falhou");
}

/** Substitui placeholders no Google Doc via replaceAllText (template nativo). */
async function replacePlaceholdersInDoc(
  docId: string,
  token: string,
  replacements: Record<string, string>
) {
  const replaceAllRequests = Object.entries(replacements).map(([text, replaceText]) => ({
    replaceAllText: {
      containsText: { text, matchCase: false },
      replaceText: replaceText ?? "",
    },
  }));

  for (let i = 0; i < replaceAllRequests.length; i += 80) {
    await docsBatchUpdate(docId, token, replaceAllRequests.slice(i, i + 80));
  }
}

async function findChildFolder(token: string, parentId: string, name: string): Promise<string | null> {
  const q = encodeURIComponent(
    `mimeType='application/vnd.google-apps.folder' and '${parentId}' in parents and name='${name.replace(/'/g, "\\'")}' and trashed=false`
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

async function getFileMeta(
  token: string,
  fileId: string
): Promise<{ id: string; name: string; mimeType: string }> {
  return driveFetch(`/files/${fileId}?fields=id,name,mimeType&supportsAllDrives=true`, {
    token,
  }) as Promise<{ id: string; name: string; mimeType: string }>;
}

async function copyFile(token: string, fileId: string, parentId: string, name: string): Promise<string> {
  const data = (await driveFetch(
    `/files/${fileId}/copy?supportsAllDrives=true&fields=id,webViewLink`,
    {
      token,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, parents: [parentId] }),
    }
  )) as { id: string };
  return data.id;
}

/** Converte .docx (Office) em Google Doc nativo — necessário para a Docs API editar placeholders. */
async function importOfficeAsGoogleDoc(
  token: string,
  fileId: string,
  parentId: string,
  name: string,
  sourceMime: string
): Promise<string> {
  const download = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&supportsAllDrives=true`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!download.ok) {
    throw new Error(`Download do template: ${await download.text()}`);
  }
  const fileBytes = Buffer.from(await download.arrayBuffer());

  const metadata = JSON.stringify({
    name,
    parents: [parentId],
    mimeType: GOOGLE_DOC_MIME,
  });
  const boundary = `sg_${Date.now()}`;
  const body = Buffer.concat([
    Buffer.from(`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n`),
    Buffer.from(`--${boundary}\r\nContent-Type: ${sourceMime}\r\n\r\n`),
    fileBytes,
    Buffer.from(`\r\n--${boundary}--`),
  ]);

  const res = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&convert=true&supportsAllDrives=true&fields=id,mimeType",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body,
    }
  );
  const data = (await res.json()) as { id?: string; mimeType?: string; error?: { message?: string } };
  if (!res.ok || !data.id) {
    throw new Error(data.error?.message || "Conversão do template para Google Doc falhou");
  }
  if (data.mimeType !== GOOGLE_DOC_MIME) {
    throw new Error(
      "Template não pôde ser convertido para Google Doc. Salve o arquivo como Google Docs nativo no Drive."
    );
  }
  return data.id;
}

async function copyAsEditableGoogleDoc(
  token: string,
  fileId: string,
  parentId: string,
  name: string
): Promise<string> {
  const meta = await getFileMeta(token, fileId);

  if (meta.mimeType === GOOGLE_DOC_MIME) {
    return copyFile(token, fileId, parentId, name);
  }

  // Tentativa 1: copy com mimeType de conversão (funciona em alguns formatos Office)
  try {
    const copied = (await driveFetch(
      `/files/${fileId}/copy?supportsAllDrives=true&fields=id,mimeType`,
      {
        token,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          parents: [parentId],
          mimeType: GOOGLE_DOC_MIME,
        }),
      }
    )) as { id: string; mimeType?: string };

    if (copied.mimeType === GOOGLE_DOC_MIME) {
      return copied.id;
    }
  } catch {
    // segue para import com convert=true
  }

  return importOfficeAsGoogleDoc(token, fileId, parentId, name, meta.mimeType);
}

async function exportPdf(token: string, fileId: string): Promise<ArrayBuffer> {
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=application/pdf`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Export PDF: ${t || res.statusText}`);
  }
  return res.arrayBuffer();
}

async function uploadPdf(
  token: string,
  parentId: string,
  name: string,
  pdf: ArrayBuffer
): Promise<{ id: string; webViewLink?: string; webContentLink?: string }> {
  const metadata = JSON.stringify({ name, parents: [parentId], mimeType: "application/pdf" });
  const boundary = `sg_${Date.now()}`;
  const body = Buffer.concat([
    Buffer.from(`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n`),
    Buffer.from(`--${boundary}\r\nContent-Type: application/pdf\r\n\r\n`),
    Buffer.from(pdf),
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

async function shareReader(token: string, fileId: string, email: string) {
  await driveFetch(`/files/${fileId}/permissions?supportsAllDrives=true&sendNotificationEmail=false`, {
    token,
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role: "reader", type: "user", emailAddress: email }),
  });
}

export type GenerateTermoResult = {
  ok: boolean;
  termLink?: string;
  docLink?: string;
  pdfFileId?: string;
  docFileId?: string;
  error?: string;
};

export async function generateTermoAdesao(
  fin: FinanceBundle,
  control: ControlBundle,
  opts?: { force?: boolean; shareWithEmail?: string | null }
): Promise<GenerateTermoResult> {
  if (fin.termLink && !opts?.force) {
    return { ok: true, termLink: fin.termLink };
  }

  try {
    const token = await getGoogleAccessToken();
    const amb = fin.ambassador;
    const ig = normalizeIg(amb.instagram);
    const monthFolderName = fin.monthRef;
    const personFolderName = `${fin.monthRef} | ${sanitizePart(amb.program)} | ${sanitizePart(amb.fullName)} | ${sanitizePart(ig)}`;
    const fileBaseName = `${personFolderName} | TERMO MENSAL (RPA)`;

    const monthFolderId = await createFolder(token, ROOT_FOLDER_ID, monthFolderName);
    const personFolderId = await createFolder(token, monthFolderId, personFolderName);

    const docId = await copyAsEditableGoogleDoc(token, TEMPLATE_DOC_ID, personFolderId, fileBaseName);
    const replacements = buildTermoReplacements(fin, control);
    await replacePlaceholdersInDoc(docId, token, replacements);

    const pdfBuffer = await exportPdf(token, docId);
    const pdf = await uploadPdf(token, personFolderId, `${fileBaseName}.pdf`, pdfBuffer);

    const termLink =
      pdf.webViewLink ||
      pdf.webContentLink ||
      `https://drive.google.com/file/d/${pdf.id}/view`;

    const docMeta = (await driveFetch(`/files/${docId}?fields=webViewLink&supportsAllDrives=true`, {
      token,
    })) as { webViewLink?: string };
    const docLink = docMeta.webViewLink || `https://docs.google.com/document/d/${docId}/edit`;

    const shareEmail = opts?.shareWithEmail || amb.email;
    if (shareEmail) {
      await shareReader(token, pdf.id, shareEmail);
      await shareReader(token, docId, shareEmail);
    }

    return {
      ok: true,
      termLink,
      docLink,
      pdfFileId: pdf.id,
      docFileId: docId,
    };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

export function isTermoGenerationConfigured(): boolean {
  return Boolean(
    process.env.GMAIL_REFRESH_TOKEN &&
      (process.env.TERM_TEMPLATE_DOC_ID || TEMPLATE_DOC_ID) &&
      (process.env.DRIVE_ROOT_TERMOS_ID || ROOT_FOLDER_ID)
  );
}
