import { prisma } from "@/lib/prisma";
import {
  createFolder,
  driveFolderUrl,
  extractFolderId,
  revokeFolderShareForEmail,
  setFolderPublicUpload,
  shareFolderWithEmail,
  withDriveToken,
} from "@/lib/drive-client";
import { syncCollabDrive } from "@/lib/campaign-collab-drive";

export const PEDIDO2_FOLDER_NAME = "Pedido 2 — Reels promocional";

export async function ensurePedido2Folder(
  token: string,
  ambassadorFolderId: string
): Promise<string> {
  return createFolder(token, ambassadorFolderId, PEDIDO2_FOLDER_NAME);
}

export async function shareRequestFolderWithAmbassador(
  requestId: string,
  emailOverride?: string
): Promise<{ ok: boolean; error?: string; folderUrl?: string; email?: string }> {
  const request = await prisma.campaignCollabRequest.findUnique({
    where: { id: requestId },
    select: { sortOrder: true },
  });
  if (!request) return { ok: false, error: "Pedido não encontrado" };
  if (request.sortOrder === 2) {
    return sharePedido2FolderWithAmbassador(requestId, emailOverride);
  }
  return sharePedido1FolderWithAmbassador(requestId, emailOverride);
}

async function sharePedido1FolderWithAmbassador(
  requestId: string,
  emailOverride?: string
): Promise<{ ok: boolean; error?: string; folderUrl?: string; email?: string }> {
  const request = await prisma.campaignCollabRequest.findUnique({
    where: { id: requestId },
    include: {
      assignment: {
        include: {
          ambassador: { select: { id: true, fullName: true, email: true } },
          collab: { select: { campaignId: true } },
        },
      },
    },
  });

  if (!request || request.sortOrder !== 1) {
    return { ok: false, error: "Pedido 1 não encontrado" };
  }

  const email = (emailOverride || request.assignment.ambassador.email || "").trim().toLowerCase();
  if (!email || !email.includes("@")) {
    return { ok: false, error: "Embaixador sem e-mail cadastrado" };
  }

  await syncCollabDrive(request.assignment.collab.campaignId);

  const assignment = await prisma.campaignCollabAssignment.findUnique({
    where: { id: request.assignmentId },
  });
  const ambassadorFolderId = extractFolderId(assignment?.driveFolderUrl);
  if (!ambassadorFolderId) {
    return { ok: false, error: "Pasta do embaixador não configurada no Drive" };
  }

  try {
    const result = await withDriveToken(async (token) => {
      await setFolderPublicUpload(token, ambassadorFolderId, false);
      const share = await shareFolderWithEmail(token, ambassadorFolderId, email, { notify: false });
      return { share };
    });

    const folderUrl = driveFolderUrl(ambassadorFolderId);
    await prisma.campaignCollabRequest.update({
      where: { id: requestId },
      data: {
        driveFolderUrl: folderUrl,
        driveShareEmail: result.share.email,
        driveSharePermissionId: result.share.permissionId,
        driveEditorShared: true,
      },
    });

    return { ok: true, folderUrl, email: result.share.email };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export async function sharePedido2FolderWithAmbassador(
  requestId: string,
  emailOverride?: string
): Promise<{ ok: boolean; error?: string; folderUrl?: string; email?: string }> {
  const request = await prisma.campaignCollabRequest.findUnique({
    where: { id: requestId },
    include: {
      assignment: {
        include: {
          ambassador: { select: { id: true, fullName: true, email: true } },
          collab: { select: { campaignId: true } },
        },
      },
    },
  });

  if (!request || request.sortOrder !== 2) {
    return { ok: false, error: "Pedido 2 não encontrado" };
  }

  const email = (emailOverride || request.assignment.ambassador.email || "").trim().toLowerCase();
  if (!email || !email.includes("@")) {
    return { ok: false, error: "Embaixador sem e-mail cadastrado" };
  }

  await syncCollabDrive(request.assignment.collab.campaignId);

  const assignment = await prisma.campaignCollabAssignment.findUnique({
    where: { id: request.assignmentId },
  });
  const ambassadorFolderId = extractFolderId(assignment?.driveFolderUrl);
  if (!ambassadorFolderId) {
    return { ok: false, error: "Pasta do embaixador não configurada no Drive" };
  }

  try {
    const result = await withDriveToken(async (token) => {
      await setFolderPublicUpload(token, ambassadorFolderId, false);
      const pedido2FolderId = await ensurePedido2Folder(token, ambassadorFolderId);
      await setFolderPublicUpload(token, pedido2FolderId, false);
      const share = await shareFolderWithEmail(token, pedido2FolderId, email, { notify: false });
      return { pedido2FolderId, share };
    });

    const folderUrl = driveFolderUrl(result.pedido2FolderId);
    await prisma.campaignCollabRequest.update({
      where: { id: requestId },
      data: {
        driveFolderUrl: folderUrl,
        driveShareEmail: result.share.email,
        driveSharePermissionId: result.share.permissionId,
        driveEditorShared: true,
      },
    });

    await prisma.campaignCollabAssignment.update({
      where: { id: request.assignmentId },
      data: { driveUploadPublic: false },
    });

    return { ok: true, folderUrl, email: result.share.email };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export async function revokePedido2FolderShare(
  requestId: string
): Promise<{ ok: boolean; error?: string }> {
  const request = await prisma.campaignCollabRequest.findUnique({
    where: { id: requestId },
  });
  if (!request?.driveFolderUrl) {
    return { ok: false, error: "Sem pasta compartilhada" };
  }

  const folderId = extractFolderId(request.driveFolderUrl);
  if (!folderId || !request.driveShareEmail) {
    return { ok: false, error: "Compartilhamento não registrado" };
  }

  try {
    await withDriveToken(async (token) => {
      await revokeFolderShareForEmail(token, folderId, request.driveShareEmail!);
      await setFolderPublicUpload(token, folderId, false);
    });

    await prisma.campaignCollabRequest.update({
      where: { id: requestId },
      data: {
        driveSharePermissionId: null,
        driveEditorShared: false,
      },
    });

    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
