import { NextResponse } from "next/server";
import { extractFolderId, folderHasPublicUpload, setFolderPublicUpload, withDriveToken } from "@/lib/drive-client";
import { getAmbassadorBriefingBySlug } from "@/lib/collab-briefing";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getAmbassadorBriefingBySlug(slug);
  if (!data) {
    return NextResponse.json({ error: "Página não encontrada" }, { status: 404 });
  }
  return NextResponse.json(data);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const body = await req.json();

    const assignment = await prisma.campaignCollabAssignment.findUnique({
      where: { publicSlug: slug },
    });
    if (!assignment) {
      return NextResponse.json({ error: "Atribuição não encontrada" }, { status: 404 });
    }

    const folderId = extractFolderId(assignment.driveFolderUrl);
    if (!folderId) {
      return NextResponse.json({ error: "Pasta Drive não configurada" }, { status: 400 });
    }

    const enable = Boolean(body.driveUploadPublic);
    await withDriveToken(async (token) => {
      await setFolderPublicUpload(token, folderId, enable);
    });

    await prisma.campaignCollabAssignment.update({
      where: { id: assignment.id },
      data: { driveUploadPublic: enable },
    });

    const data = await getAmbassadorBriefingBySlug(slug);
    return NextResponse.json({ ok: true, driveUploadPublic: enable, data });
  } catch (e) {
    console.error("[PATCH briefing]", e);
    const message = e instanceof Error ? e.message : "Erro ao atualizar pasta";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
