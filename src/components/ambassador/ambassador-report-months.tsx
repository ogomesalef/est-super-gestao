"use client";

import { useState } from "react";
import { ChevronDown, ExternalLink } from "lucide-react";
import { DeliveryLinkPills } from "@/components/delivery-link-pills";
import { NotionPill } from "@/components/views/notion-pill";
import type { ReportMonthBlock } from "@/lib/ambassador-report";
import { buildChannelStats } from "@/lib/ambassador-portal-stats";
import { formatMonthRefLong, cn } from "@/lib/utils";

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
}

function MonthBlock({ month, defaultOpen }: { month: ReportMonthBlock; defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const { control: c, partnershipDeliveries, campaignDeliveries } = month;
  const channels = buildChannelStats(c);

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
              {c.pctDelivered.toFixed(0)}% · {partnershipDeliveries.length} entrega(s)
            </span>
          </div>
          <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
            {channels.map((ch) => (
              <span key={ch.key} className="text-xs text-muted-foreground">
                {ch.label}: {ch.delivered}/{ch.meta}
                {ch.remaining > 0 ? ` · faltam ${ch.remaining}` : null}
                {ch.extra > 0 ? ` · +${ch.extra}` : null}
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

          {partnershipDeliveries.length > 0 ? (
            <div className="divide-y divide-hairline/50">
              {partnershipDeliveries.map((d) => (
                <div
                  key={d.id}
                  className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink">
                      {d.deliveryType || "Entrega"}
                      {d.postedAt ? ` · ${formatDate(d.postedAt)}` : ""}
                    </p>
                  </div>
                  <DeliveryLinkPills delivery={d} />
                </div>
              ))}
            </div>
          ) : (
            <p className="px-4 py-3 text-xs text-muted-foreground">
              Nenhuma entrega de parceria neste mês.
            </p>
          )}

          {campaignDeliveries.length > 0 ? (
            <div className="border-t border-hairline/40 bg-canvas/40 px-4 py-3">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Campanhas
              </p>
              <div className="divide-y divide-hairline/40">
                {campaignDeliveries.map((d) => (
                  <div key={d.id} className="flex flex-col gap-2 py-2 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-ink">
                      {d.deliveryType || "Campanha"}
                      {d.campaignName ? ` · ${d.campaignName}` : ""}
                    </p>
                    <DeliveryLinkPills delivery={d} />
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

export function AmbassadorReportMonths({ months }: { months: ReportMonthBlock[] }) {
  if (months.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhum histórico disponível.</p>;
  }

  return (
    <div className="space-y-2">
      {months.map((m, i) => (
        <MonthBlock key={m.control.id} month={m} defaultOpen={i === 0} />
      ))}
    </div>
  );
}
