import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeHandle } from "@/lib/utils";
import { syncMonthlyRowsForAmbassador } from "@/lib/services";
import { serializeQuickNote } from "@/lib/ambassador-quick-notes";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const program = searchParams.get("program");

  const ambassadors = await prisma.ambassador.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(program ? { program } : {}),
    },
    include: {
      partnership: true,
      quickNotes: {
        where: { completed: false },
        orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
      },
    },
    orderBy: { fullName: "asc" },
  });
  return NextResponse.json(
    ambassadors.map((a) => ({
      ...a,
      quickNotes: a.quickNotes.map(serializeQuickNote),
    }))
  );
}

export async function POST(req: Request) {
  const body = await req.json();
  const program = body.program || "OAB";
  const instagram = normalizeHandle(body.instagram);
  const ambassador = await prisma.ambassador.create({
    data: {
      program,
      instagram,
      fullName: body.fullName,
      email: body.email,
      whatsapp: body.whatsapp,
      tiktok: body.tiktok,
      status: body.status || "Pendente",
      alerts: body.alerts,
      partnership: {
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
        },
      },
    },
    include: { partnership: true },
  });
  return NextResponse.json(ambassador);
}
