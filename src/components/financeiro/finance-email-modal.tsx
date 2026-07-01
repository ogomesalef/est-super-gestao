"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, Input, Textarea } from "@/components/ui";
import { cn } from "@/lib/utils";
import { ExternalLink, Loader2, X } from "lucide-react";

function patchTermLinkInHtml(html: string, link: string): string {
  if (!link.trim()) return html;
  const safe = link.trim().replace(/"/g, "&quot;");
  let out = html;
  out = out.replace(
    /(<a[^>]*href=")[^"]*("[^>]*>\s*Acessar Termo de Parceria)/i,
    `$1${safe}$2`
  );
  out = out.replace(/href=""([^>]*>\s*Acessar Termo de Parceria)/i, `href="${safe}"$1`);
  return out;
}

function actionNeedsTermLink(action: string): boolean {
  return action.includes("fechamento") || action.toLowerCase().includes("termo");
}

export function FinanceEmailModal({
  open,
  action,
  subject,
  html,
  recipient,
  termLink,
  sending,
  onClose,
  onSend,
}: {
  open: boolean;
  action: string;
  subject: string;
  html: string;
  recipient: string;
  termLink?: string | null;
  sending: boolean;
  onClose: () => void;
  onSend: (payload: { subject: string; html: string }) => void;
}) {
  const [editSubject, setEditSubject] = useState(subject);
  const [editHtml, setEditHtml] = useState(html);
  const [editTermLink, setEditTermLink] = useState(termLink || "");
  const [tab, setTab] = useState<"preview" | "html">("preview");

  const showTermLink = actionNeedsTermLink(action);

  useEffect(() => {
    if (open) {
      setEditSubject(subject);
      setEditHtml(html);
      setEditTermLink(termLink || "");
      setTab("preview");
    }
  }, [open, subject, html, termLink]);

  const previewHtml = useMemo(() => {
    if (!showTermLink) return editHtml;
    return patchTermLinkInHtml(editHtml, editTermLink);
  }, [editHtml, editTermLink, showTermLink]);

  function handleTermLinkChange(link: string) {
    setEditTermLink(link);
    setEditHtml((prev) => patchTermLinkInHtml(prev, link));
  }

  function handleSend() {
    const finalHtml = showTermLink ? patchTermLinkInHtml(editHtml, editTermLink) : editHtml;
    onSend({ subject: editSubject, html: finalHtml });
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex bg-ink/50 p-2 backdrop-blur-sm sm:p-4"
      onClick={onClose}
    >
      <div
        className="mx-auto flex h-full w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-hairline bg-card shadow-elev"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shrink-0 border-b border-hairline px-4 py-3 sm:px-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Confirmar envio
              </p>
              <h2 className="font-serif text-lg text-ink">{action}</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">Para: {recipient || "—"}</p>
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

          <div className="mt-3 space-y-3">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted-foreground">Assunto</span>
              <Input value={editSubject} onChange={(e) => setEditSubject(e.target.value)} />
            </label>

            {showTermLink && (
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-muted-foreground">
                  Link do termo (PDF) — incluído no e-mail
                </span>
                <div className="flex gap-2">
                  <Input
                    value={editTermLink}
                    onChange={(e) => handleTermLinkChange(e.target.value)}
                    placeholder="https://drive.google.com/file/d/..."
                    className="font-mono text-xs"
                  />
                  {editTermLink && (
                    <a
                      href={editTermLink}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex shrink-0 items-center gap-1 rounded-md border border-hairline px-3 text-xs text-primary hover:bg-surface"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Abrir
                    </a>
                  )}
                </div>
                {!editTermLink.trim() && (
                  <p className="mt-1 text-xs text-amber-700">
                    Sem link do termo. Gere o termo no card antes de enviar o fechamento.
                  </p>
                )}
              </label>
            )}

            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => setTab("preview")}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                  tab === "preview"
                    ? "bg-primary text-primary-foreground"
                    : "bg-surface text-muted-foreground hover:text-ink"
                )}
              >
                Visual do e-mail
              </button>
              <button
                type="button"
                onClick={() => setTab("html")}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                  tab === "html"
                    ? "bg-primary text-primary-foreground"
                    : "bg-surface text-muted-foreground hover:text-ink"
                )}
              >
                Editar HTML
              </button>
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-hidden bg-canvas p-3 sm:p-4">
          {tab === "preview" ? (
            <iframe
              title="Preview do e-mail"
              srcDoc={previewHtml}
              className="h-full w-full rounded-lg border border-hairline bg-white shadow-hairline"
            />
          ) : (
            <Textarea
              value={editHtml}
              onChange={(e) => setEditHtml(e.target.value)}
              className="h-full min-h-0 resize-none font-mono text-xs leading-relaxed"
              spellCheck={false}
            />
          )}
        </div>

        <div className="flex shrink-0 justify-end gap-2 border-t border-hairline px-4 py-3 sm:px-5">
          <Button variant="secondary" onClick={onClose} disabled={sending}>
            Cancelar
          </Button>
          <Button
            onClick={handleSend}
            disabled={
              sending ||
              !editSubject.trim() ||
              !editHtml.trim() ||
              (showTermLink && !editTermLink.trim())
            }
          >
            {sending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Enviando…
              </>
            ) : (
              "Enviar e-mail"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
