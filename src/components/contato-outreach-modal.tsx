"use client";

import { useEffect, useState } from "react";
import { Button, Input, Select, Textarea } from "@/components/ui";
import { CONTACT_STATUSES, CONTACT_WORKING_STATUS } from "@/lib/constants";
import { buildContactOutreachMessage } from "@/lib/contact-outreach-messages";
import { Copy, Loader2, X } from "lucide-react";

export type ContactDetail = {
  id: string;
  vertical: string | null;
  status: string;
  instagram: string | null;
  tiktok: string | null;
  linkIg: string | null;
  linkTiktok: string | null;
  origin: string | null;
  contactedBy: string | null;
  notes: string | null;
  prospectedAt: string | null;
  statusChangedAt: string | null;
  lastContactedAt: string | null;
  nextFollowUpAt: string | null;
  contactAttempts: number;
  ambassadorId: string | null;
};

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
}

export function ContatoDetailModal({
  contact,
  saving,
  onClose,
  onSave,
  onOutreach,
}: {
  contact: ContactDetail | null;
  saving: boolean;
  onClose: () => void;
  onSave: (data: Partial<ContactDetail>) => Promise<void>;
  onOutreach: (contact: ContactDetail, kind: "first" | "followup", pendingStatus?: string) => void;
}) {
  const [status, setStatus] = useState("");
  const [notes, setNotes] = useState("");
  const [contactedBy, setContactedBy] = useState("");
  const [nextFollowUpAt, setNextFollowUpAt] = useState("");

  useEffect(() => {
    if (!contact) return;
    setStatus(contact.status);
    setNotes(contact.notes || "");
    setContactedBy(contact.contactedBy || "");
    setNextFollowUpAt(
      contact.nextFollowUpAt ? new Date(contact.nextFollowUpAt).toISOString().slice(0, 10) : ""
    );
  }, [contact]);

  if (!contact) return null;

  const handle = contact.instagram || contact.tiktok || "";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="max-h-[100dvh] sm:max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-hairline bg-card p-6 shadow-elev"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-2">
          <div>
            <h2 className="font-serif text-lg text-ink">{handle}</h2>
            <p className="text-sm text-muted-foreground">{contact.vertical || "—"}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-md p-1.5 hover:bg-surface">
            <X className="h-5 w-5" />
          </button>
        </div>

        <dl className="mb-4 space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Prospecção</dt>
            <dd>{formatDate(contact.prospectedAt)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Último contato</dt>
            <dd>{formatDate(contact.lastContactedAt)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Tentativas</dt>
            <dd>{contact.contactAttempts}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Origem</dt>
            <dd>{contact.origin || "—"}</dd>
          </div>
        </dl>

        <div className="space-y-3">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted-foreground">Status</span>
            <Select value={status} onChange={(e) => setStatus(e.target.value)}>
              {CONTACT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted-foreground">Contatado por</span>
            <Input value={contactedBy} onChange={(e) => setContactedBy(e.target.value)} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted-foreground">Próximo follow-up</span>
            <Input type="date" value={nextFollowUpAt} onChange={(e) => setNextFollowUpAt(e.target.value)} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted-foreground">Notas</span>
            <Textarea rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </label>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={() => onOutreach(contact, "first", CONTACT_WORKING_STATUS)}>
            Mensagem 1º contato
          </Button>
          <Button variant="secondary" size="sm" onClick={() => onOutreach(contact, "followup", CONTACT_WORKING_STATUS)}>
            Refazer contato
          </Button>
          {contact.ambassadorId && (
            <a
              href={`/ambassadors/${contact.ambassadorId}`}
              className="inline-flex items-center rounded-lg border border-hairline px-3 py-1.5 text-xs font-medium hover:bg-surface"
            >
              Ver em Parcerias
            </a>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button
            disabled={saving}
            onClick={() =>
              onSave({
                status,
                notes: notes || null,
                contactedBy: contactedBy || null,
                nextFollowUpAt: nextFollowUpAt
                  ? new Date(nextFollowUpAt).toISOString()
                  : null,
              })
            }
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function ContatoOutreachModal({
  open,
  contact,
  kind,
  saving,
  onClose,
  onConfirm,
}: {
  open: boolean;
  contact: ContactDetail | null;
  kind: "first" | "followup";
  saving: boolean;
  onClose: () => void;
  onConfirm: (payload: { notes?: string; nextFollowUpAt?: string | null }) => void;
}) {
  const [message, setMessage] = useState("");
  const [notes, setNotes] = useState("");
  const [nextFollowUpAt, setNextFollowUpAt] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open || !contact) return;
    const handle = contact.instagram || contact.tiktok || "";
    setMessage(
      buildContactOutreachMessage({
        vertical: contact.vertical || "OAB",
        handle,
        kind,
      })
    );
    setNotes("");
    const inFive = new Date();
    inFive.setDate(inFive.getDate() + 5);
    setNextFollowUpAt(inFive.toISOString().slice(0, 10));
    setCopied(false);
  }, [open, contact, kind]);

  if (!open || !contact) return null;

  async function copyMessage() {
    await navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-ink/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-xl border border-hairline bg-card p-6 shadow-elev"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {kind === "followup" ? "Refazer contato" : "Primeiro contato"}
            </p>
            <h2 className="font-serif text-lg">{contact.instagram || contact.tiktok}</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-md p-1.5 hover:bg-surface">
            <X className="h-5 w-5" />
          </button>
        </div>

        <label className="block">
          <span className="mb-1 block text-xs font-medium text-muted-foreground">
            Mensagem WhatsApp / Instagram (copiar)
          </span>
          <Textarea rows={8} value={message} onChange={(e) => setMessage(e.target.value)} className="font-mono text-sm" />
        </label>
        <Button variant="secondary" size="sm" className="mt-2" onClick={copyMessage}>
          <Copy className="mr-1 h-3.5 w-3.5" />
          {copied ? "Copiado!" : "Copiar mensagem"}
        </Button>

        <label className="mt-4 block">
          <span className="mb-1 block text-xs font-medium text-muted-foreground">Nota rápida (opcional)</span>
          <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </label>
        <label className="mt-3 block">
          <span className="mb-1 block text-xs font-medium text-muted-foreground">Próximo follow-up</span>
          <Input type="date" value={nextFollowUpAt} onChange={(e) => setNextFollowUpAt(e.target.value)} />
        </label>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button
            disabled={saving}
            onClick={() =>
              onConfirm({
                notes: notes || undefined,
                nextFollowUpAt: nextFollowUpAt ? new Date(nextFollowUpAt).toISOString() : null,
              })
            }
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Registrar contato"}
          </Button>
        </div>
      </div>
    </div>
  );
}
