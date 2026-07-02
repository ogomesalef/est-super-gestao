"use client";

import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui";
import { SendEmailModal, type SendEmailConfirmPayload } from "@/components/send-email-modal";
import {
  FINANCE_REQUEST_ACTION,
  FINANCE_RESEND_REQUEST_ACTION,
} from "@/lib/constants";
import { defaultSenderIdForProgram, resolveSenderFromDisplay } from "@/lib/email-senders";
import { ExternalLink } from "lucide-react";

function patchTermLinkInHtml(html: string, link: string): string {
  if (!link.trim()) return html;
  const safe = link.trim().replace(/"/g, "&quot;");
  let out = html;
  out = out.replace(
    /(<a[^>]*href=")[^"]*("[^>]*>\s*Acessar Termo de Parceria)/i,
    `$1${safe}$2`
  );
  out = out.replace(/href=""([^>]*>\s*Acessar Termo de Parceria)/i, `href="${safe}"$1`);
  out = out.replace(/href="{{linkTermoAssinado}}"/gi, `href="${safe}"`);
  out = out.replace(/\{\{linkTermoAssinado\}\}/g, safe);
  return out;
}

function actionNeedsTermLink(action: string): boolean {
  return (
    action.includes("fechamento") ||
    action.toLowerCase().includes("termo") ||
    action.includes("solicitação ao Financeiro") ||
    action.includes("Reenviar solicitação")
  );
}

export type FinanceEmailModalPayload = {
  financeId?: string;
  action: string;
  subject: string;
  html: string;
  recipient: string;
  recipientDisplay?: string;
  cc?: string;
  ccDisplay?: string;
  from?: string;
  program?: string;
  termLink?: string | null;
  ambassadorEmail?: {
    subject: string;
    html: string;
    recipient: string;
  };
  whatsappMessage?: string;
  financeOnly?: boolean;
};

export function FinanceEmailModal({
  open,
  action,
  subject,
  html,
  recipient,
  cc,
  from,
  program,
  termLink,
  ambassadorEmail,
  whatsappMessage = "",
  financeOnly,
  sending,
  onClose,
  onSend,
}: FinanceEmailModalPayload & {
  open: boolean;
  sending: boolean;
  onClose: () => void;
  onSend: (payload: SendEmailConfirmPayload) => void;
}) {
  const [editTermLink, setEditTermLink] = useState(termLink || "");
  const [baseHtml, setBaseHtml] = useState(html);

  const isFinanceTeamEmail =
    action === FINANCE_REQUEST_ACTION || action === FINANCE_RESEND_REQUEST_ACTION;
  const sendAmbassadorToo = isFinanceTeamEmail && !financeOnly;
  const showTermLink = actionNeedsTermLink(action);

  useEffect(() => {
    if (!open) return;
    setEditTermLink(termLink || "");
    setBaseHtml(html);
  }, [open, termLink, html]);

  const previewHtml = useMemo(() => {
    if (!showTermLink) return baseHtml;
    return patchTermLinkInHtml(baseHtml, editTermLink);
  }, [baseHtml, editTermLink, showTermLink]);

  function handleTermLinkChange(link: string) {
    setEditTermLink(link);
    setBaseHtml((prev) => patchTermLinkInHtml(prev, link));
  }

  const fromId = from
    ? resolveSenderFromDisplay(from)?.id
    : defaultSenderIdForProgram(program || "OAB");

  const termLinkField = showTermLink ? (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted-foreground">
        Link do termo assinado (PDF)
      </span>
      <div className="flex gap-2">
        <Input
          value={editTermLink}
          onChange={(e) => handleTermLinkChange(e.target.value)}
          placeholder="https://drive.google.com/file/d/..."
          className="font-mono text-xs"
        />
        {editTermLink && (
          <a
            href={editTermLink}
            target="_blank"
            rel="noreferrer"
            className="inline-flex shrink-0 items-center gap-1 rounded-md border border-hairline px-3 text-xs text-primary hover:bg-surface"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Abrir
          </a>
        )}
      </div>
      {!editTermLink.trim() && isFinanceTeamEmail && (
        <p className="mt-1 text-xs text-amber-700">
          Anexe o termo assinado antes de enviar ao financeiro.
        </p>
      )}
    </label>
  ) : null;

  return (
    <SendEmailModal
      open={open}
      onClose={onClose}
      sending={sending}
      actionLabel={action}
      hint={
        sendAmbassadorToo
          ? "Serão enviados 2 e-mails: financeiro + confirmação ao embaixador"
          : financeOnly
            ? "Reenvio apenas ao time financeiro (sem e-mail ao embaixador)"
            : undefined
      }
      program={program}
      fromId={fromId}
      to={recipient}
      cc={cc}
      subject={subject}
      html={previewHtml}
      whatsappMessage={whatsappMessage}
      showCc={Boolean(cc)}
      sendLabel={sendAmbassadorToo ? "Enviar e-mails" : "Enviar e-mail"}
      sendDisabled={showTermLink && isFinanceTeamEmail && !editTermLink.trim()}
      secondaryEmail={
        sendAmbassadorToo && ambassadorEmail?.recipient
          ? {
              label: "Confirmação ao embaixador",
              to: ambassadorEmail.recipient,
              subject: ambassadorEmail.subject,
              html: ambassadorEmail.html,
            }
          : undefined
      }
      extraFields={termLinkField}
      onSend={(payload) => {
        const finalHtml = showTermLink ? patchTermLinkInHtml(payload.html, editTermLink) : payload.html;
        onSend({ ...payload, html: finalHtml });
      }}
    />
  );
}
