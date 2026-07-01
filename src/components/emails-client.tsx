"use client";

import { useEffect, useState } from "react";
import { Button, Input, Select } from "@/components/ui";
import { EmailPreviewModal } from "@/components/email-preview-modal";
import { EmailTestCard } from "@/components/email-test-card";
import { ParceriaCancelamentoModal } from "@/components/parceria-cancelamento-modal";
import { VerticalBadge } from "@/components/vertical-badge";
import { useVertical } from "@/components/vertical-context";
import { CANCELAMENTO_EMAIL_ACTION, EMAIL_ACTIONS } from "@/lib/constants";
import { cn, currentMonthRef, formatMonthRefLong } from "@/lib/utils";

type Ambassador = {
  id: string;
  fullName: string;
  program: string;
  email: string | null;
  partnership?: {
    modality?: string | null;
    courseName?: string | null;
    couponCode?: string | null;
    agreedValue?: number | null;
  } | null;
};

export function EmailsClient() {
  const { vertical } = useVertical();
  const [ambassadors, setAmbassadors] = useState<Ambassador[]>([]);
  const [ambassadorId, setAmbassadorId] = useState("");
  const [action, setAction] = useState<string>(EMAIL_ACTIONS[0]);
  const [subject, setSubject] = useState("");
  const [html, setHtml] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [courseName, setCourseName] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [releaseDate, setReleaseDate] = useState("");
  const [cancellationMonthRef, setCancellationMonthRef] = useState(currentMonthRef());
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelSaving, setCancelSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [gmailStatus, setGmailStatus] = useState<{
    provider: string;
    gmail: { oauthConfigured: boolean; refreshTokenSet: boolean; sender: string };
  } | null>(null);

  useEffect(() => {
    fetch("/api/gmail/status")
      .then((r) => r.json())
      .then(setGmailStatus)
      .catch(() => null);
  }, []);

  useEffect(() => {
    fetch(`/api/parcerias?status=Ativo&program=${vertical}`)
      .then((r) => r.json())
      .then((list: Ambassador[]) => {
        setAmbassadors(list);
        setAmbassadorId((cur) => {
          if (cur && list.some((a) => a.id === cur)) return cur;
          return "";
        });
      });
  }, [vertical]);

  const filteredActions = EMAIL_ACTIONS.filter((a) => {
    if (a === CANCELAMENTO_EMAIL_ACTION) return true;
    const amb = ambassadors.find((x) => x.id === ambassadorId);
    const mod = amb?.partnership?.modality || "Assinatura + Cupom";
    if (mod === "Remuneração") return a.includes("Remuneração") || a === "Enviar reprovação";
    return a.includes("Assinatura + Cupom") || a === "Enviar reprovação";
  });

  const isCancelAction = action === CANCELAMENTO_EMAIL_ACTION;

  function emailVars(amb?: Ambassador) {
    return {
      courseName,
      couponCode,
      releaseDate,
      productValue: amb?.partnership?.agreedValue ?? undefined,
      cancellationMonthRef: isCancelAction ? cancellationMonthRef : undefined,
    };
  }

  useEffect(() => {
    const amb = ambassadors.find((a) => a.id === ambassadorId);
    if (amb?.partnership?.courseName) setCourseName(amb.partnership.courseName);
    if (amb?.partnership?.couponCode) setCouponCode(amb.partnership.couponCode);
  }, [ambassadorId, ambassadors]);

  useEffect(() => {
    if (filteredActions.length && !filteredActions.includes(action as (typeof EMAIL_ACTIONS)[number])) {
      setAction(filteredActions[0]);
    }
  }, [ambassadorId, ambassadors, action, filteredActions]);

  async function preview() {
    if (!ambassadorId) return;
    const amb = ambassadors.find((a) => a.id === ambassadorId);
    const res = await fetch("/api/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        previewOnly: true,
        ambassadorId,
        action,
        vars: emailVars(amb),
      }),
    });
    const data = await res.json();
    setSubject(data.subject);
    setHtml(data.html);
    setPreviewOpen(true);
  }

  async function send() {
    if (!ambassadorId) return;
    if (isCancelAction) {
      setCancelModalOpen(true);
      return;
    }
    await doSend();
  }

  async function doSend(finalize?: { newStatus: string; cancellationMonthRef: string }) {
    const amb = ambassadors.find((a) => a.id === ambassadorId);
    const vars = {
      ...emailVars(amb),
      ...(finalize ? { cancellationMonthRef: finalize.cancellationMonthRef } : {}),
    };
    const res = await fetch("/api/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ambassadorId,
        action,
        vars,
        finalize,
      }),
    });
    const data = await res.json();
    setSubject(data.subject);
    setHtml(data.html);

    if (data.send?.ok && data.partnershipUpdate) {
      const end = new Date(data.partnershipUpdate.endDate).toLocaleDateString("pt-BR", {
        timeZone: "America/Sao_Paulo",
      });
      setSuccessMessage(
        `E-mail enviado. Status atualizado para "${data.partnershipUpdate.status}" com encerramento em ${end} (${formatMonthRefLong(data.partnershipUpdate.cancellationMonthRef)}).`
      );
      setCancelModalOpen(false);
      setAmbassadorId("");
      fetch(`/api/parcerias?status=Ativo&program=${vertical}`)
        .then((r) => r.json())
        .then(setAmbassadors);
    } else {
      alert(
        data.send?.ok
          ? "E-mail enviado com sucesso!"
          : `Não foi possível enviar.\n\n${data.send?.error || data.error || "Erro desconhecido"}`
      );
    }
  }

  async function confirmCancelSend(data: { newStatus: string; cancellationMonthRef: string }) {
    setCancelSaving(true);
    await doSend(data);
    setCancelSaving(false);
  }

  return (
    <>
      {successMessage && (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          <p>{successMessage}</p>
          <button
            type="button"
            className="mt-2 text-xs font-medium underline"
            onClick={() => setSuccessMessage(null)}
          >
            Fechar
          </button>
        </div>
      )}

      {gmailStatus && (
        <div
          className={cn(
            "mb-4 rounded-xl border px-4 py-3 text-sm",
            gmailStatus.gmail.refreshTokenSet
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border-amber-200 bg-amber-50 text-amber-950"
          )}
        >
          {gmailStatus.gmail.refreshTokenSet ? (
            <p>
              <strong>Gmail conectado</strong> — envio via {gmailStatus.gmail.sender} com aliases OAB/ECJ.
            </p>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p>
                <strong>Gmail não conectado.</strong> Conecte a conta{" "}
                <code className="text-xs">cx@estrategiavestibulares.com.br</code> para enviar e-mails
                (sem Apps Script).
              </p>
              <a
                href="/api/gmail/connect"
                className="inline-flex h-8 items-center rounded-md border border-hairline bg-card px-3 text-xs font-medium text-ink shadow-hairline hover:bg-surface"
              >
                Conectar Gmail (cx@)
              </a>
            </div>
          )}
        </div>
      )}

      <EmailTestCard />

      <div
        className={cn(
          "mx-auto max-w-lg space-y-3 rounded-xl border-2 bg-card p-4 shadow-soft",
          vertical === "OAB" ? "border-oab/25" : "border-ecj/30"
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-serif text-lg text-ink">Gerar e-mail</h2>
          <VerticalBadge vertical={vertical} />
        </div>

        <Select value={ambassadorId} onChange={(e) => setAmbassadorId(e.target.value)}>
          <option value="">Selecione embaixador {vertical}...</option>
          {ambassadors.map((a) => (
            <option key={a.id} value={a.id}>
              {a.fullName} — {a.partnership?.modality || "?"}
            </option>
          ))}
        </Select>

        <Select
          value={filteredActions.includes(action as (typeof EMAIL_ACTIONS)[number]) ? action : filteredActions[0]}
          onChange={(e) => setAction(e.target.value)}
        >
          {filteredActions.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </Select>

        {!isCancelAction && (
          <Input placeholder="Nome do curso" value={courseName} onChange={(e) => setCourseName(e.target.value)} />
        )}
        <Input placeholder="Cupom" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} />
        {isCancelAction && (
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Mês de encerramento (aparece no e-mail e nos relatórios)
            </label>
            <Input
              type="month"
              value={cancellationMonthRef}
              onChange={(e) => setCancellationMonthRef(e.target.value)}
            />
          </div>
        )}
        {!isCancelAction && (
          <Input
            type="date"
            placeholder="Data liberação"
            value={releaseDate}
            onChange={(e) => setReleaseDate(e.target.value)}
          />
        )}

        <div className="flex gap-2">
          <Button variant="secondary" onClick={preview} disabled={!ambassadorId}>
            Preview
          </Button>
          <Button onClick={send} disabled={!ambassadorId}>
            Enviar
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          Templates HTML do Apps Script. Lista filtrada pela vertical selecionada acima.
        </p>
      </div>

      <EmailPreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        subject={subject}
        html={html}
      />

      <ParceriaCancelamentoModal
        open={cancelModalOpen}
        ambassadorName={ambassadors.find((a) => a.id === ambassadorId)?.fullName || ""}
        initialMonthRef={cancellationMonthRef}
        saving={cancelSaving}
        onClose={() => setCancelModalOpen(false)}
        onConfirm={confirmCancelSend}
      />
    </>
  );
}
