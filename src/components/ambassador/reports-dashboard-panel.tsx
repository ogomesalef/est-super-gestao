"use client";

import { useMemo, useState } from "react";
import { BarChart3, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { DELIVERY_TYPE_GROUPS, type DeliveryTypeGroup } from "@/lib/delivery-type";
import type {
  ReportsBarPoint,
  ReportsDashboardData,
  ReportsDashboardProgram,
  ReportsPostsBarPoint,
} from "@/lib/reports-dashboard";
import { VERTICAL_CONFIG, type Vertical } from "@/lib/constants";
import { verticalCardClass, verticalTitleClass } from "@/lib/vertical-styles";

const TYPE_COLORS: Record<DeliveryTypeGroup, string> = {
  "Feed/Reels": "bg-oab",
  Stories: "bg-ecj",
  TikTok: "bg-slate-700",
  YouTube: "bg-destructive",
  Outro: "bg-muted-foreground/50",
};

type Period = "month" | "week";

function PeriodToggle({ value, onChange }: { value: Period; onChange: (p: Period) => void }) {
  return (
    <div className="flex rounded-lg border border-hairline bg-canvas p-0.5">
      {(
        [
          { key: "month" as const, label: "Mensal" },
          { key: "week" as const, label: "Semanal" },
        ] as const
      ).map((opt) => (
        <button
          key={opt.key}
          type="button"
          onClick={() => onChange(opt.key)}
          className={cn(
            "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
            value === opt.key
              ? "bg-white text-ink shadow-hairline"
              : "text-muted-foreground hover:text-ink"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function VerticalToggle({
  value,
  onChange,
  counts,
}: {
  value: ReportsDashboardProgram;
  onChange: (v: ReportsDashboardProgram) => void;
  counts: { OAB: number; ECJ: number; ALL: number };
}) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
      {(
        [
          { key: "ALL" as const, label: "Todos", sub: `${counts.ALL} ativos agora` },
          { key: "OAB" as const, label: "OAB", sub: `${counts.OAB} ativos` },
          { key: "ECJ" as const, label: "ECJ", sub: `${counts.ECJ} ativos` },
        ] as const
      ).map((opt) => {
        const active = value === opt.key;
        const vertical = opt.key === "ALL" ? null : (opt.key as Vertical);
        return (
          <button
            key={opt.key}
            type="button"
            onClick={() => onChange(opt.key)}
            className={cn(
              "relative overflow-hidden rounded-xl border border-hairline bg-card p-3 text-left shadow-soft transition-shadow hover:shadow-elev",
              active && "ring-2 ring-primary/30",
              vertical && verticalCardClass(vertical, active)
            )}
          >
            {vertical && (
              <div
                className="absolute inset-y-0 left-0 w-1.5"
                style={{ backgroundColor: VERTICAL_CONFIG[vertical].color }}
                aria-hidden
              />
            )}
            <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">
              Vertical
            </p>
            <p
              className={cn(
                "font-serif text-lg font-bold",
                vertical ? verticalTitleClass(vertical) : "text-ink"
              )}
            >
              {opt.label}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">{opt.sub}</p>
          </button>
        );
      })}
    </div>
  );
}

function SimpleBarChart({
  data,
  accentClass = "bg-primary",
  emptyMessage = "Sem dados no período.",
}: {
  data: ReportsBarPoint[];
  accentClass?: string;
  emptyMessage?: string;
}) {
  const max = Math.max(...data.map((d) => d.count), 1);
  const total = data.reduce((s, d) => s + d.count, 0);

  if (total === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">{emptyMessage}</p>;
  }

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto pb-1">
        <div className="flex min-w-max items-end gap-2 px-1" style={{ height: "12rem" }}>
          {data.map((point) => {
            const heightPct = Math.max((point.count / max) * 100, point.count > 0 ? 8 : 0);
            return (
              <div
                key={point.key}
                className="flex w-14 flex-col items-center justify-end gap-1.5 sm:w-16"
                title={`${point.label}: ${point.count}`}
              >
                <span className="text-[10px] font-semibold tabular-nums text-ink">{point.count}</span>
                <div
                  className={cn("w-full rounded-t-md transition-all", accentClass)}
                  style={{ height: `${heightPct}%`, minHeight: point.count > 0 ? "0.5rem" : 0 }}
                />
                <span className="max-w-14 truncate text-center text-[10px] leading-tight text-muted-foreground sm:max-w-16">
                  {point.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Total no período exibido: <span className="font-medium tabular-nums text-ink">{total}</span>
      </p>
    </div>
  );
}

function StackedBarChart({
  data,
  selectedTypes,
}: {
  data: ReportsPostsBarPoint[];
  selectedTypes: Set<DeliveryTypeGroup>;
}) {
  const filtered = useMemo(
    () =>
      data.map((point) => {
        let count = 0;
        const byType = { ...point.byType };
        for (const t of DELIVERY_TYPE_GROUPS) {
          if (!selectedTypes.has(t)) byType[t] = 0;
          else count += point.byType[t];
        }
        return { ...point, byType, count };
      }),
    [data, selectedTypes]
  );

  const max = Math.max(...filtered.map((d) => d.count), 1);
  const total = filtered.reduce((s, d) => s + d.count, 0);

  if (total === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Nenhum post nos filtros selecionados.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto pb-1">
        <div className="flex min-w-max items-end gap-2 px-1" style={{ height: "12rem" }}>
          {filtered.map((point) => {
            const heightPct = Math.max((point.count / max) * 100, point.count > 0 ? 8 : 0);
            return (
              <div
                key={point.key}
                className="flex w-14 flex-col items-center justify-end gap-1.5 sm:w-16"
                title={`${point.label}: ${point.count} posts`}
              >
                <span className="text-[10px] font-semibold tabular-nums text-ink">{point.count}</span>
                <div
                  className="flex w-full flex-col justify-end overflow-hidden rounded-t-md"
                  style={{ height: `${heightPct}%`, minHeight: point.count > 0 ? "0.5rem" : 0 }}
                >
                  {DELIVERY_TYPE_GROUPS.map((type) => {
                    if (!selectedTypes.has(type) || point.byType[type] === 0) return null;
                    const slicePct = point.count > 0 ? (point.byType[type] / point.count) * 100 : 0;
                    return (
                      <div
                        key={type}
                        className={cn("w-full", TYPE_COLORS[type])}
                        style={{ height: `${slicePct}%`, minHeight: slicePct > 0 ? "2px" : 0 }}
                        title={`${type}: ${point.byType[type]}`}
                      />
                    );
                  })}
                </div>
                <span className="max-w-14 truncate text-center text-[10px] leading-tight text-muted-foreground sm:max-w-16">
                  {point.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Total de posts no período: <span className="font-medium tabular-nums text-ink">{total}</span>
      </p>
    </div>
  );
}

function TypeFilter({
  selected,
  onChange,
}: {
  selected: Set<DeliveryTypeGroup>;
  onChange: (next: Set<DeliveryTypeGroup>) => void;
}) {
  function toggle(type: DeliveryTypeGroup) {
    const next = new Set(selected);
    if (next.has(type)) {
      if (next.size === 1) return;
      next.delete(type);
    } else {
      next.add(type);
    }
    onChange(next);
  }

  return (
    <div className="flex flex-wrap gap-2">
      {DELIVERY_TYPE_GROUPS.map((type) => {
        const active = selected.has(type);
        return (
          <button
            key={type}
            type="button"
            onClick={() => toggle(type)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
              active
                ? "border-hairline bg-white text-ink shadow-hairline"
                : "border-transparent bg-surface/60 text-muted-foreground"
            )}
          >
            <span className={cn("h-2 w-2 rounded-full", TYPE_COLORS[type])} aria-hidden />
            {type}
          </button>
        );
      })}
    </div>
  );
}

export function ReportsDashboardPanel({
  dataByProgram,
  activeCounts,
}: {
  dataByProgram: Record<ReportsDashboardProgram, ReportsDashboardData>;
  activeCounts: { OAB: number; ECJ: number; ALL: number };
}) {
  const [program, setProgram] = useState<ReportsDashboardProgram>("ALL");
  const [ambassadorPeriod, setAmbassadorPeriod] = useState<Period>("month");
  const [postsPeriod, setPostsPeriod] = useState<Period>("month");
  const [selectedTypes, setSelectedTypes] = useState<Set<DeliveryTypeGroup>>(
    () => new Set(DELIVERY_TYPE_GROUPS)
  );

  const data = dataByProgram[program];

  const ambassadorData =
    ambassadorPeriod === "month" ? data.activeByMonth : data.activeByWeek;
  const postsData = postsPeriod === "month" ? data.postsByMonth : data.postsByWeek;

  const latestAmbassadors = ambassadorData[ambassadorData.length - 1]?.count ?? 0;
  const latestPosts = postsData[postsData.length - 1]?.count ?? 0;

  return (
    <section className="space-y-6">
      <div className="overflow-hidden rounded-xl border border-hairline bg-card shadow-soft">
        <div className="border-b border-hairline bg-surface/50 px-4 py-3 sm:px-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              <h2 className="font-serif text-base text-ink">Painel de relatórios</h2>
            </div>
            <p className="text-xs text-muted-foreground">Últimos 12 meses / 12 semanas</p>
          </div>
        </div>

        <div className="space-y-6 p-4 sm:p-5">
          <VerticalToggle value={program} onChange={setProgram} counts={activeCounts} />

          <div className="grid gap-6 lg:grid-cols-2">
            <article className="rounded-xl border border-hairline bg-background/60 p-4">
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    <h3 className="font-medium text-ink">Embaixadores ativos</h3>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Parceria vigente no período · atual:{" "}
                    <span className="font-semibold tabular-nums text-ink">{latestAmbassadors}</span>
                  </p>
                </div>
                <PeriodToggle value={ambassadorPeriod} onChange={setAmbassadorPeriod} />
              </div>
              <SimpleBarChart data={ambassadorData} accentClass="bg-primary" />
            </article>

            <article className="rounded-xl border border-hairline bg-background/60 p-4">
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-ecj" />
                    <h3 className="font-medium text-ink">Volume de posts</h3>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Entregas registradas · período atual:{" "}
                    <span className="font-semibold tabular-nums text-ink">{latestPosts}</span>
                  </p>
                </div>
                <PeriodToggle value={postsPeriod} onChange={setPostsPeriod} />
              </div>

              <div className="mb-4">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Filtrar por tipo
                </p>
                <TypeFilter selected={selectedTypes} onChange={setSelectedTypes} />
              </div>

              <StackedBarChart data={postsData} selectedTypes={selectedTypes} />
            </article>
          </div>
        </div>
      </div>
    </section>
  );
}
