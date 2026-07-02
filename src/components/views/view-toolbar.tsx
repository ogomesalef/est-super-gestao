"use client";

import {
  ArrowDownAZ,
  ArrowUpAZ,
  Columns3,
  LayoutGrid,
  Plus,
  Search,
  Table2,
} from "lucide-react";
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
import { Input, Select } from "@/components/ui";

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
  /** Opções de coluna quando a view é quadro (toggle visibilidade estilo Notion). */
  boardColumnOptions?: BoardColumnOption[];
}) {
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
                  "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm transition-colors",
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
                  className="ml-0.5 hidden rounded px-1 text-xs text-muted-foreground hover:bg-destructive/10 hover:text-destructive group-hover:inline"
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
          className="flex items-center gap-1 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-surface hover:text-ink"
          title="Nova view"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-hairline/60 pt-2">
        <div className="relative min-w-[10rem] flex-1 max-w-xs">
          <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar..."
            value={activeView.search}
            onChange={(e) => onUpdateView(activeView.id, { search: e.target.value })}
            className="h-8 pl-8 text-xs"
          />
        </div>

        {filterOptions && filterOptions.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Filtro</span>
            <Select
              value={activeView.filterStatus}
              onChange={(e) => onUpdateView(activeView.id, { filterStatus: e.target.value })}
              className="h-8 w-auto min-w-[8rem] max-w-[14rem] text-xs"
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
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground">Ordenar</span>
            <Select
              value={activeView.sortKey}
              onChange={(e) => onUpdateView(activeView.id, { sortKey: e.target.value })}
              className="h-8 w-auto min-w-[7rem] text-xs"
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
              className="flex h-8 w-8 items-center justify-center rounded-md border border-hairline text-muted-foreground hover:bg-surface hover:text-ink"
            >
              <SortIcon className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Tipo</span>
          <div className="flex rounded-lg border border-hairline bg-canvas p-0.5">
            {(["table", "gallery", "board"] as ViewType[]).map((type) => {
              const Icon = VIEW_ICONS[type];
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => onUpdateView(activeView.id, { type })}
                  className={cn(
                    "flex items-center gap-1 rounded-md px-2 py-1 text-xs transition-colors",
                    activeView.type === type
                      ? "bg-white font-medium text-ink shadow-hairline"
                      : "text-muted-foreground hover:text-ink"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {VIEW_TYPE_LABELS[type]}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Agrupar</span>
          <Select
            value={activeView.groupBy}
            onChange={(e) =>
              onUpdateView(activeView.id, { groupBy: e.target.value as GroupByKey })
            }
            className="h-8 w-auto min-w-[8rem] text-xs"
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

        <div className="flex items-center gap-2">
          <input
            value={activeView.name}
            onChange={(e) => onUpdateView(activeView.id, { name: e.target.value })}
            className="h-8 w-28 rounded-md border border-hairline bg-canvas px-2 text-xs text-ink focus:outline-none focus:ring-1 focus:ring-ring/50"
            title="Nome da view"
          />
        </div>
      </div>
    </div>
  );
}
