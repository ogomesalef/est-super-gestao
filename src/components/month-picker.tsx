"use client";

import { useEffect, useRef, useState } from "react";
import { Calendar, Check, ChevronDown } from "lucide-react";
import { cn, currentMonthRef, formatMonthRefLong, recentMonthRefs } from "@/lib/utils";

export function MonthPicker({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (monthRef: string) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const months = recentMonthRefs();
  const current = currentMonthRef();

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function select(monthRef: string) {
    onChange(monthRef);
    setOpen(false);
  }

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className={cn(
          "inline-flex items-center gap-2 rounded-md border border-hairline bg-canvas px-3 py-1.5 text-sm text-ink shadow-hairline transition-colors hover:bg-surface",
          open && "bg-surface ring-2 ring-ring/60 ring-offset-2 ring-offset-canvas"
        )}
      >
        <Calendar className="h-4 w-4 shrink-0 text-muted-foreground" />
        <span className="font-medium capitalize">{formatMonthRefLong(value)}</span>
        <ChevronDown
          className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")}
        />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Selecionar mês"
          className="absolute left-0 top-full z-50 mt-1 max-h-72 w-56 overflow-y-auto rounded-lg border border-hairline bg-card py-1 shadow-elev"
        >
          {months.map((monthRef) => {
            const selected = monthRef === value;
            const isCurrent = monthRef === current;
            return (
              <button
                key={monthRef}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => select(monthRef)}
                className={cn(
                  "flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-surface",
                  selected && "bg-surface font-medium text-ink"
                )}
              >
                <Check
                  className={cn("h-4 w-4 shrink-0 text-primary", selected ? "opacity-100" : "opacity-0")}
                />
                <span className="flex-1 capitalize">{formatMonthRefLong(monthRef)}</span>
                {isCurrent && !selected && (
                  <span className="text-[0.65rem] font-medium uppercase tracking-wide text-muted-foreground">
                    Atual
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
