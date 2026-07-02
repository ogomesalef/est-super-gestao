"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { TableHead, TableRow, Td, TableShell, Th } from "@/components/ui";
import { FINANCE_PIPELINE_BLOCKED, PAYMENT_STATUSES, FINANCE_PIPELINE_STAGES } from "@/lib/constants";
import { groupFinancePipelineItems } from "@/lib/finance-pipeline";
import { VerticalBadge } from "@/components/vertical-badge";
import { NotionPill, groupHeaderColor } from "@/components/views/notion-pill";
import { DragBoard } from "@/components/views/drag-board";
import { resolveGroupOrder } from "@/lib/view-system/group-order";
import { groupItems } from "@/lib/view-system/group";
import type { GroupByKey } from "@/lib/view-system/types";
import { verticalRowClass } from "@/lib/vertical-styles";
import { cn } from "@/lib/utils";
import { AmbassadorNameLink } from "@/components/ambassador-name-link";
import {
  QuickNoteCardBadges,
  QuickNoteContextTarget,
} from "@/components/ambassador/ambassador-quick-notes";
import { FinanceiroCardActions } from "./financeiro-card-actions";
import { FinanceiroItemCard } from "./financeiro-item-card";
import type { FinanceiroRow } from "./types";
import { displayName } from "@/lib/ambassador-name";

type CardActionProps = {
  loading: string | null;
  onAction: (id: string, action: string) => void;
  onEmailAction: (id: string, action: string) => void;
  onGenerateTermo: (id: string, force?: boolean) => void;
  onEditTermoData: (row: FinanceiroRow) => void;
  onEditValue: (row: FinanceiroRow) => void;
  onUploadSignedTermo?: (id: string, file: File) => void;
  onNotesChanged?: () => void;
};

function getGroupKey(item: FinanceiroRow, groupBy: GroupByKey): string {
  if (groupBy === "status") return item.paymentStatus;
  if (groupBy === "program") return item.ambassador.program;
  return "Todos";
}

function orderedKeys(groupBy: GroupByKey): string[] | undefined {
  if (groupBy === "status") return [...PAYMENT_STATUSES];
  if (groupBy === "program") return ["OAB", "ECJ"];
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
      <span className={cn("rounded px-2 py-0.5 text-sm font-medium", groupHeaderColor(groupKey, "status"))}>
        {groupKey}
      </span>
      <span className="text-xs text-muted-foreground">{count}</span>
    </button>
  );
}

function PipelineColumn({
  label,
  count,
  items,
  dropStatus,
  onDrop,
  dragId,
  setDragId,
  cardProps,
  highlightFinanceRequest,
  pillStatus,
  className,
}: {
  label: string;
  count: number;
  items: FinanceiroRow[];
  dropStatus?: string;
  onDrop?: (id: string, status: string) => void;
  dragId: string | null;
  setDragId: (id: string | null) => void;
  cardProps: CardActionProps;
  highlightFinanceRequest?: boolean;
  pillStatus?: string;
  className?: string;
}) {
  return (
    <div
      className={cn("shrink-0 rounded-xl bg-surface/60 p-2", className)}
      onDragOver={(e) => {
        if (dropStatus) e.preventDefault();
      }}
      onDrop={(e) => {
        if (!dropStatus || !onDrop) return;
        e.preventDefault();
        const id = e.dataTransfer.getData("text/plain") || dragId;
        if (id) onDrop(id, dropStatus);
        setDragId(null);
      }}
    >
      <div className="mb-3 flex flex-wrap items-center gap-1.5 px-1">
        <NotionPill kind="payment" styleAs={pillStatus}>
          {label}
        </NotionPill>
        <span className="text-xs text-muted-foreground">{count}</span>
      </div>
      <div className="min-h-[120px] space-y-3">
        {items.map((f) => (
          <FinanceiroItemCard
            key={f.id}
            row={f}
            {...cardProps}
            draggable={Boolean(dropStatus)}
            dragActive={dragId === f.id}
            highlightFinanceRequest={highlightFinanceRequest}
            onDragStart={(e) => {
              e.dataTransfer.setData("text/plain", f.id);
              setDragId(f.id);
            }}
            onDragEnd={() => setDragId(null)}
          />
        ))}
      </div>
    </div>
  );
}

export function FinanceiroTableView({
  items,
  groupBy,
  loading,
  onAction,
  onEmailAction,
  onGenerateTermo,
  onEditTermoData,
  onEditValue,
  onUploadSignedTermo,
  onNotesChanged,
}: {
  items: FinanceiroRow[];
  groupBy: GroupByKey;
} & CardActionProps) {
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
                onToggle={() => setCollapsed((c) => ({ ...c, [group.key]: !c[group.key] }))}
              />
            )}
            {!isCollapsed && (
              <TableShell className="rounded-none border-0 shadow-none">
                <TableHead>
                  <TableRow>
                    <Th>Nome</Th>
                    <Th>%</Th>
                    <Th>Valor acordado</Th>
                    <Th>A pagar</Th>
                    <Th>Status</Th>
                    <Th>Termo e ações</Th>
                  </TableRow>
                </TableHead>
                <tbody>
                  {group.items.map((f) => (
                    <TableRow key={f.id} className={verticalRowClass(f.ambassador.program)}>
                      <Td>
                        <QuickNoteContextTarget
                          ambassadorId={f.ambassador.id}
                          ambassadorName={displayName(f.ambassador)}
                          onChanged={onNotesChanged}
                        >
                          <div className="flex items-center gap-2">
                            <div>
                              <AmbassadorNameLink
                                id={f.ambassador.id}
                                onNotesChanged={onNotesChanged}
                                contextMenu={false}
                              >
                                {displayName(f.ambassador)}
                              </AmbassadorNameLink>
                              <div className="text-xs text-muted-foreground">{f.ambassador.instagram}</div>
                              <QuickNoteCardBadges notes={f.ambassador.quickNotes} />
                            </div>
                            <VerticalBadge vertical={f.ambassador.program} />
                          </div>
                        </QuickNoteContextTarget>
                      </Td>
                      <Td className="tabular">{f.pctDelivered.toFixed(0)}%</Td>
                      <Td className="tabular">R$ {f.agreedValue?.toFixed(2) ?? "—"}</Td>
                      <Td className="font-medium tabular">R$ {f.amountDue?.toFixed(2) ?? "—"}</Td>
                      <Td>
                        <NotionPill kind="payment">{f.paymentStatus}</NotionPill>
                      </Td>
                      <Td className="min-w-[12rem]">
                        <FinanceiroCardActions
                          row={f}
                          loading={loading}
                          onAction={onAction}
                          onEmailAction={onEmailAction}
                          onGenerateTermo={onGenerateTermo}
                          onEditTermoData={onEditTermoData}
                          onEditValue={onEditValue}
                          onUploadSignedTermo={onUploadSignedTermo}
                        />
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

export function FinanceiroGalleryView({
  items,
  groupBy,
  onAction,
  onEmailAction,
  onGenerateTermo,
  onEditTermoData,
  onEditValue,
  onUploadSignedTermo,
  onNotesChanged,
  loading,
}: {
  items: FinanceiroRow[];
  groupBy: GroupByKey;
} & CardActionProps) {
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
              <span className={cn("rounded px-2 py-0.5 text-sm font-medium", groupHeaderColor(group.key, "status"))}>
                {group.key}
              </span>
              <span className="text-xs text-muted-foreground">{group.items.length}</span>
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {group.items.map((f) => (
              <FinanceiroItemCard
                key={f.id}
                row={f}
                loading={loading}
                onAction={onAction}
                onEmailAction={onEmailAction}
                onGenerateTermo={onGenerateTermo}
                onEditTermoData={onEditTermoData}
                onEditValue={onEditValue}
                onUploadSignedTermo={onUploadSignedTermo}
                onNotesChanged={onNotesChanged}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function FinanceiroBoardView({
  items,
  groupBy,
  columnOrder,
  hiddenColumnKeys,
  onColumnOrderChange,
  onMove,
  onAction,
  onEmailAction,
  onGenerateTermo,
  onEditTermoData,
  onEditValue,
  onUploadSignedTermo,
  onNotesChanged,
  loading,
}: {
  items: FinanceiroRow[];
  groupBy: GroupByKey;
  columnOrder?: string[];
  hiddenColumnKeys?: string[];
  onColumnOrderChange?: (order: string[]) => void;
  onMove: (id: string, newStatus: string) => void;
} & CardActionProps) {
  const cardProps: CardActionProps = {
    loading,
    onAction,
    onEmailAction,
    onGenerateTermo,
    onEditTermoData,
    onEditValue,
    onUploadSignedTermo,
    onNotesChanged,
  };

  const renderFinanceCard = (f: FinanceiroRow) => (
    <FinanceiroItemCard
      row={f}
      {...cardProps}
      highlightFinanceRequest={
        f.paymentStatus === "Pronto para enviar ao Financeiro" ||
        f.paymentStatus === "Solicitado ao Financeiro"
      }
    />
  );

  if (groupBy !== "status" && groupBy !== "none") {
    const defaultKeys = orderedKeys(groupBy);
    const order = defaultKeys ? resolveGroupOrder(defaultKeys, columnOrder) : undefined;
    const groups = groupItems(items, (i) => getGroupKey(i, groupBy), order);
    return (
      <DragBoard
        groups={groups.map((g) => ({ key: g.key, items: g.items }))}
        groupBy={groupBy}
        defaultColumnOrder={defaultKeys}
        columnOrder={columnOrder}
        hiddenColumnKeys={hiddenColumnKeys}
        onColumnOrderChange={onColumnOrderChange}
        onItemDrop={onMove}
        getItemId={(f) => f.id}
        columnWidth="w-80"
        renderCard={renderFinanceCard}
      />
    );
  }

  const { stages, blocked } = groupFinancePipelineItems(items);
  const dropByKey = new Map<string, string>();
  const boardGroups = stages.map((stage) => {
    dropByKey.set(stage.key, stage.dropStatus);
    return {
      key: stage.key,
      label: stage.label,
      styleAs: stage.pillStatus,
      items: stage.items,
    };
  });
  if (blocked.length > 0) {
    boardGroups.push({
      key: "blocked",
      label: FINANCE_PIPELINE_BLOCKED,
      styleAs: FINANCE_PIPELINE_BLOCKED,
      items: blocked,
    });
  }

  const defaultKeys = [
    ...FINANCE_PIPELINE_STAGES.map((s) => s.key),
    ...(blocked.length > 0 ? ["blocked"] : []),
  ];

  return (
    <DragBoard
      groups={boardGroups}
      groupBy="status"
      defaultColumnOrder={defaultKeys}
      columnOrder={columnOrder}
      hiddenColumnKeys={hiddenColumnKeys}
      onColumnOrderChange={onColumnOrderChange}
      onItemDrop={(id, key) => {
        const status = dropByKey.get(key);
        if (status) onMove(id, status);
      }}
      getItemId={(f) => f.id}
      columnClassName="min-w-[16rem] flex-1"
      renderCard={renderFinanceCard}
    />
  );
}
