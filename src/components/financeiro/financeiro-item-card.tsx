"use client";

import { AmbassadorNameLink } from "@/components/ambassador-name-link";
import {
  QuickNoteCardBadges,
  QuickNoteContextTarget,
} from "@/components/ambassador/ambassador-quick-notes";
import { VerticalBadge } from "@/components/vertical-badge";
import { NotionPill } from "@/components/views/notion-pill";
import { cn } from "@/lib/utils";
import { FinanceiroCardActions } from "./financeiro-card-actions";
import type { FinanceiroRow } from "./types";

type FinanceiroItemCardProps = {
  row: FinanceiroRow;
  loading: string | null;
  onAction: (id: string, action: string) => void;
  onEmailAction: (id: string, action: string) => void;
  onGenerateTermo: (id: string, force?: boolean) => void;
  onEditTermoData: (row: FinanceiroRow) => void;
  onEditValue: (row: FinanceiroRow) => void;
  onNotesChanged?: () => void;
  className?: string;
  draggable?: boolean;
  dragActive?: boolean;
  onDragStart?: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragEnd?: () => void;
};

function programAccent(program: string): string {
  return program === "ECJ" ? "#D08C00" : "#6B0A09";
}

export function FinanceiroItemCard({
  row,
  loading,
  onAction,
  onEmailAction,
  onGenerateTermo,
  onEditTermoData,
  onEditValue,
  onNotesChanged,
  className,
  draggable,
  dragActive,
  onDragStart,
  onDragEnd,
}: FinanceiroItemCardProps) {
  function handleDragStart(e: React.DragEvent<HTMLDivElement>) {
    const target = e.target as HTMLElement;
    if (target.closest("button, a, select, input, textarea, [data-no-drag]")) {
      e.preventDefault();
      return;
    }
    onDragStart?.(e);
  }

  return (
    <QuickNoteContextTarget
      ambassadorId={row.ambassador.id}
      ambassadorName={row.ambassador.fullName}
      onChanged={onNotesChanged}
      className={cn(
        "overflow-hidden rounded-xl border border-hairline bg-white shadow-soft",
        draggable && "cursor-grab active:cursor-grabbing",
        dragActive && "opacity-50 ring-2 ring-primary/30",
        className
      )}
    >
      <div
        draggable={draggable}
        onDragStart={handleDragStart}
        onDragEnd={onDragEnd}
      >
      <div className="h-2 w-full" style={{ backgroundColor: programAccent(row.ambassador.program) }} />
      <div className="space-y-3 p-4">
        <div>
          <AmbassadorNameLink
            id={row.ambassador.id}
            onNotesChanged={onNotesChanged}
            contextMenu={false}
          >
            {row.ambassador.fullName}
          </AmbassadorNameLink>
          <p className="text-sm text-muted-foreground">{row.ambassador.instagram}</p>
        </div>
        <QuickNoteCardBadges notes={row.ambassador.quickNotes} />
        <div className="flex flex-wrap gap-1.5">
          <VerticalBadge vertical={row.ambassador.program} />
          <NotionPill kind="payment">{row.paymentStatus}</NotionPill>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{row.pctDelivered.toFixed(0)}% entregas</span>
          <span className="font-medium tabular text-ink">R$ {row.amountDue?.toFixed(2) ?? "—"}</span>
        </div>
        <FinanceiroCardActions
          row={row}
          loading={loading}
          onAction={onAction}
          onEmailAction={onEmailAction}
          onGenerateTermo={onGenerateTermo}
          onEditTermoData={onEditTermoData}
          onEditValue={onEditValue}
          compact
        />
      </div>
      </div>
    </QuickNoteContextTarget>
  );
}
