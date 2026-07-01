"use client";

import { useEffect, useMemo, useState } from "react";
import { MonthPicker } from "@/components/month-picker";
import { PAYMENT_STATUSES } from "@/lib/constants";
import { usePersistedMonthRef } from "@/lib/use-persisted-month-ref";
import { useVertical } from "@/components/vertical-context";
import { useSavedViews } from "@/lib/view-system/use-saved-views";
import { applyViewPipeline } from "@/lib/view-system/apply-view";
import type { FilterOption, GroupByKey, SortOption } from "@/lib/view-system/types";
import { ViewToolbar } from "@/components/views/view-toolbar";
import {
  FinanceiroBoardView,
  FinanceiroGalleryView,
  FinanceiroTableView,
} from "@/components/financeiro/financeiro-views";
import { FinanceEmailModal } from "@/components/financeiro/finance-email-modal";
import { FinanceiroValueModal } from "@/components/financeiro/financeiro-value-modal";
import { TermoDataModal } from "@/components/financeiro/termo-data-modal";
import type { FinanceiroRow } from "@/components/financeiro/types";

const GROUP_OPTIONS: { key: GroupByKey; label: string }[] = [
  { key: "none", label: "Nenhum" },
  { key: "status", label: "Status pagamento" },
  { key: "program", label: "Vertical" },
];

const SORT_OPTIONS: SortOption[] = [
  { key: "name", label: "Nome" },
  { key: "pct", label: "% entregas" },
  { key: "amount", label: "A pagar" },
  { key: "status", label: "Status" },
];

const FILTER_OPTIONS: FilterOption[] = PAYMENT_STATUSES.map((s) => ({ value: s, label: s }));

type EmailModalState = {
  financeId: string;
  action: string;
  subject: string;
  html: string;
  recipient: string;
  termLink?: string | null;
};

export function FinanceiroClient() {
  const { vertical } = useVertical();
  const { views, activeView, setActiveViewId, addView, updateView, removeView } =
    useSavedViews("financeiro");

  const [monthRef, setMonthRef] = usePersistedMonthRef("super-financeiro:monthRef");
  const [rows, setRows] = useState<FinanceiroRow[]>([]);
  const [loading, setLoading] = useState<string | null>(null);
  const [emailModal, setEmailModal] = useState<EmailModalState | null>(null);
  const [termoModalRow, setTermoModalRow] = useState<FinanceiroRow | null>(null);
  const [valueModalRow, setValueModalRow] = useState<FinanceiroRow | null>(null);
  const [savingTermoData, setSavingTermoData] = useState(false);
  const [savingValueData, setSavingValueData] = useState(false);

  async function load() {
    const res = await fetch(`/api/financeiro?monthRef=${monthRef}&program=${vertical}`, {
      cache: "no-store",
    });
    setRows(await res.json());
  }

  useEffect(() => {
    load();
  }, [monthRef, vertical]);

  async function runAction(financeId: string, action: string) {
    setLoading(financeId + action);
    await fetch("/api/financeiro/actions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ financeId, action }),
    });
    setLoading(null);
    load();
  }

  async function requestEmailAction(financeId: string, action: string) {
    setLoading(financeId + "preview");
    const res = await fetch("/api/financeiro/actions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ financeId, action, previewOnly: true }),
    });
    const data = await res.json();
    setLoading(null);
    if (!res.ok) {
      alert(data.error || "Erro ao preparar e-mail");
      return;
    }
    setEmailModal({
      financeId,
      action,
      subject: data.subject,
      html: data.html,
      recipient: data.recipient,
      termLink: data.termLink ?? null,
    });
  }

  async function confirmEmailSend(payload: { subject: string; html: string }) {
    if (!emailModal) return;
    setLoading(emailModal.financeId + "send");
    await fetch("/api/financeiro/actions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        financeId: emailModal.financeId,
        action: emailModal.action,
        subject: payload.subject,
        html: payload.html,
      }),
    });
    setEmailModal(null);
    setLoading(null);
    load();
  }

  async function generateTermo(financeId: string, force = false) {
    setLoading(financeId);
    const res = await fetch(`/api/financeiro/${financeId}/termo`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ force }),
    });
    const data = await res.json();
    setLoading(null);
    if (!res.ok) {
      alert(data.error || "Erro ao gerar termo");
      return;
    }
    load();
  }

  async function openTermoModal(row: FinanceiroRow) {
    const res = await fetch(`/api/financeiro/${row.id}`, { cache: "no-store" });
    if (!res.ok) {
      alert("Não foi possível carregar os dados do termo");
      return;
    }
    setTermoModalRow(await res.json());
  }

  async function saveTermoData(data: {
    legalCpf: string;
    legalAddress: string;
    bankDetails: string;
  }) {
    if (!termoModalRow) return;
    setSavingTermoData(true);
    const res = await fetch(`/api/financeiro/${termoModalRow.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const raw = await res.text();
    let json: { error?: string; id?: string; ambassador?: FinanceiroRow["ambassador"] } = {};
    try {
      json = raw ? JSON.parse(raw) : {};
    } catch {
      json = {};
    }
    if (!res.ok) {
      alert(json.error || raw || "Erro ao salvar dados do termo");
      setSavingTermoData(false);
      return;
    }
    setRows((prev) =>
      prev.map((r) => (r.id === json.id ? { ...r, ...json, ambassador: json.ambassador! } : r))
    );
    setSavingTermoData(false);
    setTermoModalRow(null);
    await load();
  }

  async function openValueModal(row: FinanceiroRow) {
    const res = await fetch(`/api/financeiro/${row.id}`, { cache: "no-store" });
    if (!res.ok) {
      alert("Não foi possível carregar os dados do mês");
      return;
    }
    setValueModalRow(await res.json());
  }

  async function saveValueData(data: {
    agreedValue: number | null;
    valueLocked: boolean;
    valueChangeNote: string;
    applyToFutureMonths: boolean;
    updatePartnershipDefault: boolean;
  }) {
    if (!valueModalRow) return;
    setSavingValueData(true);
    const res = await fetch(`/api/financeiro/${valueModalRow.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const raw = await res.text();
    let json: { error?: string } = {};
    try {
      json = raw ? JSON.parse(raw) : {};
    } catch {
      json = {};
    }
    if (!res.ok) {
      alert(json.error || raw || "Erro ao salvar valor");
      setSavingValueData(false);
      return;
    }
    setSavingValueData(false);
    setValueModalRow(null);
    await load();
  }

  async function updatePaymentStatus(id: string, paymentStatus: string) {
    await fetch(`/api/financeiro/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentStatus }),
    });
    load();
  }

  const filtered = useMemo(
    () =>
      applyViewPipeline(rows, activeView, {
        searchText: (f) =>
          [f.ambassador.fullName, f.ambassador.instagram, f.ambassador.email, f.paymentStatus]
            .filter(Boolean)
            .join(" "),
        getFilterStatus: (f) => f.paymentStatus,
        defaultSortKey: "name",
        sorters: {
          name: (a, b) => a.ambassador.fullName.localeCompare(b.ambassador.fullName, "pt-BR"),
          pct: (a, b) => a.pctDelivered - b.pctDelivered,
          amount: (a, b) => (a.amountDue ?? 0) - (b.amountDue ?? 0),
          status: (a, b) => a.paymentStatus.localeCompare(b.paymentStatus, "pt-BR"),
        },
      }),
    [rows, activeView]
  );

  const cardProps = {
    loading,
    onAction: runAction,
    onEmailAction: requestEmailAction,
    onGenerateTermo: generateTermo,
    onEditTermoData: openTermoModal,
    onEditValue: openValueModal,
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <MonthPicker value={monthRef} onChange={setMonthRef} />
        <p className="text-sm text-muted-foreground">
          {rows.length} registros
          {filtered.length !== rows.length && ` · ${filtered.length} na view`}
        </p>
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
      />

      {activeView.type === "table" && (
        <FinanceiroTableView items={filtered} groupBy={activeView.groupBy} {...cardProps} />
      )}
      {activeView.type === "gallery" && (
        <FinanceiroGalleryView items={filtered} groupBy={activeView.groupBy} {...cardProps} />
      )}
      {activeView.type === "board" && (
        <FinanceiroBoardView
          items={filtered}
          groupBy={activeView.groupBy}
          onMove={updatePaymentStatus}
          {...cardProps}
        />
      )}

      <FinanceEmailModal
        open={!!emailModal}
        action={emailModal?.action || ""}
        subject={emailModal?.subject || ""}
        html={emailModal?.html || ""}
        recipient={emailModal?.recipient || ""}
        termLink={emailModal?.termLink}
        sending={loading?.endsWith("send") || false}
        onClose={() => setEmailModal(null)}
        onSend={confirmEmailSend}
      />

      <TermoDataModal
        open={!!termoModalRow}
        row={termoModalRow}
        saving={savingTermoData}
        onClose={() => setTermoModalRow(null)}
        onSave={saveTermoData}
      />

      <FinanceiroValueModal
        open={!!valueModalRow}
        row={valueModalRow}
        saving={savingValueData}
        onClose={() => setValueModalRow(null)}
        onSave={saveValueData}
      />
    </div>
  );
}
