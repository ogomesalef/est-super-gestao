"use client";

import { useEffect, useState } from "react";
import { Button, Input, Select } from "@/components/ui";
import { PARTNERSHIP_STATUSES } from "@/lib/constants";
import { currentMonthRef, endDateFromMonthRef, formatMonthRefLong } from "@/lib/utils";
import { Loader2, X } from "lucide-react";

export function ParceriaCancelamentoModal({
  open,
  ambassadorName,
  initialMonthRef,
  saving,
  onClose,
  onConfirm,
}: {
  open: boolean;
  ambassadorName: string;
  initialMonthRef?: string;
  saving: boolean;
  onClose: () => void;
  onConfirm: (data: { newStatus: string; cancellationMonthRef: string }) => void;
}) {
  const [newStatus, setNewStatus] = useState("Inativo");
  const [cancellationMonthRef, setCancellationMonthRef] = useState(currentMonthRef());

  useEffect(() => {
    if (!open) return;
    setNewStatus("Inativo");
    setCancellationMonthRef(initialMonthRef || currentMonthRef());
  }, [open, initialMonthRef]);

  if (!open) return null;

  const endDate = endDateFromMonthRef(cancellationMonthRef);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl border border-hairline bg-card p-5 shadow-elev"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-2">
          <div>
            <h2 className="font-serif text-lg text-ink">Confirmar encerramento</h2>
            <p className="text-sm text-muted-foreground">{ambassadorName}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-md p-1.5 hover:bg-surface">
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mb-4 text-sm text-body">
          O e-mail será enviado e a parceria Super Embaixador será encerrada. Confirme o novo status
          e o mês em que o encerramento passa a valer nos relatórios.
        </p>

        <div className="space-y-3">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted-foreground">Novo status</span>
            <Select value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
              {PARTNERSHIP_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted-foreground">
              Encerramento a partir de
            </span>
            <Input
              type="month"
              value={cancellationMonthRef}
              onChange={(e) => setCancellationMonthRef(e.target.value)}
            />
            <span className="mt-1 block text-xs text-muted-foreground">
              A partir de <strong className="capitalize">{formatMonthRefLong(cancellationMonthRef)}</strong>{" "}
              a pessoa não aparece em entregas, financeiro nem painel chefe.
            </span>
          </label>
        </div>

        <div className="mt-4 rounded-lg border border-hairline bg-surface/60 p-3 text-sm">
          <p className="font-medium text-ink">Resumo</p>
          <ul className="mt-2 space-y-1 text-body">
            <li>
              Status: <strong>{newStatus}</strong>
            </li>
            <li>
              Data de encerramento:{" "}
              <strong>
                {endDate.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}
              </strong>
            </li>
            <li>
              Mês no e-mail:{" "}
              <strong className="capitalize">{formatMonthRefLong(cancellationMonthRef)}</strong>
            </li>
          </ul>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Voltar
          </Button>
          <Button
            variant="danger"
            disabled={saving || !cancellationMonthRef}
            onClick={() => onConfirm({ newStatus, cancellationMonthRef })}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enviar e encerrar"}
          </Button>
        </div>
      </div>
    </div>
  );
}
