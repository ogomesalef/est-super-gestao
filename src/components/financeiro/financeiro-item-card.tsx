"use client";

import { AmbassadorNameLink } from "@/components/ambassador-name-link";
import {
  QuickNoteCardBadges,
  QuickNoteContextTarget,
} from "@/components/ambassador/ambassador-quick-notes";
import { VerticalBadge } from "@/components/vertical-badge";
import { cn } from "@/lib/utils";
import { FinanceiroCardActions } from "./financeiro-card-actions";
import type { FinanceiroRow } from "./types";
import { displayName } from "@/lib/ambassador-name";

type FinanceiroItemCardProps = {
  row: FinanceiroRow;
  loading: string | null;
  onAction: (id: string, action: string) => void;
  onEmailAction: (id: string, action: string) => void;
  onGenerateTermo: (id: string, force?: boolean) => void;
  onEditTermoData: (row: FinanceiroRow) => void;
  onEditValue: (row: FinanceiroRow) => void;
  onUploadSignedTermo?: (id: string, file: File) => void;
  onNotesChanged?: () => void;
  className?: string;
  draggable?: boolean;
  dragActive?: boolean;
  onDragStart?: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragEnd?: () => void;
  highlightFinanceRequest?: boolean;
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
  onUploadSignedTermo,
  onNotesChanged,
  className,
  draggable,
  dragActive,
  onDragStart,
  onDragEnd,
  highlightFinanceRequest,
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
      ambassadorName={displayName(row.ambassador)}
      onChanged={onNotesChanged}
      className={cn(
        "overflow-hidden rounded-xl border border-hairline bg-white shadow-soft",
        draggable && "cursor-grab active:cursor-grabbing",
        dragActive && "opacity-50 ring-2 ring-primary/30",
        className
      )}
    >
      <div draggable={draggable} onDragStart={handleDragStart} onDragEnd={onDragEnd}>
        <div className="h-1 w-full" style={{ backgroundColor: programAccent(row.ambassador.program) }} />
        <div className="space-y-2.5 p-3.5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <AmbassadorNameLink
                id={row.ambassador.id}
                onNotesChanged={onNotesChanged}
                contextMenu={false}
                className="text-sm font-semibold leading-snug"
              >
                {displayName(row.ambassador)}
              </AmbassadorNameLink>
              <p className="truncate text-xs text-muted-foreground">{row.ambassador.instagram}</p>
            </div>
            <VerticalBadge vertical={row.ambassador.program} />
          </div>

          <QuickNoteCardBadges notes={row.ambassador.quickNotes} />

          <FinanceiroCardActions
            row={row}
            loading={loading}
            onAction={onAction}
            onEmailAction={onEmailAction}
            onGenerateTermo={onGenerateTermo}
            onEditTermoData={onEditTermoData}
            onEditValue={onEditValue}
            onUploadSignedTermo={onUploadSignedTermo}
            highlightFinanceRequest={highlightFinanceRequest}
            compact
            showPaymentStatus={false}
          />
        </div>
      </div>
    </QuickNoteContextTarget>
  );
}
