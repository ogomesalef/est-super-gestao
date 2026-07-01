"use client";

import { useState } from "react";
import { ChevronRight, ExternalLink } from "lucide-react";
import { TableHead, TableRow, Td, TableShell, Th } from "@/components/ui";
import { VerticalBadge } from "@/components/vertical-badge";
import { NotionPill, groupHeaderColor } from "@/components/views/notion-pill";
import { groupItems } from "@/lib/view-system/group";
import type { GroupByKey } from "@/lib/view-system/types";
import { POST_ASSIGNMENT_STATUSES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { AmbassadorNameLink } from "@/components/ambassador-name-link";
import { AssignButton } from "./assign-delivery-modal";
import {
  formatPostDate,
  postAssignmentStatus,
  postTypeGroup,
  type PostDelivery,
} from "./types";

function getGroupKey(item: PostDelivery, groupBy: GroupByKey): string {
  if (groupBy === "status") return postAssignmentStatus(item);
  if (groupBy === "program") return item.program || item.ambassador?.program || "—";
  if (groupBy === "modality") return postTypeGroup(item);
  return "Todos";
}

function orderedKeys(groupBy: GroupByKey): string[] | undefined {
  if (groupBy === "status") return [...POST_ASSIGNMENT_STATUSES];
  if (groupBy === "program") return ["OAB", "ECJ"];
  return undefined;
}

function GroupHeader({
  groupKey,
  count,
  groupBy,
  collapsed,
  onToggle,
  highlight,
}: {
  groupKey: string;
  count: number;
  groupBy: GroupByKey;
  collapsed: boolean;
  onToggle: () => void;
  highlight?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "flex w-full items-center gap-2 px-2 py-2 text-left hover:bg-surface/50",
        highlight && "bg-amber-50/80"
      )}
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

function PostLinks({ post }: { post: PostDelivery }) {
  const links = [
    { href: post.postLink, label: "Post" },
    { href: post.printUrl, label: "Print" },
    { href: post.storiesPrintUrl, label: "Stories" },
    { href: post.videoLink, label: "Vídeo" },
  ].filter((l) => l.href);

  if (!links.length) return <span className="text-muted-foreground">—</span>;

  return (
    <div className="flex flex-wrap gap-1">
      {links.map((l) => (
        <a
          key={l.label}
          href={l.href!}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-0.5 rounded bg-primary/10 px-1.5 py-0.5 text-[11px] font-medium text-primary hover:bg-primary/15"
        >
          {l.label}
          <ExternalLink className="h-3 w-3" />
        </a>
      ))}
    </div>
  );
}

function PostRowCells({
  post,
  onAssign,
}: {
  post: PostDelivery;
  onAssign: (post: PostDelivery) => void;
}) {
  const unassigned = post.needsReview || !post.ambassador;

  return (
    <>
      <Td className={cn(unassigned && "bg-amber-50/50")}>
        <div className="font-medium">{formatPostDate(post.postedAt || post.submittedAt)}</div>
        <div className="text-xs text-muted-foreground">{post.monthRef || "—"}</div>
      </Td>
      <Td className={cn(unassigned && "bg-amber-50/50")}>
        {post.ambassador ? (
          <AmbassadorNameLink id={post.ambassador.id}>
            <div className="font-medium">{post.ambassador.fullName}</div>
            <div className="text-xs text-muted-foreground">{post.ambassador.instagram}</div>
          </AmbassadorNameLink>
        ) : (
          <div>
            <div className="font-medium text-amber-900">{post.fullName || "—"}</div>
            <div className="text-xs text-amber-800/80">{post.instagram || "sem @"}</div>
          </div>
        )}
      </Td>
      <Td>
        <VerticalBadge vertical={post.program || post.ambassador?.program || "OAB"} />
      </Td>
      <Td>{post.deliveryType || "—"}</Td>
      <Td>
        <PostLinks post={post} />
      </Td>
      <Td className="text-xs text-muted-foreground">{post.campaignName || "—"}</Td>
      <Td>
        <NotionPill kind="status">{postAssignmentStatus(post)}</NotionPill>
      </Td>
      <Td>
        <AssignButton post={post} onClick={() => onAssign(post)} compact />
      </Td>
    </>
  );
}

export function PostsTableView({
  items,
  groupBy,
  onAssign,
}: {
  items: PostDelivery[];
  groupBy: GroupByKey;
  onAssign: (post: PostDelivery) => void;
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
        const highlight = group.key === "Sem atribuição";
        return (
          <div
            key={group.key}
            className={cn(
              "overflow-hidden rounded-xl border bg-white shadow-soft",
              highlight ? "border-amber-300 ring-1 ring-amber-200" : "border-hairline"
            )}
          >
            {groupBy !== "none" && (
              <GroupHeader
                groupKey={group.key}
                count={group.items.length}
                groupBy={groupBy}
                collapsed={!!isCollapsed}
                highlight={highlight}
                onToggle={() => setCollapsed((c) => ({ ...c, [group.key]: !c[group.key] }))}
              />
            )}
            {!isCollapsed && (
              <TableShell>
                <TableHead>
                  <TableRow>
                    <Th>Data</Th>
                    <Th>Embaixador</Th>
                    <Th>Vertical</Th>
                    <Th>Tipo</Th>
                    <Th>Links</Th>
                    <Th>Campanha</Th>
                    <Th>Status</Th>
                    <Th className="w-24"> </Th>
                  </TableRow>
                </TableHead>
                <tbody>
                  {group.items.map((post) => (
                    <TableRow key={post.id} className={cn(post.needsReview && "bg-amber-50/30")}>
                      <PostRowCells post={post} onAssign={onAssign} />
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

export function PostsGalleryView({
  items,
  groupBy,
  onAssign,
}: {
  items: PostDelivery[];
  groupBy: GroupByKey;
  onAssign: (post: PostDelivery) => void;
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
            <h3
              className={cn(
                "mb-3 text-sm font-medium",
                group.key === "Sem atribuição" ? "text-amber-800" : "text-muted-foreground"
              )}
            >
              {group.key} · {group.items.length}
            </h3>
          )}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {group.items.map((post) => {
              const unassigned = post.needsReview || !post.ambassador;
              return (
                <div
                  key={post.id}
                  className={cn(
                    "rounded-xl border p-4 shadow-soft",
                    unassigned ? "border-amber-300 bg-amber-50/40" : "border-hairline bg-white"
                  )}
                >
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <div>
                      <div className="text-xs text-muted-foreground">
                        {formatPostDate(post.postedAt || post.submittedAt)} · {post.monthRef}
                      </div>
                      <div className="font-medium">
                        {post.ambassador?.fullName || post.fullName || "—"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {post.ambassador?.instagram || post.instagram}
                      </div>
                    </div>
                    <VerticalBadge vertical={post.program || "OAB"} />
                  </div>
                  <p className="mb-2 text-sm">{post.deliveryType || "Tipo não informado"}</p>
                  <PostLinks post={post} />
                  <div className="mt-3 flex items-center justify-between">
                    <NotionPill kind="status">{postAssignmentStatus(post)}</NotionPill>
                    <AssignButton post={post} onClick={() => onAssign(post)} compact />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export function PostsBoardView({
  items,
  groupBy,
  onAssign,
}: {
  items: PostDelivery[];
  groupBy: GroupByKey;
  onAssign: (post: PostDelivery) => void;
}) {
  const effectiveGroupBy = groupBy === "none" ? "status" : groupBy;
  const groups = groupItems(items, (i) => getGroupKey(i, effectiveGroupBy), orderedKeys(effectiveGroupBy));

  return (
    <div className="flex gap-4 overflow-x-auto pb-2">
      {groups.map((group) => {
        const highlight = group.key === "Sem atribuição";
        return (
          <div
            key={group.key}
            className={cn(
              "min-w-[17rem] flex-1 rounded-xl border p-3",
              highlight ? "border-amber-300 bg-amber-50/30" : "border-hairline bg-surface/30"
            )}
          >
            <div className="mb-3 flex items-center justify-between">
              <span className={cn("text-sm font-medium", highlight && "text-amber-900")}>
                {group.key}
              </span>
              <span className="text-xs text-muted-foreground">{group.items.length}</span>
            </div>
            <div className="space-y-2">
              {group.items.map((post) => (
                <div
                  key={post.id}
                  className={cn(
                    "rounded-lg border bg-white p-3 shadow-hairline",
                    highlight && "border-amber-200"
                  )}
                >
                  <div className="text-xs text-muted-foreground">
                    {formatPostDate(post.postedAt || post.submittedAt)}
                  </div>
                  <div className="font-medium text-sm">
                    {post.ambassador?.fullName || post.fullName || "—"}
                  </div>
                  <div className="text-xs text-muted-foreground">{post.deliveryType}</div>
                  <div className="mt-2 flex justify-between">
                    <VerticalBadge vertical={post.program || "OAB"} />
                    <AssignButton post={post} onClick={() => onAssign(post)} compact />
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
