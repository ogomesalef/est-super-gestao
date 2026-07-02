"use client";

import { useRef } from "react";
import { FileText, Pencil, RefreshCw, Upload } from "lucide-react";
import { FINANCE_ACTIONS, FINANCE_REQUEST_ACTION, FINANCE_RESEND_REQUEST_ACTION } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { NotionPill } from "@/components/views/notion-pill";
import type { FinanceiroRow } from "./types";

const EMAIL_ACTIONS = new Set([
  "Enviar fechamento do mês (com termo)",
  "Enviar lembrete do termo",
  "Cobrar Form Financeiro",
  FINANCE_REQUEST_ACTION,
  FINANCE_RESEND_REQUEST_ACTION,
  "Avisar embaixador: pagamento solicitado",
]);

function missingTermoFields(row: FinanceiroRow): string[] {
  const p = row.ambassador.partnership;
  const missing: string[] = [];
  if (!p?.legalCpf?.trim()) missing.push("CPF");
  if (!p?.legalAddress?.trim()) missing.push("endereço");
  if (!p?.bankDetails?.trim()) missing.push("banco");
  return missing;
}

export function FinanceiroCardActions({
  row,
  loading,
  onAction,
  onEmailAction,
  onGenerateTermo,
  onEditTermoData,
  onEditValue,
  onUploadSignedTermo,
  compact,
  highlightFinanceRequest,
  showPaymentStatus = !compact,
}: {
  row: FinanceiroRow;
  loading: string | null;
  onAction: (id: string, action: string) => void;
  onEmailAction: (id: string, action: string) => void;
  onGenerateTermo: (id: string, force?: boolean) => void;
  onEditTermoData: (row: FinanceiroRow) => void;
  onEditValue: (row: FinanceiroRow) => void;
  onUploadSignedTermo?: (id: string, file: File) => void;
  compact?: boolean;
  highlightFinanceRequest?: boolean;
  showPaymentStatus?: boolean;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const busy = loading === row.id || loading?.startsWith(row.id);
  const uploading = loading === `${row.id}:upload-termo`;
  const missing = missingTermoFields(row);
  const canUploadSigned =
    !row.termSigned &&
    (row.paymentStatus === "Aguardando termo assinado" || Boolean(row.termLink));
  const termLink = row.termSigned ? row.signedTermLink || row.termLink : row.termLink;
  const showFinanceCta =
    highlightFinanceRequest &&
    (row.paymentStatus === "Pronto para enviar ao Financeiro" ||
      row.paymentStatus === "Solicitado ao Financeiro" ||
      row.paymentStatus === "Pagamento confirmado ao embaixador");
  const financeCtaAction =
    row.paymentStatus === "Pronto para enviar ao Financeiro"
      ? FINANCE_REQUEST_ACTION
      : FINANCE_RESEND_REQUEST_ACTION;
  const financeCtaLabel =
    row.paymentStatus === "Pronto para enviar ao Financeiro"
      ? "Solicitar pagamento ao Financeiro"
      : "Reenviar e-mail ao financeiro";
  const showTermoTools = !row.termSigned;

  return (
    <div className={cn("space-y-2.5", compact && "mt-0")}>
      {(showPaymentStatus || row.valueLocked) && (
        <div className="flex flex-wrap items-center gap-1.5">
          {showPaymentStatus && <NotionPill kind="payment">{row.paymentStatus}</NotionPill>}
          {row.valueLocked && (
            <span className="rounded bg-surface px-1.5 py-0.5 text-[10px] text-muted-foreground">
              valor travado
            </span>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={() => onEditValue(row)}
        className="flex w-full items-center justify-between gap-2 rounded-md border border-hairline bg-canvas px-2.5 py-2 text-left text-xs shadow-hairline hover:bg-surface"
      >
        <span className="min-w-0 text-muted-foreground">
          <span className="tabular">{row.pctDelivered.toFixed(0)}% entregas</span>
          <span className="mx-1.5 text-hairline">·</span>
          Acordado{" "}
          <strong className="text-ink">R$ {row.agreedValue?.toFixed(2) ?? "—"}</strong>
          <span className="mx-1.5 text-hairline">·</span>
          A pagar{" "}
          <strong className="text-ink">R$ {row.amountDue?.toFixed(2) ?? "—"}</strong>
        </span>
        <Pencil className="h-3 w-3 shrink-0 text-muted-foreground" />
      </button>

      {row.termActivityAuto && (
        <p className="line-clamp-2 text-[11px] leading-snug text-muted-foreground">
          {row.termActivityAuto}
        </p>
      )}

      {(termLink || (!row.termSigned && row.termDocLink)) && (
        <div className="flex flex-wrap items-center gap-1.5">
          {termLink ? (
            <a
              href={termLink}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary hover:bg-primary/15"
            >
              <FileText className="h-3.5 w-3.5" />
              {row.termSigned ? "Termo assinado" : "Termo PDF"}
            </a>
          ) : (
            <span className="text-xs text-muted-foreground">Sem termo</span>
          )}
          {!row.termSigned && row.termDocLink && (
            <a
              href={row.termDocLink}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-muted-foreground hover:text-primary hover:underline"
            >
              Doc
            </a>
          )}
        </div>
      )}

      {canUploadSigned && onUploadSignedTermo && (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf,.pdf"
            className="hidden"
            data-no-drag
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onUploadSignedTermo(row.id, file);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            disabled={!!busy}
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-primary px-2 py-2 text-xs font-medium text-white hover:bg-primary/90 disabled:opacity-50"
          >
            <Upload className={cn("h-3.5 w-3.5", uploading && "animate-pulse")} />
            {uploading ? "Enviando…" : "Anexar termo assinado"}
          </button>
        </>
      )}

      {showFinanceCta && (
        <button
          type="button"
          disabled={!!busy}
          onClick={() => onEmailAction(row.id, financeCtaAction)}
          className="inline-flex w-full items-center justify-center rounded-md border border-amber-300 bg-amber-50 px-2 py-2 text-xs font-medium text-amber-900 hover:bg-amber-100 disabled:opacity-50"
        >
          {financeCtaLabel}
        </button>
      )}

      <div className="flex flex-wrap gap-1">
        <button
          type="button"
          disabled={!!busy}
          onClick={() => onEditTermoData(row)}
          className="rounded-md border border-hairline bg-canvas px-2 py-1 text-xs text-ink shadow-hairline hover:bg-surface disabled:opacity-50"
        >
          Dados termo
          {missing.length > 0 && (
            <span className="ml-1 text-amber-600">({missing.length})</span>
          )}
        </button>
        {showTermoTools && (
          <button
            type="button"
            disabled={!!busy}
            onClick={() => onGenerateTermo(row.id, Boolean(row.termLink))}
            className="inline-flex items-center gap-1 rounded-md border border-hairline bg-canvas px-2 py-1 text-xs text-ink shadow-hairline hover:bg-surface disabled:opacity-50"
          >
            <RefreshCw className={cn("h-3 w-3", busy && "animate-spin")} />
            {row.termLink ? "Atualizar termo" : "Gerar termo"}
          </button>
        )}
      </div>

      <select
        className="w-full rounded-md border border-hairline bg-canvas px-2 py-1.5 text-xs text-ink shadow-hairline"
        defaultValue=""
        disabled={!!busy}
        onChange={(e) => {
          const v = e.target.value;
          if (!v) return;
          if (EMAIL_ACTIONS.has(v)) onEmailAction(row.id, v);
          else onAction(row.id, v);
          e.target.value = "";
        }}
      >
        <option value="">Mais ações…</option>
        {FINANCE_ACTIONS.map((a) => (
          <option key={a} value={a}>
            {a}
          </option>
        ))}
      </select>
    </div>
  );
}
