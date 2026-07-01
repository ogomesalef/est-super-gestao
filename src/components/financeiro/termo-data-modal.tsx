"use client";

import { useEffect, useState } from "react";
import { Button, Input, Textarea } from "@/components/ui";
import { Loader2, X } from "lucide-react";
import type { FinanceiroRow } from "./types";

export function TermoDataModal({
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
    legalCpf: string;
    legalAddress: string;
    bankDetails: string;
  }) => void;
}) {
  const [cpf, setCpf] = useState("");
  const [address, setAddress] = useState("");
  const [bank, setBank] = useState("");

  useEffect(() => {
    if (!open || !row) return;
    const p = row.ambassador.partnership;
    setCpf(p?.legalCpf || "");
    setAddress(p?.legalAddress || "");
    setBank(p?.bankDetails || "");
  }, [open, row]);

  if (!open || !row) return null;

  const activity = row.termActivityAuto || "—";

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
            <h2 className="font-serif text-lg text-ink">Dados do termo</h2>
            <p className="text-sm text-muted-foreground">{row.ambassador.fullName}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-md p-1.5 hover:bg-surface">
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mb-4 text-xs text-muted-foreground">
          CPF, endereço e banco ficam salvos na parceria e valem para todos os meses. A atividade
          do mês é calculada automaticamente pelas entregas registradas em Entregas.
        </p>

        <div className="space-y-3">
          <label className="block">
            <span className="mb-1 block text-xs text-muted-foreground">CPF</span>
            <Input value={cpf} onChange={(e) => setCpf(e.target.value)} placeholder="000.000.000-00" />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-muted-foreground">Endereço completo</span>
            <Textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={2}
              placeholder="Rua, número, bairro, cidade, estado, CEP"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-muted-foreground">Dados bancários</span>
            <Textarea
              value={bank}
              onChange={(e) => setBank(e.target.value)}
              rows={3}
              placeholder={"Banco do Brasil: 001\nAgência: 322-0\nConta: 83061-5"}
            />
          </label>
          <div className="rounded-lg border border-hairline bg-surface/50 p-3">
            <p className="mb-1 text-xs font-medium text-muted-foreground">
              Atividade do mês (automática)
            </p>
            <p className="text-sm text-ink">{activity}</p>
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button
            onClick={() =>
              onSave({
                legalCpf: cpf.trim(),
                legalAddress: address.trim(),
                bankDetails: bank.trim(),
              })
            }
            disabled={saving}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}
          </Button>
        </div>
      </div>
    </div>
  );
}
