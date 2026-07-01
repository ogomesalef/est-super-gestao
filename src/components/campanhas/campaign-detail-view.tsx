"use client";

import { ExternalLink } from "lucide-react";
import { TableHead, TableRow, Td, TableShell, Th } from "@/components/ui";
import { VerticalBadge } from "@/components/vertical-badge";
import { NotionPill } from "@/components/views/notion-pill";
import type { CampaignDeliveryRow, CampaignDetailPayload } from "@/lib/campaign-detail";
import { cn } from "@/lib/utils";
import { AmbassadorNameLink } from "@/components/ambassador-name-link";

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

function DeliveryLinks({ d }: { d: CampaignDeliveryRow }) {
  const links = [
    { href: d.postLink, label: "Post" },
    { href: d.printUrl, label: "Print" },
    { href: d.storiesPrintUrl, label: "Stories" },
    { href: d.videoLink, label: "Vídeo" },
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

export function CampaignDetailView({
  data,
  showAmbassadorLinks = false,
  className,
}: {
  data: CampaignDetailPayload;
  showAmbassadorLinks?: boolean;
  className?: string;
}) {
  const { campaign, stats, deliveries } = data;
  const accent = campaign.program === "ECJ" ? "#D08C00" : "#6B0A09";

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

      <div className="overflow-hidden rounded-xl border border-hairline bg-card shadow-soft">
        <div className="border-b border-hairline px-4 py-3 sm:px-5">
          <h2 className="font-serif text-lg text-ink">Todas as entregas</h2>
          <p className="text-xs text-muted-foreground">
            Posts, stories, prints e links enviados pelos embaixadores nesta campanha.
          </p>
        </div>

        {deliveries.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">Nenhuma entrega registrada ainda.</p>
        ) : (
          <TableShell className="rounded-none border-0 shadow-none">
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
                    {d.postedAt && d.submittedAt !== d.postedAt && (
                      <div className="text-xs text-muted-foreground">
                        enviado {formatDate(d.submittedAt)}
                      </div>
                    )}
                  </Td>
                  <Td>
                    {d.ambassador ? (
                      showAmbassadorLinks ? (
                        <AmbassadorNameLink id={d.ambassador.id}>
                          <div>{d.ambassador.fullName}</div>
                          <div className="text-xs font-normal text-muted-foreground">
                            {d.ambassador.instagram}
                          </div>
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
                    {d.deliveryType && d.deliveryType !== d.typeGroup && (
                      <p className="mt-1 text-xs text-muted-foreground">{d.deliveryType}</p>
                    )}
                  </Td>
                  <Td>
                    <DeliveryLinks d={d} />
                  </Td>
                  <Td className="text-xs text-muted-foreground">
                    {d.campaignDriveStatus || d.driveStatus || "—"}
                  </Td>
                </TableRow>
              ))}
            </tbody>
          </TableShell>
        )}
      </div>
    </div>
  );
}

export { formatPeriod, formatDate };
