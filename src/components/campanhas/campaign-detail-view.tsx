"use client";

import { ExternalLink, Star, Video } from "lucide-react";
import { TableHead, TableRow, Td, TableShell, Th } from "@/components/ui";
import { VerticalBadge } from "@/components/vertical-badge";
import { NotionPill } from "@/components/views/notion-pill";
import type { CampaignDeliveryRow, CampaignDetailPayload } from "@/lib/campaign-detail";
import { collabSectionTitle } from "@/lib/campaign-collab-video";
import { cn } from "@/lib/utils";
import { AmbassadorNameLink } from "@/components/ambassador-name-link";
import { DeliveryLinkPills } from "@/components/delivery-link-pills";

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  });
}

function formatPeriod(start: string | null, end: string | null): string {
  if (!start && !end) return "Sem período definido";
  return `${start ? formatDate(start) : "…"} → ${end ? formatDate(end) : "…"}`;
}

function sameCalendarDay(a: string, b: string): boolean {
  const opts: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  };
  return (
    new Date(a).toLocaleDateString("pt-BR", opts) === new Date(b).toLocaleDateString("pt-BR", opts)
  );
}

function DeliveriesTable({
  deliveries,
  showAmbassadorLinks,
  emptyMessage,
}: {
  deliveries: CampaignDeliveryRow[];
  showAmbassadorLinks?: boolean;
  emptyMessage: string;
}) {
  if (deliveries.length === 0) {
    return <p className="p-6 text-sm text-muted-foreground">{emptyMessage}</p>;
  }

  return (
    <>
      <div className="space-y-3 p-4 lg:hidden">
        {deliveries.map((d) => (
          <div key={d.id} className="rounded-lg border border-hairline/80 bg-background p-4">
            <p className="font-medium tabular">{formatDate(d.postedAt || d.submittedAt)}</p>
            {d.postedAt && !sameCalendarDay(d.postedAt, d.submittedAt) && (
              <p className="text-xs text-muted-foreground">enviado {formatDate(d.submittedAt)}</p>
            )}
            <div className="mt-2">
              {d.ambassador ? (
                showAmbassadorLinks ? (
                  <AmbassadorNameLink id={d.ambassador.id}>
                    <div>{d.ambassador.fullName}</div>
                    <div className="text-xs font-normal text-muted-foreground">{d.ambassador.instagram}</div>
                  </AmbassadorNameLink>
                ) : (
                  <>
                    <div className="font-medium">{d.ambassador.fullName}</div>
                    <div className="text-xs text-muted-foreground">{d.ambassador.instagram}</div>
                  </>
                )
              ) : (
                <>
                  <div className="font-medium">{d.fullName || "—"}</div>
                  <div className="text-xs text-muted-foreground">{d.instagram || "—"}</div>
                </>
              )}
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              <NotionPill kind="modality">{d.typeGroup}</NotionPill>
              <span className="text-xs text-muted-foreground">
                Drive: {d.campaignDriveStatus || d.driveStatus || "—"}
              </span>
            </div>
            <div className="mt-2">
              <DeliveryLinkPills delivery={d} />
            </div>
          </div>
        ))}
      </div>

      <TableShell className="hidden rounded-none border-0 shadow-none lg:block">
      <TableHead>
        <TableRow>
          <Th>Data</Th>
          <Th>Embaixador</Th>
          <Th>Tipo</Th>
          <Th>Links</Th>
          <Th>Drive</Th>
        </TableRow>
      </TableHead>
      <tbody>
        {deliveries.map((d) => (
          <TableRow key={d.id}>
            <Td>
              <div className="font-medium tabular">{formatDate(d.postedAt || d.submittedAt)}</div>
              {d.postedAt && !sameCalendarDay(d.postedAt, d.submittedAt) && (
                <div className="text-xs text-muted-foreground">enviado {formatDate(d.submittedAt)}</div>
              )}
            </Td>
            <Td>
              {d.ambassador ? (
                showAmbassadorLinks ? (
                  <AmbassadorNameLink id={d.ambassador.id}>
                    <div>{d.ambassador.fullName}</div>
                    <div className="text-xs font-normal text-muted-foreground">{d.ambassador.instagram}</div>
                  </AmbassadorNameLink>
                ) : (
                  <>
                    <div className="font-medium">{d.ambassador.fullName}</div>
                    <div className="text-xs text-muted-foreground">{d.ambassador.instagram}</div>
                  </>
                )
              ) : (
                <>
                  <div className="font-medium">{d.fullName || "—"}</div>
                  <div className="text-xs text-muted-foreground">{d.instagram || "—"}</div>
                </>
              )}
            </Td>
            <Td>
              <NotionPill kind="modality">{d.typeGroup}</NotionPill>
            </Td>
            <Td>
              <DeliveryLinkPills delivery={d} />
            </Td>
            <Td className="text-xs text-muted-foreground">{d.campaignDriveStatus || d.driveStatus || "—"}</Td>
          </TableRow>
        ))}
      </tbody>
    </TableShell>
    </>
  );
}

function CollabHighlight({
  collab,
  accent,
  showAmbassadorLinks,
}: {
  collab: NonNullable<CampaignDetailPayload["collab"]>;
  accent: string;
  showAmbassadorLinks?: boolean;
}) {
  return (
    <div
      className="overflow-hidden rounded-xl border-2 bg-card shadow-soft"
      style={{ borderColor: accent }}
    >
      <div className="border-b border-hairline bg-gradient-to-r from-amber-50/90 to-orange-50/50 px-4 py-3 sm:px-5">
        <div className="flex flex-wrap items-center gap-2">
          <Video className="h-5 w-5" style={{ color: accent }} />
          <h2 className="font-serif text-lg text-ink">{collabSectionTitle(collab)}</h2>
          <span
            className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white"
            style={{ backgroundColor: accent }}
          >
            Selecionados
          </span>
        </div>
        {collab.notes && <p className="mt-2 text-sm text-muted-foreground">{collab.notes}</p>}
      </div>

      <div className="space-y-3 p-4 sm:p-5">
        {collab.assignments.length > 0 ? (
          <>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Embaixadores convidados ({collab.assignments.length})
            </p>
            <ul className="space-y-2">
              {collab.assignments.map((a) => (
                <li
                  key={a.ambassadorId}
                  className="flex items-start justify-between gap-3 rounded-lg border border-amber-200/80 bg-amber-50/50 px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 font-medium text-ink">
                      <Star className="h-3.5 w-3.5 shrink-0 fill-amber-500 text-amber-500" />
                      {showAmbassadorLinks ? (
                        <AmbassadorNameLink id={a.ambassadorId}>{a.fullName}</AmbassadorNameLink>
                      ) : (
                        a.fullName
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{a.instagram}</p>
                    {(a.driveVideoUrl || a.driveFolderUrl) && (
                      <a
                        href={a.driveVideoUrl || a.driveFolderUrl!}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 inline-flex items-center gap-1 text-sm text-primary hover:underline"
                      >
                        {a.driveVideoUrl ? "Ver vídeo no Drive" : "Abrir pasta no Drive"}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <VerticalBadge vertical={a.program} />
                    <NotionPill kind={a.hasDelivery ? "status" : "modality"}>
                      {a.hasDelivery
                        ? `${a.deliveryCount} entrega${a.deliveryCount === 1 ? "" : "s"}`
                        : "Sem entrega ainda"}
                    </NotionPill>
                  </div>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Nenhum embaixador atribuído ainda.</p>
        )}
      </div>
    </div>
  );
}

function DeliveriesSection({
  title,
  subtitle,
  deliveries,
  showAmbassadorLinks,
  emptyMessage,
  highlight,
}: {
  title: string;
  subtitle: string;
  deliveries: CampaignDeliveryRow[];
  showAmbassadorLinks?: boolean;
  emptyMessage: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-hairline bg-card shadow-soft",
        highlight && "ring-1 ring-amber-200"
      )}
    >
      <div className="border-b border-hairline px-4 py-3 sm:px-5">
        <h2 className="font-serif text-lg text-ink">{title}</h2>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
      <DeliveriesTable
        deliveries={deliveries}
        showAmbassadorLinks={showAmbassadorLinks}
        emptyMessage={emptyMessage}
      />
    </div>
  );
}

export function CampaignDetailView({
  data,
  showAmbassadorLinks = false,
  className,
}: {
  data: CampaignDetailPayload;
  showAmbassadorLinks?: boolean;
  className?: string;
}) {
  const { campaign, stats, collab, deliveries } = data;
  const accent = campaign.program === "ECJ" ? "#D08C00" : "#6B0A09";
  const hasCollab = Boolean(collab?.videoUrl);

  return (
    <div className={cn("space-y-6", className)}>
      <div
        className="overflow-hidden rounded-xl border border-hairline bg-card shadow-soft"
        style={{ borderTopWidth: 4, borderTopColor: accent }}
      >
        <div className="p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="font-serif text-2xl text-ink sm:text-3xl">{campaign.name}</h1>
              {campaign.description && (
                <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{campaign.description}</p>
              )}
              <div className="mt-3 flex flex-wrap gap-1.5">
                {campaign.program && <VerticalBadge vertical={campaign.program} />}
                <NotionPill kind="status">{campaign.effectiveStatus}</NotionPill>
              </div>
            </div>
            <div className="text-right text-sm">
              <p className="text-muted-foreground">Período</p>
              <p className="font-medium text-ink">{formatPeriod(campaign.startDate, campaign.endDate)}</p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {campaign.driveFolderUrl && (
              <a
                href={campaign.driveFolderUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-hairline bg-canvas px-4 py-2 text-sm font-medium text-primary shadow-hairline hover:bg-surface"
              >
                <ExternalLink className="h-4 w-4" />
                Pasta Drive da campanha
              </a>
            )}
            {campaign.pageUrl && (
              <a
                href={campaign.pageUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-hairline bg-canvas px-4 py-2 text-sm font-medium text-ink shadow-hairline hover:bg-surface"
              >
                Página da campanha
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-hairline bg-card p-4 shadow-soft">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Entregas</p>
          <p className="mt-1 text-3xl font-bold tabular text-ink">{stats.totalDeliveries}</p>
        </div>
        <div className="rounded-xl border border-hairline bg-card p-4 shadow-soft">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Embaixadores</p>
          <p className="mt-1 text-3xl font-bold tabular text-ink">{stats.uniqueAmbassadors}</p>
        </div>
        {Object.entries(stats.byType).map(([type, count]) => (
          <div key={type} className="rounded-xl border border-hairline bg-card p-4 shadow-soft">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{type}</p>
            <p className="mt-1 text-3xl font-bold tabular text-ink">{count}</p>
          </div>
        ))}
      </div>

      {hasCollab && collab && (
        <CollabHighlight collab={collab} accent={accent} showAmbassadorLinks={showAmbassadorLinks} />
      )}

      <DeliveriesSection
        title="Todas as entregas"
        subtitle="Posts, stories, prints e links enviados pelos embaixadores nesta campanha."
        deliveries={deliveries}
        showAmbassadorLinks={showAmbassadorLinks}
        emptyMessage="Nenhuma entrega registrada ainda."
      />
    </div>
  );
}

export { formatPeriod, formatDate };
