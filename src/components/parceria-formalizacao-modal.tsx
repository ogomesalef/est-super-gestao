"use client";

import { useCallback, useEffect, useState } from "react";
import { Button, Input } from "@/components/ui";
import { SendEmailModal, type SendEmailConfirmPayload } from "@/components/send-email-modal";
import { resolveFormalizacaoAction } from "@/lib/constants";
import { instagramProfileUrl } from "@/lib/formalizacao-instagram-message";
import { ExternalLink, Loader2, X } from "lucide-react";
import type { ParceriaItem } from "@/components/parcerias/types";

type EmailVars = {
  courseName: string;
  couponCode: string;
  releaseDate: string;
};

export function ParceriaFormalizacaoModal({
  open,
  item,
  saving,
  onClose,
  onActivateOnly,
  onSendAndActivate,
}: {
  open: boolean;
  item: ParceriaItem | null;
  saving: boolean;
  onClose: () => void;
  onActivateOnly: () => void;
  onSendAndActivate: (vars: EmailVars, email: SendEmailConfirmPayload) => void;
}) {
  const [courseName, setCourseName] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [releaseDate, setReleaseDate] = useState("");
  const [subject, setSubject] = useState("");
  const [html, setHtml] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [sendOpen, setSendOpen] = useState(false);
  const [modalMeta, setModalMeta] = useState<{
    to: string;
    fromId?: string;
    program: string;
    whatsappMessage: string;
  } | null>(null);

  const p = item?.partnership;
  const isAssinatura = p?.modality !== "Remuneração";
  const emailAction = item ? resolveFormalizacaoAction(p?.modality) : "";
  const instagramUrl = item ? instagramProfileUrl(item.instagram) : null;

  const emailVars = useCallback(
    (): EmailVars => ({
      courseName,
      couponCode,
      releaseDate,
    }),
    [courseName, couponCode, releaseDate]
  );

  const loadPreview = useCallback(async () => {
    if (!item) return;
    setPreviewLoading(true);
    setPreviewError(null);
    try {
      const res = await fetch("/api/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          previewOnly: true,
          ambassadorId: item.id,
          action: emailAction,
          vars: emailVars(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPreviewError(data.error || "Erro ao gerar preview");
        return;
      }
      setSubject(data.subject || "");
      setHtml(data.html || "");
      setModalMeta({
        to: data.to || item.email || "",
        fromId: data.fromId,
        program: data.program || item.program,
        whatsappMessage: data.whatsappMessage || "",
      });
    } catch {
      setPreviewError("Erro ao gerar preview do e-mail");
    } finally {
      setPreviewLoading(false);
    }
  }, [item, emailAction, emailVars]);

  useEffect(() => {
    if (!open || !item) return;
    setCourseName(p?.courseName || "");
    setCouponCode(p?.couponCode || "");
    setReleaseDate(
      p?.startDate
        ? new Date(p.startDate).toISOString().slice(0, 10)
        : new Date().toISOString().slice(0, 10)
    );
    setSubject("");
    setHtml("");
    setPreviewError(null);
    setSendOpen(false);
  }, [open, item, p?.courseName, p?.couponCode, p?.startDate]);

  useEffect(() => {
    if (!open || !item) return;
    const timer = setTimeout(() => {
      loadPreview();
    }, 200);
    return () => clearTimeout(timer);
  }, [open, item, courseName, couponCode, releaseDate, loadPreview]);

  async function openSendModal() {
    await loadPreview();
    if (!html) return;
    setSendOpen(true);
  }

  if (!open || !item) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/50 p-4 backdrop-blur-sm"
        onClick={onClose}
      >
        <div
          className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-hairline bg-card shadow-elev"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-3 border-b border-hairline px-5 py-4">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Formalizar parceria
              </p>
              <h2 className="font-serif text-lg text-ink">{item.fullName}</h2>
              <p className="text-sm text-muted-foreground">
                Proposta → Ativo · {emailAction}
              </p>
            </div>
            <button type="button" onClick={onClose} className="rounded-md p-1.5 hover:bg-surface">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="grid min-h-0 flex-1 gap-4 overflow-y-auto p-5 lg:grid-cols-[280px_1fr]">
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Revise os dados antes de enviar. No próximo passo você poderá editar remetente,
                destinatário, assunto, corpo e a mensagem de WhatsApp.
              </p>

              {isAssinatura && (
                <>
                  <label className="block">
                    <span className="mb-1 block text-xs font-medium text-muted-foreground">Curso</span>
                    <Input value={courseName} onChange={(e) => setCourseName(e.target.value)} />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs font-medium text-muted-foreground">Cupom</span>
                    <Input value={couponCode} onChange={(e) => setCouponCode(e.target.value)} />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs font-medium text-muted-foreground">
                      Data de liberação
                    </span>
                    <Input
                      type="date"
                      value={releaseDate}
                      onChange={(e) => setReleaseDate(e.target.value)}
                    />
                  </label>
                </>
              )}

              {!item.email && (
                <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950">
                  Este embaixador não tem e-mail cadastrado. Você pode ativar sem enviar.
                </p>
              )}

              <Button variant="secondary" size="sm" disabled={previewLoading} onClick={loadPreview}>
                {previewLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Atualizar preview"}
              </Button>

              {instagramUrl && (
                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-hairline bg-card px-3 py-2 text-xs font-medium text-ink hover:bg-surface"
                >
                  Abrir perfil no Instagram
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </div>

            <div className="flex min-h-[320px] flex-col rounded-lg border border-hairline bg-canvas">
              <div className="border-b border-hairline px-3 py-2">
                <p className="text-xs font-medium text-muted-foreground">Assunto (preview)</p>
                <p className="text-sm text-ink">{subject || "—"}</p>
              </div>
              <div className="min-h-0 flex-1 p-3">
                {previewLoading && !html ? (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Gerando preview…
                  </div>
                ) : previewError ? (
                  <p className="text-sm text-destructive">{previewError}</p>
                ) : html ? (
                  <iframe
                    title="Preview formalização"
                    srcDoc={html}
                    className="h-[min(50vh,480px)] w-full rounded-lg border border-hairline bg-white"
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">Nenhum preview disponível.</p>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap justify-end gap-2 border-t border-hairline px-5 py-3">
            <Button variant="ghost" onClick={onClose} disabled={saving}>
              Cancelar
            </Button>
            <Button variant="secondary" onClick={onActivateOnly} disabled={saving}>
              Ativar sem e-mail
            </Button>
            <Button onClick={openSendModal} disabled={saving || !item.email || !html}>
              Enviar e ativar
            </Button>
          </div>
        </div>
      </div>

      <SendEmailModal
        open={sendOpen}
        onClose={() => setSendOpen(false)}
        sending={saving}
        actionLabel={emailAction}
        program={modalMeta?.program}
        fromId={modalMeta?.fromId}
        to={modalMeta?.to || ""}
        subject={subject}
        html={html}
        whatsappMessage={modalMeta?.whatsappMessage || ""}
        onSend={(payload) => {
          onSendAndActivate(emailVars(), payload);
        }}
      />
    </>
  );
}
