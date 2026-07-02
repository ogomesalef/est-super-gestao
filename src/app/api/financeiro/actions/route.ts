import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { renderFinanceEmail, sendEmail } from "@/lib/email";
import {
  FINANCE_ACTIONS,
  FINANCE_REQUEST_ACTION,
  FINANCE_RESEND_REQUEST_ACTION,
} from "@/lib/constants";
import { appendFinanceLog } from "@/lib/finance-log";
import { generateTermoAdesao, isTermoGenerationConfigured } from "@/lib/termo-adesao";
import { buildEmailWhatsAppMessage } from "@/lib/email-whatsapp-messages";
import {
  defaultSenderIdForProgram,
  formatFromHeader,
  getEmailSenderById,
} from "@/lib/email-senders";
import {
  FINANCE_TEAM_CC_DISPLAY,
  FINANCE_TEAM_TO_DISPLAY,
  financeTeamCcHeader,
  financeTeamToHeader,
} from "@/lib/finance-recipients";
import { shareSignedTermWithFinanceTeam } from "@/lib/termo-finance-share";

const AMBASSADOR_PAYMENT_NOTICE_ACTION = "Avisar embaixador: pagamento solicitado";

const ACTION_STATUS: Record<string, string> = {
  "Enviar fechamento do mês (com termo)": "Aguardando termo assinado",
  "Enviar lembrete do termo": "Aguardando termo assinado",
  "Cobrar Form Financeiro": "Aguardando Form Financeiro",
  [FINANCE_REQUEST_ACTION]: "Solicitado ao Financeiro",
  [FINANCE_RESEND_REQUEST_ACTION]: "Solicitado ao Financeiro",
  [AMBASSADOR_PAYMENT_NOTICE_ACTION]: "Solicitado ao Financeiro",
  "Marcar como Pago": "Pago",
  "Bloquear pagamento": "Bloqueado",
  "Desbloquear pagamento": "Pendente",
};

const EMAIL_ACTIONS = new Set([
  "Enviar fechamento do mês (com termo)",
  "Enviar lembrete do termo",
  "Cobrar Form Financeiro",
  FINANCE_REQUEST_ACTION,
  FINANCE_RESEND_REQUEST_ACTION,
  AMBASSADOR_PAYMENT_NOTICE_ACTION,
]);

function isFinanceTeamEmailAction(action: string): boolean {
  return action === FINANCE_REQUEST_ACTION || action === FINANCE_RESEND_REQUEST_ACTION;
}

function financeWhatsAppMessage(
  action: string,
  fin: NonNullable<Awaited<ReturnType<typeof loadFinance>>>
) {
  return buildEmailWhatsAppMessage({
    fullName: fin.ambassador.fullName,
    socialName: fin.ambassador.socialName,
    program: fin.ambassador.program,
    action,
    monthRef: fin.monthRef,
    amountDue: fin.amountDue,
  });
}

function financePreviewMeta(
  action: string,
  fin: NonNullable<Awaited<ReturnType<typeof loadFinance>>>,
  rendered: ReturnType<typeof renderFinanceEmail>,
  to: string,
  termLinkValue?: string | null
) {
  const fromId = defaultSenderIdForProgram(fin.ambassador.program);
  const sender = getEmailSenderById(fromId)!;
  return {
    subject: rendered.subject,
    html: rendered.html,
    recipient: to,
    cc: rendered.cc,
    from: rendered.from || formatFromHeader(sender),
    fromId,
    program: fin.ambassador.program,
    termLink: termLinkValue,
    whatsappMessage: financeWhatsAppMessage(action, fin),
  };
}
function financeBundle(fin: NonNullable<Awaited<ReturnType<typeof loadFinance>>>, termLink?: string | null) {
  return {
    monthRef: fin.monthRef,
    pctDelivered: fin.pctDelivered,
    agreedValue: fin.agreedValue,
    amountDue: fin.amountDue,
    termLink: termLink ?? fin.termLink,
    signedTermLink: fin.signedTermLink,
    ambassador: fin.ambassador,
  };
}

async function loadFinance(financeId: string) {
  return prisma.monthlyFinance.findUnique({
    where: { id: financeId },
    include: { ambassador: { include: { partnership: true } } },
  });
}

export async function POST(req: Request) {
  const body = await req.json();
  const {
    financeId,
    action,
    previewOnly,
    subject: subjectOverride,
    html: htmlOverride,
    to: toOverride,
    from: fromOverride,
    cc: ccOverride,
  } = body;
  if (!(FINANCE_ACTIONS as readonly string[]).includes(action)) {
    return NextResponse.json({ error: "Ação inválida" }, { status: 400 });
  }

  const fin = await loadFinance(financeId);
  if (!fin) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  const control = await prisma.monthlyControl.findUnique({
    where: { ambassadorId_monthRef: { ambassadorId: fin.ambassadorId, monthRef: fin.monthRef } },
  });

  const newStatus = ACTION_STATUS[action] || fin.paymentStatus;
  let termLink = fin.termLink;

  if (action === "Enviar fechamento do mês (com termo)" && !termLink && isTermoGenerationConfigured()) {
    const termo = await generateTermoAdesao(fin, control, {
      shareWithEmail: fin.ambassador.email,
    });
    if (termo.ok && termo.termLink) {
      termLink = termo.termLink;
      await prisma.monthlyFinance.update({
        where: { id: financeId },
        data: {
          termLink,
          termDocLink: termo.docLink || null,
          log: appendFinanceLog(fin.log, `${new Date().toISOString()} — Termo gerado antes do fechamento`),
        },
      });
    }
  }

  if (EMAIL_ACTIONS.has(action)) {
    const bundle = financeBundle(fin, termLink);
    const sendAmbassadorToo = action === FINANCE_REQUEST_ACTION;

    if (isFinanceTeamEmailAction(action) && previewOnly) {
      const financeEmail = renderFinanceEmail(FINANCE_REQUEST_ACTION, bundle, control);
      const ambassadorEmail = sendAmbassadorToo
        ? renderFinanceEmail(AMBASSADOR_PAYMENT_NOTICE_ACTION, bundle, control)
        : null;

      return NextResponse.json({
        ...financePreviewMeta(
          action,
          fin,
          financeEmail,
          financeEmail.recipient || financeTeamToHeader()
        ),
        recipientDisplay: FINANCE_TEAM_TO_DISPLAY,
        ccDisplay: FINANCE_TEAM_CC_DISPLAY,
        termLink: fin.signedTermLink || termLink,
        financeOnly: !sendAmbassadorToo,
        ambassadorEmail: ambassadorEmail
          ? {
              subject: ambassadorEmail.subject,
              html: ambassadorEmail.html,
              recipient: fin.ambassador.email || "",
            }
          : undefined,
      });
    }

    const rendered = renderFinanceEmail(
      action === FINANCE_RESEND_REQUEST_ACTION ? FINANCE_REQUEST_ACTION : action,
      bundle,
      control
    );

    const to =
      rendered.recipient ||
      (isFinanceTeamEmailAction(action) ? financeTeamToHeader() : fin.ambassador.email) ||
      undefined;

    if (previewOnly) {
      return NextResponse.json(
        financePreviewMeta(action, fin, rendered, to || "", termLink)
      );
    }

    const subject = subjectOverride || rendered.subject;
    const html = htmlOverride || rendered.html;
    const finalTo = String(toOverride || to || "").trim();
    const finalCc = ccOverride
      ? String(ccOverride)
      : isFinanceTeamEmailAction(action)
        ? financeTeamCcHeader()
        : undefined;
    const from = fromOverride ? String(fromOverride) : undefined;

    if (isFinanceTeamEmailAction(action)) {
      const shareResult = await shareSignedTermWithFinanceTeam(
        fin.signedTermLink,
        fin.ambassador.email
      );
      if (!shareResult.ok) {
        return NextResponse.json(
          { error: shareResult.error || "Falha ao compartilhar termo assinado no Drive" },
          { status: 500 }
        );
      }
    }

    const emailResult = await sendEmail({
      action: isFinanceTeamEmailAction(action) ? FINANCE_REQUEST_ACTION : action,
      financeId,
      subject,
      html,
      to: finalTo,
      from,
      program: fin.ambassador.program,
      cc: finalCc,
    });

    await prisma.emailLog.create({
      data: {
        ambassadorId: fin.ambassadorId,
        emailType: action,
        subject,
        recipient: finalTo,
        htmlPreview: html.slice(0, 5000),
        status: emailResult.ok ? "sent" : "failed",
        sentAt: emailResult.ok ? new Date() : undefined,
      },
    });

    if (!emailResult.ok) {
      return NextResponse.json({ ok: false, error: emailResult.error, email: emailResult });
    }

    let ambassadorEmailResult: { ok: boolean; error?: string } | null = null;

    if (sendAmbassadorToo) {
      const ambassadorRendered = renderFinanceEmail(AMBASSADOR_PAYMENT_NOTICE_ACTION, bundle, control);
      if (fin.ambassador.email) {
        ambassadorEmailResult = await sendEmail({
          action: AMBASSADOR_PAYMENT_NOTICE_ACTION,
          financeId,
          subject: ambassadorRendered.subject,
          html: ambassadorRendered.html,
          to: fin.ambassador.email,
          program: fin.ambassador.program,
        });

        await prisma.emailLog.create({
          data: {
            ambassadorId: fin.ambassadorId,
            emailType: AMBASSADOR_PAYMENT_NOTICE_ACTION,
            subject: ambassadorRendered.subject,
            recipient: fin.ambassador.email,
            htmlPreview: ambassadorRendered.html.slice(0, 5000),
            status: ambassadorEmailResult.ok ? "sent" : "failed",
            sentAt: ambassadorEmailResult.ok ? new Date() : undefined,
          },
        });
      }
    }

    const updated = await prisma.monthlyFinance.update({
      where: { id: financeId },
      data: {
        paymentStatus: newStatus,
        closingSentAt: action.includes("fechamento") ? new Date() : fin.closingSentAt,
        termSentAt:
          action === "Enviar fechamento do mês (com termo)" ? new Date() : fin.termSentAt,
        financeSentAt: isFinanceTeamEmailAction(action) ? new Date() : fin.financeSentAt,
        paymentSent:
          isFinanceTeamEmailAction(action) && sendAmbassadorToo ? true : fin.paymentSent,
        log: appendFinanceLog(
          fin.log,
          `${new Date().toISOString()} — ${action}${
            ambassadorEmailResult && !ambassadorEmailResult.ok
              ? ` (aviso embaixador falhou: ${ambassadorEmailResult.error})`
              : sendAmbassadorToo && fin.ambassador.email
                ? " + Avisar embaixador: pagamento solicitado"
                : ""
          }`
        ),
      },
    });

    return NextResponse.json({
      ok: true,
      finance: updated,
      email: emailResult,
      ambassadorEmail: ambassadorEmailResult,
    });
  }

  const updated = await prisma.monthlyFinance.update({
    where: { id: financeId },
    data: {
      paymentStatus: newStatus,
      log: appendFinanceLog(fin.log, `${new Date().toISOString()} — ${action}`),
    },
  });

  return NextResponse.json({ ok: true, finance: updated });
}
