"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { Button, TableHead, TableRow, Td, TableShell, Th } from "@/components/ui";
import { VerticalBadge } from "@/components/vertical-badge";
import { NotionPill, groupHeaderColor } from "@/components/views/notion-pill";
import { DragBoard } from "@/components/views/drag-board";
import { resolveGroupOrder } from "@/lib/view-system/group-order";
import { groupItems } from "@/lib/view-system/group";
import type { GroupByKey } from "@/lib/view-system/types";
import { PARTNERSHIP_STATUSES } from "@/lib/constants";
import { verticalRowClass } from "@/lib/vertical-styles";
import { cn } from "@/lib/utils";
import { AmbassadorNameLink } from "@/components/ambassador-name-link";
import {
  QuickNoteCardBadges,
  QuickNoteContextTarget,
} from "@/components/ambassador/ambassador-quick-notes";
import type { ParceriaItem } from "./types";
import { displayName } from "@/lib/ambassador-name";
import {
  daysSinceProposalSent,
  isProposalStale,
  needsAnalysis,
  proposalAlertLabel,
} from "@/lib/partnership-alerts";
import { countFormFields } from "@/lib/respostas-form-sections";
import { parceriaFormQuickLine } from "@/lib/parceria-form-preview";

function ParceriaAlertBadge({ item }: { item: ParceriaItem }) {
  const label = proposalAlertLabel(item);
  if (!label) return null;
  const stale = isProposalStale(item);
  const review = needsAnalysis(item);
  return (
    <span
      className={cn(
        "inline-flex rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        review && "bg-amber-100 text-amber-900",
        stale && !review && "bg-orange-100 text-orange-900"
      )}
    >
      {label}
    </span>
  );
}

function ParceriaActionButtons({
  item,
  onSendProposta,
  onLembrete,
  onFormalizar,
  onViewCandidatura,
}: {
  item: ParceriaItem;
  onSendProposta?: (item: ParceriaItem) => void;
  onLembrete?: (item: ParceriaItem) => void;
  onFormalizar?: (item: ParceriaItem) => void;
  onViewCandidatura?: (item: ParceriaItem) => void;
}) {
  const hasForm = countFormFields(item.applicationFormData || {}) > 0;

  return (
    <>
      {hasForm && onViewCandidatura && (
        <button
          type="button"
          onClick={() => onViewCandidatura(item)}
          className="text-xs font-medium text-amber-900 hover:underline"
        >
          Ver candidatura
        </button>
      )}
      {item.status === "Pendente" && onSendProposta && (
        <button
          type="button"
          onClick={() => onSendProposta(item)}
          className="text-xs font-medium text-primary hover:underline"
        >
          {needsAnalysis(item) ? "Analisar" : "Enviar proposta"}
        </button>
      )}
      {item.status === "Proposta" && isProposalStale(item) && onLembrete && (
        <button
          type="button"
          onClick={() => onLembrete(item)}
          className="text-xs font-medium text-orange-700 hover:underline"
        >
          Lembrete
        </button>
      )}
      {item.status === "Proposta" && onFormalizar && (
        <button
          type="button"
          onClick={() => onFormalizar(item)}
          className="text-xs font-medium text-success hover:underline"
        >
          Formalizar
        </button>
      )}
    </>
  );
}

function formatProposalDate(item: ParceriaItem): string | null {
  const sent = item.partnership?.proposalSentAt;
  if (!sent) return null;
  const days = daysSinceProposalSent(item);
  const date = new Date(sent).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
  return days != null ? `Proposta ${date} (${days}d)` : `Proposta ${date}`;
}

function getGroupKey(item: ParceriaItem, groupBy: GroupByKey): string {
  if (groupBy === "status") return item.status;
  if (groupBy === "program") return item.program;
  if (groupBy === "modality") return item.partnership?.modality || "—";
  return "Todos";
}

function orderedKeys(groupBy: GroupByKey): string[] | undefined {
  if (groupBy === "status") return [...PARTNERSHIP_STATUSES];
  if (groupBy === "program") return ["OAB", "ECJ"];
  if (groupBy === "modality") return ["Assinatura + Cupom", "Remuneração", "—"];
  return undefined;
}

function GroupHeader({
  groupKey,
  count,
  groupBy,
  collapsed,
  onToggle,
}: {
  groupKey: string;
  count: number;
  groupBy: GroupByKey;
  collapsed: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-center gap-2 px-2 py-2 text-left hover:bg-surface/50"
    >
      <ChevronRight
        className={cn("h-4 w-4 text-muted-foreground transition-transform", !collapsed && "rotate-90")}
      />
      <span className={cn("rounded px-2 py-0.5 text-sm font-medium", groupHeaderColor(groupKey, groupBy))}>
        {groupKey}
      </span>
      <span className="text-xs text-muted-foreground">{count}</span>
    </button>
  );
}

export function ParceriasTableView({
  items,
  groupBy,
  onEdit,
  onActivate,
  onEncerrar,
  onNotesChanged,
  onSendProposta,
  onLembrete,
  onViewCandidatura,
}: {
  items: ParceriaItem[];
  groupBy: GroupByKey;
  onEdit: (item: ParceriaItem) => void;
  onActivate: (id: string) => void;
  onEncerrar: (id: string) => void;
  onNotesChanged?: () => void;
  onSendProposta?: (item: ParceriaItem) => void;
  onLembrete?: (item: ParceriaItem) => void;
  onViewCandidatura?: (item: ParceriaItem) => void;
}) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const groups =
    groupBy === "none"
      ? [{ key: "Todos", items }]
      : groupItems(items, (i) => getGroupKey(i, groupBy), orderedKeys(groupBy));

  return (
    <div className="space-y-4">
      {groups.map((group) => {
        const isCollapsed = collapsed[group.key];
        return (
          <div key={group.key} className="overflow-hidden rounded-xl border border-hairline bg-white shadow-soft">
            {groupBy !== "none" && (
              <GroupHeader
                groupKey={group.key}
                count={group.items.length}
                groupBy={groupBy}
                collapsed={!!isCollapsed}
                onToggle={() =>
                  setCollapsed((c) => ({ ...c, [group.key]: !c[group.key] }))
                }
              />
            )}
            {!isCollapsed && (
              <TableShell className="rounded-none border-0 shadow-none">
                <TableHead>
                  <TableRow>
                    <Th>Nome</Th>
                    <Th>Vertical</Th>
                    <Th>@</Th>
                    <Th>Status</Th>
                    <Th>Modalidade</Th>
                    <Th>Metas</Th>
                    <Th>Curso / Valor</Th>
                    <Th>Ações</Th>
                  </TableRow>
                </TableHead>
                <tbody>
                  {group.items.map((a) => (
                    <TableRow key={a.id} className={verticalRowClass(a.program)}>
                      <Td>
                        <QuickNoteContextTarget
                          ambassadorId={a.id}
                          ambassadorName={displayName(a)}
                          onChanged={onNotesChanged}
                        >
                          <AmbassadorNameLink
                            id={a.id}
                            onNotesChanged={onNotesChanged}
                            contextMenu={false}
                          >
                            {displayName(a)}
                          </AmbassadorNameLink>
                          <QuickNoteCardBadges notes={a.quickNotes} />
                        </QuickNoteContextTarget>
                      </Td>
                      <Td><VerticalBadge vertical={a.program} /></Td>
                      <Td className="text-muted-foreground">{a.instagram}</Td>
                      <Td><NotionPill kind="status">{a.status}</NotionPill></Td>
                      <Td>
                        <NotionPill kind="status">{a.status}</NotionPill>
                        <div className="mt-1 flex flex-col gap-0.5">
                          <ParceriaAlertBadge item={a} />
                          {formatProposalDate(a) && (
                            <span className="text-xs text-muted-foreground">{formatProposalDate(a)}</span>
                          )}
                          {a.contact && (
                            <span className="text-[10px] text-muted-foreground">Veio de contato</span>
                          )}
                          {a.status === "Pendente" && parceriaFormQuickLine(a) && (
                            <span className="line-clamp-2 text-[11px] text-amber-900/80">
                              {parceriaFormQuickLine(a)}
                            </span>
                          )}
                        </div>
                      </Td>
                      <Td>
                        {a.partnership?.modality ? (
                          <NotionPill kind="modality">{a.partnership.modality}</NotionPill>
                        ) : (
                          "—"
                        )}
                      </Td>
                      <Td className="tabular text-sm">
                        {a.partnership
                          ? `${a.partnership.metaFeed}/${a.partnership.metaStories}`
                          : "—"}
                      </Td>
                      <Td className="text-sm">
                        {a.partnership?.modality === "Remuneração"
                          ? `R$ ${a.partnership?.agreedValue ?? 0}`
                          : a.partnership?.courseName || a.partnership?.couponCode || "—"}
                      </Td>
                      <Td className="space-x-1 whitespace-nowrap">
                        {countFormFields(a.applicationFormData || {}) > 0 && onViewCandidatura && (
                          <Button variant="secondary" size="sm" onClick={() => onViewCandidatura(a)}>
                            Candidatura
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => onEdit(a)}>
                          Abrir
                        </Button>
                        {a.status === "Pendente" && onSendProposta && (
                          <Button variant="secondary" size="sm" onClick={() => onSendProposta(a)}>
                            {needsAnalysis(a) ? "Analisar" : "Proposta"}
                          </Button>
                        )}
                        {a.status === "Proposta" && isProposalStale(a) && onLembrete && (
                          <Button variant="secondary" size="sm" onClick={() => onLembrete(a)}>
                            Lembrete
                          </Button>
                        )}
                        {a.status !== "Ativo" && (
                          <Button variant="secondary" size="sm" onClick={() => onActivate(a.id)}>
                            Ativar
                          </Button>
                        )}
                        {a.status === "Ativo" && (
                          <Button variant="danger" size="sm" onClick={() => onEncerrar(a.id)}>
                            Encerrar
                          </Button>
                        )}
                      </Td>
                    </TableRow>
                  ))}
                </tbody>
              </TableShell>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function ParceriasGalleryView({
  items,
  groupBy,
  onEdit,
  onNotesChanged,
  onSendProposta,
  onLembrete,
  onViewCandidatura,
}: {
  items: ParceriaItem[];
  groupBy: GroupByKey;
  onEdit: (item: ParceriaItem) => void;
  onNotesChanged?: () => void;
  onSendProposta?: (item: ParceriaItem) => void;
  onLembrete?: (item: ParceriaItem) => void;
  onViewCandidatura?: (item: ParceriaItem) => void;
}) {
  const groups =
    groupBy === "none"
      ? [{ key: "Todos", items }]
      : groupItems(items, (i) => getGroupKey(i, groupBy), orderedKeys(groupBy));

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <div key={group.key}>
          {groupBy !== "none" && (
            <div className="mb-3 flex items-center gap-2">
              <span className={cn("rounded px-2 py-0.5 text-sm font-medium", groupHeaderColor(group.key, groupBy))}>
                {group.key}
              </span>
              <span className="text-xs text-muted-foreground">{group.items.length}</span>
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {group.items.map((a) => (
              <QuickNoteContextTarget
                key={a.id}
                ambassadorId={a.id}
                ambassadorName={displayName(a)}
                onChanged={onNotesChanged}
              >
                <button
                  type="button"
                  onClick={() => onEdit(a)}
                  className="group w-full overflow-hidden rounded-xl border border-hairline bg-white text-left shadow-soft transition-shadow hover:shadow-elev"
                >
                  <div
                    className="h-2 w-full"
                    style={{
                      backgroundColor: a.program === "ECJ" ? "#D08C00" : "#6B0A09",
                    }}
                  />
                  <div className="space-y-3 p-4">
                    <div>
                      <AmbassadorNameLink
                        id={a.id}
                        onNotesChanged={onNotesChanged}
                        contextMenu={false}
                      >
                        {displayName(a)}
                      </AmbassadorNameLink>
                      <p className="text-sm text-muted-foreground">{a.instagram}</p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <NotionPill kind="vertical">{a.program}</NotionPill>
                      <NotionPill kind="status">{a.status}</NotionPill>
                      <ParceriaAlertBadge item={a} />
                      {a.partnership?.modality && (
                        <NotionPill kind="modality">{a.partnership.modality}</NotionPill>
                      )}
                    </div>
                    {formatProposalDate(a) && (
                      <p className="text-xs text-muted-foreground">{formatProposalDate(a)}</p>
                    )}
                    {a.status === "Pendente" && parceriaFormQuickLine(a) && (
                      <p className="line-clamp-3 text-xs text-amber-900/85">{parceriaFormQuickLine(a)}</p>
                    )}
                    <QuickNoteCardBadges notes={a.quickNotes} />
                    <p className="line-clamp-2 text-xs text-muted-foreground">
                      {a.partnership?.modality === "Remuneração"
                        ? `Valor: R$ ${a.partnership?.agreedValue ?? 0}`
                        : [a.partnership?.courseName, a.partnership?.couponCode].filter(Boolean).join(" · ") ||
                          "Sem curso/cupom"}
                      {a.alerts ? ` — ${a.alerts}` : ""}
                    </p>
                  </div>
                </button>
              </QuickNoteContextTarget>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function ParceriasBoardView({
  items,
  groupBy,
  columnOrder,
  hiddenColumnKeys,
  onColumnOrderChange,
  onEdit,
  onMove,
  onNotesChanged,
  onFormalizar,
  onSendProposta,
  onLembrete,
  onViewCandidatura,
}: {
  items: ParceriaItem[];
  groupBy: GroupByKey;
  columnOrder?: string[];
  hiddenColumnKeys?: string[];
  onColumnOrderChange?: (order: string[]) => void;
  onEdit: (item: ParceriaItem) => void;
  onMove: (id: string, newGroupKey: string) => void;
  onNotesChanged?: () => void;
  onFormalizar?: (item: ParceriaItem) => void;
  onSendProposta?: (item: ParceriaItem) => void;
  onLembrete?: (item: ParceriaItem) => void;
  onViewCandidatura?: (item: ParceriaItem) => void;
}) {
  const effectiveGroupBy = groupBy === "none" ? "status" : groupBy;
  const defaultKeys = orderedKeys(effectiveGroupBy);
  const order = defaultKeys
    ? resolveGroupOrder(defaultKeys, columnOrder)
    : undefined;
  const groups = groupItems(items, (i) => getGroupKey(i, effectiveGroupBy), order);

  return (
    <DragBoard
      groups={groups.map((g) => ({ key: g.key, items: g.items }))}
      groupBy={effectiveGroupBy}
      defaultColumnOrder={defaultKeys}
      columnOrder={columnOrder}
      hiddenColumnKeys={hiddenColumnKeys}
      onColumnOrderChange={onColumnOrderChange}
      onItemDrop={onMove}
      getItemId={(a) => a.id}
      renderCard={(a) => (
        <QuickNoteContextTarget
          ambassadorId={a.id}
          ambassadorName={displayName(a)}
          onChanged={onNotesChanged}
        >
          <div
            className={cn(
              "rounded-lg border border-hairline bg-white p-3 shadow-soft",
              needsAnalysis(a) && "border-amber-300 bg-amber-50/40",
              isProposalStale(a) && "border-orange-300 bg-orange-50/30"
            )}
          >
            <div className="mb-2 flex items-start justify-between gap-2">
              <div className="min-w-0">
                <AmbassadorNameLink
                  id={a.id}
                  className="truncate text-sm"
                  stopPropagation
                  onNotesChanged={onNotesChanged}
                  contextMenu={false}
                >
                  {displayName(a)}
                </AmbassadorNameLink>
                <p className="truncate text-xs text-muted-foreground">{a.instagram}</p>
              </div>
              <VerticalBadge vertical={a.program} className="shrink-0 scale-90" />
            </div>
            <div className="mb-2 flex flex-wrap gap-1">
              <ParceriaAlertBadge item={a} />
              {a.partnership?.modality && (
                <NotionPill kind="modality">{a.partnership.modality}</NotionPill>
              )}
            </div>
            {formatProposalDate(a) && (
              <p className="mb-2 text-[10px] text-muted-foreground">{formatProposalDate(a)}</p>
            )}
            {a.status === "Pendente" && parceriaFormQuickLine(a) && (
              <p className="mb-2 line-clamp-3 text-[10px] leading-snug text-amber-900/85">
                {parceriaFormQuickLine(a)}
              </p>
            )}
            <QuickNoteCardBadges notes={a.quickNotes} />
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <ParceriaActionButtons
                item={a}
                onSendProposta={onSendProposta}
                onLembrete={onLembrete}
                onFormalizar={onFormalizar}
                onViewCandidatura={onViewCandidatura}
              />
              <button
                type="button"
                onClick={() => onEdit(a)}
                className="text-xs font-medium text-primary hover:underline"
              >
                Abrir
              </button>
            </div>
          </div>
        </QuickNoteContextTarget>
      )}
    />
  );
}
