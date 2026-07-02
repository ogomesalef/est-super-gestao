import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { syncMonthlyRowsForAmbassador } from "@/lib/services";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  if (body.action === "encerrar") {
    const ambassador = await prisma.ambassador.update({
      where: { id },
      data: {
        status: "Inativo",
        partnership: { update: { endDate: new Date() } },
      },
    });
    return NextResponse.json(ambassador);
  }

  const ambassador = await prisma.ambassador.update({
    where: { id },
    data: {
      fullName: body.fullName,
      socialName: body.socialName !== undefined ? (String(body.socialName || "").trim() || null) : undefined,
      email: body.email,
      whatsapp: body.whatsapp,
      status: body.status,
      alerts: body.alerts,
      needsReview: body.needsReview !== undefined ? !!body.needsReview : undefined,
      partnership: {
        upsert: {
          create: {
            modality: body.modality,
            agreedValue: body.agreedValue,
            courseName: body.courseName,
            couponCode: body.couponCode,
            metaFeed: body.metaFeed ?? 0,
            metaStories: body.metaStories ?? 0,
            metaTiktok: body.metaTiktok ?? 0,
            metaYoutube: body.metaYoutube ?? 0,
            startDate: body.startDate ? new Date(body.startDate) : undefined,
            legalCpf: body.legalCpf ?? null,
            legalAddress: body.legalAddress ?? null,
            bankDetails: body.bankDetails ?? null,
          },
          update: {
            modality: body.modality,
            agreedValue: body.agreedValue,
            valueLocked: body.valueLocked,
            courseName: body.courseName,
            couponCode: body.couponCode,
            courseReleased: body.courseReleased,
            metaFeed: body.metaFeed,
            metaStories: body.metaStories,
            metaTiktok: body.metaTiktok,
            metaYoutube: body.metaYoutube,
            startDate: body.startDate ? new Date(body.startDate) : undefined,
            legalCpf: body.legalCpf ?? undefined,
            legalAddress: body.legalAddress ?? undefined,
            bankDetails: body.bankDetails ?? undefined,
          },
        },
      },
    },
    include: { partnership: true },
  });

  if (body.status === "Ativo") {
    await syncMonthlyRowsForAmbassador(id);
  } else if (
    body.metaFeed !== undefined ||
    body.metaStories !== undefined ||
    body.metaTiktok !== undefined ||
    body.metaYoutube !== undefined
  ) {
    await syncMonthlyRowsForAmbassador(id);
  }

  return NextResponse.json(ambassador);
}
