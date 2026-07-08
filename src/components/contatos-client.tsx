"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button, Input, Select, Textarea } from "@/components/ui";
import {
  CONTACT_WORKING_STATUS,
  MODALITIES,
  PIPELINE_BOARD_STATUSES,
  PIPELINE_CANDIDATURA_STATUSES,
  PIPELINE_PROSPECCAO_STATUSES,
} from "@/lib/constants";
import { useVertical } from "@/components/vertical-context";
import { VerticalBadge } from "@/components/vertical-badge";
import { useSavedViews } from "@/lib/view-system/use-saved-views";
import { boardColumnOptionsFor } from "@/lib/view-system/board-columns";
import { applyViewPipeline } from "@/lib/view-system/apply-view";
import type { FilterOption, GroupByKey, SortOption } from "@/lib/view-system/types";
import { ViewToolbar } from "@/components/views/view-toolbar";
import { PipelineBoardView, PipelineTableView } from "@/components/contatos/pipeline-views";
import { QuickNotesInlinePanel } from "@/components/ambassador/ambassador-quick-notes";
import { ParceriaFormalizacaoModal } from "@/components/parceria-formalizacao-modal";
import { ParceriaCandidaturaModal } from "@/components/parceria-candidatura-modal";
import {
  ParceriaPropostaModal,
  type PropostaEmailVars,
} from "@/components/parceria-proposta-modal";
import { SendEmailModal, type SendEmailConfirmPayload } from "@/components/send-email-modal";
import {
  resolveFormalizacaoAction,
  PROPOSTA_LEMBRETE_ACTION,
  resolvePropostaAction,
} from "@/lib/constants";
import { isOutreachStatus } from "@/lib/contact-alerts";
import {
  ContatoDetailModal,
  ContatoOutreachModal,
  type ContactDetail,
} from "@/components/contato-outreach-modal";
import {
  countPipelineActions,
  filterPipelineByScope,
  pipelineToParceriaItem,
  type PipelineCounts,
  type PipelineItem,
} from "@/lib/pipeline";
import type { ParceriaItem, ParceriaPartnership } from "@/components/parcerias/types";
import { displayName } from "@/lib/ambassador-name";
import { ApplicationFormSummary } from "@/components/parcerias/application-form-summary";
import { buildParceriaOperationalHints } from "@/lib/parceria-form-preview";
import { cn } from "@/lib/utils";

const emptyPartnership = (): ParceriaPartnership => ({
  modality: null,
  agreedValue: null,
  valueLocked: false,
  courseName: null,
  courseReleased: false,
  couponCode: null,
  metaFeed: 0,
  metaStories: 0,
  metaTiktok: 0,
  metaYoutube: 0,
  startDate: null,
  proposalSentAt: null,
  proposalReminderSentAt: null,
  legalCpf: null,
  legalAddress: null,
  bankDetails: null,
});

const GROUP_OPTIONS: { key: GroupByKey; label: string }[] = [
  { key: "none", label: "Nenhum" },
  { key: "status", label: "Status" },
  { key: "vertical", label: "Vertical" },
];

const SORT_OPTIONS: SortOption[] = [
  { key: "name", label: "Nome" },
  { key: "status", label: "Status" },
  { key: "vertical", label: "Vertical" },
];

const FILTER_OPTIONS: FilterOption[] = [
  { value: "__pipeline__", label: "Pipeline completo" },
  { value: "__prospeccao__", label: "Prospecção" },
  { value: "__candidaturas__", label: "Candidaturas" },
  { value: "__desinteressado__", label: "Desinteressados" },
  { value: "__needsReview__", label: "Analisar candidatos" },
  { value: "__proposalStale__", label: "Cobrar proposta" },
  { value: "__contactStale__", label: "Refazer contato" },
  { value: "__needsLink__", label: "Vincular contato" },
];

function pipelineScope(viewFilter: string): string {
  return viewFilter || "__pipeline__";
}

function defaultBoardColumns(scope: string): readonly string[] {
  if (scope === "__prospeccao__") return PIPELINE_PROSPECCAO_STATUSES;
  if (scope === "__candidaturas__") return PIPELINE_CANDIDATURA_STATUSES;
  if (scope === "__desinteressado__") return ["Desinteressado"];
  return PIPELINE_BOARD_STATUSES;
}

function pipelineItemToContact(item: PipelineItem): ContactDetail {
  return {
    id: item.contactId || item.id,
    vertical: item.vertical,
    status: item.stage === "Pendente" || item.stage === "Proposta" ? "Trabalhando" : item.stage,
    instagram: item.instagram,
    tiktok: item.tiktok,
    linkIg: item.instagram ? `https://instagram.com/${item.instagram.replace(/^@/, "")}` : null,
    linkTiktok: item.tiktok ? `https://tiktok.com/@${item.tiktok.replace(/^@/, "")}` : null,
    notes: item.notes,
    contactAttempts: item.contactAttempts,
    lastContactedAt: item.lastContactedAt,
    nextFollowUpAt: item.nextFollowUpAt,
    contactedBy: item.contactedBy,
    origin: item.origin,
    prospectedAt: null,
    statusChangedAt: null,
    ambassadorId: item.ambassadorId,
  };
}

export function ContatosClient() {
  const { vertical } = useVertical();
  const { views, activeView, setActiveViewId, addView, updateView, removeView } =
    useSavedViews("contatos");

  const [list, setList] = useState<PipelineItem[]>([]);
  const [counts, setCounts] = useState<PipelineCounts | null>(null);
  const [loading, setLoading] = useState(true);
  const [newIg, setNewIg] = useState("");
  const [detailContact, setDetailContact] = useState<ContactDetail | null>(null);
  const [saving, setSaving] = useState(false);
  const [outreach, setOutreach] = useState<{
    contact: ContactDetail;
    kind: "first" | "followup";
    pendingStatus?: string;
  } | null>(null);
  const [editing, setEditing] = useState<ParceriaItem | null>(null);
  const [form, setForm] = useState<ParceriaItem | null>(null);
  const [formalizacaoItem, setFormalizacaoItem] = useState<ParceriaItem | null>(null);
  const [formalizacaoSaving, setFormalizacaoSaving] = useState(false);
  const [propostaItem, setPropostaItem] = useState<ParceriaItem | null>(null);
  const [propostaSaving, setPropostaSaving] = useState(false);
  const [candidaturaItem, setCandidaturaItem] = useState<ParceriaItem | null>(null);
  const [lembreteItem, setLembreteItem] = useState<ParceriaItem | null>(null);
  const [lembreteSaving, setLembreteSaving] = useState(false);
  const [lembreteModal, setLembreteModal] = useState<{
    subject: string;
    html: string;
    to: string;
    fromId?: string;
    program: string;
    whatsappMessage: string;
  } | null>(null);
  const [syncMeta, setSyncMeta] = useState<{
    configured?: boolean;
    sheets?: Array<{
      sheetName: string;
      program: string;
      lastRow: number;
      sheetLastRow: number;
      pendingRows: number;
      lastSyncedAt: string | null;
    }>;
  } | null>(null);
  const [syncing, setSyncing] = useState(false);

  const scope = pipelineScope(activeView.filterStatus);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("vertical", vertical);
    try {
      const pipelineRes = await fetch(`/api/contatos/pipeline?${params}`);
      if (pipelineRes.ok) {
        const data = await pipelineRes.json();
        if (Array.isArray(data.items)) setList(data.items);
        if (data.counts) setCounts(data.counts);
      }
    } finally {
      setLoading(false);
    }
  }, [vertical]);

  const loadSyncMeta = useCallback(async () => {
    const syncRes = await fetch("/api/candidaturas/sync");
    if (syncRes.ok) {
      const syncRaw = await syncRes.text();
      if (syncRaw) setSyncMeta(JSON.parse(syncRaw));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    loadSyncMeta();
  }, [loadSyncMeta, vertical]);

  async function syncFromSheet(full = false) {
    setSyncing(true);
    const res = await fetch("/api/candidaturas/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ full }),
    });
    setSyncing(false);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert(err.error || "Erro ao sincronizar Respostas");
      return;
    }
    const data = await res.json();
    if (data.ok) {
      alert(
        `Sync concluído: ${data.totalCreated ?? 0} criada(s), ${data.totalUpdated ?? 0} atualizada(s).`
      );
    }
    await load();
    await loadSyncMeta();
  }

  async function addContact() {
    await fetch("/api/contatos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "instagram", vertical, handle: newIg }),
    });
    setNewIg("");
    load();
  }

  async function promoteContact(contactId: string) {
    await fetch(`/api/contatos/${contactId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "promote" }),
    });
    load();
  }

  async function saveContact(id: string, data: Partial<ContactDetail>) {
    setSaving(true);
    await fetch(`/api/contatos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setSaving(false);
    setDetailContact(null);
    load();
  }

  async function confirmOutreach(payload: { notes?: string; nextFollowUpAt?: string | null }) {
    if (!outreach) return;
    setSaving(true);
    await fetch(`/api/contatos/${outreach.contact.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "outreach",
        notes: payload.notes,
        nextFollowUpAt: payload.nextFollowUpAt,
        status: outreach.pendingStatus,
      }),
    });
    setSaving(false);
    setOutreach(null);
    load();
  }

  function openOutreach(item: PipelineItem, kind: "first" | "followup", pendingStatus?: string) {
    setOutreach({
      contact: pipelineItemToContact(item),
      kind,
      pendingStatus,
    });
    setDetailContact(null);
  }

  async function updateContactStatus(contactId: string, newStatus: string, item: PipelineItem) {
    if (isOutreachStatus(newStatus) && item.stage !== newStatus) {
      openOutreach(
        item,
        item.contactAttempts > 0 || item.stage === CONTACT_WORKING_STATUS ? "followup" : "first",
        newStatus
      );
      return;
    }
    await fetch(`/api/contatos/${contactId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    load();
  }

  async function updateAmbassadorStatus(id: string, status: string) {
    await fetch(`/api/parcerias/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
  }

  async function handleBoardMove(id: string, newStage: string) {
    const item = list.find((i) => i.id === id);
    if (!item || item.stage === newStage) return;

    if (newStage === "Desinteressado") {
      if (item.contactId && !item.ambassadorId) {
        await updateContactStatus(item.contactId, "Desinteressado", item);
      } else if (item.ambassadorId) {
        await updateAmbassadorStatus(item.ambassadorId, "Desinteressado");
      }
      return;
    }

    if (item.stage === "Novo" || item.stage === "Trabalhando") {
      if (newStage === "Pendente" && item.contactId) {
        await promoteContact(item.contactId);
        return;
      }
      if ((newStage === "Novo" || newStage === "Trabalhando") && item.contactId) {
        await updateContactStatus(item.contactId, newStage, item);
        return;
      }
    }

    if (item.stage === "Pendente" && newStage === "Proposta") {
      const p = pipelineToParceriaItem(item);
      if (p) setPropostaItem(p);
      return;
    }

    if (item.stage === "Proposta" && newStage === "Ativo") {
      const p = pipelineToParceriaItem(item);
      if (p) setFormalizacaoItem(p);
      return;
    }

    if (item.ambassadorId) {
      await updateAmbassadorStatus(item.ambassadorId, newStage);
    }
  }

  function openEdit(item: ParceriaItem) {
    setEditing(item);
    setForm({
      ...item,
      partnership: item.partnership ? { ...item.partnership } : emptyPartnership(),
    });
  }

  function closeEdit() {
    setEditing(null);
    setForm(null);
  }

  async function saveEdit() {
    if (!form) return;
    setSaving(true);
    const p = form.partnership;
    await fetch(`/api/parcerias/${form.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: form.fullName,
        socialName: form.socialName,
        email: form.email,
        whatsapp: form.whatsapp,
        status: form.status,
        alerts: form.alerts,
        modality: p?.modality,
        agreedValue: p?.agreedValue != null ? Number(p.agreedValue) : null,
        valueLocked: p?.valueLocked,
        courseName: p?.courseName,
        courseReleased: p?.courseReleased,
        couponCode: p?.couponCode,
        metaFeed: p?.metaFeed ?? 0,
        metaStories: p?.metaStories ?? 0,
        metaTiktok: p?.metaTiktok ?? 0,
        metaYoutube: p?.metaYoutube ?? 0,
        startDate: p?.startDate || null,
        legalCpf: p?.legalCpf || null,
        legalAddress: p?.legalAddress || null,
        bankDetails: p?.bankDetails || null,
      }),
    });
    setSaving(false);
    closeEdit();
    load();
  }

  async function markPropostaOnly(vars: PropostaEmailVars) {
    if (!propostaItem) return;
    setPropostaSaving(true);
    await fetch(`/api/parcerias/${propostaItem.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "Proposta",
        needsReview: false,
        modality: vars.modality,
        agreedValue: vars.agreedValue,
        metaFeed: vars.metaFeed,
        metaStories: vars.metaStories,
        metaTiktok: vars.metaTiktok,
        metaYoutube: vars.metaYoutube,
      }),
    });
    setPropostaSaving(false);
    setPropostaItem(null);
    load();
  }

  async function sendPropostaAndUpdate(vars: PropostaEmailVars, email: SendEmailConfirmPayload) {
    if (!propostaItem) return;
    setPropostaSaving(true);
    const action = resolvePropostaAction(vars.modality);
    const res = await fetch("/api/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ambassadorId: propostaItem.id,
        action,
        vars: {
          metaFeed: vars.metaFeed,
          metaStories: vars.metaStories,
          metaTiktok: vars.metaTiktok,
          metaYoutube: vars.metaYoutube,
          productValue: vars.productValue,
          simulationCourseName: vars.simulationCourseName,
        },
        finalize: { sendProposal: true, proposal: vars },
        to: email.to,
        from: email.from,
        cc: email.cc,
        subject: email.subject,
        html: email.html,
        whatsappMessage: email.whatsappMessage,
      }),
    });
    const data = await res.json();
    setPropostaSaving(false);
    if (data.send?.ok && data.partnershipUpdate?.status === "Proposta") {
      setPropostaItem(null);
      load();
      return;
    }
    alert(data.send?.error || data.error || "Erro ao enviar proposta");
  }

  async function prepareLembrete(item: ParceriaItem) {
    setLembreteItem(item);
    const res = await fetch("/api/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        previewOnly: true,
        ambassadorId: item.id,
        action: PROPOSTA_LEMBRETE_ACTION,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error || "Erro ao preparar lembrete");
      setLembreteItem(null);
      return;
    }
    setLembreteModal({
      subject: data.subject,
      html: data.html,
      to: data.to || item.email || "",
      fromId: data.fromId,
      program: data.program || item.program,
      whatsappMessage: data.whatsappMessage || "",
    });
  }

  async function sendLembrete(email: SendEmailConfirmPayload) {
    if (!lembreteItem) return;
    setLembreteSaving(true);
    const res = await fetch("/api/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ambassadorId: lembreteItem.id,
        action: PROPOSTA_LEMBRETE_ACTION,
        to: email.to,
        from: email.from,
        cc: email.cc,
        subject: email.subject,
        html: email.html,
        whatsappMessage: email.whatsappMessage,
      }),
    });
    const data = await res.json();
    setLembreteSaving(false);
    if (data.send?.ok) {
      setLembreteModal(null);
      setLembreteItem(null);
      load();
    } else {
      alert(data.send?.error || data.error || "Erro ao enviar lembrete");
    }
  }

  async function activateFormalizacaoOnly() {
    if (!formalizacaoItem) return;
    setFormalizacaoSaving(true);
    await updateAmbassadorStatus(formalizacaoItem.id, "Ativo");
    setFormalizacaoSaving(false);
    setFormalizacaoItem(null);
  }

  async function sendFormalizacaoAndActivate(
    vars: { courseName: string; couponCode: string; releaseDate: string },
    email: { to: string; from: string; subject: string; html: string; whatsappMessage: string }
  ) {
    if (!formalizacaoItem) return;
    setFormalizacaoSaving(true);
    const action = resolveFormalizacaoAction(formalizacaoItem.partnership?.modality);
    const res = await fetch("/api/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ambassadorId: formalizacaoItem.id,
        action,
        vars,
        finalize: { activatePartnership: true },
        to: email.to,
        from: email.from,
        subject: email.subject,
        html: email.html,
        whatsappMessage: email.whatsappMessage,
      }),
    });
    const data = await res.json();
    setFormalizacaoSaving(false);
    if (data.send?.ok && data.partnershipUpdate?.status === "Ativo") {
      setFormalizacaoItem(null);
      load();
      return;
    }
    alert(data.send?.error || data.error || "Erro ao enviar e-mail de formalização");
  }

  const scoped = useMemo(
    () => filterPipelineByScope(list, scope),
    [list, scope]
  );

  const filtered = useMemo(() => {
    return applyViewPipeline(scoped, activeView, {
      searchText: (i) =>
        [i.displayName, i.instagram, i.tiktok, i.notes, i.email, i.fullName]
          .filter(Boolean)
          .join(" "),
      getFilterStatus: (i) => i.stage,
      defaultSortKey: "name",
      sorters: {
        name: (a, b) => a.displayName.localeCompare(b.displayName, "pt-BR"),
        status: (a, b) => a.stage.localeCompare(b.stage, "pt-BR"),
        vertical: (a, b) => a.vertical.localeCompare(b.vertical, "pt-BR"),
      },
    });
  }, [scoped, activeView]);

  const viewBadges = useMemo(() => {
    const badges: Record<string, number> = {};
    const pending = counts?.respostasPending ?? 0;
    for (const v of views) {
      const s = pipelineScope(v.filterStatus);
      let count = countPipelineActions(list, s);
      if (s === "__pipeline__" || s === "__candidaturas__") count += pending;
      if (count > 0) badges[v.id] = count;
    }
    return badges;
  }, [views, list, counts]);

  const boardColumns = useMemo(
    () => boardColumnOptionsFor("contatos", activeView.groupBy),
    [activeView.groupBy]
  );

  const sheetForVertical = syncMeta?.sheets?.find((s) => s.program === vertical);
  const p = form?.partnership;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-hairline bg-surface/50 px-3 py-2">
        <Button variant="secondary" onClick={() => syncFromSheet(false)} disabled={syncing}>
          {syncing ? (
            <>
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              Sincronizando…
            </>
          ) : (
            "Sync Respostas"
          )}
          {sheetForVertical?.pendingRows != null && sheetForVertical.pendingRows > 0 && (
            <span className="ml-1.5 rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
              {sheetForVertical.pendingRows}
            </span>
          )}
        </Button>
        <Button
          variant="ghost"
          className="text-xs"
          onClick={() => {
            if (confirm("Reimportar todas as linhas de Respostas OAB/ECJ da planilha?")) {
              syncFromSheet(true);
            }
          }}
          disabled={syncing}
        >
          sync completo
        </Button>
        {sheetForVertical?.lastSyncedAt && (
          <span className="text-xs text-muted-foreground">
            Último sync {vertical}:{" "}
            {new Date(sheetForVertical.lastSyncedAt).toLocaleString("pt-BR", {
              dateStyle: "short",
              timeStyle: "short",
            })}
          </span>
        )}
      </div>

      <ViewToolbar
        views={views}
        activeView={activeView}
        groupOptions={GROUP_OPTIONS}
        sortOptions={SORT_OPTIONS}
        filterOptions={FILTER_OPTIONS}
        onSelectView={setActiveViewId}
        onAddView={addView}
        onUpdateView={updateView}
        onRemoveView={removeView}
        boardColumnOptions={activeView.type === "board" ? boardColumns : undefined}
        viewBadges={viewBadges}
      />

      <div
        className={cn(
          "flex gap-2 rounded-xl border-2 bg-card p-3 shadow-soft",
          vertical === "OAB" ? "border-oab/25" : "border-ecj/30"
        )}
      >
        <Input placeholder="@instagram" value={newIg} onChange={(e) => setNewIg(e.target.value)} />
        <VerticalBadge vertical={vertical} className="shrink-0 self-center" />
        <Button onClick={addContact} disabled={!newIg.trim()}>
          Adicionar
        </Button>
      </div>

      {filtered.length !== scoped.length && (
        <p className="text-sm text-muted-foreground">
          {filtered.length} de {scoped.length} na view
        </p>
      )}

      {loading ? (
        <div className="flex items-center justify-center gap-2 rounded-xl border border-hairline bg-card py-16 text-sm text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Carregando pipeline…
        </div>
      ) : activeView.type === "board" ? (
        <PipelineBoardView
          items={filtered}
          columnOrder={activeView.groupOrder}
          hiddenColumnKeys={activeView.hiddenGroups}
          defaultColumnOrder={defaultBoardColumns(scope)}
          onColumnOrderChange={(order) => updateView(activeView.id, { groupOrder: order })}
          onMove={handleBoardMove}
          onOpenContact={(item) => setDetailContact(pipelineItemToContact(item))}
          onOutreach={(item) => openOutreach(item, "followup", CONTACT_WORKING_STATUS)}
          onSendProposta={(item) => setPropostaItem(item)}
          onLembrete={prepareLembrete}
          onFormalizar={(item) => setFormalizacaoItem(item)}
          onViewCandidatura={(item) => setCandidaturaItem(item)}
          onNotesChanged={load}
        />
      ) : activeView.type === "table" ? (
        <PipelineTableView
          items={filtered}
          groupBy={activeView.groupBy}
          onOpenContact={(item) => setDetailContact(pipelineItemToContact(item))}
          onOutreach={(item) => openOutreach(item, "followup", CONTACT_WORKING_STATUS)}
          onSendProposta={(item) => setPropostaItem(item)}
          onLembrete={prepareLembrete}
          onFormalizar={(item) => setFormalizacaoItem(item)}
          onViewCandidatura={(item) => setCandidaturaItem(item)}
          onNotesChanged={load}
        />
      ) : (
        <PipelineTableView
          items={filtered}
          groupBy="none"
          onOpenContact={(item) => setDetailContact(pipelineItemToContact(item))}
          onOutreach={(item) => openOutreach(item, "followup", CONTACT_WORKING_STATUS)}
          onSendProposta={(item) => setPropostaItem(item)}
          onViewCandidatura={(item) => setCandidaturaItem(item)}
          onNotesChanged={load}
        />
      )}

      <ContatoDetailModal
        contact={detailContact}
        saving={saving}
        onClose={() => setDetailContact(null)}
        onSave={(data) => (detailContact ? saveContact(detailContact.id, data) : Promise.resolve())}
        onOutreach={(c, kind, pending) => setOutreach({ contact: c, kind, pendingStatus: pending })}
      />

      <ContatoOutreachModal
        open={!!outreach}
        contact={outreach?.contact || null}
        kind={outreach?.kind || "first"}
        saving={saving}
        onClose={() => setOutreach(null)}
        onConfirm={confirmOutreach}
      />

      <ParceriaCandidaturaModal
        open={!!candidaturaItem}
        item={candidaturaItem}
        onClose={() => setCandidaturaItem(null)}
        onMontarProposta={(item) => setPropostaItem(item)}
      />

      <ParceriaPropostaModal
        open={!!propostaItem}
        item={propostaItem}
        saving={propostaSaving}
        onClose={() => setPropostaItem(null)}
        onMarkPropostaOnly={markPropostaOnly}
        onSendProposal={sendPropostaAndUpdate}
      />

      <SendEmailModal
        open={!!lembreteModal}
        onClose={() => {
          setLembreteModal(null);
          setLembreteItem(null);
        }}
        sending={lembreteSaving}
        actionLabel={PROPOSTA_LEMBRETE_ACTION}
        program={lembreteModal?.program}
        fromId={lembreteModal?.fromId}
        to={lembreteModal?.to || ""}
        subject={lembreteModal?.subject || ""}
        html={lembreteModal?.html || ""}
        whatsappMessage={lembreteModal?.whatsappMessage || ""}
        onSend={sendLembrete}
      />

      <ParceriaFormalizacaoModal
        open={!!formalizacaoItem}
        item={formalizacaoItem}
        saving={formalizacaoSaving}
        onClose={() => setFormalizacaoItem(null)}
        onActivateOnly={activateFormalizacaoOnly}
        onSendAndActivate={sendFormalizacaoAndActivate}
      />

      {editing && form && p && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm">
          <div
            className={`max-h-[90vh] w-full overflow-y-auto rounded-xl border border-hairline bg-card p-6 shadow-elev ${
              form.applicationFormData ? "max-w-4xl" : "max-w-lg"
            }`}
          >
            <h2 className="mb-4 font-serif text-lg text-ink">Editar — {displayName(form)}</h2>
            {(form.applicationFormData || form.needsReview) && (
              <ApplicationFormSummary
                program={form.program}
                applicationFormData={form.applicationFormData}
                applicationReceivedAt={form.applicationReceivedAt}
                respostasSheetName={form.respostasSheetName}
                respostasSheetRow={form.respostasSheetRow}
                operational={buildParceriaOperationalHints(form)}
                variant="analysis"
                className="mb-4"
              />
            )}
            <div className="space-y-3">
              <label className="block text-xs font-medium text-muted-foreground">Nome civil</label>
              <Input
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              />
              <label className="block text-xs font-medium text-muted-foreground">Status</label>
              <Select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                {["Pendente", "Proposta", "Desinteressado"].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
              <QuickNotesInlinePanel
                ambassadorId={form.id}
                ambassadorName={displayName(form)}
                onChanged={load}
              />
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="secondary" onClick={closeEdit}>
                Cancelar
              </Button>
              <Button onClick={saveEdit} disabled={saving}>
                {saving ? "Salvando…" : "Salvar"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
