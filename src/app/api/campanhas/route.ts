import { NextResponse } from "next/server";
import { afterCampaignMutation, serializeCampaign, syncCampaignStatuses } from "@/lib/campaigns";
import { generatePublicSlug } from "@/lib/campaign-public";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const program = searchParams.get("program");

    await syncCampaignStatuses();

    const campaigns = await prisma.campaign.findMany({
      where: program ? { program } : undefined,
      orderBy: [{ status: "asc" }, { startDate: "desc" }, { name: "asc" }],
    });

    return NextResponse.json(campaigns.map(serializeCampaign));
  } catch (e) {
    console.error("[GET /api/campanhas]", e);
    const message = e instanceof Error ? e.message : "Erro ao carregar campanhas";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const body = await req.json();
  const startDate = body.startDate ? new Date(body.startDate) : undefined;
  const endDate = body.endDate ? new Date(body.endDate) : undefined;

  const campaign = await prisma.campaign.create({
    data: {
      name: body.name,
      program: body.program || null,
      status: body.status || "Inativa",
      publicSlug: generatePublicSlug(),
      driveFolderUrl: body.driveFolderUrl,
      startDate,
      endDate,
      eventDate: endDate || (body.eventDate ? new Date(body.eventDate) : undefined),
      pageUrl: body.pageUrl,
      formLabel: body.formLabel || body.name,
      description: body.description,
    },
  });

  await afterCampaignMutation();

  const refreshed = await prisma.campaign.findUnique({ where: { id: campaign.id } });
  return NextResponse.json(serializeCampaign(refreshed || campaign));
}
