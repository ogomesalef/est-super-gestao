import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const ctrl = await prisma.monthlyControl.update({
    where: { id },
    data: {
      notes: body.notes,
      metaLocked: body.metaLocked,
      metaFeed: body.metaFeed,
      metaStories: body.metaStories,
      metaTiktok: body.metaTiktok,
      metaYoutube: body.metaYoutube,
    },
  });
  return NextResponse.json(ctrl);
}
