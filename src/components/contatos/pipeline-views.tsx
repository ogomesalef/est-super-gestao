"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui";
import { VerticalBadge } from "@/components/vertical-badge";
import { NotionPill, groupHeaderColor } from "@/components/views/notion-pill";
import { DragBoard } from "@/components/views/drag-board";
import { resolveGroupOrder } from "@/lib/view-system/group-order";
import { groupItems } from "@/lib/view-system/group";
import type { GroupByKey } from "@/lib/view-system/types";
import { verticalRowClass } from "@/lib/vertical-styles";
import { cn } from "@/lib/utils";
import { contactAlertLabel } from "@/lib/contact-alerts";
import {
  isProposalStale,
  needsAnalysis,
  proposalAlertLabel,
} from "@/lib/partnership-alerts";
import { countFormFields } from "@/lib/respostas-form-sections";
import { parceriaFormQuickLine } from "@/lib/parceria-form-preview";
import type { PipelineItem } from "@/lib/pipeline";
import type { ParceriaItem } from "@/components/parcerias/types";
import {
  QuickNoteCardBadges,
  QuickNoteContextTarget,
} from "@/components/ambassador/ambassador-quick-notes";
import { AmbassadorNameLink } from "@/components/ambassador-name-link";

function PipelineAlertBadge({ item }: { item: PipelineItem }) {
  if (item.needsLink) {
    return (
      <span className="inline-flex rounded bg-violet-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-violet-900">
        Vincular
      </span>
    );
  }
  if (item.kind === "contact" && item.staleContact) {
    const label = contactAlertLabel({
      status: item.stage,
      lastContactedAt: item.lastContactedAt,
    });
    if (!label) return null;
    return (
      <span className="inline-flex rounded bg-orange-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-orange-900">
        {label}
      </span>
    );
  }
  if (item.kind === "ambassador") {
    const label = proposalAlertLabel(item);
    if (!label) return null;
    return (
      <span
        className={cn(
          "inline-flex rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
          item.needsReview && "bg-amber-100 text-amber-900",
          item.staleProposal && !item.needsReview && "bg-orange-100 text-orange-900"
        )}
      >
        {label}
      </span>
    );
  }
  return null;
}

function itemLabel(item: PipelineItem) {
  return item.displayName || item.instagram || item.tiktok || "—";
}

function getGroupKey(item: PipelineItem, groupBy: GroupByKey): string {
  if (groupBy === "status") return item.stage;
  if (groupBy === "vertical" || groupBy === "program") return item.vertical;
  return "Todos";
}

export function PipelineBoardView({
  items,
  columnOrder,
  hiddenColumnKeys,
  defaultColumnOrder,
  onColumnOrderChange,
  onMove,
  onOpenContact,
  onOutreach,
  onSendProposta,
  onLembrete,
  onFormalizar,
  onViewCandidatura,
  onNotesChanged,
}: {
  items: PipelineItem[];
  columnOrder?: string[];
  hiddenColumnKeys?: string[];
  defaultColumnOrder: readonly string[];
  onColumnOrderChange?: (order: string[]) => void;
  onMove: (id: string, newStage: string) => void;
  onOpenContact?: (item: PipelineItem) => void;
  onOutreach?: (item: PipelineItem) => void;
  onSendProposta?: (item: ParceriaItem) => void;
  onLembrete?: (item: ParceriaItem) => void;
  onFormalizar?: (item: ParceriaItem) => void;
  onViewCandidatura?: (item: ParceriaItem) => void;
  onNotesChanged?: () => void;
}) {
  const statusOrder = resolveGroupOrder(defaultColumnOrder, columnOrder);
  const groups = groupItems(items, (i) => i.stage, statusOrder);

  return (
    <DragBoard
      groups={groups.map((g) => ({ key: g.key, items: g.items }))}
      groupBy="status"
      defaultColumnOrder={[...defaultColumnOrder]}
      columnOrder={columnOrder}
      hiddenColumnKeys={hiddenColumnKeys}
      onColumnOrderChange={onColumnOrderChange}
      onItemDrop={(id, key) => onMove(id, key)}
      getItemId={(i) => i.id}
      columnWidth="w-64"
      renderCard={(item) => (
        <div
          className={cn(
            "rounded-lg border border-hairline bg-white p-3 shadow-soft",
            item.staleContact && "border-orange-300 bg-orange-50/40",
            item.needsReview && "border-amber-300 bg-amber-50/30",
            item.needsLink && "border-violet-300 bg-violet-50/30"
          )}
        >
          <div className="space-y-1">
            {item.ambassadorId ? (
              <QuickNoteContextTarget
                ambassadorId={item.ambassadorId}
                ambassadorName={item.displayName}
                onChanged={onNotesChanged}
              >
                <AmbassadorNameLink
                  id={item.ambassadorId}
                  onNotesChanged={onNotesChanged}
                  contextMenu={false}
                  className="text-sm font-medium"
                >
                  {itemLabel(item)}
                </AmbassadorNameLink>
                <QuickNoteCardBadges notes={item.quickNotes} />
              </QuickNoteContextTarget>
            ) : (
              <button
                type="button"
                className="text-left text-sm font-medium hover:underline"
                onClick={() => onOpenContact?.(item)}
              >
                {itemLabel(item)}
              </button>
            )}
            <div className="flex flex-wrap gap-1">
              <NotionPill kind="status">{item.stage}</NotionPill>
              <PipelineAlertBadge item={item} />
            </div>
            {item.stage === "Pendente" && item.applicationFormData && parceriaFormQuickLine(item as ParceriaItem) && (
              <p className="line-clamp-2 text-[11px] text-amber-900/80">
                {parceriaFormQuickLine(item as ParceriaItem)}
              </p>
            )}
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {item.kind === "contact" && onOpenContact && (
              <Button variant="ghost" size="sm" onClick={() => onOpenContact(item)}>
                Abrir
              </Button>
            )}
            {item.staleContact && onOutreach && (
              <Button variant="secondary" size="sm" onClick={() => onOutreach(item)}>
                Refazer
              </Button>
            )}
            {item.ambassadorId && countFormFields(item.applicationFormData || {}) > 0 && onViewCandidatura && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onViewCandidatura(item as ParceriaItem)}
              >
                Candidatura
              </Button>
            )}
            {item.stage === "Pendente" && item.ambassadorId && onSendProposta && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onSendProposta(item as ParceriaItem)}
              >
                {needsAnalysis(item) ? "Analisar" : "Proposta"}
              </Button>
            )}
            {item.stage === "Proposta" && isProposalStale(item) && onLembrete && item.ambassadorId && (
              <Button variant="secondary" size="sm" onClick={() => onLembrete(item as ParceriaItem)}>
                Lembrete
              </Button>
            )}
            {item.stage === "Proposta" && onFormalizar && item.ambassadorId && (
              <Button variant="ghost" size="sm" onClick={() => onFormalizar(item as ParceriaItem)}>
                Formalizar
              </Button>
            )}
            {item.ambassadorId && (
              <Link
                href={`/ambassadors/${item.ambassadorId}`}
                className="self-center text-xs font-medium text-primary hover:underline"
              >
                Perfil
              </Link>
            )}
          </div>
        </div>
      )}
    />
  );
}

export function PipelineTableView({
  items,
  groupBy,
  onOpenContact,
  onOutreach,
  onSendProposta,
  onLembrete,
  onFormalizar,
  onViewCandidatura,
  onNotesChanged,
}: {
  items: PipelineItem[];
  groupBy: GroupByKey;
  onOpenContact?: (item: PipelineItem) => void;
  onOutreach?: (item: PipelineItem) => void;
  onSendProposta?: (item: ParceriaItem) => void;
  onLembrete?: (item: ParceriaItem) => void;
  onFormalizar?: (item: ParceriaItem) => void;
  onViewCandidatura?: (item: ParceriaItem) => void;
  onNotesChanged?: () => void;
}) {
  const groups =
    groupBy === "none"
      ? [{ key: "Todos", items }]
      : groupItems(items, (i) => getGroupKey(i, groupBy));

  return (
    <div className="space-y-3">
      {groups.map((group) => (
        <div key={group.key} className="overflow-hidden rounded-xl border border-hairline bg-white shadow-soft">
          {groupBy !== "none" && (
            <div className="flex items-center gap-2 border-b border-hairline px-3 py-2">
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
              <span className={cn("rounded px-2 py-0.5 text-sm", groupHeaderColor(group.key, groupBy))}>
                {group.key}
              </span>
              <span className="text-xs text-muted-foreground">{group.items.length}</span>
            </div>
          )}
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-hairline text-left text-xs text-muted-foreground">
                <th className="px-3 py-2 font-medium">Nome</th>
                <th className="px-3 py-2 font-medium">Vertical</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium">Alertas</th>
                <th className="px-3 py-2 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {group.items.map((item) => (
                <tr key={item.id} className={cn("border-t border-hairline/60", verticalRowClass(item.vertical))}>
                  <td className="px-3 py-2 font-medium">
                    {item.ambassadorId ? (
                      <QuickNoteContextTarget
                        ambassadorId={item.ambassadorId}
                        ambassadorName={item.displayName}
                        onChanged={onNotesChanged}
                      >
                        <AmbassadorNameLink id={item.ambassadorId} onNotesChanged={onNotesChanged}>
                          {itemLabel(item)}
                        </AmbassadorNameLink>
                      </QuickNoteContextTarget>
                    ) : (
                      <button
                        type="button"
                        className="hover:underline"
                        onClick={() => onOpenContact?.(item)}
                      >
                        {itemLabel(item)}
                      </button>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <VerticalBadge vertical={item.vertical} />
                  </td>
                  <td className="px-3 py-2">
                    <NotionPill kind="status">{item.stage}</NotionPill>
                  </td>
                  <td className="px-3 py-2">
                    <PipelineAlertBadge item={item} />
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-2">
                      {item.kind === "contact" && onOpenContact && (
                        <Button variant="ghost" size="sm" onClick={() => onOpenContact(item)}>
                          Abrir
                        </Button>
                      )}
                      {item.staleContact && onOutreach && (
                        <Button variant="secondary" size="sm" onClick={() => onOutreach(item)}>
                          Refazer
                        </Button>
                      )}
                      {item.stage === "Pendente" && item.ambassadorId && onSendProposta && (
                        <Button variant="secondary" size="sm" onClick={() => onSendProposta(item as ParceriaItem)}>
                          {needsAnalysis(item) ? "Analisar" : "Proposta"}
                        </Button>
                      )}
                      {countFormFields(item.applicationFormData || {}) > 0 && onViewCandidatura && (
                        <Button variant="ghost" size="sm" onClick={() => onViewCandidatura(item as ParceriaItem)}>
                          Candidatura
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
