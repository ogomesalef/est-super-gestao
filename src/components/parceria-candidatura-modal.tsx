"use client";

import { Button } from "@/components/ui";
import { ApplicationFormSummary } from "@/components/parcerias/application-form-summary";
import { buildParceriaOperationalHints } from "@/lib/parceria-form-preview";
import { X } from "lucide-react";
import type { ParceriaItem } from "@/components/parcerias/types";

export function ParceriaCandidaturaModal({
  open,
  item,
  onClose,
  onMontarProposta,
}: {
  open: boolean;
  item: ParceriaItem | null;
  onClose: () => void;
  onMontarProposta?: (item: ParceriaItem) => void;
}) {
  if (!open || !item) return null;

  return (
    <div
      className="fixed inset-0 z-[65] flex items-center justify-center bg-ink/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-hairline bg-card shadow-elev"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-hairline px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Respostas do formulário
            </p>
            <h2 className="font-serif text-lg text-ink">{item.fullName}</h2>
            <p className="text-sm text-muted-foreground">
              {item.instagram} · {item.program}
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded-md p-1.5 hover:bg-surface">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          <ApplicationFormSummary
            program={item.program}
            applicationFormData={item.applicationFormData}
            applicationReceivedAt={item.applicationReceivedAt}
            respostasSheetName={item.respostasSheetName}
            respostasSheetRow={item.respostasSheetRow}
            operational={buildParceriaOperationalHints(item)}
            variant="analysis"
          />
        </div>

        <div className="flex flex-wrap justify-end gap-2 border-t border-hairline px-5 py-3">
          <Button variant="ghost" onClick={onClose}>
            Fechar
          </Button>
          {item.status === "Pendente" && onMontarProposta && (
            <Button
              onClick={() => {
                onClose();
                onMontarProposta(item);
              }}
            >
              Montar proposta
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
