"use client";

import { useEffect, useState } from "react";
import { Loader2, Mail } from "lucide-react";
import { Button, Input } from "@/components/ui";
import { SendEmailModal, type SendEmailConfirmPayload } from "@/components/send-email-modal";
import { COLLAB_PEDIDO_EMAIL_ACTION } from "@/lib/constants";

export type CollabPedidoEmailDefaults = {
  ambassadorId: string;
  ambassadorName: string;
  ambassadorEmail: string | null;
  program: string;
  campaignName: string;
  briefingUrl: string;
  dueDateDisplay?: string;
  videoConcept?: string;
};

export function CollabPedidoEmailModal({
  open,
  defaults,
  onClose,
}: {
  open: boolean;
  defaults: CollabPedidoEmailDefaults | null;
  onClose: () => void;
}) {
  const [campaignName, setCampaignName] = useState("");
  const [briefingUrl, setBriefingUrl] = useState("");
  const [dueDateDisplay, setDueDateDisplay] = useState("");
  const [videoConcept, setVideoConcept] = useState("");
  const [busy, setBusy] = useState(false);
  const [sendOpen, setSendOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [html, setHtml] = useState("");
  const [modalMeta, setModalMeta] = useState<{
    to: string;
    fromId?: string;
    program: string;
    whatsappMessage: string;
  } | null>(null);

  useEffect(() => {
    if (!open || !defaults) return;
    setCampaignName(defaults.campaignName);
    setBriefingUrl(defaults.briefingUrl);
    setDueDateDisplay(defaults.dueDateDisplay || "");
    setVideoConcept(
      defaults.videoConcept ||
        "1 Reels — roteiro completo, referência de estilo e pasta de upload na página do briefing."
    );
    setSendOpen(false);
  }, [open, defaults]);

  if (!open || !defaults) return null;

  function vars() {
    return { campaignName, briefingUrl, dueDateDisplay, videoConcept };
  }

  async function prepareEmail() {
    const res = await fetch("/api/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        previewOnly: true,
        ambassadorId: defaults!.ambassadorId,
        action: COLLAB_PEDIDO_EMAIL_ACTION,
        vars: vars(),
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Erro ao gerar e-mail");
    setSubject(data.subject);
    setHtml(data.html);
    setModalMeta({
      to: data.to || defaults!.ambassadorEmail || "",
      fromId: data.fromId,
      program: data.program || defaults!.program,
      whatsappMessage: data.whatsappMessage || "",
    });
  }

  async function openSendModal() {
    setBusy(true);
    try {
      await prepareEmail();
      setSendOpen(true);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erro ao preparar envio");
    } finally {
      setBusy(false);
    }
  }

  async function confirmSend(payload: SendEmailConfirmPayload) {
    setBusy(true);
    try {
      const res = await fetch("/api/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ambassadorId: defaults!.ambassadorId,
          action: COLLAB_PEDIDO_EMAIL_ACTION,
          vars: vars(),
          to: payload.to,
          from: payload.from,
          subject: payload.subject,
          html: payload.html,
          whatsappMessage: payload.whatsappMessage,
        }),
      });
      const data = await res.json();
      if (!data.send?.ok) throw new Error(data.send?.error || data.error || "Erro ao enviar");
      setSendOpen(false);
      onClose();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erro ao enviar");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
        <div
          className="max-h-[100dvh] sm:max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-hairline bg-card p-5 shadow-soft"
          role="dialog"
          aria-labelledby="collab-email-title"
        >
          <div className="mb-4 flex items-start gap-3">
            <Mail className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
            <div>
              <h3 id="collab-email-title" className="font-serif text-lg text-ink">
                E-mail — pedido de vídeo
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Para <strong>{defaults.ambassadorName}</strong>
                {defaults.ambassadorEmail ? ` (${defaults.ambassadorEmail})` : " — sem e-mail cadastrado"}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Campanha</label>
              <Input value={campaignName} onChange={(e) => setCampaignName(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Link do briefing</label>
              <Input value={briefingUrl} onChange={(e) => setBriefingUrl(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Prazo (texto)</label>
              <Input
                placeholder="ex.: 5 de junho"
                value={dueDateDisplay}
                onChange={(e) => setDueDateDisplay(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">O que pedimos</label>
              <textarea
                className="min-h-[88px] w-full rounded-md border border-hairline bg-canvas px-3 py-2 text-sm text-ink"
                value={videoConcept}
                onChange={(e) => setVideoConcept(e.target.value)}
              />
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <Button onClick={openSendModal} disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Preparar envio"}
            </Button>
            <Button variant="secondary" onClick={onClose} disabled={busy}>
              Fechar
            </Button>
          </div>
        </div>
      </div>

      <SendEmailModal
        open={sendOpen}
        onClose={() => setSendOpen(false)}
        sending={busy}
        actionLabel={COLLAB_PEDIDO_EMAIL_ACTION}
        program={modalMeta?.program}
        fromId={modalMeta?.fromId}
        to={modalMeta?.to || ""}
        subject={subject}
        html={html}
        whatsappMessage={modalMeta?.whatsappMessage || ""}
        onSend={(payload) => {
          void confirmSend(payload);
        }}
      />
    </>
  );
}
