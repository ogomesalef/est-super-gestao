import { NextResponse } from "next/server";
import { afterCampaignMutation, generateCampaignFolder, serializeCampaign } from "@/lib/campaigns";
import { getCampaignDetailById } from "@/lib/campaign-detail";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const detail = await getCampaignDetailById(id);
    if (!detail) {
      return NextResponse.json({ error: "Campanha não encontrada" }, { status: 404 });
    }
    return NextResponse.json(detail);
  } catch (e) {
    console.error("[GET /api/campanhas/[id]]", e);
    const message = e instanceof Error ? e.message : "Erro ao carregar campanha";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  if (body.action === "generateFolder") {
    const result = await generateCampaignFolder(id);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    await afterCampaignMutation();
    return NextResponse.json(result.campaign);
  }

  const campaign = await prisma.campaign.update({
    where: { id },
    data: {
      name: body.name,
      program: body.program,
      status: body.status,
      driveFolderUrl: body.driveFolderUrl,
      startDate: body.startDate !== undefined ? (body.startDate ? new Date(body.startDate) : null) : undefined,
      endDate: body.endDate !== undefined ? (body.endDate ? new Date(body.endDate) : null) : undefined,
      eventDate:
        body.endDate !== undefined
          ? body.endDate
            ? new Date(body.endDate)
            : null
          : body.eventDate !== undefined
            ? body.eventDate
              ? new Date(body.eventDate)
              : null
            : undefined,
      pageUrl: body.pageUrl,
      formLabel: body.formLabel,
      description: body.description,
    },
  });

  await afterCampaignMutation();

  const refreshed = await prisma.campaign.findUnique({ where: { id: campaign.id } });
  return NextResponse.json(serializeCampaign(refreshed || campaign));
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.campaign.delete({ where: { id } });
  await afterCampaignMutation();
  return NextResponse.json({ ok: true });
}
