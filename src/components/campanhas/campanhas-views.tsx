"use client";

import Link from "next/link";
import { ExternalLink, FolderPlus, Loader2, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui";
import { VerticalBadge } from "@/components/vertical-badge";
import { NotionPill, groupHeaderColor } from "@/components/views/notion-pill";
import { groupItems } from "@/lib/view-system/group";
import type { GroupByKey } from "@/lib/view-system/types";
import { cn } from "@/lib/utils";
import { CAMPAIGN_STATUSES, type CampaignItem } from "./types";

function getGroupKey(item: CampaignItem, groupBy: GroupByKey): string {
  if (groupBy === "status") return item.effectiveStatus;
  if (groupBy === "program") return item.program || "—";
  return "Todos";
}

function orderedKeys(groupBy: GroupByKey): string[] | undefined {
  if (groupBy === "status") return [...CAMPAIGN_STATUSES];
  if (groupBy === "program") return ["OAB", "ECJ", "—"];
  return undefined;
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
}

function formatPeriod(c: CampaignItem): string {
  if (!c.startDate && !c.endDate) return "Sem agendamento";
  const start = c.startDate ? formatDate(c.startDate) : "…";
  const end = c.endDate ? formatDate(c.endDate) : "…";
  return `${start} → ${end}`;
}

function accentColor(program: string | null): string {
  return program === "ECJ" ? "#D08C00" : "#6B0A09";
}

function CampaignCard({
  c,
  loading,
  onEdit,
  onGenerateFolder,
  onDelete,
}: {
  c: CampaignItem;
  loading: string | null;
  onEdit: (c: CampaignItem) => void;
  onGenerateFolder: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const busy = loading === c.id || loading?.startsWith(c.id);

  return (
    <div className="overflow-hidden rounded-xl border border-hairline bg-white shadow-soft transition-shadow hover:shadow-elev">
      <div className="h-2 w-full" style={{ backgroundColor: accentColor(c.program) }} />
      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-medium text-ink">
              <Link href={`/campanhas/${c.id}`} className="hover:text-primary hover:underline">
                {c.name}
              </Link>
            </h3>
            {c.description && (
              <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{c.description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => onEdit(c)}
            className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-surface hover:text-ink"
            aria-label="Editar"
          >
            <Pencil className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {c.program && <VerticalBadge vertical={c.program} />}
          <NotionPill kind="status">{c.effectiveStatus}</NotionPill>
        </div>

        <div className="rounded-lg border border-hairline bg-canvas/60 px-3 py-2 text-xs">
          <p className="text-muted-foreground">
            Período: <strong className="text-ink">{formatPeriod(c)}</strong>
          </p>
          {c.pageUrl && (
            <a
              href={c.pageUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-flex items-center gap-1 text-primary hover:underline"
            >
              Página da campanha <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {c.driveFolderUrl ? (
            <a
              href={c.driveFolderUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary hover:bg-primary/15"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Pasta Drive
            </a>
          ) : (
            <span className="text-xs text-muted-foreground">Sem pasta Drive</span>
          )}
          <Button
            variant="secondary"
            size="sm"
            disabled={!!busy}
            onClick={() => onGenerateFolder(c.id)}
          >
            {busy ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <FolderPlus className="h-3.5 w-3.5" />
            )}
            Gerar pasta
          </Button>
        </div>

        <div className="flex justify-end border-t border-hairline pt-2">
          <button
            type="button"
            disabled={!!busy}
            onClick={() => onDelete(c.id)}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive disabled:opacity-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Excluir
          </button>
        </div>
      </div>
    </div>
  );
}

export function CampanhasGalleryView({
  items,
  groupBy,
  loading,
  onEdit,
  onGenerateFolder,
  onDelete,
}: {
  items: CampaignItem[];
  groupBy: GroupByKey;
  loading: string | null;
  onEdit: (c: CampaignItem) => void;
  onGenerateFolder: (id: string) => void;
  onDelete: (id: string) => void;
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
                className={cn(
                  "rounded px-2 py-0.5 text-sm font-medium",
                  groupHeaderColor(group.key, groupBy)
                )}
              >
                {group.key}
              </span>
              <span className="text-xs text-muted-foreground">{group.items.length}</span>
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {group.items.map((c) => (
              <CampaignCard
                key={c.id}
                c={c}
                loading={loading}
                onEdit={onEdit}
                onGenerateFolder={onGenerateFolder}
                onDelete={onDelete}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function CampanhasBoardView({
  items,
  groupBy,
  loading,
  onEdit,
  onGenerateFolder,
  onDelete,
}: {
  items: CampaignItem[];
  groupBy: GroupByKey;
  loading: string | null;
  onEdit: (c: CampaignItem) => void;
  onGenerateFolder: (id: string) => void;
  onDelete: (id: string) => void;
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
        <div key={group.key} className="w-80 shrink-0 rounded-xl bg-surface/60 p-2">
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
          <div className="space-y-2">
            {group.items.map((c) => (
              <div
                key={c.id}
                className="overflow-hidden rounded-lg border border-hairline bg-white shadow-soft"
              >
                <div className="h-1.5 w-full" style={{ backgroundColor: accentColor(c.program) }} />
                <div className="space-y-2 p-3">
                  <div>
                    <Link
                      href={`/campanhas/${c.id}`}
                      className="truncate text-sm font-medium text-ink hover:text-primary hover:underline"
                    >
                      {c.name}
                    </Link>
                    <p className="truncate text-xs text-muted-foreground">{formatPeriod(c)}</p>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {c.program && <NotionPill kind="vertical">{c.program}</NotionPill>}
                    <NotionPill kind="status">{c.effectiveStatus}</NotionPill>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="flex-1 text-xs"
                      disabled={!!loading?.startsWith(c.id)}
                      onClick={() => onGenerateFolder(c.id)}
                    >
                      Pasta
                    </Button>
                    {c.driveFolderUrl && (
                      <a
                        href={c.driveFolderUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex h-8 items-center rounded-md border border-hairline px-2 text-xs hover:bg-surface"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function CampanhasTableView({
  items,
  groupBy,
  loading,
  onEdit,
  onGenerateFolder,
  onDelete,
}: {
  items: CampaignItem[];
  groupBy: GroupByKey;
  loading: string | null;
  onEdit: (c: CampaignItem) => void;
  onGenerateFolder: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const groups =
    groupBy === "none"
      ? [{ key: "Todos", items }]
      : groupItems(items, (i) => getGroupKey(i, groupBy), orderedKeys(groupBy));

  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <div key={group.key}>
          {groupBy !== "none" && (
            <div className="mb-2 flex items-center gap-2">
              <span className={cn("rounded px-2 py-0.5 text-sm font-medium", groupHeaderColor(group.key, groupBy))}>
                {group.key}
              </span>
              <span className="text-xs text-muted-foreground">{group.items.length}</span>
            </div>
          )}
          <div className="overflow-hidden rounded-xl border border-hairline bg-card shadow-soft">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-hairline bg-surface/50 text-left text-xs text-muted-foreground">
                  <th className="px-4 py-2 font-medium">Campanha</th>
                  <th className="px-4 py-2 font-medium">Vertical</th>
                  <th className="px-4 py-2 font-medium">Período</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2 font-medium">Drive</th>
                  <th className="px-4 py-2 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {group.items.map((c) => (
                  <tr key={c.id} className="border-b border-hairline/60 last:border-0">
                    <td className="px-4 py-3">
                      <Link href={`/campanhas/${c.id}`} className="font-medium text-ink hover:text-primary hover:underline">
                        {c.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{c.program ? <VerticalBadge vertical={c.program} /> : "—"}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{formatPeriod(c)}</td>
                    <td className="px-4 py-3">
                      <NotionPill kind="status">{c.effectiveStatus}</NotionPill>
                    </td>
                    <td className="px-4 py-3">
                      {c.driveFolderUrl ? (
                        <a href={c.driveFolderUrl} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">
                          Abrir
                        </a>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <Button variant="secondary" size="sm" disabled={!!loading?.startsWith(c.id)} onClick={() => onGenerateFolder(c.id)}>
                          Pasta
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => onDelete(c.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}

export { formatPeriod, formatDate };
