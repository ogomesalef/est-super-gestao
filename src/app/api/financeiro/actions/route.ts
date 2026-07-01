import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { renderFinanceEmail, sendEmail } from "@/lib/email";
import { FINANCE_ACTIONS } from "@/lib/constants";
import { appendFinanceLog } from "@/lib/finance-log";
import { generateTermoAdesao, isTermoGenerationConfigured } from "@/lib/termo-adesao";

const ACTION_STATUS: Record<string, string> = {
  "Enviar fechamento do mês (com termo)": "Aguardando termo assinado",
  "Enviar lembrete do termo": "Aguardando termo assinado",
  "Cobrar Form Financeiro": "Aguardando Form Financeiro",
  "Enviar solicitação ao Financeiro": "Solicitado ao Financeiro",
  "Avisar embaixador: pagamento solicitado": "Pagamento confirmado ao embaixador",
  "Marcar como Pago": "Pago",
  "Bloquear pagamento": "Bloqueado",
  "Desbloquear pagamento": "Pendente",
};

const EMAIL_ACTIONS = new Set([
  "Enviar fechamento do mês (com termo)",
  "Enviar lembrete do termo",
  "Cobrar Form Financeiro",
  "Enviar solicitação ao Financeiro",
  "Avisar embaixador: pagamento solicitado",
]);

export async function POST(req: Request) {
  const body = await req.json();
  const { financeId, action, previewOnly, subject: subjectOverride, html: htmlOverride } = body;
  if (!(FINANCE_ACTIONS as readonly string[]).includes(action)) {
    return NextResponse.json({ error: "Ação inválida" }, { status: 400 });
  }

  const fin = await prisma.monthlyFinance.findUnique({
    where: { id: financeId },
    include: { ambassador: { include: { partnership: true } } },
  });
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
    const rendered = renderFinanceEmail(
      action,
      {
        monthRef: fin.monthRef,
        pctDelivered: fin.pctDelivered,
        agreedValue: fin.agreedValue,
        amountDue: fin.amountDue,
        termLink,
        signedTermLink: fin.signedTermLink,
        ambassador: fin.ambassador,
      },
      control
    );

    const to =
      rendered.recipient ||
      (action === "Enviar solicitação ao Financeiro"
        ? process.env.FINANCE_TEAM_EMAIL
        : fin.ambassador.email) ||
      undefined;

    if (previewOnly) {
      return NextResponse.json({
        subject: rendered.subject,
        html: rendered.html,
        recipient: to || "",
        termLink,
      });
    }

    const subject = subjectOverride || rendered.subject;
    const html = htmlOverride || rendered.html;

    const emailResult = await sendEmail({
      action,
      financeId,
      subject,
      html,
      to,
      program: fin.ambassador.program,
      cc:
        action === "Enviar solicitação ao Financeiro"
          ? process.env.FINANCE_CC_EMAIL || "alefgomesandre+chefe@gmail.com"
          : undefined,
    });

    await prisma.emailLog.create({
      data: {
        ambassadorId: fin.ambassadorId,
        emailType: action,
        subject,
        recipient: to,
        htmlPreview: html.slice(0, 5000),
        status: emailResult.ok ? "sent" : "failed",
        sentAt: emailResult.ok ? new Date() : undefined,
      },
    });

    const updated = await prisma.monthlyFinance.update({
      where: { id: financeId },
      data: {
        paymentStatus: newStatus,
        closingSentAt: action.includes("fechamento") ? new Date() : fin.closingSentAt,
        termSentAt:
          action === "Enviar fechamento do mês (com termo)" && emailResult.ok
            ? new Date()
            : fin.termSentAt,
        financeSentAt: action.includes("Financeiro") ? new Date() : fin.financeSentAt,
        paymentSent: action === "Avisar embaixador: pagamento solicitado" ? true : fin.paymentSent,
        log: appendFinanceLog(
          fin.log,
          `${new Date().toISOString()} — ${action}${emailResult.error ? ` (erro: ${emailResult.error})` : ""}`
        ),
      },
    });

    return NextResponse.json({ ok: true, finance: updated, email: emailResult });
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
