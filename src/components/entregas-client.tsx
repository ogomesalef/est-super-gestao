"use client";

import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui";
import { currentMonthRef } from "@/lib/utils";
import { useVertical } from "@/components/vertical-context";
import { useSavedViews } from "@/lib/view-system/use-saved-views";
import { applyViewPipeline } from "@/lib/view-system/apply-view";
import type { FilterOption, GroupByKey, SortOption } from "@/lib/view-system/types";
import { ViewToolbar } from "@/components/views/view-toolbar";
import {
  EntregasBoardView,
  EntregasGalleryView,
  EntregasTableView,
} from "@/components/entregas/entregas-views";
import { DELIVERY_STATUSES, deliveryStatus, type EntregaControl } from "@/components/entregas/types";

const GROUP_OPTIONS: { key: GroupByKey; label: string }[] = [
  { key: "none", label: "Nenhum" },
  { key: "status", label: "Status entrega" },
  { key: "program", label: "Vertical" },
];

const SORT_OPTIONS: SortOption[] = [
  { key: "name", label: "Nome" },
  { key: "pct", label: "% entregas" },
  { key: "status", label: "Status" },
];

const FILTER_OPTIONS: FilterOption[] = DELIVERY_STATUSES.map((s) => ({ value: s, label: s }));

export function EntregasClient() {
  const { vertical } = useVertical();
  const { views, activeView, setActiveViewId, addView, updateView, removeView } =
    useSavedViews("entregas");

  const [monthRef, setMonthRef] = useState(currentMonthRef());
  const [controls, setControls] = useState<EntregaControl[]>([]);

  async function load() {
    const res = await fetch(`/api/entregas?monthRef=${monthRef}&program=${vertical}`);
    const raw = await res.text();
    if (!raw) {
      setControls([]);
      return;
    }
    try {
      setControls(JSON.parse(raw));
    } catch {
      setControls([]);
    }
  }

  useEffect(() => {
    load();
  }, [monthRef, vertical]);

  async function saveNotes(id: string, notes: string) {
    await fetch(`/api/entregas/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes }),
    });
  }

  const filtered = useMemo(
    () =>
      applyViewPipeline(controls, activeView, {
        searchText: (c) =>
          [c.ambassador.fullName, c.ambassador.instagram, c.notes].filter(Boolean).join(" "),
        getFilterStatus: deliveryStatus,
        defaultSortKey: "name",
        sorters: {
          name: (a, b) => a.ambassador.fullName.localeCompare(b.ambassador.fullName, "pt-BR"),
          pct: (a, b) => a.pctDelivered - b.pctDelivered,
          status: (a, b) => deliveryStatus(a).localeCompare(deliveryStatus(b), "pt-BR"),
        },
      }),
    [controls, activeView]
  );

  const pending = controls.filter((c) => deliveryStatus(c) === "Pendente");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Input type="month" value={monthRef} onChange={(e) => setMonthRef(e.target.value)} className="max-w-xs" />
        <p className="text-sm text-muted-foreground">
          {controls.length} embaixadores · {pending.length} com pendências
          {filtered.length !== controls.length && ` · ${filtered.length} na view`}
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
        <EntregasTableView items={filtered} groupBy={activeView.groupBy} onSaveNotes={saveNotes} />
      )}
      {activeView.type === "gallery" && (
        <EntregasGalleryView items={filtered} groupBy={activeView.groupBy} />
      )}
      {activeView.type === "board" && (
        <EntregasBoardView items={filtered} groupBy={activeView.groupBy} />
      )}
    </div>
  );
}
