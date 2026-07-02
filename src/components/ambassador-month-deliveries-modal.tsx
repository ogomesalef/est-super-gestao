"use client";

import { useCallback, useEffect, useState } from "react";
import { Button, Input, Select } from "@/components/ui";
import { formatMonthRefLong } from "@/lib/utils";
import { ExternalLink, Loader2, Pencil, X } from "lucide-react";
import type { PostDelivery } from "@/components/entregas/posts/types";
import { formatPostDate } from "@/components/entregas/posts/types";

function toDateInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
}

type EditForm = {
  deliveryType: string;
  postedAt: string;
  postLink: string;
  printUrl: string;
  storiesPrintUrl: string;
  videoLink: string;
  campaignName: string;
  driveStatus: string;
  driveOrganizedIn: string;
  campaignDriveStatus: string;
  program: string;
  fullName: string;
  email: string;
};

function deliveryToForm(d: PostDelivery): EditForm {
  return {
    deliveryType: d.deliveryType || "",
    postedAt: toDateInput(d.postedAt),
    postLink: d.postLink || "",
    printUrl: d.printUrl || "",
    storiesPrintUrl: d.storiesPrintUrl || "",
    videoLink: d.videoLink || "",
    campaignName: d.campaignName || "",
    driveStatus: d.driveStatus || "",
    driveOrganizedIn: d.driveOrganizedIn || "",
    campaignDriveStatus: d.campaignDriveStatus || "",
    program: d.program || "",
    fullName: d.fullName || "",
    email: d.email || "",
  };
}

function DeliveryDetailView({ d }: { d: PostDelivery }) {
  const rows: Array<{ label: string; value: React.ReactNode }> = [
    { label: "Carimbo (envio)", value: formatDateTime(d.submittedAt) },
    { label: "Data da postagem", value: formatPostDate(d.postedAt) },
    { label: "Programa", value: d.program || "—" },
    { label: "Instagram", value: d.instagram || "—" },
    { label: "Nome", value: d.fullName || "—" },
    { label: "E-mail", value: d.email || "—" },
    { label: "Tipo de entrega", value: d.deliveryType || "—" },
    { label: "Campanha", value: d.campaignName || "—" },
    { label: "Drive status", value: d.driveStatus || "—" },
    { label: "Drive organizado em", value: d.driveOrganizedIn || "—" },
    { label: "Campanha Drive status", value: d.campaignDriveStatus || "—" },
  ];

  return (
    <dl className="grid gap-2 text-sm sm:grid-cols-2">
      {rows.map((r) => (
        <div key={r.label} className="min-w-0">
          <dt className="text-xs font-medium text-muted-foreground">{r.label}</dt>
          <dd className="text-ink">{r.value}</dd>
        </div>
      ))}
      <div className="sm:col-span-2">
        <dt className="text-xs font-medium text-muted-foreground">Link da postagem</dt>
        <dd>
          {d.postLink ? (
            <a href={d.postLink} target="_blank" rel="noreferrer" className="break-all text-primary hover:underline">
              {d.postLink}
            </a>
          ) : (
            "—"
          )}
        </dd>
      </div>
      {d.printUrl && (
        <div className="sm:col-span-2">
          <dt className="text-xs font-medium text-muted-foreground">Print da postagem</dt>
          <dd>
            <a href={d.printUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
              Abrir <ExternalLink className="h-3 w-3" />
            </a>
          </dd>
        </div>
      )}
      {d.storiesPrintUrl && (
        <div className="sm:col-span-2">
          <dt className="text-xs font-medium text-muted-foreground">Print (Stories)</dt>
          <dd>
            <a href={d.storiesPrintUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
              Abrir <ExternalLink className="h-3 w-3" />
            </a>
          </dd>
        </div>
      )}
      {d.videoLink && (
        <div className="sm:col-span-2">
          <dt className="text-xs font-medium text-muted-foreground">Link do vídeo</dt>
          <dd>
            <a href={d.videoLink} target="_blank" rel="noreferrer" className="break-all text-primary hover:underline">
              {d.videoLink}
            </a>
          </dd>
        </div>
      )}
    </dl>
  );
}

function DeliveryEditForm({
  form,
  onChange,
}: {
  form: EditForm;
  onChange: (next: EditForm) => void;
}) {
  const set = (key: keyof EditForm, value: string) => onChange({ ...form, [key]: value });

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">Data da postagem</label>
        <Input type="date" value={form.postedAt} onChange={(e) => set("postedAt", e.target.value)} />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">Tipo de entrega</label>
        <Select value={form.deliveryType} onChange={(e) => set("deliveryType", e.target.value)}>
          <option value="">—</option>
          <option value="Stories">Stories</option>
          <option value="Feed">Feed</option>
          <option value="Reels">Reels</option>
          <option value="TikTok">TikTok</option>
          <option value="YouTube">YouTube</option>
        </Select>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">Programa</label>
        <Select value={form.program} onChange={(e) => set("program", e.target.value)}>
          <option value="ECJ">ECJ</option>
          <option value="OAB">OAB</option>
        </Select>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">Nome</label>
        <Input value={form.fullName} onChange={(e) => set("fullName", e.target.value)} />
      </div>
      <div className="sm:col-span-2">
        <label className="mb-1 block text-xs font-medium text-muted-foreground">E-mail</label>
        <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
      </div>
      <div className="sm:col-span-2">
        <label className="mb-1 block text-xs font-medium text-muted-foreground">Link da postagem</label>
        <Input value={form.postLink} onChange={(e) => set("postLink", e.target.value)} />
      </div>
      <div className="sm:col-span-2">
        <label className="mb-1 block text-xs font-medium text-muted-foreground">Print da postagem</label>
        <Input value={form.printUrl} onChange={(e) => set("printUrl", e.target.value)} />
      </div>
      <div className="sm:col-span-2">
        <label className="mb-1 block text-xs font-medium text-muted-foreground">Print (Stories)</label>
        <Input value={form.storiesPrintUrl} onChange={(e) => set("storiesPrintUrl", e.target.value)} />
      </div>
      <div className="sm:col-span-2">
        <label className="mb-1 block text-xs font-medium text-muted-foreground">Link do vídeo</label>
        <Input value={form.videoLink} onChange={(e) => set("videoLink", e.target.value)} />
      </div>
      <div className="sm:col-span-2">
        <label className="mb-1 block text-xs font-medium text-muted-foreground">Campanha</label>
        <Input value={form.campaignName} onChange={(e) => set("campaignName", e.target.value)} />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">Drive status</label>
        <Input value={form.driveStatus} onChange={(e) => set("driveStatus", e.target.value)} />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">Drive organizado em</label>
        <Input value={form.driveOrganizedIn} onChange={(e) => set("driveOrganizedIn", e.target.value)} />
      </div>
      <div className="sm:col-span-2">
        <label className="mb-1 block text-xs font-medium text-muted-foreground">Campanha Drive status</label>
        <Input value={form.campaignDriveStatus} onChange={(e) => set("campaignDriveStatus", e.target.value)} />
      </div>
    </div>
  );
}

export function AmbassadorMonthDeliveriesModal({
  open,
  ambassadorId,
  monthRef,
  onClose,
  onUpdated,
}: {
  open: boolean;
  ambassadorId: string;
  monthRef: string | null;
  onClose: () => void;
  onUpdated?: () => void;
}) {
  const [deliveries, setDeliveries] = useState<PostDelivery[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!monthRef) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ ambassadorId, monthRef, limit: "200" });
      const res = await fetch(`/api/entregas/deliveries?${params}`, { cache: "no-store" });
      const raw = await res.text();
      const data = raw ? JSON.parse(raw) : { deliveries: [] };
      if (!res.ok) throw new Error(data.error || "Erro ao carregar entregas");
      setDeliveries(
        [...(data.deliveries || [])].sort((a: PostDelivery, b: PostDelivery) => {
          const da = a.postedAt ? new Date(a.postedAt).getTime() : 0;
          const db = b.postedAt ? new Date(b.postedAt).getTime() : 0;
          return db - da;
        })
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar entregas");
      setDeliveries([]);
    } finally {
      setLoading(false);
    }
  }, [ambassadorId, monthRef]);

  useEffect(() => {
    if (!open || !monthRef) return;
    setEditingId(null);
    setEditForm(null);
    load();
  }, [open, monthRef, load]);

  async function saveEdit(id: string) {
    if (!editForm) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/entregas/deliveries/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao salvar");
      setEditingId(null);
      setEditForm(null);
      await load();
      onUpdated?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  if (!open || !monthRef) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex max-h-[100dvh] sm:max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-hairline bg-card shadow-elev"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-hairline px-5 py-4">
          <div>
            <h2 className="font-serif text-lg text-ink capitalize">Entregas — {formatMonthRefLong(monthRef)}</h2>
            <p className="text-sm text-muted-foreground">
              {loading ? "Carregando…" : `${deliveries.length} entrega(s) neste mês`}
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:bg-muted">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-auto px-5 py-4">
          {error && <p className="mb-3 text-sm text-destructive">{error}</p>}

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : deliveries.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Nenhuma entrega neste mês.</p>
          ) : (
            <div className="space-y-4">
              {deliveries.map((d) => {
                const isEditing = editingId === d.id;
                return (
                  <div key={d.id} className="rounded-lg border border-hairline bg-background p-4">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="font-medium text-ink">
                          {d.deliveryType || "Entrega"} · {formatPostDate(d.postedAt)}
                        </p>
                        <p className="text-xs text-muted-foreground">Enviado em {formatDateTime(d.submittedAt)}</p>
                      </div>
                      {!isEditing ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            setEditingId(d.id);
                            setEditForm(deliveryToForm(d));
                          }}
                        >
                          <Pencil className="mr-1 h-3.5 w-3.5" />
                          Editar
                        </Button>
                      ) : (
                        <div className="flex gap-2">
                          <Button variant="secondary" size="sm" onClick={() => { setEditingId(null); setEditForm(null); }}>
                            Cancelar
                          </Button>
                          <Button size="sm" onClick={() => saveEdit(d.id)} disabled={saving}>
                            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}
                          </Button>
                        </div>
                      )}
                    </div>
                    {isEditing && editForm ? (
                      <DeliveryEditForm form={editForm} onChange={setEditForm} />
                    ) : (
                      <DeliveryDetailView d={d} />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
