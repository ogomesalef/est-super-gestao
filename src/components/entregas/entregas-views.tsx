"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { Badge, TableHead, TableRow, Td, TableShell, Textarea, Th } from "@/components/ui";
import { VerticalBadge } from "@/components/vertical-badge";
import { NotionPill, groupHeaderColor } from "@/components/views/notion-pill";
import { groupItems } from "@/lib/view-system/group";
import type { GroupByKey } from "@/lib/view-system/types";
import { verticalRowClass } from "@/lib/vertical-styles";
import { cn } from "@/lib/utils";
import { AmbassadorNameLink } from "@/components/ambassador-name-link";
import {
  QuickNoteCardBadges,
  QuickNoteContextTarget,
} from "@/components/ambassador/ambassador-quick-notes";
import { DELIVERY_STATUSES, deliveryStatus, type EntregaControl } from "./types";

function getGroupKey(item: EntregaControl, groupBy: GroupByKey): string {
  if (groupBy === "status") return deliveryStatus(item);
  if (groupBy === "program") return item.ambassador.program;
  return "Todos";
}

function orderedKeys(groupBy: GroupByKey): string[] | undefined {
  if (groupBy === "status") return [...DELIVERY_STATUSES];
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
      <span className={cn("rounded px-2 py-0.5 text-sm font-medium", groupHeaderColor(groupKey, groupBy))}>
        {groupKey}
      </span>
      <span className="text-xs text-muted-foreground">{count}</span>
    </button>
  );
}

function ChannelCell({
  delivered,
  meta,
  status,
}: {
  delivered: number;
  meta: number;
  status: string | null;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="tabular text-sm">
        {delivered}/{meta}
      </span>
      <Badge variant={status === "OK" ? "success" : "warning"}>{status || "—"}</Badge>
    </span>
  );
}

export function EntregasTableView({
  items,
  groupBy,
  onSaveNotes,
  onNotesChanged,
}: {
  items: EntregaControl[];
  groupBy: GroupByKey;
  onSaveNotes: (id: string, notes: string) => void;
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
                onToggle={() => setCollapsed((c) => ({ ...c, [group.key]: !c[group.key] }))}
              />
            )}
            {!isCollapsed && (
              <TableShell className="rounded-none border-0 shadow-none">
                <TableHead>
                  <TableRow>
                    <Th>Nome</Th>
                    <Th>@</Th>
                    <Th>Status</Th>
                    <Th>%</Th>
                    <Th>Feed</Th>
                    <Th>Stories</Th>
                    <Th>TikTok</Th>
                    <Th>Observações</Th>
                  </TableRow>
                </TableHead>
                <tbody>
                  {group.items.map((c) => (
                    <TableRow key={c.id} className={verticalRowClass(c.ambassador.program)}>
                      <Td>
                        <QuickNoteContextTarget
                          ambassadorId={c.ambassador.id}
                          ambassadorName={c.ambassador.fullName}
                          onChanged={onNotesChanged}
                        >
                          <AmbassadorNameLink
                            id={c.ambassador.id}
                            onNotesChanged={onNotesChanged}
                            contextMenu={false}
                          >
                            {c.ambassador.fullName}
                          </AmbassadorNameLink>
                          <QuickNoteCardBadges notes={c.ambassador.quickNotes} />
                        </QuickNoteContextTarget>
                      </Td>
                      <Td className="text-muted-foreground">{c.ambassador.instagram}</Td>
                      <Td>
                        <NotionPill kind="status">{deliveryStatus(c)}</NotionPill>
                      </Td>
                      <Td className="tabular">{c.pctDelivered.toFixed(0)}%</Td>
                      <Td>
                        <ChannelCell delivered={c.deliveredFeed} meta={c.metaFeed} status={c.statusFeed} />
                      </Td>
                      <Td>
                        <ChannelCell
                          delivered={c.deliveredStories}
                          meta={c.metaStories}
                          status={c.statusStories}
                        />
                      </Td>
                      <Td>
                        <ChannelCell
                          delivered={c.deliveredTiktok}
                          meta={c.metaTiktok}
                          status={c.statusTiktok}
                        />
                      </Td>
                      <Td>
                        <Textarea
                          defaultValue={c.notes || ""}
                          onBlur={(e) => onSaveNotes(c.id, e.target.value)}
                          className="min-w-[180px] text-xs"
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

export function EntregasGalleryView({
  items,
  groupBy,
  onNotesChanged,
}: {
  items: EntregaControl[];
  groupBy: GroupByKey;
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
            {group.items.map((c) => (
              <QuickNoteContextTarget
                key={c.id}
                ambassadorId={c.ambassador.id}
                ambassadorName={c.ambassador.fullName}
                onChanged={onNotesChanged}
              >
                <div className="overflow-hidden rounded-xl border border-hairline bg-white shadow-soft">
                  <div
                    className="h-2 w-full"
                    style={{ backgroundColor: c.ambassador.program === "ECJ" ? "#D08C00" : "#6B0A09" }}
                  />
                  <div className="space-y-3 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <AmbassadorNameLink
                          id={c.ambassador.id}
                          onNotesChanged={onNotesChanged}
                          contextMenu={false}
                        >
                          {c.ambassador.fullName}
                        </AmbassadorNameLink>
                        <p className="text-sm text-muted-foreground">{c.ambassador.instagram}</p>
                      </div>
                      <VerticalBadge vertical={c.ambassador.program} className="shrink-0 scale-90" />
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <NotionPill kind="status">{deliveryStatus(c)}</NotionPill>
                      <span className="rounded bg-surface px-2 py-0.5 text-xs font-medium tabular text-body">
                        {c.pctDelivered.toFixed(0)}%
                      </span>
                    </div>
                    <QuickNoteCardBadges notes={c.ambassador.quickNotes} />
                    <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                    <div>
                      <p className="font-medium text-ink">Feed</p>
                      {c.deliveredFeed}/{c.metaFeed}
                    </div>
                    <div>
                      <p className="font-medium text-ink">Stories</p>
                      {c.deliveredStories}/{c.metaStories}
                    </div>
                    <div>
                      <p className="font-medium text-ink">TikTok</p>
                      {c.deliveredTiktok}/{c.metaTiktok}
                    </div>
                  </div>
                  {c.notes && <p className="line-clamp-2 text-xs text-muted-foreground">{c.notes}</p>}
                </div>
              </div>
              </QuickNoteContextTarget>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function EntregasBoardView({
  items,
  groupBy,
  onNotesChanged,
}: {
  items: EntregaControl[];
  groupBy: GroupByKey;
  onNotesChanged?: () => void;
}) {
  const effectiveGroupBy = groupBy === "none" ? "status" : groupBy;
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
          <div className="min-h-[120px] space-y-2">
            {group.items.map((c) => (
              <QuickNoteContextTarget
                key={c.id}
                ambassadorId={c.ambassador.id}
                ambassadorName={c.ambassador.fullName}
                onChanged={onNotesChanged}
              >
                <div className="rounded-lg border border-hairline bg-white p-3 shadow-soft">
                  <AmbassadorNameLink
                    id={c.ambassador.id}
                    className="truncate text-sm"
                    stopPropagation
                    onNotesChanged={onNotesChanged}
                    contextMenu={false}
                  >
                    {c.ambassador.fullName}
                  </AmbassadorNameLink>
                  <p className="truncate text-xs text-muted-foreground">{c.ambassador.instagram}</p>
                  <QuickNoteCardBadges notes={c.ambassador.quickNotes} />
                  <div className="mt-2 flex flex-wrap gap-1">
                  <span className="rounded bg-surface px-1.5 py-0.5 text-xs tabular">
                    {c.pctDelivered.toFixed(0)}%
                  </span>
                  <Badge variant={c.statusFeed === "OK" ? "success" : "warning"}>
                    F {c.deliveredFeed}/{c.metaFeed}
                  </Badge>
                  <Badge variant={c.statusStories === "OK" ? "success" : "warning"}>
                    S {c.deliveredStories}/{c.metaStories}
                  </Badge>
                </div>
              </div>
              </QuickNoteContextTarget>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
