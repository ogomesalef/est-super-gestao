import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { recalcMonthlyControl } from "@/lib/delivery-calc";
import { prisma } from "@/lib/prisma";
import { monthRefFromDate, normalizeHandle, parseDateBr } from "@/lib/utils";

export const dynamic = "force-dynamic";

const EDITABLE_STRING_FIELDS = [
  "deliveryType",
  "postLink",
  "printUrl",
  "storiesPrintUrl",
  "videoLink",
  "campaignName",
  "driveStatus",
  "driveOrganizedIn",
  "campaignDriveStatus",
  "program",
  "fullName",
  "email",
] as const;

function parsePostedAtInput(v: unknown): Date | null {
  if (v === null || v === "") return null;
  if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v)) {
    const [y, m, d] = v.split("-").map(Number);
    return new Date(y, m - 1, d, 12, 0, 0);
  }
  return parseDateBr(v);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireSession(["admin"]);
    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.delivery.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

    const data: Record<string, unknown> = {};
    const oldMonthRef = existing.monthRef;
    const oldAmbassadorId = existing.ambassadorId;

    if ("ambassadorId" in body) {
      const ambassadorId = body.ambassadorId as string | null;
      if (ambassadorId) {
        const ambassador = await prisma.ambassador.findUnique({ where: { id: ambassadorId } });
        if (!ambassador) {
          return NextResponse.json({ error: "Embaixador não encontrado" }, { status: 404 });
        }
        data.ambassadorId = ambassadorId;
        data.needsReview = false;
        data.program = ambassador.program;
        data.instagram = ambassador.instagram;
      } else {
        data.ambassadorId = null;
        data.needsReview = true;
      }
    }

    for (const field of EDITABLE_STRING_FIELDS) {
      if (field in body) {
        const val = body[field];
        data[field] = val === "" || val === null ? null : String(val).trim();
      }
    }

    if ("instagram" in body && body.instagram != null) {
      data.instagram = normalizeHandle(String(body.instagram));
    }

    if ("postedAt" in body) {
      const postedAt = parsePostedAtInput(body.postedAt);
      data.postedAt = postedAt;
      data.monthRef = monthRefFromDate(postedAt) || oldMonthRef;
    }

    if ("submittedAt" in body) {
      const submittedAt = parsePostedAtInput(body.submittedAt);
      if (submittedAt) data.submittedAt = submittedAt;
    }

    if (!("monthRef" in data) && ("postedAt" in data || "ambassadorId" in data)) {
      const postedAt = (data.postedAt as Date | null | undefined) ?? existing.postedAt;
      data.monthRef = monthRefFromDate(postedAt) || oldMonthRef;
    }

    const updated = await prisma.delivery.update({
      where: { id },
      data,
      include: {
        ambassador: {
          select: { id: true, fullName: true, instagram: true, program: true },
        },
        campaign: { select: { id: true, name: true } },
      },
    });

    const newMonthRef = updated.monthRef;
    const newAmbassadorId = updated.ambassadorId;

    const recalcTargets = new Set<string>();
    if (oldAmbassadorId && oldMonthRef) recalcTargets.add(`${oldAmbassadorId}:${oldMonthRef}`);
    if (newAmbassadorId && newMonthRef) recalcTargets.add(`${newAmbassadorId}:${newMonthRef}`);

    for (const key of recalcTargets) {
      const [ambassadorId, monthRef] = key.split(":");
      await recalcMonthlyControl(ambassadorId, monthRef);
    }

    return NextResponse.json(updated);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg === "UNAUTHORIZED") return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    if (msg === "FORBIDDEN") return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    console.error("PATCH /api/entregas/deliveries/[id]", e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
