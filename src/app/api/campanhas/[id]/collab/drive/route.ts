import { NextResponse } from "next/server";
import { syncCollabDrive } from "@/lib/campaign-collab-drive";
import { getCampaignDetailById } from "@/lib/campaign-detail";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const action = body.action === "organize" ? "organize" : "structure";

    const campaign = await prisma.campaign.findUnique({ where: { id } });
    if (!campaign) {
      return NextResponse.json({ error: "Campanha não encontrada" }, { status: 404 });
    }

    if (action === "organize") {
      const result = await syncCollabDrive(id);
      const detail = await getCampaignDetailById(id);
      return NextResponse.json({ ...result, detail });
    }

    const result = await syncCollabDrive(id);
    const detail = await getCampaignDetailById(id);
    return NextResponse.json({ ...result, detail });
  } catch (e) {
    console.error("[POST /api/campanhas/[id]/collab/drive]", e);
    const message = e instanceof Error ? e.message : "Erro no Drive de collab";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
