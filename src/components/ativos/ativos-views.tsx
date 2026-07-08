"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { TableHead, TableRow, Td, TableShell, Th } from "@/components/ui";
import { DragBoard } from "@/components/views/drag-board";
import { NotionPill, groupHeaderColor } from "@/components/views/notion-pill";
import { groupItems } from "@/lib/view-system/group";
import { resolveGroupOrder } from "@/lib/view-system/group-order";
import type { GroupByKey } from "@/lib/view-system/types";
import type { AtivoItem } from "@/lib/ativos";
import { MODALITIES } from "@/lib/constants";
import { verticalRowClass } from "@/lib/vertical-styles";
import { cn } from "@/lib/utils";
import {
  AtivoAvatar,
  AtivoContactRow,
  AtivoDeliveryReport,
  AtivoFullCard,
  AtivoPartnershipBlock,
  formatDate,
  formatMoney,
  metasLabel,
  pctColor,
} from "@/components/ativos/ativo-shared";
import { AmbassadorNameLink } from "@/components/ambassador-name-link";

function getGroupKey(item: AtivoItem, groupBy: GroupByKey): string {
  if (groupBy === "program") return item.program;
  if (groupBy === "modality") return item.partnership.modality || "—";
  return "Todos";
}

function orderedKeys(groupBy: GroupByKey): string[] | undefined {
  if (groupBy === "program") return ["OAB", "ECJ"];
  if (groupBy === "modality") return [...MODALITIES, "—"];
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

function AtivoTableExpandableRow({ item }: { item: AtivoItem }) {
  const [open, setOpen] = useState(false);
  const p = item.partnership;

  return (
    <>
      <TableRow className={verticalRowClass(item.program)}>
        <Td>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="mr-1 inline-flex rounded p-0.5 hover:bg-surface"
            aria-expanded={open}
          >
            <ChevronRight className={cn("h-4 w-4 transition-transform", open && "rotate-90")} />
          </button>
          <div className="inline-flex items-center gap-2">
            <AtivoAvatar item={item} size="sm" />
            <AmbassadorNameLink id={item.id}>{item.displayName}</AmbassadorNameLink>
          </div>
        </Td>
        <Td>
          <div className="max-w-[10rem]">
            <AtivoContactRow item={item} />
          </div>
        </Td>
        <Td>
          {p.modality ? <NotionPill kind="modality">{p.modality}</NotionPill> : "—"}
          {p.modality === "Assinatura + Cupom" && p.couponCode ? (
            <p className="mt-1 font-mono text-xs">{p.couponCode}</p>
          ) : null}
          {p.modality === "Remuneração" ? (
            <p className="mt-1 text-xs tabular-nums">{formatMoney(p.agreedValue)}</p>
          ) : null}
        </Td>
        <Td className="text-xs">{metasLabel(p)}</Td>
        <Td className="text-sm">{formatDate(p.startDate)}</Td>
        <Td>
          <span className={cn("font-bold tabular-nums", pctColor(item.currentMonthPct))}>
            {item.currentMonthPct != null ? `${item.currentMonthPct.toFixed(0)}%` : "—"}
          </span>
        </Td>
        <Td>
          <span className={cn("font-bold tabular-nums", pctColor(item.previousMonthPct))}>
            {item.previousMonthPct != null ? `${item.previousMonthPct.toFixed(0)}%` : "—"}
          </span>
        </Td>
        <Td className="text-sm">
          {p.modality === "Assinatura + Cupom" ? (
            <>
              {p.courseReleased ? "Liberado" : "Pendente"}
              {p.courseName ? ` · ${p.courseName}` : ""}
            </>
          ) : (
            "—"
          )}
        </Td>
      </TableRow>
      {open ? (
        <tr className="bg-surface/30">
          <td colSpan={8} className="p-4">
            <div className="grid gap-4 lg:grid-cols-2">
              <AtivoPartnershipBlock item={item} />
              <AtivoDeliveryReport item={item} />
            </div>
          </td>
        </tr>
      ) : null}
    </>
  );
}

export function AtivosTableView({
  items,
  groupBy,
}: {
  items: AtivoItem[];
  groupBy: GroupByKey;
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
          <div key={group.key} className="overflow-hidden rounded-xl border border-hairline bg-card shadow-soft">
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
                    <Th>Contato</Th>
                    <Th>Parceria</Th>
                    <Th>Metas</Th>
                    <Th>Início</Th>
                    <Th>Mês atual</Th>
                    <Th>Mês anterior</Th>
                    <Th>Curso</Th>
                  </TableRow>
                </TableHead>
                <tbody>
                  {group.items.map((item) => (
                    <AtivoTableExpandableRow key={item.id} item={item} />
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

export function AtivosGalleryView({
  items,
  groupBy,
}: {
  items: AtivoItem[];
  groupBy: GroupByKey;
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
              <span
                className={cn("rounded px-2 py-0.5 text-sm font-medium", groupHeaderColor(group.key, groupBy))}
              >
                {group.key}
              </span>
              <span className="text-xs text-muted-foreground">{group.items.length}</span>
            </div>
          )}
          <div className="grid gap-4 lg:grid-cols-2">
            {group.items.map((item) => (
              <AtivoFullCard key={item.id} item={item} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function AtivoBoardCard({ item }: { item: AtivoItem }) {
  const [open, setOpen] = useState(false);
  const p = item.partnership;

  return (
    <div className="rounded-lg border border-hairline bg-card p-3 shadow-soft">
      <div className="flex items-start gap-2">
        <AtivoAvatar item={item} size="sm" />
        <div className="min-w-0 flex-1">
          <AmbassadorNameLink id={item.id} className="text-sm font-medium">
            {item.displayName}
          </AmbassadorNameLink>
          <p className="truncate text-xs text-muted-foreground">{item.instagram}</p>
        </div>
      </div>
      <div className="mt-2 flex flex-wrap gap-1">
        <NotionPill kind="vertical">{item.program}</NotionPill>
        {p.modality ? <NotionPill kind="modality">{p.modality}</NotionPill> : null}
      </div>
      <div className="mt-2 grid grid-cols-2 gap-1.5 text-center text-xs">
        <div className="rounded bg-surface/80 px-1 py-1">
          <p className="text-muted-foreground">Atual</p>
          <p className={cn("font-bold tabular-nums", pctColor(item.currentMonthPct))}>
            {item.currentMonthPct != null ? `${item.currentMonthPct.toFixed(0)}%` : "—"}
          </p>
        </div>
        <div className="rounded bg-surface/80 px-1 py-1">
          <p className="text-muted-foreground">Anterior</p>
          <p className={cn("font-bold tabular-nums", pctColor(item.previousMonthPct))}>
            {item.previousMonthPct != null ? `${item.previousMonthPct.toFixed(0)}%` : "—"}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="mt-2 w-full text-center text-xs font-medium text-primary hover:underline"
      >
        {open ? "Fechar detalhes" : "Ver detalhes completos"}
      </button>
      {open ? (
        <div className="mt-3 max-h-[min(60vh,420px)] space-y-3 overflow-y-auto border-t border-hairline pt-3">
          <AtivoContactRow item={item} />
          <AtivoPartnershipBlock item={item} />
          <AtivoDeliveryReport item={item} />
        </div>
      ) : null}
    </div>
  );
}

export function AtivosBoardView({
  items,
  groupBy,
  columnOrder,
  hiddenColumnKeys,
  onColumnOrderChange,
}: {
  items: AtivoItem[];
  groupBy: GroupByKey;
  columnOrder?: string[];
  hiddenColumnKeys?: string[];
  onColumnOrderChange?: (order: string[]) => void;
}) {
  const effectiveGroupBy = groupBy === "none" ? "modality" : groupBy;
  const defaultKeys = orderedKeys(effectiveGroupBy);
  const order = defaultKeys ? resolveGroupOrder(defaultKeys, columnOrder) : undefined;
  const groups = groupItems(items, (i) => getGroupKey(i, effectiveGroupBy), order);

  return (
    <DragBoard
      groups={groups.map((g) => ({ key: g.key, items: g.items }))}
      groupBy={effectiveGroupBy}
      defaultColumnOrder={defaultKeys}
      columnOrder={columnOrder}
      hiddenColumnKeys={hiddenColumnKeys}
      onColumnOrderChange={onColumnOrderChange}
      getItemId={(item) => item.id}
      renderCard={(item) => <AtivoBoardCard item={item} />}
    />
  );
}
