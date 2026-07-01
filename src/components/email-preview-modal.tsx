"use client";

import { Button } from "@/components/ui";
import { X } from "lucide-react";

export function EmailPreviewModal({
  open,
  onClose,
  subject,
  html,
}: {
  open: boolean;
  onClose: () => void;
  subject: string;
  html: string;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-hairline bg-card shadow-elev"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-hairline px-5 py-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Preview do e-mail
            </p>
            <h2 className="font-serif text-lg text-ink">{subject || "Sem assunto"}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-surface hover:text-ink"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-auto bg-canvas p-4">
          {html ? (
            <iframe
              title="Preview do e-mail"
              srcDoc={html}
              className="h-[min(70vh,720px)] w-full rounded-lg border border-hairline bg-white shadow-hairline"
            />
          ) : (
            <p className="text-sm text-muted-foreground">Nenhum conteúdo para exibir.</p>
          )}
        </div>

        <div className="flex justify-end border-t border-hairline px-5 py-3">
          <Button variant="secondary" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </div>
    </div>
  );
}
