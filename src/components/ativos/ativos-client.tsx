"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { useVertical } from "@/components/vertical-context";
import { ViewToolbar } from "@/components/views/view-toolbar";
import {
  AtivosBoardView,
  AtivosGalleryView,
  AtivosTableView,
} from "@/components/ativos/ativos-views";
import type { AtivoItem } from "@/lib/ativos";
import { MODALITIES } from "@/lib/constants";
import { applyViewPipeline } from "@/lib/view-system/apply-view";
import { boardColumnOptionsFor } from "@/lib/view-system/board-columns";
import { useSavedViews } from "@/lib/view-system/use-saved-views";
import type { FilterOption, GroupByKey, SortOption } from "@/lib/view-system/types";

const GROUP_OPTIONS: { key: GroupByKey; label: string }[] = [
  { key: "none", label: "Nenhum" },
  { key: "modality", label: "Modalidade" },
  { key: "program", label: "Vertical" },
];

const SORT_OPTIONS: SortOption[] = [
  { key: "name", label: "Nome" },
  { key: "startDate", label: "Início" },
  { key: "currentPct", label: "% mês atual" },
  { key: "previousPct", label: "% mês anterior" },
];

const FILTER_OPTIONS: FilterOption[] = MODALITIES.map((m) => ({ value: m, label: m }));

export function AtivosClient() {
  const { vertical } = useVertical();
  const { views, activeView, setActiveViewId, addView, updateView, removeView } =
    useSavedViews("ativos");

  const [list, setList] = useState<AtivoItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/ativos?program=${vertical}`, { cache: "no-store" });
    if (res.ok) {
      setList(await res.json());
    }
    setLoading(false);
  }, [vertical]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(
    () =>
      applyViewPipeline(list, activeView, {
        searchText: (a) =>
          [
            a.displayName,
            a.instagram,
            a.email,
            a.whatsapp,
            a.partnership.modality,
            a.partnership.courseName,
            a.partnership.couponCode,
          ]
            .filter(Boolean)
            .join(" "),
        getFilterStatus: (a) => a.partnership.modality || "",
        defaultSortKey: "name",
        sorters: {
          name: (a, b) => a.displayName.localeCompare(b.displayName, "pt-BR"),
          startDate: (a, b) => {
            const da = a.partnership.startDate ? new Date(a.partnership.startDate).getTime() : 0;
            const db = b.partnership.startDate ? new Date(b.partnership.startDate).getTime() : 0;
            return da - db;
          },
          currentPct: (a, b) => (a.currentMonthPct ?? -1) - (b.currentMonthPct ?? -1),
          previousPct: (a, b) => (a.previousMonthPct ?? -1) - (b.previousMonthPct ?? -1),
        },
      }),
    [list, activeView]
  );

  const boardColumns = useMemo(
    () => boardColumnOptionsFor("ativos", activeView.groupBy),
    [activeView.groupBy]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Carregando embaixadores ativos…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {filtered.length} embaixador{filtered.length === 1 ? "" : "es"} ativo
        {filtered.length === 1 ? "" : "s"} · vertical {vertical}
      </p>

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

      {filtered.length === 0 ? (
        <p className="rounded-xl border border-hairline bg-card px-5 py-10 text-center text-sm text-muted-foreground">
          Nenhum embaixador ativo nesta vertical.
        </p>
      ) : activeView.type === "table" ? (
        <AtivosTableView items={filtered} groupBy={activeView.groupBy} />
      ) : activeView.type === "gallery" ? (
        <AtivosGalleryView items={filtered} groupBy={activeView.groupBy} />
      ) : (
        <AtivosBoardView
          items={filtered}
          groupBy={activeView.groupBy}
          columnOrder={activeView.groupOrder}
          hiddenColumnKeys={activeView.hiddenGroups}
          onColumnOrderChange={(order) => updateView(activeView.id, { groupOrder: order })}
        />
      )}
    </div>
  );
}
