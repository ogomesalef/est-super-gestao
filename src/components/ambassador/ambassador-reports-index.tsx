"use client";

import { useMemo, useState } from "react";
import { ViewToolbar } from "@/components/views/view-toolbar";
import {
  ReportsBoardView,
  ReportsGalleryView,
  ReportsTableView,
} from "@/components/ambassador/ambassador-reports-views";
import { MODALITIES, VERTICAL_CONFIG, type Vertical } from "@/lib/constants";
import type { AmbassadorReportIndexItem } from "@/lib/ambassador-report";
import { applyViewPipeline } from "@/lib/view-system/apply-view";
import { useSavedViews } from "@/lib/view-system/use-saved-views";
import type { FilterOption, GroupByKey, SortOption } from "@/lib/view-system/types";
import { verticalCardClass, verticalTitleClass } from "@/lib/vertical-styles";
import { cn } from "@/lib/utils";

const GROUP_OPTIONS: { key: GroupByKey; label: string }[] = [
  { key: "none", label: "Nenhum" },
  { key: "modality", label: "Modalidade" },
  { key: "program", label: "Vertical" },
];

const SORT_OPTIONS: SortOption[] = [
  { key: "name", label: "Nome" },
  { key: "deliveries", label: "Entregas" },
  { key: "pct", label: "% mês atual" },
  { key: "startDate", label: "Início" },
];

const FILTER_OPTIONS: FilterOption[] = MODALITIES.map((m) => ({ value: m, label: m }));

function VerticalFilterCard({
  vertical,
  active,
  count,
  onClick,
}: {
  vertical: Vertical;
  active: boolean;
  count: number;
  onClick: () => void;
}) {
  const cfg = VERTICAL_CONFIG[vertical];
  const label = vertical === "OAB" ? "Estratégia OAB" : "Carreira Jurídica";

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(verticalCardClass(vertical, active), "w-full p-4 text-left")}
    >
      <div className="absolute inset-y-0 left-0 w-1.5" style={{ backgroundColor: cfg.color }} aria-hidden />
      <div className="pl-2">
        <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">Vertical</p>
        <p className={cn("font-serif text-xl font-bold", verticalTitleClass(vertical))}>{vertical}</p>
        <p className="mt-0.5 text-sm text-body">{label}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {count} embaixador{count === 1 ? "" : "es"} ativo{count === 1 ? "" : "s"}
        </p>
      </div>
      {active ? (
        <span
          className={cn(
            "absolute right-3 top-3 rounded-full px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wide text-white",
            vertical === "OAB" ? "bg-oab" : "bg-ecj"
          )}
        >
          Ativo
        </span>
      ) : null}
    </button>
  );
}

export function AmbassadorReportsIndex({ items }: { items: AmbassadorReportIndexItem[] }) {
  const [vertical, setVertical] = useState<Vertical>("OAB");
  const { views, activeView, setActiveViewId, addView, updateView, removeView } =
    useSavedViews("relatorios");

  const counts = useMemo(
    () => ({
      OAB: items.filter((i) => i.program === "OAB").length,
      ECJ: items.filter((i) => i.program === "ECJ").length,
    }),
    [items]
  );

  const byVertical = useMemo(
    () => items.filter((i) => i.program === vertical),
    [items, vertical]
  );

  const filtered = useMemo(
    () =>
      applyViewPipeline(byVertical, activeView, {
        searchText: (i) => [i.displayName, i.instagram, i.modality, i.courseName].filter(Boolean).join(" "),
        getFilterStatus: (i) => i.modality || "",
        defaultSortKey: "name",
        sorters: {
          name: (a, b) => a.displayName.localeCompare(b.displayName, "pt-BR"),
          deliveries: (a, b) => a.deliveryCount - b.deliveryCount,
          pct: (a, b) => (a.currentMonthPct ?? -1) - (b.currentMonthPct ?? -1),
          startDate: (a, b) => {
            const da = a.startDate ? new Date(a.startDate).getTime() : 0;
            const db = b.startDate ? new Date(b.startDate).getTime() : 0;
            return da - db;
          },
        },
      }),
    [byVertical, activeView]
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <VerticalFilterCard
          vertical="OAB"
          active={vertical === "OAB"}
          count={counts.OAB}
          onClick={() => setVertical("OAB")}
        />
        <VerticalFilterCard
          vertical="ECJ"
          active={vertical === "ECJ"}
          count={counts.ECJ}
          onClick={() => setVertical("ECJ")}
        />
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

      {filtered.length === 0 ? (
        <p className="rounded-xl border border-hairline bg-card px-5 py-10 text-center text-sm text-muted-foreground">
          Nenhum embaixador ativo nesta vertical.
        </p>
      ) : activeView.type === "table" ? (
        <ReportsTableView items={filtered} groupBy={activeView.groupBy} />
      ) : activeView.type === "gallery" ? (
        <ReportsGalleryView items={filtered} groupBy={activeView.groupBy} />
      ) : (
        <ReportsBoardView items={filtered} groupBy={activeView.groupBy} />
      )}
    </div>
  );
}
