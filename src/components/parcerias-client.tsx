"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button, Input, Select, Textarea } from "@/components/ui";
import { MODALITIES, PARTNERSHIP_STATUSES } from "@/lib/constants";
import { useVertical } from "@/components/vertical-context";
import { useSavedViews } from "@/lib/view-system/use-saved-views";
import { boardColumnOptionsFor } from "@/lib/view-system/board-columns";
import { applyViewPipeline } from "@/lib/view-system/apply-view";
import type { FilterOption, GroupByKey, SortOption } from "@/lib/view-system/types";
import { ViewToolbar } from "@/components/views/view-toolbar";
import {
  ParceriasBoardView,
  ParceriasGalleryView,
  ParceriasTableView,
} from "@/components/parcerias/parcerias-views";
import { QuickNotesInlinePanel } from "@/components/ambassador/ambassador-quick-notes";
import { ParceriaFormalizacaoModal } from "@/components/parceria-formalizacao-modal";
import { ParceriaCandidaturaModal } from "@/components/parceria-candidatura-modal";
import {
  ParceriaPropostaModal,
  type PropostaEmailVars,
} from "@/components/parceria-proposta-modal";
import { SendEmailModal, type SendEmailConfirmPayload } from "@/components/send-email-modal";
import { resolveFormalizacaoAction, PROPOSTA_LEMBRETE_ACTION, resolvePropostaAction } from "@/lib/constants";
import { isProposalStale, needsAnalysis, proposalAlertLabel } from "@/lib/partnership-alerts";
import type { ParceriaItem, ParceriaPartnership } from "@/components/parcerias/types";
import { displayName } from "@/lib/ambassador-name";
import { ApplicationFormSummary } from "@/components/parcerias/application-form-summary";
import { buildParceriaOperationalHints } from "@/lib/parceria-form-preview";

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
  { key: "program", label: "Vertical" },
  { key: "modality", label: "Modalidade" },
];

const SORT_OPTIONS: SortOption[] = [
  { key: "name", label: "Nome" },
  { key: "status", label: "Status" },
  { key: "modality", label: "Modalidade" },
  { key: "program", label: "Vertical" },
];

const FILTER_OPTIONS: FilterOption[] = [
  ...PARTNERSHIP_STATUSES.map((s) => ({ value: s, label: s })),
  { value: "__needsReview__", label: "Analisar candidatos" },
  { value: "__proposalStale__", label: "Cobrar proposta" },
];

export function ParceriasClient() {
  const { vertical } = useVertical();
  const { views, activeView, setActiveViewId, addView, updateView, removeView } =
    useSavedViews("parcerias");

  const [list, setList] = useState<ParceriaItem[]>([]);
  const [editing, setEditing] = useState<ParceriaItem | null>(null);
  const [form, setForm] = useState<ParceriaItem | null>(null);
  const [saving, setSaving] = useState(false);
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
    totalPendingRows?: number;
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

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    params.set("program", vertical);
    const [parceriasRes, syncRes] = await Promise.all([
      fetch(`/api/parcerias?${params}`),
      fetch("/api/candidaturas/sync", { cache: "no-store" }),
    ]);
    if (parceriasRes.ok) {
      const data = await parceriasRes.json();
      if (Array.isArray(data)) setList(data);
    } else {
      console.error("Erro ao carregar parcerias:", parceriasRes.status);
    }
    if (syncRes.ok) {
      const syncRaw = await syncRes.text();
      if (syncRaw) setSyncMeta(JSON.parse(syncRaw));
    }
  }, [vertical]);

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
    } else if (data.totalCreated === 0 && data.totalUpdated === 0 && !full) {
      alert("Nenhuma linha nova na planilha Respostas desde o último sync.");
    }
    await load();
  }

  useEffect(() => {
    load();
  }, [load]);

  function openEdit(a: ParceriaItem) {
    setEditing(a);
    setForm({
      ...a,
      partnership: a.partnership ? { ...a.partnership } : emptyPartnership(),
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

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/parcerias/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
  }

  function requestActivation(id: string) {
    const item = list.find((i) => i.id === id);
    if (!item) return;
    if (item.status === "Proposta") {
      setFormalizacaoItem(item);
      return;
    }
    void updateStatus(id, "Ativo");
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
        courseName: vars.courseName,
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

  async function sendPropostaAndUpdate(
    vars: PropostaEmailVars,
    email: SendEmailConfirmPayload
  ) {
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
          courseName: vars.courseName,
          courseUrl: vars.courseUrl,
          courseDescription: vars.courseDescription,
          careerUrl: vars.careerUrl,
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

  function requestProposta(item: ParceriaItem) {
    setPropostaItem(item);
  }

  function viewCandidatura(item: ParceriaItem) {
    setCandidaturaItem(item);
  }

  async function activateFormalizacaoOnly() {
    if (!formalizacaoItem) return;
    setFormalizacaoSaving(true);
    await updateStatus(formalizacaoItem.id, "Ativo");
    setFormalizacaoSaving(false);
    setFormalizacaoItem(null);
  }

  async function sendFormalizacaoAndActivate(
    vars: {
      courseName: string;
      couponCode: string;
      releaseDate: string;
    },
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

  async function encerrar(id: string) {
    if (!confirm("Encerrar parceria?")) return;
    await fetch(`/api/parcerias/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "encerrar" }),
    });
    load();
  }

  async function handleBoardMove(id: string, newGroupKey: string) {
    const item = list.find((i) => i.id === id);
    if (!item) return;

    const gb = activeView.groupBy === "none" ? "status" : activeView.groupBy;

    if (gb === "status" && item.status !== newGroupKey) {
      if (item.status === "Pendente" && newGroupKey === "Proposta") {
        setPropostaItem(item);
        return;
      }
      if (item.status === "Proposta" && newGroupKey === "Ativo") {
        setFormalizacaoItem(item);
        return;
      }
      await updateStatus(id, newGroupKey);
      return;
    }
    if (gb === "modality" && item.partnership?.modality !== newGroupKey && newGroupKey !== "—") {
      await fetch(`/api/parcerias/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modality: newGroupKey }),
      });
      load();
    }
  }

  const filtered = useMemo(() => {
    let result = applyViewPipeline(list, activeView, {
      searchText: (a) =>
        [displayName(a), a.fullName, a.instagram, a.email, a.whatsapp, a.alerts, a.partnership?.courseName]
          .filter(Boolean)
          .join(" "),
      getFilterStatus: (a) => a.status,
      defaultSortKey: "name",
      sorters: {
        name: (a, b) => displayName(a).localeCompare(displayName(b), "pt-BR"),
        status: (a, b) => a.status.localeCompare(b.status, "pt-BR"),
        modality: (a, b) =>
          (a.partnership?.modality || "").localeCompare(b.partnership?.modality || "", "pt-BR"),
        program: (a, b) => a.program.localeCompare(b.program, "pt-BR"),
        applicationReceivedAt: (a, b) =>
          (a.applicationReceivedAt || "").localeCompare(b.applicationReceivedAt || "", "pt-BR"),
      },
    });

    if (activeView.filterStatus === "__needsReview__") {
      result = result.filter((a) => needsAnalysis(a));
    } else if (activeView.filterStatus === "__proposalStale__") {
      result = result.filter((a) => isProposalStale(a));
    }

    return result;
  }, [list, activeView]);

  const p = form?.partnership;
  const sheetForVertical = syncMeta?.sheets?.find((s) => s.program === vertical);
  const boardColumns = useMemo(
    () => boardColumnOptionsFor("parcerias", activeView.groupBy),
    [activeView.groupBy]
  );

  return (
    <div className="space-y-2">
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
            · linha {sheetForVertical.lastRow}
            {sheetForVertical.sheetLastRow != null && ` / ${sheetForVertical.sheetLastRow} na planilha`}
          </span>
        )}
        {sheetForVertical?.pendingRows != null && sheetForVertical.pendingRows > 0 && (
          <span className="text-xs font-medium text-amber-800">
            {sheetForVertical.pendingRows} candidatura
            {sheetForVertical.pendingRows !== 1 ? "s" : ""} na planilha aguardando sync
          </span>
        )}
        {!syncMeta?.configured && (
          <span className="text-xs text-muted-foreground">
            Google Sheets não conectado — use import xlsx ou configure Gmail.
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
      />

      {activeView.type === "table" && (
        <ParceriasTableView
          items={filtered}
          groupBy={activeView.groupBy}
          onEdit={openEdit}
          onActivate={requestActivation}
          onEncerrar={encerrar}
          onNotesChanged={load}
          onSendProposta={requestProposta}
          onLembrete={prepareLembrete}
          onViewCandidatura={viewCandidatura}
        />
      )}
      {activeView.type === "gallery" && (
        <ParceriasGalleryView
          items={filtered}
          groupBy={activeView.groupBy}
          onEdit={openEdit}
          onNotesChanged={load}
          onSendProposta={requestProposta}
          onLembrete={prepareLembrete}
          onViewCandidatura={viewCandidatura}
        />
      )}
      {activeView.type === "board" && (
        <ParceriasBoardView
          items={filtered}
          groupBy={activeView.groupBy}
          columnOrder={activeView.groupOrder}
          hiddenColumnKeys={activeView.hiddenGroups}
          onColumnOrderChange={(order) => updateView(activeView.id, { groupOrder: order })}
          onEdit={openEdit}
          onMove={handleBoardMove}
          onNotesChanged={load}
          onFormalizar={(item) => setFormalizacaoItem(item)}
          onSendProposta={requestProposta}
          onLembrete={prepareLembrete}
          onViewCandidatura={viewCandidatura}
        />
      )}

      <ParceriaCandidaturaModal
        open={!!candidaturaItem}
        item={candidaturaItem}
        onClose={() => setCandidaturaItem(null)}
        onMontarProposta={requestProposta}
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
            <h2 className="mb-4 font-serif text-lg text-ink">
              Editar parceria — {displayName(form)}
            </h2>

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
              <label className="block text-xs font-medium text-muted-foreground">
                Nome social (opcional)
              </label>
              <Input
                placeholder="Como prefere ser chamado(a)"
                value={form.socialName || ""}
                onChange={(e) =>
                  setForm({ ...form, socialName: e.target.value.trim() || null })
                }
              />
              <p className="text-xs text-muted-foreground">
                E-mails e telas usam o nome social quando preenchido. Termos e financeiro usam o nome
                civil.
              </p>

              <label className="block text-xs font-medium text-muted-foreground">Status</label>
              <Select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                {PARTNERSHIP_STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </Select>

              <label className="block text-xs font-medium text-muted-foreground">Modalidade</label>
              <Select
                value={p.modality || ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    partnership: { ...p, modality: e.target.value || null },
                  })
                }
              >
                <option value="">—</option>
                {MODALITIES.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </Select>

              {p.modality === "Remuneração" && (
                <>
                  <label className="block text-xs font-medium text-muted-foreground">Valor acordado (R$)</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={p.agreedValue ?? ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        partnership: { ...p, agreedValue: e.target.value ? Number(e.target.value) : null },
                      })
                    }
                  />
                  <label className="flex items-center gap-2 text-sm text-body">
                    <input
                      type="checkbox"
                      checked={p.valueLocked}
                      onChange={(e) =>
                        setForm({ ...form, partnership: { ...p, valueLocked: e.target.checked } })
                      }
                    />
                    Valor travado
                  </label>

                  <p className="pt-2 text-xs font-semibold uppercase text-muted-foreground">
                    Dados para termo (RPA)
                  </p>
                  <label className="block text-xs font-medium text-muted-foreground">CPF</label>
                  <Input
                    value={p.legalCpf || ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        partnership: { ...p, legalCpf: e.target.value || null },
                      })
                    }
                    placeholder="000.000.000-00"
                  />
                  <label className="block text-xs font-medium text-muted-foreground">
                    Endereço completo
                  </label>
                  <Textarea
                    rows={2}
                    value={p.legalAddress || ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        partnership: { ...p, legalAddress: e.target.value || null },
                      })
                    }
                  />
                  <label className="block text-xs font-medium text-muted-foreground">
                    Dados bancários
                  </label>
                  <Textarea
                    rows={3}
                    value={p.bankDetails || ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        partnership: { ...p, bankDetails: e.target.value || null },
                      })
                    }
                    placeholder={"Banco do Brasil: 001\nAgência: 322-0\nConta: 83061-5"}
                  />
                </>
              )}

              {p.modality === "Assinatura + Cupom" && (
                <>
                  <label className="block text-xs font-medium text-muted-foreground">Curso</label>
                  <Input
                    value={p.courseName || ""}
                    onChange={(e) =>
                      setForm({ ...form, partnership: { ...p, courseName: e.target.value || null } })
                    }
                  />
                  <label className="block text-xs font-medium text-muted-foreground">Cupom</label>
                  <Input
                    value={p.couponCode || ""}
                    onChange={(e) =>
                      setForm({ ...form, partnership: { ...p, couponCode: e.target.value || null } })
                    }
                  />
                  <label className="flex items-center gap-2 text-sm text-body">
                    <input
                      type="checkbox"
                      checked={p.courseReleased}
                      onChange={(e) =>
                        setForm({ ...form, partnership: { ...p, courseReleased: e.target.checked } })
                      }
                    />
                    Curso liberado
                  </label>
                </>
              )}

              <p className="text-xs font-semibold uppercase text-muted-foreground">Metas mensais</p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {(["metaFeed", "metaStories", "metaTiktok", "metaYoutube"] as const).map((field, i) => (
                  <div key={field}>
                    <label className="text-xs text-muted-foreground">
                      {["Feed", "Stories", "TikTok", "YouTube"][i]}
                    </label>
                    <Input
                      type="number"
                      value={p[field]}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          partnership: { ...p, [field]: Number(e.target.value) || 0 },
                        })
                      }
                    />
                  </div>
                ))}
              </div>

              <label className="block text-xs font-medium text-muted-foreground">Início da parceria</label>
              <Input
                type="date"
                value={p.startDate ? p.startDate.slice(0, 10) : ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    partnership: {
                      ...p,
                      startDate: e.target.value ? new Date(e.target.value).toISOString() : null,
                    },
                  })
                }
              />

              <label className="block text-xs font-medium text-muted-foreground">Observações / alertas</label>
              <Textarea
                rows={3}
                value={form.alerts || ""}
                onChange={(e) => setForm({ ...form, alerts: e.target.value || null })}
              />

              <QuickNotesInlinePanel
                ambassadorId={form.id}
                ambassadorName={displayName(form)}
                onChanged={load}
              />
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <Button variant="secondary" onClick={closeEdit}>Cancelar</Button>
              <Button onClick={saveEdit} disabled={saving}>{saving ? "Salvando…" : "Salvar"}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
