"use client";

import { useEffect, useState } from "react";
import { Button, Input, Textarea } from "@/components/ui";
import { parseLogLines } from "@/lib/finance-log";
import { Loader2, X } from "lucide-react";
import type { FinanceiroRow } from "./types";

export function FinanceiroValueModal({
  open,
  row,
  saving,
  onClose,
  onSave,
}: {
  open: boolean;
  row: FinanceiroRow | null;
  saving: boolean;
  onClose: () => void;
  onSave: (data: {
    agreedValue: number | null;
    valueLocked: boolean;
    valueChangeNote: string;
    applyToFutureMonths: boolean;
    updatePartnershipDefault: boolean;
  }) => void;
}) {
  const [value, setValue] = useState("");
  const [locked, setLocked] = useState(false);
  const [note, setNote] = useState("");
  const [applyFuture, setApplyFuture] = useState(false);
  const [updatePartnership, setUpdatePartnership] = useState(false);

  useEffect(() => {
    if (!open || !row) return;
    setValue(row.agreedValue != null ? String(row.agreedValue) : "");
    setLocked(row.valueLocked);
    setNote("");
    setApplyFuture(false);
    setUpdatePartnership(false);
  }, [open, row]);

  if (!open || !row) return null;

  const history = parseLogLines(row.log).slice(-5).reverse();
  const partnershipDefault = row.ambassador.partnership?.agreedValue;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="max-h-[92vh] w-full max-w-lg overflow-auto rounded-xl border border-hairline bg-card p-5 shadow-elev"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-2">
          <div>
            <h2 className="font-serif text-lg text-ink">Valor do mês</h2>
            <p className="text-sm text-muted-foreground">
              {row.ambassador.fullName} · {row.monthRef}
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded-md p-1.5 hover:bg-surface">
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mb-4 text-xs text-muted-foreground">
          Ajuste o valor acordado <strong>deste mês</strong>. Use para reajustes no meio do caminho
          (ex.: R$ 700 até abril, R$ 1.000 a partir de maio). A alteração fica registrada no
          histórico.
        </p>

        {partnershipDefault != null && (
          <p className="mb-3 rounded-lg bg-surface/80 px-3 py-2 text-xs text-muted-foreground">
            Valor padrão na parceria: <strong className="text-ink">R$ {partnershipDefault.toFixed(2)}</strong>
          </p>
        )}

        <div className="space-y-3">
          <label className="block">
            <span className="mb-1 block text-xs text-muted-foreground">Valor acordado (R$)</span>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="1000.00"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs text-muted-foreground">Motivo / observação (histórico)</span>
            <Textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ex.: Reajuste combinado em maio/2026"
            />
          </label>

          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              className="mt-0.5"
              checked={locked}
              onChange={(e) => setLocked(e.target.checked)}
            />
            <span>
              Travar valor deste mês
              <span className="mt-0.5 block text-xs text-muted-foreground">
                Impede que atualizações em lote sobrescrevam este registro.
              </span>
            </span>
          </label>

          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              className="mt-0.5"
              checked={applyFuture}
              onChange={(e) => setApplyFuture(e.target.checked)}
            />
            <span>
              Aplicar também aos meses seguintes (não travados)
              <span className="mt-0.5 block text-xs text-muted-foreground">
                Atualiza {row.monthRef} em diante para o mesmo valor.
              </span>
            </span>
          </label>

          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              className="mt-0.5"
              checked={updatePartnership}
              onChange={(e) => setUpdatePartnership(e.target.checked)}
            />
            <span>
              Atualizar valor padrão na parceria
              <span className="mt-0.5 block text-xs text-muted-foreground">
                Novos meses sincronizados usarão este valor.
              </span>
            </span>
          </label>
        </div>

        {history.length > 0 && (
          <div className="mt-4 rounded-lg border border-hairline bg-surface/40 p-3">
            <p className="mb-2 text-xs font-medium text-muted-foreground">Histórico recente</p>
            <ul className="space-y-1 text-[11px] leading-snug text-muted-foreground">
              {history.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button
            onClick={() =>
              onSave({
                agreedValue: value.trim() ? Number(value) : null,
                valueLocked: locked,
                valueChangeNote: note,
                applyToFutureMonths: applyFuture,
                updatePartnershipDefault: updatePartnership,
              })
            }
            disabled={saving || !value.trim()}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}
          </Button>
        </div>
      </div>
    </div>
  );
}
