"use client";

import { FileText, Pencil, RefreshCw } from "lucide-react";
import { FINANCE_ACTIONS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { NotionPill } from "@/components/views/notion-pill";
import type { FinanceiroRow } from "./types";

const EMAIL_ACTIONS = new Set([
  "Enviar fechamento do mês (com termo)",
  "Enviar lembrete do termo",
  "Cobrar Form Financeiro",
  "Enviar solicitação ao Financeiro",
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
  compact,
}: {
  row: FinanceiroRow;
  loading: string | null;
  onAction: (id: string, action: string) => void;
  onEmailAction: (id: string, action: string) => void;
  onGenerateTermo: (id: string, force?: boolean) => void;
  onEditTermoData: (row: FinanceiroRow) => void;
  onEditValue: (row: FinanceiroRow) => void;
  compact?: boolean;
}) {
  const busy = loading === row.id || loading?.startsWith(row.id);
  const missing = missingTermoFields(row);

  return (
    <div className={cn("space-y-2", compact && "mt-2")}>
      <div className="flex flex-wrap items-center gap-1.5">
        <NotionPill kind="payment">{row.paymentStatus}</NotionPill>
        {row.valueLocked && (
          <span className="rounded bg-surface px-1.5 py-0.5 text-[10px] text-muted-foreground">
            valor travado
          </span>
        )}
      </div>

      <button
        type="button"
        onClick={() => onEditValue(row)}
        className="flex w-full items-center justify-between rounded-md border border-hairline bg-canvas px-2 py-1.5 text-left text-xs shadow-hairline hover:bg-surface"
      >
        <span className="text-muted-foreground">
          Acordado{" "}
          <strong className="text-ink">R$ {row.agreedValue?.toFixed(2) ?? "—"}</strong>
          <span className="mx-1">·</span>
          A pagar{" "}
          <strong className="text-ink">R$ {row.amountDue?.toFixed(2) ?? "—"}</strong>
        </span>
        <Pencil className="h-3 w-3 shrink-0 text-muted-foreground" />
      </button>

      <div className="flex flex-wrap items-center gap-1.5">
        {row.termLink ? (
          <a
            href={row.termLink}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary hover:bg-primary/15"
          >
            <FileText className="h-3.5 w-3.5" />
            Termo PDF
          </a>
        ) : (
          <span className="text-xs text-muted-foreground">Sem termo</span>
        )}
        {row.termDocLink && (
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
      {row.termActivityAuto && (
        <p className="line-clamp-2 text-[11px] leading-snug text-muted-foreground">
          {row.termActivityAuto}
        </p>
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
        <button
          type="button"
          disabled={!!busy}
          onClick={() => onGenerateTermo(row.id, Boolean(row.termLink))}
          className="inline-flex items-center gap-1 rounded-md border border-hairline bg-canvas px-2 py-1 text-xs text-ink shadow-hairline hover:bg-surface disabled:opacity-50"
        >
          <RefreshCw className={cn("h-3 w-3", busy && "animate-spin")} />
          {row.termLink ? "Atualizar" : "Gerar termo"}
        </button>
      </div>

      <select
        className="w-full rounded-md border border-hairline bg-canvas px-2 py-1 text-xs text-ink shadow-hairline"
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
        <option value="">Ação…</option>
        {FINANCE_ACTIONS.map((a) => (
          <option key={a} value={a}>
            {a}
          </option>
        ))}
      </select>
    </div>
  );
}
