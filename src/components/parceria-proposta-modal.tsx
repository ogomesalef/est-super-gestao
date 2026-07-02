"use client";

import { useCallback, useEffect, useState } from "react";
import { Button, Input, Select } from "@/components/ui";
import { SendEmailModal, type SendEmailConfirmPayload } from "@/components/send-email-modal";
import { ApplicationFormSummary } from "@/components/parcerias/application-form-summary";
import { MODALITIES, resolvePropostaAction } from "@/lib/constants";
import { instagramProfileUrl } from "@/lib/formalizacao-instagram-message";
import { buildParceriaOperationalHints } from "@/lib/parceria-form-preview";
import { needsAnalysis } from "@/lib/partnership-alerts";
import { ExternalLink, Loader2, X } from "lucide-react";
import type { ParceriaItem } from "@/components/parcerias/types";

export type PropostaEmailVars = {
  modality: string;
  agreedValue: number | null;
  metaFeed: number;
  metaStories: number;
  metaTiktok: number;
  metaYoutube: number;
  productValue?: number;
};

export function ParceriaPropostaModal({
  open,
  item,
  saving,
  onClose,
  onMarkPropostaOnly,
  onSendProposal,
}: {
  open: boolean;
  item: ParceriaItem | null;
  saving: boolean;
  onClose: () => void;
  onMarkPropostaOnly: (vars: PropostaEmailVars) => void;
  onSendProposal: (vars: PropostaEmailVars, email: SendEmailConfirmPayload) => void;
}) {
  const p = item?.partnership;
  const [modality, setModality] = useState<string>(MODALITIES[0]);
  const [agreedValue, setAgreedValue] = useState("");
  const [metaFeed, setMetaFeed] = useState("0");
  const [metaStories, setMetaStories] = useState("0");
  const [metaTiktok, setMetaTiktok] = useState("0");
  const [metaYoutube, setMetaYoutube] = useState("0");
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

  const emailAction = resolvePropostaAction(modality);
  const isRemuneracao = modality === "Remuneração";
  const instagramUrl = item ? instagramProfileUrl(item.instagram) : null;

  const emailVars = useCallback((): PropostaEmailVars => {
    const value = agreedValue.trim() ? Number(agreedValue) : null;
    return {
      modality,
      agreedValue: value,
      metaFeed: Number(metaFeed) || 0,
      metaStories: Number(metaStories) || 0,
      metaTiktok: Number(metaTiktok) || 0,
      metaYoutube: Number(metaYoutube) || 0,
      productValue: value ?? undefined,
    };
  }, [modality, agreedValue, metaFeed, metaStories, metaTiktok, metaYoutube]);

  const loadPreview = useCallback(async () => {
    if (!item) return;
    setPreviewLoading(true);
    setPreviewError(null);
    try {
      const vars = emailVars();
      const res = await fetch("/api/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          previewOnly: true,
          ambassadorId: item.id,
          action: resolvePropostaAction(vars.modality),
          vars: {
            metaFeed: vars.metaFeed,
            metaStories: vars.metaStories,
            metaTiktok: vars.metaTiktok,
            metaYoutube: vars.metaYoutube,
            productValue: vars.productValue,
          },
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
  }, [item, emailVars]);

  useEffect(() => {
    if (!open || !item) return;
    setModality(p?.modality || MODALITIES[0]);
    setAgreedValue(p?.agreedValue != null ? String(p.agreedValue) : "");
    setMetaFeed(String(p?.metaFeed ?? 0));
    setMetaStories(String(p?.metaStories ?? 0));
    setMetaTiktok(String(p?.metaTiktok ?? 0));
    setMetaYoutube(String(p?.metaYoutube ?? 0));
    setSubject("");
    setHtml("");
    setPreviewError(null);
    setSendOpen(false);
  }, [open, item, p?.modality, p?.agreedValue, p?.metaFeed, p?.metaStories, p?.metaTiktok, p?.metaYoutube]);

  useEffect(() => {
    if (!open || !item) return;
    const timer = setTimeout(loadPreview, 200);
    return () => clearTimeout(timer);
  }, [open, item, modality, agreedValue, metaFeed, metaStories, metaTiktok, metaYoutube, loadPreview]);

  async function openSendModal() {
    await loadPreview();
    if (!html) return;
    setSendOpen(true);
  }

  if (!open || !item) return null;

  const analyzing = needsAnalysis(item);

  return (
    <>
      <div
        className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/50 p-4 backdrop-blur-sm"
        onClick={onClose}
      >
        <div
          className="flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-xl border border-hairline bg-card shadow-elev"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-3 border-b border-hairline px-5 py-4">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {analyzing ? "Analisar candidatura" : "Enviar proposta"}
              </p>
              <h2 className="font-serif text-lg text-ink">{item.fullName}</h2>
              <p className="text-sm text-muted-foreground">
                {item.instagram}
                {item.program ? ` · ${item.program}` : ""}
                {analyzing
                  ? " — leia o formulário completo antes de definir oferta e contrapartida"
                  : ` · Pendente → Proposta · ${emailAction}`}
              </p>
            </div>
            <button type="button" onClick={onClose} className="rounded-md p-1.5 hover:bg-surface">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
            <ApplicationFormSummary
              program={item.program}
              applicationFormData={item.applicationFormData}
              applicationReceivedAt={item.applicationReceivedAt}
              respostasSheetName={item.respostasSheetName}
              respostasSheetRow={item.respostasSheetRow}
              operational={buildParceriaOperationalHints(item)}
              variant="analysis"
            />

            <div className="border-t border-hairline pt-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {analyzing ? "Montar proposta" : "Proposta"}
              </p>
              <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground">
                    Defina modalidade e entregas. No envio você poderá editar e-mail e WhatsApp.
                  </p>

                  <label className="block">
                    <span className="mb-1 block text-xs font-medium text-muted-foreground">Modalidade</span>
                    <Select value={modality} onChange={(e) => setModality(e.target.value)}>
                      {MODALITIES.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </Select>
                  </label>

                  {isRemuneracao && (
                    <label className="block">
                      <span className="mb-1 block text-xs font-medium text-muted-foreground">
                        Valor mensal (R$)
                      </span>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        value={agreedValue}
                        onChange={(e) => setAgreedValue(e.target.value)}
                      />
                    </label>
                  )}

                  <p className="text-xs font-semibold text-muted-foreground">Metas mensais</p>
                  {(
                    [
                      ["Feed/Reels", metaFeed, setMetaFeed],
                      ["Stories", metaStories, setMetaStories],
                      ["TikTok", metaTiktok, setMetaTiktok],
                      ["YouTube", metaYoutube, setMetaYoutube],
                    ] as const
                  ).map(([label, val, setVal]) => (
                    <label key={label} className="block">
                      <span className="mb-1 block text-xs font-medium text-muted-foreground">{label}</span>
                      <Input type="number" min={0} value={val} onChange={(e) => setVal(e.target.value)} />
                    </label>
                  ))}

                  {!item.email && (
                    <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950">
                      Sem e-mail cadastrado. Você pode marcar como Proposta sem enviar.
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

                <div className="flex min-h-[280px] flex-col rounded-lg border border-hairline bg-canvas">
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
                        title="Preview proposta"
                        srcDoc={html}
                        className="h-[min(40vh,400px)] w-full rounded-lg border border-hairline bg-white"
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground">Nenhum preview disponível.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap justify-end gap-2 border-t border-hairline px-5 py-3">
            <Button variant="ghost" onClick={onClose} disabled={saving}>
              Cancelar
            </Button>
            <Button variant="secondary" onClick={() => onMarkPropostaOnly(emailVars())} disabled={saving}>
              Marcar Proposta sem e-mail
            </Button>
            <Button onClick={openSendModal} disabled={saving || !item.email || !html}>
              Enviar proposta
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
        onSend={(payload) => onSendProposal(emailVars(), payload)}
      />
    </>
  );
}
