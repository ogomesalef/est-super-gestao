"use client";

import { useState } from "react";
import { ChevronDown, ExternalLink } from "lucide-react";
import { DeliveryLinkPills } from "@/components/delivery-link-pills";
import { NotionPill } from "@/components/views/notion-pill";
import type { ReportMonthBlock } from "@/lib/ambassador-report";
import { formatMonthRefLong } from "@/lib/utils";
import { cn } from "@/lib/utils";

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
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
  if (meta === 0 && delivered === 0) return null;
  return (
    <span className="inline-flex items-center gap-1 text-xs tabular-nums">
      {delivered}/{meta}
      {status ? (
        <NotionPill kind="status" className="text-[10px]">
          {status}
        </NotionPill>
      ) : null}
    </span>
  );
}

function MonthBlock({ month, defaultOpen }: { month: ReportMonthBlock; defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const { control: c, deliveries } = month;

  const channels = [
    { label: "Feed", delivered: c.deliveredFeed, meta: c.metaFeed, status: c.statusFeed },
    { label: "Stories", delivered: c.deliveredStories, meta: c.metaStories, status: c.statusStories },
    { label: "TikTok", delivered: c.deliveredTiktok, meta: c.metaTiktok, status: c.statusTiktok },
    { label: "YouTube", delivered: c.deliveredYoutube, meta: c.metaYoutube, status: c.statusYoutube },
  ].filter((ch) => ch.meta > 0 || ch.delivered > 0);

  return (
    <div className="rounded-lg border border-hairline/80 bg-background">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left hover:bg-muted/30"
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-medium capitalize text-primary">{formatMonthRefLong(c.monthRef)}</h3>
            <span className="text-xs tabular-nums text-muted-foreground">
              {c.pctDelivered.toFixed(0)}% · {deliveries.length} entrega(s)
            </span>
          </div>
          <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
            {channels.map((ch) => (
              <span key={ch.label} className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                {ch.label}: <ChannelCell delivered={ch.delivered} meta={ch.meta} status={ch.status} />
              </span>
            ))}
          </div>
        </div>
        <ChevronDown
          className={cn("mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")}
        />
      </button>

      {open && (
        <div className="border-t border-hairline/60">
          {c.proofsLink ? (
            <div className="border-b border-hairline/40 px-4 py-2">
              <a
                href={c.proofsLink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                Comprovantes do mês <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          ) : null}

          {deliveries.length > 0 ? (
            <div className="divide-y divide-hairline/50">
              {deliveries.map((d) => (
                <div
                  key={d.id}
                  className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink">
                      {d.deliveryType || "Entrega"}
                      {d.postedAt ? ` · ${formatDate(d.postedAt)}` : ""}
                    </p>
                    {d.campaignName ? (
                      <p className="text-xs text-muted-foreground">{d.campaignName}</p>
                    ) : null}
                  </div>
                  <DeliveryLinkPills delivery={d} />
                </div>
              ))}
            </div>
          ) : (
            <p className="px-4 py-3 text-xs text-muted-foreground">Nenhuma entrega individual neste mês.</p>
          )}
        </div>
      )}
    </div>
  );
}

export function AmbassadorReportMonths({ months }: { months: ReportMonthBlock[] }) {
  if (months.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhum registro de entregas.</p>;
  }

  return (
    <div className="space-y-2">
      {months.map((m, i) => (
        <MonthBlock key={m.control.id} month={m} defaultOpen={i === 0} />
      ))}
    </div>
  );
}
