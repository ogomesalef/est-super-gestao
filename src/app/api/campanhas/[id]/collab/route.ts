import { NextResponse } from "next/server";
import { upsertCampaignCollab } from "@/lib/campaign-collab";
import { syncCollabDrive } from "@/lib/campaign-collab-drive";
import { getCampaignDetailById } from "@/lib/campaign-detail";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const campaign = await prisma.campaign.findUnique({ where: { id } });
    if (!campaign) {
      return NextResponse.json({ error: "Campanha não encontrada" }, { status: 404 });
    }

    const detail = await getCampaignDetailById(id);
    return NextResponse.json({
      collab: detail?.collab ?? null,
      campaignProgram: campaign.program,
    });
  } catch (e) {
    console.error("[GET /api/campanhas/[id]/collab]", e);
    const message = e instanceof Error ? e.message : "Erro ao carregar collab";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const campaign = await prisma.campaign.findUnique({ where: { id } });
    if (!campaign) {
      return NextResponse.json({ error: "Campanha não encontrada" }, { status: 404 });
    }

    const body = await req.json();
    const ambassadorIds = Array.isArray(body.ambassadorIds)
      ? body.ambassadorIds.map(String)
      : [];

    const collab = await upsertCampaignCollab(id, {
      videoUrl: String(body.videoUrl ?? ""),
      title: body.title ?? null,
      notes: body.notes ?? null,
      driveFolderName: body.driveFolderName ?? null,
      ambassadorIds,
    });

    let drive: Awaited<ReturnType<typeof syncCollabDrive>> | null = null;
    if (collab && ambassadorIds.length > 0) {
      drive = await syncCollabDrive(id);
    }

    const detail = await getCampaignDetailById(id);
    return NextResponse.json({ collab, detail, drive });
  } catch (e) {
    console.error("[PUT /api/campanhas/[id]/collab]", e);
    const message = e instanceof Error ? e.message : "Erro ao salvar collab";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
