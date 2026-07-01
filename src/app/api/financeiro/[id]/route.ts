import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { recalcFinanceAmount } from "@/lib/services";
import { buildTermActivityText } from "@/lib/termo-data";
import {
  appendFinanceLog,
  formatValueChangeLog,
} from "@/lib/finance-log";

export const dynamic = "force-dynamic";

function pickFinancePatch(body: Record<string, unknown>) {
  const data: Record<string, unknown> = {};
  const keys = [
    "paymentStatus",
    "agreedValue",
    "valueLocked",
    "termLink",
    "termDocLink",
    "termActivity",
    "termSigned",
    "financeFormOk",
    "paymentSent",
    "log",
  ] as const;
  for (const key of keys) {
    if (body[key] !== undefined) data[key] = body[key];
  }
  return data;
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const fin = await prisma.monthlyFinance.findUnique({
    where: { id },
    include: { ambassador: { include: { partnership: true } } },
  });
  if (!fin) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  const control = await prisma.monthlyControl.findUnique({
    where: {
      ambassadorId_monthRef: { ambassadorId: fin.ambassadorId, monthRef: fin.monthRef },
    },
  });

  return NextResponse.json({
    ...fin,
    termActivityAuto: buildTermActivityText(fin.monthRef, control),
  });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.monthlyFinance.findUnique({
      where: { id },
      include: { ambassador: { include: { partnership: true } } },
    });
    if (!existing) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

    if (
      body.legalCpf !== undefined ||
      body.legalAddress !== undefined ||
      body.bankDetails !== undefined
    ) {
      await prisma.partnership.upsert({
        where: { ambassadorId: existing.ambassadorId },
        create: {
          ambassadorId: existing.ambassadorId,
          legalCpf: body.legalCpf ?? null,
          legalAddress: body.legalAddress ?? null,
          bankDetails: body.bankDetails ?? null,
        },
        update: {
          ...(body.legalCpf !== undefined ? { legalCpf: body.legalCpf || null } : {}),
          ...(body.legalAddress !== undefined ? { legalAddress: body.legalAddress || null } : {}),
          ...(body.bankDetails !== undefined ? { bankDetails: body.bankDetails || null } : {}),
        },
      });
    }

    const financePatch = pickFinancePatch(body);
    let nextLog = existing.log;

    if (body.agreedValue !== undefined) {
      const newVal =
        body.agreedValue === null || body.agreedValue === ""
          ? null
          : Number(body.agreedValue);
      if (newVal !== existing.agreedValue) {
        nextLog = appendFinanceLog(
          nextLog,
          formatValueChangeLog(existing.agreedValue, newVal, body.valueChangeNote)
        );
      }
      financePatch.agreedValue = newVal;
    }

    if (body.valueLocked !== undefined) {
      financePatch.valueLocked = Boolean(body.valueLocked);
    }

    if (nextLog !== existing.log) {
      financePatch.log = nextLog;
    }

    if (Object.keys(financePatch).length > 0) {
      await prisma.monthlyFinance.update({
        where: { id },
        data: financePatch,
      });
    }

    if (body.applyToFutureMonths && body.agreedValue !== undefined) {
      const newVal =
        body.agreedValue === null || body.agreedValue === ""
          ? null
          : Number(body.agreedValue);
      const futureRows = await prisma.monthlyFinance.findMany({
        where: {
          ambassadorId: existing.ambassadorId,
          monthRef: { gte: existing.monthRef },
          valueLocked: false,
          NOT: { id },
        },
      });
      for (const row of futureRows) {
        const rowLog = appendFinanceLog(
          row.log,
          formatValueChangeLog(
            row.agreedValue,
            newVal,
            body.valueChangeNote
              ? `${body.valueChangeNote} (aplicado em lote a partir de ${existing.monthRef})`
              : `Aplicado em lote a partir de ${existing.monthRef}`
          )
        );
        await prisma.monthlyFinance.update({
          where: { id: row.id },
          data: { agreedValue: newVal, log: rowLog },
        });
        await recalcFinanceAmount(row.ambassadorId, row.monthRef);
      }
    }

    if (body.updatePartnershipDefault && body.agreedValue !== undefined) {
      const newVal =
        body.agreedValue === null || body.agreedValue === ""
          ? null
          : Number(body.agreedValue);
      await prisma.partnership.updateMany({
        where: { ambassadorId: existing.ambassadorId },
        data: { agreedValue: newVal },
      });
    }

    await recalcFinanceAmount(existing.ambassadorId, existing.monthRef);

    const fin = await prisma.monthlyFinance.findUnique({
      where: { id },
      include: { ambassador: { include: { partnership: true } } },
    });
    if (!fin) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

    const control = await prisma.monthlyControl.findUnique({
      where: {
        ambassadorId_monthRef: { ambassadorId: fin.ambassadorId, monthRef: fin.monthRef },
      },
    });

    return NextResponse.json({
      ...fin,
      termActivityAuto: buildTermActivityText(fin.monthRef, control),
    });
  } catch (e) {
    console.error("PATCH /api/financeiro/[id]", e);
    const message = e instanceof Error ? e.message : "Erro ao salvar";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
