"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { Button, TableHead, TableRow, Td, TableShell, Th } from "@/components/ui";
import { VerticalBadge } from "@/components/vertical-badge";
import { NotionPill, groupHeaderColor } from "@/components/views/notion-pill";
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
}: {
  items: ParceriaItem[];
  groupBy: GroupByKey;
  onEdit: (item: ParceriaItem) => void;
  onActivate: (id: string) => void;
  onEncerrar: (id: string) => void;
  onNotesChanged?: () => void;
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
                          ambassadorName={a.fullName}
                          onChanged={onNotesChanged}
                        >
                          <AmbassadorNameLink
                            id={a.id}
                            onNotesChanged={onNotesChanged}
                            contextMenu={false}
                          >
                            {a.fullName}
                          </AmbassadorNameLink>
                          <QuickNoteCardBadges notes={a.quickNotes} />
                        </QuickNoteContextTarget>
                      </Td>
                      <Td><VerticalBadge vertical={a.program} /></Td>
                      <Td className="text-muted-foreground">{a.instagram}</Td>
                      <Td><NotionPill kind="status">{a.status}</NotionPill></Td>
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
                        <Button variant="ghost" size="sm" onClick={() => onEdit(a)}>
                          Abrir
                        </Button>
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
}: {
  items: ParceriaItem[];
  groupBy: GroupByKey;
  onEdit: (item: ParceriaItem) => void;
  onNotesChanged?: () => void;
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
                ambassadorName={a.fullName}
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
                        {a.fullName}
                      </AmbassadorNameLink>
                      <p className="text-sm text-muted-foreground">{a.instagram}</p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <NotionPill kind="vertical">{a.program}</NotionPill>
                      <NotionPill kind="status">{a.status}</NotionPill>
                      {a.partnership?.modality && (
                        <NotionPill kind="modality">{a.partnership.modality}</NotionPill>
                      )}
                    </div>
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
  onEdit,
  onMove,
  onNotesChanged,
}: {
  items: ParceriaItem[];
  groupBy: GroupByKey;
  onEdit: (item: ParceriaItem) => void;
  onMove: (id: string, newGroupKey: string) => void;
  onNotesChanged?: () => void;
}) {
  const effectiveGroupBy = groupBy === "none" ? "status" : groupBy;
  const groups = groupItems(
    items,
    (i) => getGroupKey(i, effectiveGroupBy),
    orderedKeys(effectiveGroupBy)
  );

  const [dragId, setDragId] = useState<string | null>(null);

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {groups.map((group) => (
        <div
          key={group.key}
          className="w-72 shrink-0 rounded-xl bg-surface/60 p-2"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const id = e.dataTransfer.getData("text/plain") || dragId;
            if (id) onMove(id, group.key);
            setDragId(null);
          }}
        >
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
            {group.items.map((a) => (
              <QuickNoteContextTarget
                key={a.id}
                ambassadorId={a.id}
                ambassadorName={a.fullName}
                onChanged={onNotesChanged}
              >
                <div
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData("text/plain", a.id);
                    setDragId(a.id);
                  }}
                  onDragEnd={() => setDragId(null)}
                  className={cn(
                    "cursor-grab rounded-lg border border-hairline bg-white p-3 shadow-soft active:cursor-grabbing",
                    dragId === a.id && "opacity-50 ring-2 ring-primary/30"
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
                        {a.fullName}
                      </AmbassadorNameLink>
                      <p className="truncate text-xs text-muted-foreground">{a.instagram}</p>
                    </div>
                    <VerticalBadge vertical={a.program} className="shrink-0 scale-90" />
                  </div>
                  <div className="mb-2 flex flex-wrap gap-1">
                    {a.partnership?.modality && (
                      <NotionPill kind="modality">{a.partnership.modality}</NotionPill>
                    )}
                  </div>
                  <QuickNoteCardBadges notes={a.quickNotes} />
                  <button
                    type="button"
                    onClick={() => onEdit(a)}
                    className="mt-2 text-xs font-medium text-primary hover:underline"
                  >
                    Abrir
                  </button>
                </div>
              </QuickNoteContextTarget>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
