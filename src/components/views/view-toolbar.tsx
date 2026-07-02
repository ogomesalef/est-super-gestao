"use client";

import {
  ArrowDownAZ,
  ArrowUpAZ,
  ChevronDown,
  Columns3,
  LayoutGrid,
  Plus,
  Search,
  SlidersHorizontal,
  Table2,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import type {
  FilterOption,
  GroupByKey,
  SavedView,
  SortOption,
  ViewType,
} from "@/lib/view-system/types";
import { VIEW_TYPE_LABELS } from "@/lib/view-system/types";
import type { BoardColumnOption } from "@/components/views/board-column-picker";
import { BoardColumnPicker } from "@/components/views/board-column-picker";
import { Button, Input, Select } from "@/components/ui";

const VIEW_ICONS: Record<ViewType, typeof Table2> = {
  table: Table2,
  gallery: LayoutGrid,
  board: Columns3,
};

type GroupOption = { key: GroupByKey; label: string };

export function ViewToolbar({
  views,
  activeView,
  groupOptions,
  sortOptions,
  filterOptions,
  onSelectView,
  onAddView,
  onUpdateView,
  onRemoveView,
  boardColumnOptions,
}: {
  views: SavedView[];
  activeView: SavedView;
  groupOptions: GroupOption[];
  sortOptions?: SortOption[];
  filterOptions?: FilterOption[];
  onSelectView: (id: string) => void;
  onAddView: () => void;
  onUpdateView: (id: string, patch: Partial<SavedView>) => void;
  onRemoveView: (id: string) => void;
  boardColumnOptions?: BoardColumnOption[];
}) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const SortIcon = activeView.sortDir === "desc" ? ArrowDownAZ : ArrowUpAZ;

  return (
    <div className="mb-4 space-y-3 rounded-xl border border-hairline bg-white/80 p-2 shadow-hairline backdrop-blur-sm">
      <div className="flex flex-wrap items-center gap-1">
        {views.map((view) => {
          const Icon = VIEW_ICONS[view.type];
          const active = view.id === activeView.id;
          return (
            <div key={view.id} className="group relative flex items-center">
              <button
                type="button"
                onClick={() => onSelectView(view.id)}
                className={cn(
                  "flex min-h-9 items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm transition-colors sm:min-h-0",
                  active
                    ? "bg-surface font-medium text-ink shadow-hairline"
                    : "text-muted-foreground hover:bg-surface/60 hover:text-ink"
                )}
              >
                <Icon className="h-3.5 w-3.5 shrink-0 opacity-70" />
                <span className="max-w-[9rem] truncate">{view.name}</span>
              </button>
              {active && views.length > 1 && (
                <button
                  type="button"
                  title="Remover view"
                  onClick={() => onRemoveView(view.id)}
                  className="ml-0.5 inline-flex rounded px-1.5 py-1 text-xs text-muted-foreground hover:bg-destructive/10 hover:text-destructive lg:hidden lg:group-hover:inline-flex"
                >
                  ×
                </button>
              )}
            </div>
          );
        })}
        <button
          type="button"
          onClick={onAddView}
          className="flex min-h-9 items-center gap-1 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-surface hover:text-ink sm:min-h-0"
          title="Nova view"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <div className="sm:hidden">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full justify-between"
          onClick={() => setFiltersOpen((v) => !v)}
        >
          <span className="inline-flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4" />
            Filtros e ordenação
          </span>
          <ChevronDown className={cn("h-4 w-4 transition-transform", filtersOpen && "rotate-180")} />
        </Button>
      </div>

      <div
        className={cn(
          "flex flex-wrap items-center gap-3 border-t border-hairline/60 pt-2",
          !filtersOpen && "hidden sm:flex"
        )}
      >
        <div className="relative w-full min-w-0 flex-1 sm:min-w-[10rem] sm:max-w-xs">
          <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar..."
            value={activeView.search}
            onChange={(e) => onUpdateView(activeView.id, { search: e.target.value })}
            className="h-9 pl-8 text-xs sm:h-8"
          />
        </div>

        {filterOptions && filterOptions.length > 0 && (
          <div className="flex w-full items-center gap-2 sm:w-auto">
            <span className="text-xs text-muted-foreground">Filtro</span>
            <Select
              value={activeView.filterStatus}
              onChange={(e) => onUpdateView(activeView.id, { filterStatus: e.target.value })}
              className="h-9 w-full min-w-0 text-xs sm:h-8 sm:w-auto sm:min-w-[8rem] sm:max-w-[14rem]"
            >
              <option value="">Todos</option>
              {filterOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          </div>
        )}

        {sortOptions && sortOptions.length > 0 && (
          <div className="flex w-full items-center gap-1 sm:w-auto">
            <span className="text-xs text-muted-foreground">Ordenar</span>
            <Select
              value={activeView.sortKey}
              onChange={(e) => onUpdateView(activeView.id, { sortKey: e.target.value })}
              className="h-9 w-full min-w-0 flex-1 text-xs sm:h-8 sm:w-auto sm:min-w-[7rem]"
            >
              {sortOptions.map((o) => (
                <option key={o.key} value={o.key}>
                  {o.label}
                </option>
              ))}
            </Select>
            <button
              type="button"
              title={activeView.sortDir === "desc" ? "Decrescente" : "Crescente"}
              onClick={() =>
                onUpdateView(activeView.id, {
                  sortDir: activeView.sortDir === "desc" ? "asc" : "desc",
                })
              }
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-hairline text-muted-foreground hover:bg-surface hover:text-ink sm:h-8 sm:w-8"
            >
              <SortIcon className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        <div className="flex w-full items-center gap-2 sm:w-auto">
          <span className="hidden text-xs text-muted-foreground sm:inline">Tipo</span>
          <div className="flex w-full rounded-lg border border-hairline bg-canvas p-0.5 sm:w-auto">
            {(["table", "gallery", "board"] as ViewType[]).map((type) => {
              const Icon = VIEW_ICONS[type];
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => onUpdateView(activeView.id, { type })}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-1 rounded-md px-2 py-1.5 text-xs transition-colors sm:flex-none sm:py-1",
                    activeView.type === type
                      ? "bg-white font-medium text-ink shadow-hairline"
                      : "text-muted-foreground hover:text-ink"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{VIEW_TYPE_LABELS[type]}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex w-full items-center gap-2 sm:w-auto">
          <span className="text-xs text-muted-foreground">Agrupar</span>
          <Select
            value={activeView.groupBy}
            onChange={(e) =>
              onUpdateView(activeView.id, { groupBy: e.target.value as GroupByKey })
            }
            className="h-9 w-full min-w-0 text-xs sm:h-8 sm:w-auto sm:min-w-[8rem]"
          >
            {groupOptions.map((o) => (
              <option key={o.key} value={o.key}>
                {o.label}
              </option>
            ))}
          </Select>
        </div>

        {activeView.type === "board" && boardColumnOptions && boardColumnOptions.length > 0 && (
          <BoardColumnPicker
            columns={boardColumnOptions}
            hiddenKeys={activeView.hiddenGroups || []}
            groupBy={activeView.groupBy}
            onChange={(hiddenGroups) => onUpdateView(activeView.id, { hiddenGroups })}
          />
        )}

        <div className="flex w-full items-center gap-2 sm:w-auto">
          <input
            value={activeView.name}
            onChange={(e) => onUpdateView(activeView.id, { name: e.target.value })}
            className="h-9 w-full rounded-md border border-hairline bg-canvas px-2 text-xs text-ink focus:outline-none focus:ring-1 focus:ring-ring/50 sm:h-8 sm:w-28"
            title="Nome da view"
          />
        </div>
      </div>
    </div>
  );
}
