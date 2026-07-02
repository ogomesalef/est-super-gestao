"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Button, Input, Select, Textarea } from "@/components/ui";
import { SavedEmailInput } from "@/components/saved-email-input";
import {
  defaultSenderIdForProgram,
  formatFromHeader,
  getEmailSenders,
  type EmailSender,
} from "@/lib/email-senders";
import { rememberRecipient } from "@/lib/saved-recipients";
import { cn } from "@/lib/utils";
import { Check, Copy, Loader2, X } from "lucide-react";

export type SendEmailConfirmPayload = {
  fromId: string;
  from: string;
  to: string;
  cc?: string;
  subject: string;
  html: string;
  whatsappMessage: string;
};

export type SendEmailSecondaryPayload = {
  label: string;
  to: string;
  subject: string;
  html: string;
};

export type SendEmailModalProps = {
  open: boolean;
  onClose: () => void;
  sending?: boolean;
  title?: string;
  actionLabel: string;
  hint?: string;
  program?: string;
  fromId?: string;
  to?: string;
  cc?: string;
  subject: string;
  html: string;
  whatsappMessage: string;
  sendLabel?: string;
  sendDisabled?: boolean;
  showCc?: boolean;
  showSendButton?: boolean;
  secondaryEmail?: SendEmailSecondaryPayload;
  extraFields?: ReactNode;
  onSend: (payload: SendEmailConfirmPayload) => void;
};

export function SendEmailModal({
  open,
  onClose,
  sending = false,
  title = "Confirmar envio",
  actionLabel,
  hint,
  program,
  fromId,
  to = "",
  cc = "",
  subject,
  html,
  whatsappMessage,
  sendLabel = "Enviar e-mail",
  sendDisabled = false,
  showCc = false,
  showSendButton = true,
  secondaryEmail,
  extraFields,
  onSend,
}: SendEmailModalProps) {
  const senders = useMemo(() => getEmailSenders(), []);
  const [editFromId, setEditFromId] = useState(fromId || defaultSenderIdForProgram(program || "OAB"));
  const [editTo, setEditTo] = useState(to);
  const [editCc, setEditCc] = useState(cc);
  const [editSubject, setEditSubject] = useState(subject);
  const [editHtml, setEditHtml] = useState(html);
  const [editWhatsApp, setEditWhatsApp] = useState(whatsappMessage);
  const [tab, setTab] = useState<"preview" | "html">("preview");
  const [copiedWa, setCopiedWa] = useState(false);
  const [savedKey, setSavedKey] = useState(0);

  useEffect(() => {
    if (!open) return;
    setEditFromId(fromId || defaultSenderIdForProgram(program || "OAB"));
    setEditTo(to);
    setEditCc(cc);
    setEditSubject(subject);
    setEditHtml(html);
    setEditWhatsApp(whatsappMessage);
    setTab("preview");
    setCopiedWa(false);
  }, [open, fromId, program, to, cc, subject, html, whatsappMessage]);

  const selectedSender = senders.find((s) => s.id === editFromId) || senders[0];

  async function copyWhatsApp() {
    if (!editWhatsApp.trim()) return;
    await navigator.clipboard.writeText(editWhatsApp);
    setCopiedWa(true);
    setTimeout(() => setCopiedWa(false), 2000);
  }

  function handleSend() {
    const sender = senders.find((s) => s.id === editFromId) || senders[0];
    if (editTo.trim()) rememberRecipient(editTo.trim());
    if (editCc.trim()) rememberRecipient(editCc.trim());
    setSavedKey((k) => k + 1);
    onSend({
      fromId: sender.id,
      from: formatFromHeader(sender),
      to: editTo.trim(),
      cc: editCc.trim() || undefined,
      subject: editSubject.trim(),
      html: editHtml,
      whatsappMessage: editWhatsApp,
    });
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex bg-ink/50 p-2 backdrop-blur-sm sm:p-4"
      onClick={onClose}
    >
      <div
        className="mx-auto flex h-full w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-hairline bg-card shadow-elev"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shrink-0 border-b border-hairline px-4 py-3 sm:px-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {title}
              </p>
              <h2 className="font-serif text-lg text-ink">{actionLabel}</h2>
              {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
              {secondaryEmail && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Também será enviado: {secondaryEmail.label} → {secondaryEmail.to}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md p-1.5 text-muted-foreground hover:bg-surface hover:text-ink"
              aria-label="Fechar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted-foreground">De</span>
              <Select value={editFromId} onChange={(e) => setEditFromId(e.target.value)}>
                {senders.map((s: EmailSender) => (
                  <option key={s.id} value={s.id}>
                    {s.label} ({s.address})
                  </option>
                ))}
              </Select>
              <p className="mt-1 truncate text-[11px] text-muted-foreground">
                {formatFromHeader(selectedSender)}
              </p>
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted-foreground">Para</span>
              <SavedEmailInput
                value={editTo}
                onChange={setEditTo}
                refreshKey={savedKey}
                placeholder="destinatario@email.com"
              />
            </label>

            {showCc && (
              <label className="block sm:col-span-2">
                <span className="mb-1 block text-xs font-medium text-muted-foreground">Cópia</span>
                <SavedEmailInput
                  value={editCc}
                  onChange={setEditCc}
                  refreshKey={savedKey}
                  placeholder="cc@email.com (opcional)"
                />
              </label>
            )}
          </div>

          <div className="mt-3 space-y-3">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted-foreground">Assunto</span>
              <Input value={editSubject} onChange={(e) => setEditSubject(e.target.value)} />
            </label>

            {extraFields}

            <div className="rounded-xl border border-hairline bg-surface/40 p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Mensagem WhatsApp
                </p>
                <button
                  type="button"
                  onClick={copyWhatsApp}
                  className="inline-flex items-center gap-1 rounded-md border border-hairline bg-card px-2 py-1 text-xs text-ink hover:bg-surface"
                >
                  {copiedWa ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                      Copiado
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      Copiar
                    </>
                  )}
                </button>
              </div>
              <div className="overflow-hidden rounded-lg border border-hairline bg-[#1e1e1e]">
                <div className="border-b border-white/10 px-3 py-1.5">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-white/50">
                    DM / WhatsApp
                  </span>
                </div>
                <textarea
                  value={editWhatsApp}
                  onChange={(e) => setEditWhatsApp(e.target.value)}
                  className="max-h-40 min-h-[120px] w-full resize-y bg-transparent p-3 font-mono text-[12px] leading-relaxed text-[#e6e6e6] focus:outline-none"
                  spellCheck={false}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-1">
              <button
                type="button"
                onClick={() => setTab("preview")}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                  tab === "preview"
                    ? "bg-primary text-primary-foreground"
                    : "bg-surface text-muted-foreground hover:text-ink"
                )}
              >
                Visual
              </button>
              <button
                type="button"
                onClick={() => setTab("html")}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                  tab === "html"
                    ? "bg-primary text-primary-foreground"
                    : "bg-surface text-muted-foreground hover:text-ink"
                )}
              >
                Editar HTML
              </button>
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-hidden bg-canvas p-3 sm:p-4">
          {tab === "html" ? (
            <Textarea
              value={editHtml}
              onChange={(e) => setEditHtml(e.target.value)}
              className="h-full min-h-0 resize-none font-mono text-xs leading-relaxed"
              spellCheck={false}
            />
          ) : (
            <iframe
              title="Preview do e-mail"
              srcDoc={editHtml}
              className="h-full w-full rounded-lg border border-hairline bg-white shadow-hairline"
            />
          )}
        </div>

        <div className="flex shrink-0 justify-end gap-2 border-t border-hairline px-4 py-3 sm:px-5">
          <Button variant="secondary" onClick={onClose} disabled={sending}>
            {showSendButton ? "Cancelar" : "Fechar"}
          </Button>
          {showSendButton && (
            <Button
              onClick={handleSend}
              disabled={
                sending ||
                sendDisabled ||
                !editSubject.trim() ||
                !editHtml.trim() ||
                !editTo.trim()
              }
            >
              {sending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Enviando…
                </>
              ) : (
                sendLabel
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
