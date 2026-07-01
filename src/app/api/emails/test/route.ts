import { NextResponse } from "next/server";
import { EMAIL_ACTIONS } from "@/lib/constants";
import { renderAmbassadorEmail } from "@/lib/email-templates";
import { buildTestAmbassador, TEST_EMAIL_VARS } from "@/lib/email-test-fixtures";
import { sendEmail } from "@/lib/send-email";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  const body = await req.json();
  const to = String(body.to || "").trim();
  const program = body.program === "ECJ" ? "ECJ" : "OAB";
  const modality =
    body.modality === "Remuneração" ? "Remuneração" : ("Assinatura + Cupom" as const);
  const action = String(body.action || EMAIL_ACTIONS[0]);
  const previewOnly = Boolean(body.previewOnly);

  if (!EMAIL_RE.test(to)) {
    return NextResponse.json({ error: "E-mail inválido" }, { status: 400 });
  }

  const ambassador = buildTestAmbassador(program, to, modality);

  let subject: string;
  let html: string;
  let resolvedAction: string;

  try {
    const rendered = renderAmbassadorEmail(action, ambassador, TEST_EMAIL_VARS);
    subject = rendered.subject;
    html = rendered.html;
    resolvedAction = rendered.action;
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Template inválido" },
      { status: 400 }
    );
  }

  if (previewOnly) {
    return NextResponse.json({ subject, html, action: resolvedAction });
  }

  const result = await sendEmail({
    action: resolvedAction,
    to,
    subject,
    html,
    program,
  });

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error || "Falha no envio" }, { status: 502 });
  }

  return NextResponse.json({
    ok: true,
    messageId: "messageId" in result ? result.messageId : undefined,
    subject,
    action: resolvedAction,
    to,
  });
}
