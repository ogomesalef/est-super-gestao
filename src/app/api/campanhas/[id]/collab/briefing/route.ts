import { NextResponse } from "next/server";
import { ambassadorBriefingUrl, getAmbassadorBriefingBySlug, syncBriefingContent } from "@/lib/collab-briefing";
import { displayName } from "@/lib/ambassador-name";
import { sharePedido2FolderWithAmbassador, revokePedido2FolderShare } from "@/lib/collab-request-drive";
import { extractFolderId, folderHasPublicUpload, setFolderPublicUpload, withDriveToken } from "@/lib/drive-client";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: campaignId } = await params;
    const body = await req.json().catch(() => ({}));

    if (body.action === "seedBriefings") {
      const count = await syncBriefingContent(campaignId);
      const collab = await prisma.campaignCollab.findUnique({
        where: { campaignId },
        include: {
          assignments: {
            include: { ambassador: { select: { fullName: true, instagram: true } }, requests: true },
          },
        },
      });
      return NextResponse.json({
        ok: true,
        seeded: count,
        assignments: collab?.assignments.map((a) => ({
          fullName: displayName(a.ambassador),
          instagram: a.ambassador.instagram,
          publicSlug: a.publicSlug,
          publicUrl: a.publicSlug ? ambassadorBriefingUrl(a.publicSlug) : null,
          requests: a.requests.length,
        })),
      });
    }

    if (body.action === "sharePedido2") {
      const requestId = String(body.requestId || "");
      if (!requestId) {
        return NextResponse.json({ error: "requestId obrigatório" }, { status: 400 });
      }
      const result = await sharePedido2FolderWithAmbassador(
        requestId,
        body.email ? String(body.email) : undefined
      );
      if (!result.ok) {
        return NextResponse.json({ error: result.error || "Erro ao compartilhar" }, { status: 400 });
      }
      return NextResponse.json(result);
    }

    if (body.action === "revokePedido2") {
      const requestId = String(body.requestId || "");
      if (!requestId) {
        return NextResponse.json({ error: "requestId obrigatório" }, { status: 400 });
      }
      const result = await revokePedido2FolderShare(requestId);
      if (!result.ok) {
        return NextResponse.json({ error: result.error || "Erro ao revogar" }, { status: 400 });
      }
      return NextResponse.json(result);
    }

    if (body.action === "toggleUpload") {
      const assignment = await prisma.campaignCollabAssignment.findUnique({
        where: { id: String(body.assignmentId) },
      });
      if (!assignment?.driveFolderUrl) {
        return NextResponse.json({ error: "Sem pasta Drive" }, { status: 400 });
      }
      const folderId = extractFolderId(assignment.driveFolderUrl)!;
      const enable = Boolean(body.enable);
      await withDriveToken(async (token) => {
        await setFolderPublicUpload(token, folderId, enable);
      });
      await prisma.campaignCollabAssignment.update({
        where: { id: assignment.id },
        data: { driveUploadPublic: enable },
      });
      return NextResponse.json({ ok: true, driveUploadPublic: enable });
    }

    if (body.action === "syncUploadStatus") {
      const collab = await prisma.campaignCollab.findUnique({
        where: { campaignId },
        include: { assignments: true },
      });
      if (!collab) return NextResponse.json({ error: "Sem collab" }, { status: 404 });

      for (const a of collab.assignments) {
        const folderId = extractFolderId(a.driveFolderUrl);
        if (!folderId) continue;
        const publicUpload = await withDriveToken((token) => folderHasPublicUpload(token, folderId));
        await prisma.campaignCollabAssignment.update({
          where: { id: a.id },
          data: { driveUploadPublic: publicUpload },
        });
      }
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Ação inválida" }, { status: 400 });
  } catch (e) {
    console.error("[POST collab/briefing]", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
