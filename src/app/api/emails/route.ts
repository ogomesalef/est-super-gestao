import { NextResponse } from "next/server";
import { renderAmbassadorEmail, resolveAmbassadorEmailAction, sendEmail } from "@/lib/email";
import {
  CANCELAMENTO_EMAIL_ACTION,
  FORMALIZACAO_EMAIL_ACTIONS,
  PROPOSTA_EMAIL_ACTIONS,
  PROPOSTA_LEMBRETE_ACTION,
} from "@/lib/constants";
import {
  defaultSenderIdForProgram,
  formatFromHeader,
  getEmailSenderById,
} from "@/lib/email-senders";
import { buildEmailWhatsAppMessage } from "@/lib/email-whatsapp-messages";
import { monthNameFromRef } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import { syncMonthlyRowsForAmbassador } from "@/lib/services";
import { endDateFromMonthRef } from "@/lib/utils";

function buildAmbassadorWhatsApp(
  action: string,
  ambassador: {
    fullName: string;
    socialName?: string | null;
    program: string;
    partnership?: {
      modality?: string | null;
      couponCode?: string | null;
    } | null;
  },
  vars?: Record<string, unknown>
) {
  const cancellationMonthRef = String(vars?.cancellationMonthRef || "");
  return buildEmailWhatsAppMessage({
    fullName: ambassador.fullName,
    socialName: ambassador.socialName,
    program: ambassador.program,
    action,
    couponCode:
      vars?.couponCode !== undefined
        ? String(vars.couponCode || "")
        : ambassador.partnership?.couponCode,
    modality: ambassador.partnership?.modality,
    campaignName: vars?.campaignName as string | undefined,
    briefingUrl: vars?.briefingUrl as string | undefined,
    dueDateDisplay: vars?.dueDateDisplay as string | undefined,
    mesEncerramento: cancellationMonthRef
      ? monthNameFromRef(cancellationMonthRef)
      : undefined,
  });
}

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
  const rendered = renderAmbassadorEmail(action, ambassador, vars);
  const fromId = defaultSenderIdForProgram(ambassador.program);
  const sender = getEmailSenderById(fromId)!;
  const whatsappMessage = buildAmbassadorWhatsApp(action, ambassador, vars);

  if (body.previewOnly) {
    return NextResponse.json({
      subject: rendered.subject,
      html: rendered.html,
      action,
      to: ambassador.email || "",
      fromId,
      from: formatFromHeader(sender),
      program: ambassador.program,
      whatsappMessage,
    });
  }

  if (action === CANCELAMENTO_EMAIL_ACTION) {
    if (!finalize?.cancellationMonthRef || !finalize?.newStatus) {
      return NextResponse.json(
        { error: "Confirme o status e o mês de encerramento antes de enviar." },
        { status: 400 }
      );
    }
  }

  const to = String(body.to || ambassador.email || "").trim();
  if (!to) {
    return NextResponse.json({ error: "Destinatário ausente" }, { status: 400 });
  }

  const subject = String(body.subject || rendered.subject).trim();
  const html = String(body.html || rendered.html);
  const from = body.from ? String(body.from) : undefined;
  const cc = body.cc ? String(body.cc) : undefined;

  const result = await sendEmail({
    action,
    ambassadorId,
    subject,
    html,
    to,
    from,
    cc,
    program: ambassador.program,
  });

  let partnershipUpdate: {
    status: string;
    endDate?: string;
    cancellationMonthRef?: string;
    formalizationSentAt?: string;
    proposalSentAt?: string;
    proposalReminderSentAt?: string;
  } | null = null;

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

  if (result.ok && finalize?.sendProposal && PROPOSTA_EMAIL_ACTIONS.has(action)) {
    const proposalData = finalize.proposal || vars || {};
    await prisma.ambassador.update({
      where: { id: ambassadorId },
      data: {
        status: "Proposta",
        needsReview: false,
        partnership: {
          update: {
            proposalSentAt: new Date(),
            modality: String(proposalData.modality || ambassador.partnership?.modality || ""),
            agreedValue:
              proposalData.agreedValue != null
                ? Number(proposalData.agreedValue)
                : ambassador.partnership?.agreedValue,
            metaFeed: Number(proposalData.metaFeed ?? ambassador.partnership?.metaFeed ?? 0),
            metaStories: Number(proposalData.metaStories ?? ambassador.partnership?.metaStories ?? 0),
            metaTiktok: Number(proposalData.metaTiktok ?? ambassador.partnership?.metaTiktok ?? 0),
            metaYoutube: Number(proposalData.metaYoutube ?? ambassador.partnership?.metaYoutube ?? 0),
            ...(proposalData.courseName
              ? { courseName: String(proposalData.courseName) }
              : {}),
          },
        },
      },
    });
    partnershipUpdate = {
      status: "Proposta",
      proposalSentAt: new Date().toISOString(),
    };
  }

  if (result.ok && action === PROPOSTA_LEMBRETE_ACTION) {
    await prisma.partnership.update({
      where: { ambassadorId },
      data: { proposalReminderSentAt: new Date() },
    });
    partnershipUpdate = {
      status: ambassador.status,
      proposalReminderSentAt: new Date().toISOString(),
    };
  }

  if (result.ok && action === "Enviar reprovação") {
    await prisma.ambassador.update({
      where: { id: ambassadorId },
      data: { status: "Desinteressado", needsReview: false },
    });
    partnershipUpdate = { status: "Desinteressado" };
  }

  if (result.ok && finalize?.activatePartnership && FORMALIZACAO_EMAIL_ACTIONS.has(action)) {
    const releaseDate = vars?.releaseDate ? new Date(String(vars.releaseDate)) : new Date();
    const isAssinatura = action === "Enviar formalização (Assinatura + Cupom)";

    await prisma.ambassador.update({
      where: { id: ambassadorId },
      data: {
        status: "Ativo",
        partnership: {
          update: {
            formalizationSentAt: new Date(),
            startDate: ambassador.partnership?.startDate ?? new Date(),
            ...(isAssinatura
              ? {
                  courseReleased: true,
                  courseReleaseDate: releaseDate,
                  ...(vars?.courseName ? { courseName: String(vars.courseName) } : {}),
                  ...(vars?.couponCode !== undefined ? { couponCode: String(vars.couponCode) } : {}),
                }
              : {}),
          },
        },
      },
    });
    await syncMonthlyRowsForAmbassador(ambassadorId);
    partnershipUpdate = {
      status: "Ativo",
      formalizationSentAt: new Date().toISOString(),
    };
  }

  await prisma.emailLog.create({
    data: {
      ambassadorId,
      emailType: action,
      subject,
      recipient: to,
      htmlPreview: html.slice(0, 5000),
      status: result.ok ? "sent" : "draft",
      sentAt: result.ok ? new Date() : undefined,
    },
  });

  return NextResponse.json({
    subject,
    html,
    action,
    whatsappMessage: body.whatsappMessage || whatsappMessage,
    send: result,
    partnershipUpdate,
  });
}
