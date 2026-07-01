import { NextResponse } from "next/server";
import { renderAmbassadorEmail, resolveAmbassadorEmailAction, sendEmail } from "@/lib/email";
import { CANCELAMENTO_EMAIL_ACTION } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { endDateFromMonthRef } from "@/lib/utils";

export async function POST(req: Request) {
  const body = await req.json();
  const { ambassadorId, emailType, vars, action: actionOverride, finalize } = body;

  const ambassador = ambassadorId
    ? await prisma.ambassador.findUnique({ where: { id: ambassadorId }, include: { partnership: true } })
    : null;

  if (!ambassador) {
    return NextResponse.json({ error: "Embaixador não encontrado" }, { status: 404 });
  }

  const action = actionOverride || resolveAmbassadorEmailAction(emailType || "proposta", ambassador.partnership?.modality);
  const { subject, html } = renderAmbassadorEmail(action, ambassador, vars);

  if (body.previewOnly) {
    return NextResponse.json({ subject, html, action });
  }

  if (action === CANCELAMENTO_EMAIL_ACTION) {
    if (!finalize?.cancellationMonthRef || !finalize?.newStatus) {
      return NextResponse.json(
        { error: "Confirme o status e o mês de encerramento antes de enviar." },
        { status: 400 }
      );
    }
  }

  const result = await sendEmail({
    action,
    ambassadorId,
    subject,
    html,
    to: ambassador.email || undefined,
    program: ambassador.program,
  });

  let partnershipUpdate: { status: string; endDate: string; cancellationMonthRef: string } | null =
    null;

  if (result.ok && action === CANCELAMENTO_EMAIL_ACTION && finalize) {
    const endDate = endDateFromMonthRef(finalize.cancellationMonthRef);
    await prisma.ambassador.update({
      where: { id: ambassadorId },
      data: {
        status: finalize.newStatus,
        partnership: { update: { endDate } },
      },
    });
    partnershipUpdate = {
      status: finalize.newStatus,
      endDate: endDate.toISOString(),
      cancellationMonthRef: finalize.cancellationMonthRef,
    };
  }

  await prisma.emailLog.create({
    data: {
      ambassadorId,
      emailType: action,
      subject,
      recipient: ambassador.email,
      htmlPreview: html.slice(0, 5000),
      status: result.ok ? "sent" : "draft",
      sentAt: result.ok ? new Date() : undefined,
    },
  });

  return NextResponse.json({ subject, html, action, send: result, partnershipUpdate });
}
