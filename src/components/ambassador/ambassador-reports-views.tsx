"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, ChevronRight } from "lucide-react";
import { TableHead, TableRow, Td, TableShell, Th } from "@/components/ui";
import { NotionPill, groupHeaderColor } from "@/components/views/notion-pill";
import { groupItems } from "@/lib/view-system/group";
import type { GroupByKey } from "@/lib/view-system/types";
import type { AmbassadorReportIndexItem } from "@/lib/ambassador-report";
import { MODALITIES } from "@/lib/constants";
import { verticalRowClass } from "@/lib/vertical-styles";
import { cn } from "@/lib/utils";

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
}

function formatMoney(v: number | null): string {
  if (v == null) return "—";
  return `R$ ${v.toFixed(0)}`;
}

function benefitLabel(item: AmbassadorReportIndexItem): string {
  if (item.modality === "Remuneração") return formatMoney(item.agreedValue);
  if (item.modality === "Assinatura + Cupom") return item.courseName || "—";
  return "—";
}

function getGroupKey(item: AmbassadorReportIndexItem, groupBy: GroupByKey): string {
  if (groupBy === "program") return item.program;
  if (groupBy === "modality") return item.modality || "—";
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

export function ReportsTableView({
  items,
  groupBy,
}: {
  items: AmbassadorReportIndexItem[];
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
                    <Th>Instagram</Th>
                    <Th>Modalidade</Th>
                    <Th>Entregas</Th>
                    <Th>Mês atual</Th>
                    <Th>Início</Th>
                    <Th>Curso / Valor</Th>
                  </TableRow>
                </TableHead>
                <tbody>
                  {group.items.map((item) => (
                    <TableRow key={item.reportSlug} className={verticalRowClass(item.program)}>
                      <Td>
                        <Link
                          href={`/r/${item.reportSlug}`}
                          className="font-medium text-primary hover:underline"
                        >
                          {item.displayName}
                        </Link>
                      </Td>
                      <Td className="text-sm text-muted-foreground">{item.instagram}</Td>
                      <Td>
                        {item.modality ? (
                          <NotionPill kind="modality">{item.modality}</NotionPill>
                        ) : (
                          "—"
                        )}
                      </Td>
                      <Td className="tabular-nums">{item.deliveryCount}</Td>
                      <Td className="tabular-nums">
                        {item.currentMonthPct != null ? `${item.currentMonthPct.toFixed(0)}%` : "—"}
                      </Td>
                      <Td className="text-sm">{formatDate(item.startDate)}</Td>
                      <Td className="max-w-[12rem] text-sm">{benefitLabel(item)}</Td>
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

export function ReportsGalleryCard({ item }: { item: AmbassadorReportIndexItem }) {
  const accent = item.program === "ECJ" ? "#D08C00" : "#6B0A09";
  const [avatarFailed, setAvatarFailed] = useState(false);

  return (
    <Link
      href={`/r/${item.reportSlug}`}
      className="group overflow-hidden rounded-xl border border-hairline bg-card text-left shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-elev"
    >
      <div className="h-1.5 w-full" style={{ backgroundColor: accent }} />
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border border-hairline bg-surface">
            {item.avatarUrl && !avatarFailed ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.avatarUrl}
                alt=""
                className="h-full w-full object-cover"
                onError={() => setAvatarFailed(true)}
              />
            ) : (
              <div
                className="flex h-full w-full items-center justify-center text-sm font-bold text-white"
                style={{ backgroundColor: accent }}
              >
                {item.displayName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h2 className="font-serif text-base leading-snug text-ink group-hover:text-primary">
                {item.displayName}
              </h2>
              <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
            <p className="mt-0.5 truncate text-sm text-muted-foreground">{item.instagram}</p>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <NotionPill kind="vertical">{item.program}</NotionPill>
          {item.modality ? <NotionPill kind="modality">{item.modality}</NotionPill> : null}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-lg bg-surface/80 px-2.5 py-2">
            <p className="text-muted-foreground">Entregas</p>
            <p className="mt-0.5 font-semibold tabular-nums text-ink">{item.deliveryCount}</p>
          </div>
          <div className="rounded-lg bg-surface/80 px-2.5 py-2">
            <p className="text-muted-foreground">Mês atual</p>
            <p className="mt-0.5 font-semibold tabular-nums text-ink">
              {item.currentMonthPct != null ? `${item.currentMonthPct.toFixed(0)}%` : "—"}
            </p>
          </div>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Início: <span className="font-medium text-ink">{formatDate(item.startDate)}</span>
          {item.modality === "Remuneração" && item.agreedValue != null ? (
            <>
              {" · "}
              <span className="font-medium text-ink">{formatMoney(item.agreedValue)}/mês</span>
            </>
          ) : null}
          {item.modality === "Assinatura + Cupom" && item.courseName ? (
            <>
              {" · "}
              <span className="font-medium text-ink">Curso: {item.courseName}</span>
            </>
          ) : null}
        </p>
      </div>
    </Link>
  );
}

export function ReportsGalleryView({
  items,
  groupBy,
}: {
  items: AmbassadorReportIndexItem[];
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
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {group.items.map((item) => (
              <ReportsGalleryCard key={item.reportSlug} item={item} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function ReportsBoardView({
  items,
  groupBy,
}: {
  items: AmbassadorReportIndexItem[];
  groupBy: GroupByKey;
}) {
  const effectiveGroupBy = groupBy === "none" ? "modality" : groupBy;
  const groups = groupItems(
    items,
    (i) => getGroupKey(i, effectiveGroupBy),
    orderedKeys(effectiveGroupBy)
  );

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {groups.map((group) => (
        <div key={group.key} className="w-72 shrink-0 rounded-xl bg-surface/60 p-2">
          <div className="mb-2 flex items-center gap-2 px-1">
            <span
              className={cn(
                "rounded px-2 py-0.5 text-xs font-semibold",
                groupHeaderColor(group.key, effectiveGroupBy)
              )}
            >
              {group.key}
            </span>
            <span className="text-xs text-muted-foreground">{group.items.length}</span>
          </div>
          <div className="space-y-2 min-h-[120px]">
            {group.items.map((item) => (
              <Link
                key={item.reportSlug}
                href={`/r/${item.reportSlug}`}
                className="block rounded-lg border border-hairline bg-card p-3 shadow-soft transition-shadow hover:shadow-elev"
              >
                <p className="font-medium text-ink">{item.displayName}</p>
                <p className="text-xs text-muted-foreground">{item.instagram}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  <NotionPill kind="vertical">{item.program}</NotionPill>
                </div>
                <p className="mt-2 text-xs tabular-nums text-muted-foreground">
                  {item.deliveryCount} entregas
                  {item.currentMonthPct != null ? ` · ${item.currentMonthPct.toFixed(0)}% mês` : ""}
                </p>
                {item.modality === "Assinatura + Cupom" && item.courseName ? (
                  <p className="mt-1 text-xs text-ink">{item.courseName}</p>
                ) : null}
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
