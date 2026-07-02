"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Columns3, EyeOff } from "lucide-react";
import { groupHeaderColor } from "@/lib/status-colors";
import type { GroupByKey } from "@/lib/view-system/types";
import { cn } from "@/lib/utils";

export type BoardColumnOption = {
  key: string;
  label?: string;
  styleAs?: string;
};

export function BoardColumnPicker({
  columns,
  hiddenKeys,
  groupBy,
  onChange,
}: {
  columns: BoardColumnOption[];
  hiddenKeys: string[];
  groupBy: GroupByKey;
  onChange: (hiddenKeys: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const hidden = new Set(hiddenKeys);
  const visibleCount = columns.filter((c) => !hidden.has(c.key)).length;

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  function toggle(key: string) {
    const next = new Set(hiddenKeys);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    onChange(Array.from(next));
  }

  function showAll() {
    onChange([]);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex h-8 items-center gap-1.5 rounded-md border border-hairline px-2.5 text-xs transition-colors",
          open ? "bg-surface text-ink" : "text-muted-foreground hover:bg-surface hover:text-ink"
        )}
        title="Escolher colunas visíveis"
      >
        <Columns3 className="h-3.5 w-3.5" />
        Colunas
        {hidden.size > 0 && (
          <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-900">
            {visibleCount}/{columns.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-w-[calc(100vw-1rem)] rounded-lg border border-hairline bg-card p-2 shadow-elev sm:right-auto sm:w-56">
          <div className="mb-2 flex items-center justify-between px-1">
            <p className="text-xs font-semibold text-ink">Colunas do quadro</p>
            {hidden.size > 0 && (
              <button
                type="button"
                onClick={showAll}
                className="text-[11px] font-medium text-primary hover:underline"
              >
                Mostrar todas
              </button>
            )}
          </div>
          <ul className="max-h-64 space-y-0.5 overflow-y-auto">
            {columns.map((col) => {
              const label = col.label || col.key;
              const styleKey = col.styleAs || col.key;
              const isVisible = !hidden.has(col.key);
              return (
                <li key={col.key}>
                  <button
                    type="button"
                    onClick={() => toggle(col.key)}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs hover:bg-surface",
                      !isVisible && "opacity-60"
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                        isVisible
                          ? "border-primary bg-primary text-white"
                          : "border-hairline bg-canvas text-transparent"
                      )}
                    >
                      {isVisible && <Check className="h-3 w-3" strokeWidth={3} />}
                    </span>
                    <span
                      className={cn(
                        "truncate rounded px-1.5 py-0.5 text-[11px] font-medium",
                        groupHeaderColor(styleKey, groupBy === "none" ? "status" : groupBy)
                      )}
                    >
                      {label}
                    </span>
                    {!isVisible && <EyeOff className="ml-auto h-3 w-3 text-muted-foreground" />}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
