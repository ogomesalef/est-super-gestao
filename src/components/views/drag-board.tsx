"use client";

import { useMemo, useState, type ReactNode } from "react";
import { GripVertical } from "lucide-react";
import { groupHeaderColor } from "@/lib/status-colors";
import { reorderGroupKeys, resolveGroupOrder } from "@/lib/view-system/group-order";
import type { GroupByKey } from "@/lib/view-system/types";
import { cn } from "@/lib/utils";

const COLUMN_MIME = "application/x-board-column";

export type DragBoardGroup<T> = {
  key: string;
  items: T[];
  label?: string;
  styleAs?: string;
};

type DragBoardProps<T> = {
  groups: DragBoardGroup<T>[];
  groupBy: GroupByKey;
  defaultColumnOrder?: readonly string[];
  columnOrder?: string[];
  hiddenColumnKeys?: string[];
  onColumnOrderChange?: (order: string[]) => void;
  onItemDrop?: (itemId: string, columnKey: string) => void;
  getItemId: (item: T) => string;
  renderCard: (item: T, ctx: { dragging: boolean }) => ReactNode;
  columnClassName?: string;
  columnWidth?: string;
};

export function DragBoard<T>({
  groups,
  groupBy,
  defaultColumnOrder,
  columnOrder,
  hiddenColumnKeys,
  onColumnOrderChange,
  onItemDrop,
  getItemId,
  renderCard,
  columnClassName,
  columnWidth = "w-72",
}: DragBoardProps<T>) {
  const [dragItemId, setDragItemId] = useState<string | null>(null);
  const [dragColumnKey, setDragColumnKey] = useState<string | null>(null);
  const [dragOverColumnKey, setDragOverColumnKey] = useState<string | null>(null);

  const orderedGroups = useMemo(() => {
    const keys = groups.map((g) => g.key);
    const order = resolveGroupOrder(defaultColumnOrder || keys, columnOrder, keys);
    const byKey = new Map(groups.map((g) => [g.key, g]));
    const result: DragBoardGroup<T>[] = [];
    const seen = new Set<string>();
    for (const key of order) {
      const group = byKey.get(key);
      if (group) {
        result.push(group);
        seen.add(key);
      } else if (defaultColumnOrder?.includes(key)) {
        result.push({ key, items: [] });
        seen.add(key);
      }
    }
    for (const group of groups) {
      if (!seen.has(group.key)) result.push(group);
    }
    return result;
  }, [groups, defaultColumnOrder, columnOrder]);

  const visibleGroups = useMemo(() => {
    if (!hiddenColumnKeys?.length) return orderedGroups;
    const hidden = new Set(hiddenColumnKeys);
    return orderedGroups.filter((g) => !hidden.has(g.key));
  }, [orderedGroups, hiddenColumnKeys]);

  function handleColumnDrop(targetKey: string) {
    if (!dragColumnKey || dragColumnKey === targetKey) return;
    const currentOrder = visibleGroups.map((g) => g.key);
    const next = reorderGroupKeys(currentOrder, dragColumnKey, targetKey);
    onColumnOrderChange?.(next);
    setDragColumnKey(null);
    setDragOverColumnKey(null);
  }

  function handleItemDrop(targetKey: string) {
    if (!onItemDrop || !dragItemId) return;
    onItemDrop(dragItemId, targetKey);
    setDragItemId(null);
  }

  return (
    <div className="space-y-2">
      {visibleGroups.length === 0 && (
        <p className="rounded-lg border border-dashed border-hairline px-4 py-8 text-center text-sm text-muted-foreground">
          Nenhuma coluna visível. Abra <strong>Colunas</strong> na barra acima e marque os status que
          quer ver.
        </p>
      )}
      <div className="flex gap-4 overflow-x-auto pb-4">
      {visibleGroups.map((group) => {
        const label = group.label || group.key;
        const styleKey = group.styleAs || group.key;
        const isColumnTarget = dragOverColumnKey === group.key && dragColumnKey;

        return (
          <div
            key={group.key}
            className={cn(
              "shrink-0 rounded-xl bg-surface/60 p-2 transition-shadow",
              columnWidth,
              columnClassName,
              isColumnTarget && "ring-2 ring-primary/40"
            )}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOverColumnKey(group.key);
            }}
            onDragLeave={() => {
              if (dragOverColumnKey === group.key) setDragOverColumnKey(null);
            }}
            onDrop={(e) => {
              e.preventDefault();
              const col = e.dataTransfer.getData(COLUMN_MIME);
              if (col) handleColumnDrop(group.key);
              else handleItemDrop(group.key);
              setDragOverColumnKey(null);
            }}
          >
            <div
              className={cn(
                "mb-2 flex items-center gap-1 rounded-md px-1 py-0.5",
                dragColumnKey === group.key && "opacity-60"
              )}
            >
              <button
                type="button"
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData(COLUMN_MIME, group.key);
                  e.dataTransfer.effectAllowed = "move";
                  setDragColumnKey(group.key);
                }}
                onDragEnd={() => {
                  setDragColumnKey(null);
                  setDragOverColumnKey(null);
                }}
                className="cursor-grab rounded p-0.5 text-muted-foreground hover:bg-surface hover:text-ink active:cursor-grabbing"
                title="Arrastar coluna"
                aria-label={`Reordenar coluna ${label}`}
              >
                <GripVertical className="h-4 w-4" />
              </button>
              <span
                className={cn(
                  "rounded px-2 py-0.5 text-xs font-semibold",
                  groupHeaderColor(styleKey, groupBy)
                )}
              >
                {label}
              </span>
              <span className="text-xs text-muted-foreground">{group.items.length}</span>
            </div>

            <div className="min-h-[120px] space-y-2">
              {group.items.map((item) => {
                const id = getItemId(item);
                const dragging = dragItemId === id;
                return (
                  <div
                    key={id}
                    draggable={!!onItemDrop}
                    onDragStart={(e) => {
                      if (!onItemDrop) return;
                      e.dataTransfer.setData("text/plain", id);
                      e.dataTransfer.effectAllowed = "move";
                      setDragItemId(id);
                    }}
                    onDragEnd={() => setDragItemId(null)}
                    className={cn(
                      onItemDrop && "cursor-grab active:cursor-grabbing",
                      dragging && "opacity-50 ring-2 ring-primary/30"
                    )}
                  >
                    {renderCard(item, { dragging })}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
      </div>
    </div>
  );
}
