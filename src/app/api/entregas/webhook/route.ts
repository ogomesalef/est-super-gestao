import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { recalcMonthlyControl } from "@/lib/delivery-calc";
import { recalcFinanceAmount } from "@/lib/services";
import { monthRefFromDate, normalizeHandle, parseDate } from "@/lib/utils";

/** Webhook: nova entrega (Form ou Apps Script encaminha aqui). */
export async function POST(req: Request) {
  const data = await req.json();
  const secret = process.env.WEBHOOK_SECRET || process.env.APPS_SCRIPT_SECRET;

  if (!secret) {
    return NextResponse.json({ ok: false, error: "webhook not configured" }, { status: 503 });
  }
  if (data.secret !== secret) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const program = String(data.program || data.Programa || "OAB").trim();
  const instagram = normalizeHandle(String(data.instagram || data.handle || data["Seu Instagram (@)"] || ""));
  const fullName = String(data.fullName || data.nome || data["Seu nome completo"] || "") || null;
  const email = String(data.email || data["Seu e-mail"] || "") || null;

  let ambassadorId: string | undefined;
  if (instagram && instagram !== "@") {
    const amb = await prisma.ambassador.findUnique({
      where: { program_instagram: { program, instagram } },
    });
    ambassadorId = amb?.id;
  }

  let campaignId: string | undefined;
  const campaignName = String(
    data.campaignName || data.campanha || data["Esta entrega faz parte de alguma campanha?"] || ""
  ).trim();
  if (
    campaignName &&
    !campaignName.toLowerCase().includes("não se aplica") &&
    campaignName.toLowerCase() !== "nenhuma"
  ) {
    const camp = await prisma.campaign.findFirst({ where: { name: campaignName } });
    campaignId = camp?.id;
  }

  const postedAt = parseDate(data.postedAt || data["Data da postagem"]);
  const submittedAt = parseDate(data.submittedAt || data.timestamp) || new Date();
  const monthRef =
    String(data.monthRef || "").trim() ||
    monthRefFromDate(postedAt) ||
    monthRefFromDate(submittedAt) ||
    null;

  const delivery = await prisma.delivery.create({
    data: {
      ambassadorId,
      campaignId,
      monthRef,
      needsReview: !ambassadorId,
      program,
      instagram: instagram || null,
      fullName,
      email,
      deliveryType: String(data.deliveryType || data.tipo || data["Tipo de entrega"] || "") || null,
      postedAt,
      submittedAt,
      postLink: String(data.postLink || data["Link da postagem"] || "") || null,
      printUrl: String(data.printUrl || data["Print da postagem"] || "") || null,
      storiesPrintUrl: String(data.storiesPrintUrl || data["Print (Stories)"] || "") || null,
      videoLink: String(data.videoLink || data["Link do vídeo"] || "") || null,
      campaignName: campaignName || null,
      driveStatus: String(data.driveStatus || "") || null,
      driveOrganizedIn: String(data.driveOrganizedIn || "") || null,
      campaignDriveStatus: String(data.campaignDriveStatus || "") || null,
    },
  });

  if (ambassadorId && monthRef) {
    await recalcMonthlyControl(ambassadorId, monthRef);
    await recalcFinanceAmount(ambassadorId, monthRef);
  }

  return NextResponse.json({ ok: true, id: delivery.id, ambassadorId, needsReview: !ambassadorId });
}
