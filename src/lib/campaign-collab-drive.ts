import { prisma } from "@/lib/prisma";
import { normalizeHandle } from "@/lib/utils";
import {
  createFolder,
  driveFileUrl,
  driveFolderUrl,
  extractDriveFileId,
  extractFolderId,
  findChildFolders,
  isDriveConfigured,
  listChildFiles,
  moveFile,
  renameFile,
  withDriveToken,
  type DriveFile,
} from "@/lib/drive-client";

export const COLLAB_ROOT_FOLDER_ID =
  process.env.DRIVE_ROOT_COLLAB_ID || "1AldzAn7qVJL7ZHkgiP7RkTI5CVWTYU48";

export const COLLAB_INBOX_FOLDER_NAME = "_INBOX";
export const COLLAB_BASE_FOLDER_NAME = "00 Referência";

export type CollabAmbassador = {
  id: string;
  fullName: string;
  instagram: string;
  program: string;
};

export type CollabDrivePaths = {
  rootUrl: string;
  campaignFolderUrl: string;
  inboxUrl: string;
  baseFolderUrl: string;
  ambassadors: Array<{
    ambassadorId: string;
    folderUrl: string;
    folderName: string;
    expectedVideoName: string;
  }>;
};

export type CollabSyncResult = CollabOrganizeResult & {
  paths?: CollabDrivePaths;
};

export type CollabOrganizeResult = {
  ok: boolean;
  error?: string;
  moved: Array<{ file: string; ambassador: string; newName: string; destination: string }>;
  referencePlaced?: string;
  unmatched: string[];
  skipped: string[];
};

function sanitizeDriveName(value: string, max = 120): string {
  return value
    .replace(/[/\\?*:|"<>]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function stripAccents(value: string): string {
  return value.normalize("NFD").replace(/\p{M}/gu, "");
}

function fileExtension(name: string): string {
  const m = name.match(/(\.[a-z0-9]{2,5})$/i);
  return m ? m[1].toLowerCase() : ".mp4";
}

export function collabAmbassadorFolderName(a: CollabAmbassador): string {
  const handle = normalizeHandle(a.instagram);
  return sanitizeDriveName(`${a.program} — ${a.fullName} (${handle})`);
}

export function collabVideoFileName(campaignName: string, a: CollabAmbassador, ext = ".mp4"): string {
  const handle = normalizeHandle(a.instagram);
  const shortCampaign = sanitizeDriveName(campaignName, 48);
  return sanitizeDriveName(`Collab — ${shortCampaign} — ${a.fullName} (${handle})${ext}`, 180);
}

export function collabReferenceFileName(campaignName: string, ext = ".mp4"): string {
  return sanitizeDriveName(`Referência — ${sanitizeDriveName(campaignName, 48)}${ext}`, 120);
}

function isVideoFile(file: { name: string; mimeType?: string }): boolean {
  if (file.mimeType?.startsWith("video/")) return true;
  return /\.(mp4|mov|webm|m4v|avi|mkv)$/i.test(file.name);
}

function matchAmbassador(fileName: string, ambassadors: CollabAmbassador[]): CollabAmbassador | null {
  const normalized = stripAccents(fileName.toLowerCase());
  const matches: CollabAmbassador[] = [];

  for (const a of ambassadors) {
    const handle = normalizeHandle(a.instagram).replace("@", "");
    if (normalized.includes(`@${handle}`) || normalized.includes(handle)) {
      matches.push(a);
      continue;
    }
    const nameParts = stripAccents(a.fullName.toLowerCase()).split(/\s+/).filter((p) => p.length > 2);
    const hitCount = nameParts.filter((p) => normalized.includes(p)).length;
    if (nameParts.length >= 2 && hitCount >= 2) matches.push(a);
    else if (nameParts.length === 1 && hitCount === 1) matches.push(a);
  }

  if (matches.length === 1) return matches[0];
  return null;
}

async function folderIsDescendantOf(token: string, folderId: string, ancestorId: string): Promise<boolean> {
  let current: string | null = folderId;
  for (let depth = 0; depth < 8 && current; depth++) {
    if (current === ancestorId) return true;
    const meta = (await fetch(
      `https://www.googleapis.com/drive/v3/files/${current}?fields=parents&supportsAllDrives=true`,
      { headers: { Authorization: `Bearer ${token}` } }
    ).then((r) => r.json())) as { parents?: string[] };
    current = meta.parents?.[0] ?? null;
  }
  return false;
}

async function pickCampaignFolderId(
  token: string,
  folderName: string,
  preferredId: string | null
): Promise<string> {
  if (preferredId) {
    try {
      await listChildFiles(token, preferredId);
      return preferredId;
    } catch {
      /* pasta removida — recria abaixo */
    }
  }

  const matches = await findChildFolders(token, COLLAB_ROOT_FOLDER_ID, folderName);
  if (matches.length === 0) {
    return createFolder(token, COLLAB_ROOT_FOLDER_ID, folderName);
  }

  if (matches.length === 1) return matches[0].id;

  let best = matches[0];
  let bestScore = -1;
  for (const folder of matches) {
    const children = await listChildFiles(token, folder.id);
    const score =
      children.filter((c) => c.mimeType === "application/vnd.google-apps.folder").length * 2 +
      children.filter((c) => isVideoFile(c)).length * 3;
    if (score > bestScore) {
      bestScore = score;
      best = folder;
    }
  }
  return best.id;
}

async function organizeVideoFile(
  token: string,
  file: DriveFile,
  parentId: string,
  campaignName: string,
  ambassadors: CollabAmbassador[],
  folderByAmbassador: Map<string, { folderUrl: string; folderName: string }>,
  baseFolderId: string,
  moved: CollabOrganizeResult["moved"],
  unmatched: string[],
  assignmentUpdates: Map<string, string>
) {
  if (!isVideoFile(file)) return;

  const match = matchAmbassador(file.name, ambassadors);
  const ext = fileExtension(file.name);

  if (match) {
    const target = folderByAmbassador.get(match.id);
    if (!target) {
      unmatched.push(file.name);
      return;
    }
    const targetFolderId = extractFolderId(target.folderUrl);
    if (!targetFolderId) return;

    const newName = collabVideoFileName(campaignName, match, ext);
    await renameFile(token, file.id, newName);
    const oldParent = file.parents?.[0] || parentId;
    if (oldParent !== targetFolderId) {
      await moveFile(token, file.id, targetFolderId, oldParent);
    }
    assignmentUpdates.set(match.id, driveFileUrl(file.id));
    moved.push({
      file: file.name,
      ambassador: match.fullName,
      newName,
      destination: target.folderName,
    });
    return;
  }

  unmatched.push(file.name);
}

export function isCollabDriveConfigured(): boolean {
  return isDriveConfigured() && Boolean(COLLAB_ROOT_FOLDER_ID);
}

export async function syncCollabDrive(campaignId: string): Promise<CollabSyncResult> {
  if (!isCollabDriveConfigured()) {
    return { ok: false, error: "Drive não configurado", moved: [], unmatched: [], skipped: [] };
  }

  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: {
      collab: {
        include: {
          assignments: {
            include: {
              ambassador: { select: { id: true, fullName: true, instagram: true, program: true } },
            },
          },
        },
      },
    },
  });

  if (!campaign?.collab) {
    return { ok: false, error: "Collab não configurado", moved: [], unmatched: [], skipped: [] };
  }

  const folderLabel = sanitizeDriveName(
    campaign.collab.driveFolderName?.trim() || campaign.name
  );
  const ambassadors = campaign.collab.assignments.map((x) => x.ambassador);
  const moved: CollabOrganizeResult["moved"] = [];
  const unmatched: string[] = [];
  const skipped: string[] = [];
  const assignmentUpdates = new Map<string, string>();
  let referencePlaced: string | undefined;

  try {
    const paths = await withDriveToken(async (token) => {
      const preferredCampaignId = extractFolderId(campaign.collab!.driveFolderUrl);
      const campaignFolderId = await pickCampaignFolderId(token, folderLabel, preferredCampaignId);
      const inboxId = await createFolder(token, campaignFolderId, COLLAB_INBOX_FOLDER_NAME);
      const baseId = await createFolder(token, campaignFolderId, COLLAB_BASE_FOLDER_NAME);

      const ambassadorPaths: CollabDrivePaths["ambassadors"] = [];
      const folderByAmbassador = new Map<string, { folderUrl: string; folderName: string }>();

      for (const assignment of campaign.collab!.assignments) {
        const a = assignment.ambassador;
        const preferredAmbassadorId = extractFolderId(assignment.driveFolderUrl);
        let folderId: string;
        const folderName = collabAmbassadorFolderName(a);

        if (preferredAmbassadorId) {
          const validParent = await folderIsDescendantOf(token, preferredAmbassadorId, campaignFolderId);
          if (validParent && preferredAmbassadorId !== campaignFolderId) {
            folderId = preferredAmbassadorId;
          } else {
            folderId = await createFolder(token, campaignFolderId, folderName);
          }
        } else {
          folderId = await createFolder(token, campaignFolderId, folderName);
        }

        const folderUrl = driveFolderUrl(folderId);
        folderByAmbassador.set(a.id, { folderUrl, folderName });
        ambassadorPaths.push({
          ambassadorId: a.id,
          folderName,
          folderUrl,
          expectedVideoName: collabVideoFileName(campaign.name, a),
        });
      }

      const scanFolderIds = new Set<string>([inboxId, campaignFolderId]);

      const referenceFileId = extractDriveFileId(campaign.collab!.videoUrl);

      if (referenceFileId) {
        const refMeta = (await fetch(
          `https://www.googleapis.com/drive/v3/files/${referenceFileId}?fields=id,name,parents,mimeType&supportsAllDrives=true`,
          { headers: { Authorization: `Bearer ${token}` } }
        ).then((r) => r.json())) as DriveFile;

        if (refMeta?.id && isVideoFile(refMeta)) {
          const refMatch = matchAmbassador(refMeta.name, ambassadors);
          if (refMatch) {
            await organizeVideoFile(
              token,
              refMeta,
              refMeta.parents?.[0] || campaignFolderId,
              campaign.name,
              ambassadors,
              folderByAmbassador,
              baseId,
              moved,
              unmatched,
              assignmentUpdates
            );
            referencePlaced = refMatch.fullName;
          } else {
            const newName = collabReferenceFileName(campaign.name, fileExtension(refMeta.name));
            await renameFile(token, referenceFileId, newName);
            const oldParent = refMeta.parents?.[0] || campaignFolderId;
            if (oldParent !== baseId) {
              await moveFile(token, referenceFileId, baseId, oldParent);
            }
            referencePlaced = "00 Referência";
          }
        }
      }

      for (const scanId of scanFolderIds) {
        const files = await listChildFiles(token, scanId);
        for (const file of files) {
          if (file.mimeType === "application/vnd.google-apps.folder") continue;
          if (file.id === referenceFileId) continue;
          if (!isVideoFile(file)) {
            skipped.push(`${file.name} (não é vídeo)`);
            continue;
          }
          await organizeVideoFile(
            token,
            file,
            scanId,
            campaign.name,
            ambassadors,
            folderByAmbassador,
            baseId,
            moved,
            unmatched,
            assignmentUpdates
          );
        }
      }

      for (const [ambassadorId, target] of folderByAmbassador) {
        if (assignmentUpdates.has(ambassadorId)) continue;
        const folderId = extractFolderId(target.folderUrl);
        if (!folderId) continue;
        const files = await listChildFiles(token, folderId);
        const video = files.find((f) => isVideoFile(f));
        if (video) assignmentUpdates.set(ambassadorId, driveFileUrl(video.id));
      }

      await prisma.campaignCollab.update({
        where: { id: campaign.collab!.id },
        data: {
          driveFolderUrl: driveFolderUrl(campaignFolderId),
          driveInboxUrl: driveFolderUrl(inboxId),
          driveFolderName: folderLabel,
        },
      });

      for (const assignment of campaign.collab!.assignments) {
        const amb = folderByAmbassador.get(assignment.ambassadorId);
        const videoUrl = assignmentUpdates.get(assignment.ambassadorId) ?? assignment.driveVideoUrl;
        await prisma.campaignCollabAssignment.update({
          where: { id: assignment.id },
          data: {
            driveFolderUrl: amb?.folderUrl ?? assignment.driveFolderUrl,
            driveVideoUrl: videoUrl,
          },
        });
      }

      return {
        rootUrl: driveFolderUrl(COLLAB_ROOT_FOLDER_ID),
        campaignFolderUrl: driveFolderUrl(campaignFolderId),
        inboxUrl: driveFolderUrl(inboxId),
        baseFolderUrl: driveFolderUrl(baseId),
        ambassadors: ambassadorPaths,
      };
    });

    return {
      ok: true,
      paths,
      moved,
      unmatched,
      skipped,
      referencePlaced,
    };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : String(e),
      moved,
      unmatched,
      skipped,
    };
  }
}

/** @deprecated use syncCollabDrive */
export async function ensureCollabDriveStructure(campaignId: string) {
  const result = await syncCollabDrive(campaignId);
  return { ok: result.ok, paths: result.paths, error: result.error };
}

/** @deprecated use syncCollabDrive */
export async function organizeCollabInbox(campaignId: string): Promise<CollabOrganizeResult> {
  return syncCollabDrive(campaignId);
}
