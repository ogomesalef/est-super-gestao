"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Copy, ExternalLink, FolderOpen, Link2, Loader2, Mail, Save, Star, Trash2, Upload, Video, Wand2 } from "lucide-react";
import { Button } from "@/components/ui";
import { VerticalBadge } from "@/components/vertical-badge";
import { CollabPedidoEmailModal, type CollabPedidoEmailDefaults } from "@/components/campanhas/collab-pedido-email-modal";
import type { CampaignCollabRow } from "@/lib/campaign-collab";
import type { CampaignDetailPayload } from "@/lib/campaign-detail";
import { cn } from "@/lib/utils";

type AmbassadorOption = {
  id: string;
  fullName: string;
  instagram: string;
  program: string;
};

export function CampaignCollabEditor({
  campaignId,
  campaignName,
  campaignProgram,
  collab,
  onSaved,
}: {
  campaignId: string;
  campaignName: string;
  campaignProgram: string | null;
  collab: CampaignCollabRow | null;
  onSaved: (detail: CampaignDetailPayload) => void;
}) {
  const [title, setTitle] = useState(collab?.title ?? "");
  const [videoUrl, setVideoUrl] = useState(collab?.videoUrl ?? "");
  const [driveFolderName, setDriveFolderName] = useState(collab?.driveFolderName ?? campaignName);
  const [notes, setNotes] = useState(collab?.notes ?? "");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set(collab?.assignments.map((a) => a.ambassadorId) ?? [])
  );
  const [ambassadors, setAmbassadors] = useState<AmbassadorOption[]>([]);
  const [loadingAmbassadors, setLoadingAmbassadors] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [driveBusy, setDriveBusy] = useState(false);
  const [organizeReport, setOrganizeReport] = useState<string | null>(null);
  const [briefingBusy, setBriefingBusy] = useState(false);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [emailModal, setEmailModal] = useState<CollabPedidoEmailDefaults | null>(null);

  useEffect(() => {
    if (!collab) return;
    setTitle(collab.title ?? "");
    setVideoUrl(collab.videoUrl ?? "");
    setDriveFolderName(collab.driveFolderName ?? campaignName);
    setNotes(collab.notes ?? "");
    setSelectedIds(new Set(collab.assignments.map((a) => a.ambassadorId)));
  }, [campaignId, collab?.id, campaignName]);

  const loadAmbassadors = useCallback(async () => {
    setLoadingAmbassadors(true);
    try {
      const qs = campaignProgram ? `?program=${encodeURIComponent(campaignProgram)}` : "";
      const res = await fetch(`/api/parcerias${qs}`);
      const rows = (await res.json()) as AmbassadorOption[];
      setAmbassadors(
        rows.map((a) => ({
          id: a.id,
          fullName: a.fullName,
          instagram: a.instagram,
          program: a.program,
        }))
      );
    } catch {
      setAmbassadors([]);
    } finally {
      setLoadingAmbassadors(false);
    }
  }, [campaignProgram]);

  useEffect(() => {
    loadAmbassadors();
  }, [loadAmbassadors]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return ambassadors;
    return ambassadors.filter(
      (a) =>
        a.fullName.toLowerCase().includes(q) ||
        a.instagram.toLowerCase().includes(q)
    );
  }, [ambassadors, search]);

  function toggle(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/campanhas/${campaignId}/collab`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim() || null,
          videoUrl: videoUrl.trim(),
          driveFolderName: driveFolderName.trim() || campaignName,
          notes: notes.trim() || null,
          ambassadorIds: [...selectedIds],
        }),
      });
      const text = await res.text();
      if (!res.ok || !text.trim()) {
        setError("Não foi possível salvar");
        return;
      }
      const payload = JSON.parse(text) as {
        detail: CampaignDetailPayload;
        drive?: {
          ok: boolean;
          error?: string;
          moved?: Array<{ file: string; ambassador: string }>;
          unmatched?: string[];
          referencePlaced?: string;
        };
      };
      onSaved(payload.detail);
      if (payload.detail.collab) {
        setSelectedIds(new Set(payload.detail.collab.assignments.map((a) => a.ambassadorId)));
      }
      if (payload.drive) {
        if (!payload.drive.ok) {
          setError(payload.drive.error || "Erro ao organizar Drive");
        } else {
          const parts: string[] = [];
          if (payload.drive.moved?.length) parts.push(`${payload.drive.moved.length} vídeo(s) organizado(s)`);
          if (payload.drive.referencePlaced) parts.push(`referência → ${payload.drive.referencePlaced}`);
          if (payload.drive.unmatched?.length) parts.push(`${payload.drive.unmatched.length} sem match`);
          setOrganizeReport(parts.length ? parts.join(" · ") : "Pastas criadas no Drive");
        }
      }
    } catch {
      setError("Erro ao salvar collab");
    } finally {
      setSaving(false);
    }
  }

  async function removeCollab() {
    if (!confirm("Remover o vídeo de collab e a lista de embaixadores selecionados?")) return;
    setVideoUrl("");
    setTitle("");
    setNotes("");
    setSelectedIds(new Set());
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/campanhas/${campaignId}/collab`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoUrl: "", ambassadorIds: [] }),
      });
      const text = await res.text();
      if (res.ok && text.trim()) {
        const payload = JSON.parse(text) as { detail: CampaignDetailPayload };
        onSaved(payload.detail);
      }
    } finally {
      setSaving(false);
    }
  }

  async function runDrive(action: "structure" | "organize") {
    setDriveBusy(true);
    setError(null);
    setOrganizeReport(null);
    try {
      const res = await fetch(`/api/campanhas/${campaignId}/collab/drive`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: action === "organize" ? "organize" : "structure" }),
      });
      const text = await res.text();
      if (!res.ok || !text.trim()) {
        setError("Erro ao acessar Drive");
        return;
      }
      const payload = JSON.parse(text) as {
        ok: boolean;
        error?: string;
        detail?: CampaignDetailPayload;
        moved?: Array<{ file: string; ambassador: string; newName: string }>;
        unmatched?: string[];
        skipped?: string[];
      };
      if (!payload.ok) {
        setError(payload.error || "Erro no Drive");
        return;
      }
      if (payload.detail) onSaved(payload.detail);
      if (action === "organize") {
        const parts: string[] = [];
        if (payload.moved?.length) parts.push(`${payload.moved.length} vídeo(s) organizado(s)`);
        if (payload.unmatched?.length) parts.push(`${payload.unmatched.length} sem match (ficaram na inbox)`);
        if (payload.skipped?.length) parts.push(`${payload.skipped.length} ignorado(s)`);
        setOrganizeReport(parts.length ? parts.join(" · ") : "Inbox vazia — nada para organizar");
      }
    } catch {
      setError("Erro ao acessar Drive");
    } finally {
      setDriveBusy(false);
    }
  }

  async function loadFromDetail() {
    const res = await fetch(`/api/campanhas/${campaignId}`, { cache: "no-store" });
    const text = await res.text();
    if (res.ok && text.trim()) {
      onSaved(JSON.parse(text) as CampaignDetailPayload);
    }
  }

  async function seedBriefings() {
    setBriefingBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/campanhas/${campaignId}/collab/briefing`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "seedBriefings" }),
      });
      const payload = await res.json();
      if (!res.ok) {
        setError(payload.error || "Erro ao gerar páginas");
        return;
      }
      await loadFromDetail();
      setOrganizeReport(`Páginas geradas para ${payload.seeded ?? 0} embaixador(es)`);
    } catch {
      setError("Erro ao gerar páginas");
    } finally {
      setBriefingBusy(false);
    }
  }

  async function sharePedido2(requestId: string, revoke = false) {
    setBriefingBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/campanhas/${campaignId}/collab/briefing`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: revoke ? "revokePedido2" : "sharePedido2",
          requestId,
        }),
      });
      const payload = await res.json();
      if (!res.ok) {
        setError(payload.error || "Erro no Drive");
        return;
      }
      await loadFromDetail();
      setOrganizeReport(
        revoke
          ? "Acesso de editor revogado"
          : `Pasta Pedido 2 compartilhada com ${payload.email || "embaixador"}`
      );
    } catch {
      setError("Erro no Drive");
    } finally {
      setBriefingBusy(false);
    }
  }

  async function toggleUpload(assignmentId: string, enable: boolean) {
    setBriefingBusy(true);
    try {
      const res = await fetch(`/api/campanhas/${campaignId}/collab/briefing`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggleUpload", assignmentId, enable }),
      });
      if (res.ok) await loadFromDetail();
    } finally {
      setBriefingBusy(false);
    }
  }

  function formatDueDateBr(iso: string | null): string {
    if (!iso) return "";
    return new Date(iso).toLocaleDateString("pt-BR", {
      day: "numeric",
      month: "long",
      timeZone: "America/Sao_Paulo",
    });
  }

  function fullBriefingUrl(a: { publicSlug: string | null; publicUrl: string | null }): string {
    const path = a.publicUrl || (a.publicSlug ? `/p/${a.publicSlug}` : "");
    if (!path) return "";
    if (path.startsWith("http")) return path;
    const origin =
      typeof window !== "undefined" ? window.location.origin : "https://est-super-gestao.vercel.app";
    return `${origin}${path.startsWith("/") ? path : `/${path}`}`;
  }

  function openCollabEmail(a: CampaignCollabRow["assignments"][number]) {
    const url = fullBriefingUrl(a);
    if (!url) {
      setError("Gere a página do embaixador antes de enviar o e-mail.");
      return;
    }
    setEmailModal({
      ambassadorId: a.ambassadorId,
      ambassadorName: a.fullName,
      ambassadorEmail: a.email,
      program: a.program,
      campaignName,
      briefingUrl: url,
      dueDateDisplay: formatDueDateBr(a.pedido1VideoDueDate) || "5 de junho",
      videoConcept:
        campaignName.toLowerCase().includes("desesperados")
          ? "1 Reels na cozinha, estilo receita de bolo — metáfora de que estudar para a OAB exige teoria, prática e cabeça no lugar. Roteiro, referência e upload na página do briefing."
          : "1 Reels — roteiro completo, referência de estilo e pasta de upload na página do briefing.",
    });
  }

  async function copyLink(slug: string, url: string) {
    const full = url.startsWith("http") ? url : `${window.location.origin}${url}`;
    await navigator.clipboard.writeText(full);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2000);
  }

  return (
    <div className="overflow-hidden rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50/60 shadow-soft">
      <div className="border-b border-amber-200/80 px-4 py-3 sm:px-5">
        <div className="flex flex-wrap items-center gap-2">
          <Video className="h-5 w-5 text-amber-800" />
          <h2 className="font-serif text-lg text-amber-950">Vídeo de collab</h2>
          <span className="rounded-full bg-amber-200/80 px-2 py-0.5 text-[11px] font-medium text-amber-900">
            embaixadores selecionados
          </span>
        </div>
        <p className="mt-1 text-xs text-amber-900/75">
          Defina o vídeo de referência e quem foi convidado para esta collab. Aparece em destaque na
          página pública, antes das entregas.
        </p>
      </div>

      <div className="space-y-4 p-4 sm:p-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="font-medium text-ink">Título (opcional)</span>
            <input
              className="mt-1 w-full rounded-lg border border-hairline bg-white px-3 py-2 text-sm"
              placeholder="Ex.: Vídeo base — Semana Nacional"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="font-medium text-ink">Pasta no Drive</span>
            <input
              className="mt-1 w-full rounded-lg border border-hairline bg-white px-3 py-2 text-sm"
              placeholder="Ex.: SNCJ 2026"
              value={driveFolderName}
              onChange={(e) => setDriveFolderName(e.target.value)}
            />
            <span className="mt-1 block text-xs text-muted-foreground">
              Nome da pasta da campanha dentro de Collabs. Use o mesmo nome se já existir (ex.{" "}
              <strong>SNCJ 2026</strong>).
            </span>
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="font-medium text-ink">Link do vídeo *</span>
            <input
              className="mt-1 w-full rounded-lg border border-hairline bg-white px-3 py-2 text-sm"
              placeholder="YouTube, Google Drive ou link direto"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
            />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="font-medium text-ink">Observações (opcional)</span>
            <textarea
              className="mt-1 min-h-[72px] w-full rounded-lg border border-hairline bg-white px-3 py-2 text-sm"
              placeholder="Briefing, roteiro, prazo…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </label>
        </div>

        <div>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium text-ink">
              Embaixadores selecionados ({selectedIds.size})
            </p>
            <input
              className="rounded-lg border border-hairline bg-white px-3 py-1.5 text-sm"
              placeholder="Buscar nome ou @…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {loadingAmbassadors ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Carregando embaixadores…
            </p>
          ) : (
            <div className="max-h-56 overflow-y-auto rounded-lg border border-hairline bg-white">
              {filtered.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground">Nenhum embaixador encontrado.</p>
              ) : (
                <ul className="divide-y divide-hairline">
                  {filtered.map((a) => {
                    const checked = selectedIds.has(a.id);
                    return (
                      <li key={a.id}>
                        <button
                          type="button"
                          onClick={() => toggle(a.id)}
                          className={cn(
                            "flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition hover:bg-surface",
                            checked && "bg-amber-50/80"
                          )}
                        >
                          <span
                            className={cn(
                              "flex h-5 w-5 shrink-0 items-center justify-center rounded border",
                              checked
                                ? "border-amber-600 bg-amber-600 text-white"
                                : "border-hairline bg-white"
                            )}
                          >
                            {checked && <Check className="h-3.5 w-3.5" />}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex flex-wrap items-center gap-1.5 font-medium text-ink">
                              {checked && <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />}
                              {a.fullName}
                            </span>
                            <span className="text-xs text-muted-foreground">{a.instagram}</span>
                          </span>
                          <VerticalBadge vertical={a.program} />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}
        </div>

        {collab && selectedIds.size > 0 && (
          <div className="rounded-lg border border-hairline bg-white p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="flex items-center gap-2 text-sm font-medium text-ink">
                  <FolderOpen className="h-4 w-4 text-amber-700" />
                  Drive — Collabs
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Ao salvar, o app usa a pasta <strong>{driveFolderName || campaignName}</strong>, cria{" "}
                  <strong>_INBOX</strong>, <strong>00 Referência</strong> e uma pasta por embaixador. Vídeos
                  soltos na pasta da campanha ou link do Drive no campo acima são movidos automaticamente.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" size="sm" onClick={() => runDrive("structure")} disabled={driveBusy}>
                  {driveBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <FolderOpen className="h-4 w-4" />}
                  Criar pastas
                </Button>
                <Button size="sm" onClick={() => runDrive("organize")} disabled={driveBusy}>
                  {driveBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                  Organizar inbox
                </Button>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              {collab.driveInboxUrl && (
                <a
                  href={collab.driveInboxUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-1 font-medium text-amber-950 hover:bg-amber-200"
                >
                  Abrir inbox da campanha
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
              {collab.driveFolderUrl && (
                <a
                  href={collab.driveFolderUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 rounded-md border border-hairline px-2 py-1 text-ink hover:bg-surface"
                >
                  Pasta {campaignName}
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>

            {collab.assignments.length > 0 && (
              <ul className="mt-3 space-y-2 border-t border-hairline pt-3 text-xs">
                {collab.assignments.map((a) => (
                  <li key={a.ambassadorId} className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-ink">{a.fullName}</p>
                      <p className="text-muted-foreground">Pasta: {a.folderName}</p>
                      <p className="text-muted-foreground">Vídeo: {a.expectedVideoName}</p>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {a.driveFolderUrl && (
                        <a
                          href={a.driveFolderUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded bg-surface px-2 py-0.5 text-primary hover:underline"
                        >
                          Pasta
                        </a>
                      )}
                      {a.driveVideoUrl && (
                        <a
                          href={a.driveVideoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded bg-emerald-50 px-2 py-0.5 text-emerald-800 hover:underline"
                        >
                          Vídeo ✓
                        </a>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {organizeReport && <p className="mt-2 text-xs text-emerald-800">{organizeReport}</p>}
          </div>
        )}

        {collab && collab.assignments.length > 0 && (
          <div className="rounded-lg border border-sky-200 bg-sky-50/80 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="flex items-center gap-2 text-sm font-medium text-sky-950">
                  <Link2 className="h-4 w-4" />
                  Páginas para embaixadores
                </p>
                <p className="mt-1 text-xs text-sky-900/80">
                  Link individual com campanha, roteiro e pedidos de vídeo. Envie no WhatsApp.
                </p>
              </div>
              <Button variant="secondary" size="sm" onClick={seedBriefings} disabled={briefingBusy}>
                {briefingBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
                Gerar páginas
              </Button>
            </div>

            <ul className="mt-3 space-y-3">
              {collab.assignments.map((a) => {
                const href = a.publicUrl || (a.publicSlug ? `/p/${a.publicSlug}` : null);
                return (
                  <li
                    key={a.ambassadorId}
                    className="rounded-lg border border-sky-200/80 bg-white px-3 py-2.5 text-xs"
                  >
                    <p className="font-medium text-ink">{a.fullName}</p>
                    {href ? (
                      <div className="mt-2 flex flex-wrap gap-2">
                        <a
                          href={href.startsWith("http") ? href : href}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-primary hover:underline"
                        >
                          Abrir página
                          <ExternalLink className="h-3 w-3" />
                        </a>
                        <button
                          type="button"
                          onClick={() => copyLink(a.publicSlug!, href)}
                          className="inline-flex items-center gap-1 text-muted-foreground hover:text-ink"
                        >
                          {copiedSlug === a.publicSlug ? (
                            <Check className="h-3 w-3 text-emerald-600" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                          Copiar link
                        </button>
                        <button
                          type="button"
                          onClick={() => openCollabEmail(a)}
                          className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                        >
                          <Mail className="h-3 w-3" />
                          Enviar e-mail pedido
                        </button>
                        <button
                          type="button"
                          disabled={briefingBusy || !a.pedido2RequestId}
                          onClick={() =>
                            sharePedido2(a.pedido2RequestId!, a.pedido2EditorShared)
                          }
                          className={cn(
                            "inline-flex items-center gap-1 rounded px-2 py-0.5 font-medium",
                            a.pedido2EditorShared
                              ? "bg-emerald-100 text-emerald-900"
                              : "bg-surface text-muted-foreground hover:text-ink"
                          )}
                        >
                          <Upload className="h-3 w-3" />
                          {a.pedido2EditorShared
                            ? "Revogar acesso Pedido 2"
                            : "Compartilhar Pedido 2 (editor)"}
                        </button>
                        {a.pedido2EditorShared && a.pedido2ShareEmail && (
                          <span className="text-muted-foreground">{a.pedido2ShareEmail}</span>
                        )}
                      </div>
                    ) : (
                      <p className="mt-1 text-muted-foreground">Clique em “Gerar páginas”</p>
                    )}
                    {a.requestCount > 0 && (
                      <p className="mt-1 text-muted-foreground">{a.requestCount} pedido(s) configurado(s)</p>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex flex-wrap gap-2">
          <Button onClick={save} disabled={saving || !videoUrl.trim()}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Salvar collab
          </Button>
          {collab && (
            <Button variant="secondary" onClick={removeCollab} disabled={saving}>
              <Trash2 className="h-4 w-4" />
              Remover
            </Button>
          )}
        </div>
      </div>

      <CollabPedidoEmailModal
        open={!!emailModal}
        defaults={emailModal}
        onClose={() => setEmailModal(null)}
      />
    </div>
  );
}
