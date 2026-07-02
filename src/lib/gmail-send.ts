import { VERTICAL_CONFIG } from "@/lib/constants";
import { getGoogleAccessToken } from "@/lib/google-oauth";

function encodeMime(raw: string): string {
  return Buffer.from(raw, "utf-8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function encodeSubject(subject: string): string {
  return `=?UTF-8?B?${Buffer.from(subject, "utf-8").toString("base64")}?=`;
}

function fromHeader(program?: string, fromOverride?: string): string {
  if (fromOverride?.trim()) {
    const trimmed = fromOverride.trim();
    if (trimmed.includes("<") && trimmed.includes(">")) return trimmed;
    return `Programa Super Embaixadores <${trimmed}>`;
  }
  const key = program === "ECJ" ? "ECJ" : "OAB";
  const cfg = VERTICAL_CONFIG[key];
  const alias =
    key === "ECJ"
      ? process.env.GMAIL_FROM_ECJ || cfg.emailFrom
      : process.env.GMAIL_FROM_OAB || cfg.emailFrom;
  return `Programa Super Embaixadores <${alias}>`;
}

function replyToHeader(program?: string): string {
  const key = program === "ECJ" ? "ECJ" : "OAB";
  const cfg = VERTICAL_CONFIG[key];
  return process.env.GMAIL_REPLY_TO || cfg.emailFrom;
}

/** Texto simples para multipart — ajuda Gmail a classificar como Principal. */
export function htmlToPlainText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<\/tr>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function buildMime({
  to,
  subject,
  html,
  cc,
  program,
  from,
}: {
  to: string;
  subject: string;
  html: string;
  cc?: string;
  program?: string;
  from?: string;
}) {
  const plain =
    htmlToPlainText(html) ||
    "Seu cliente de e-mail não suporta HTML. Acesse a mensagem em um cliente compatível.";
  const boundary = `sg_${Date.now().toString(36)}`;
  const replyTo = replyToHeader(program);

  const headers = [
    `From: ${fromHeader(program, from)}`,
    `To: ${to}`,
    cc ? `Cc: ${cc}` : null,
    `Reply-To: ${replyTo}`,
    `Subject: ${encodeSubject(subject)}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    "X-Priority: 1",
    "Importance: High",
    "X-MSMail-Priority: High",
  ].filter(Boolean);

  const parts = [
    `--${boundary}`,
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    "",
    Buffer.from(plain, "utf-8").toString("base64"),
    `--${boundary}`,
    "Content-Type: text/html; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    "",
    Buffer.from(html, "utf-8").toString("base64"),
    `--${boundary}--`,
  ];

  return [...headers, "", ...parts].join("\r\n");
}

export async function sendViaGmail(payload: {
  to?: string;
  subject?: string;
  html?: string;
  cc?: string;
  program?: string;
  from?: string;
}): Promise<{ ok: boolean; error?: string; messageId?: string }> {
  const to = payload.to?.trim();
  const subject = payload.subject?.trim();
  const html = payload.html?.trim();

  if (!to || !subject || !html) {
    return { ok: false, error: "Destinatário, assunto ou HTML ausente" };
  }

  try {
    const accessToken = await getGoogleAccessToken();
    const raw = encodeMime(
      buildMime({
        to,
        subject,
        html,
        cc: payload.cc,
        program: payload.program,
        from: payload.from,
      })
    );

    const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ raw }),
    });

    const data = (await res.json()) as { id?: string; error?: { message?: string } };
    if (!res.ok) {
      const msg = data.error?.message || `Gmail API ${res.status}`;
      if (msg.includes("Mail service not enabled")) {
        return {
          ok: false,
          error: "Gmail API não habilitada no projeto Google Cloud (ative Gmail API).",
        };
      }
      if (msg.toLowerCase().includes("invalid grant")) {
        return {
          ok: false,
          error: "Token Gmail expirado — reconecte em /emails → Conectar Gmail (cx@).",
        };
      }
      return { ok: false, error: msg };
    }

    return { ok: true, messageId: data.id };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}
