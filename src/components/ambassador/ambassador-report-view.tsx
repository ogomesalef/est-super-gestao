"use client";

import { useState } from "react";
import { ChevronDown, ExternalLink, GraduationCap, Wallet } from "lucide-react";
import Image from "next/image";
import { DeliveryLinkPills } from "@/components/delivery-link-pills";
import { VerticalBadge } from "@/components/vertical-badge";
import { NotionPill } from "@/components/views/notion-pill";
import { AmbassadorReportMonths } from "@/components/ambassador/ambassador-report-months";
import type { AmbassadorReportPayload, ReportDelivery } from "@/lib/ambassador-report";
import {
  buildChannelStats,
  sumChannelStats,
  type ChannelStat,
} from "@/lib/ambassador-portal-stats";
import { buildAmbassadorSocialLinks } from "@/lib/ambassador-social-links";
import { getBriefingTheme } from "@/lib/briefing-theme";
import { formatMonthRefLong, normalizeHandle, cn } from "@/lib/utils";

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
}

function formatMoney(v: number | null | undefined): string {
  if (v == null) return "—";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

function PortalCard({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-2xl border border-hairline bg-card shadow-soft",
        className
      )}
    >
      <div className="border-b border-hairline/60 px-4 py-3 md:px-5">
        <h2 className="text-sm font-semibold text-ink md:text-base">{title}</h2>
      </div>
      <div className="p-4 md:p-5">{children}</div>
    </section>
  );
}

function ChannelProgressRow({ channel }: { channel: ChannelStat }) {
  const pct =
    channel.meta <= 0 ? 0 : Math.min(100, Math.round((channel.delivered / channel.meta) * 100));

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2 text-sm">
        <span className="font-medium text-ink">{channel.label}</span>
        <span className="tabular-nums text-muted-foreground">
          {channel.delivered}/{channel.meta}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted/60">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs">
        {channel.remaining > 0 ? (
          <span className="text-amber-700">Faltam {channel.remaining}</span>
        ) : channel.meta > 0 ? (
          <span className="text-emerald-700">Meta cumprida</span>
        ) : null}
        {channel.extra > 0 ? (
          <span className="text-emerald-700">+{channel.extra} a mais</span>
        ) : null}
        {channel.weeklyHint > 0 ? (
          <span className="text-muted-foreground">≈ {channel.weeklyHint}/semana</span>
        ) : null}
      </div>
    </div>
  );
}

function DeliveryList({ deliveries, emptyLabel }: { deliveries: ReportDelivery[]; emptyLabel: string }) {
  if (deliveries.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyLabel}</p>;
  }

  return (
    <div className="divide-y divide-hairline/50 rounded-xl border border-hairline/60">
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
  );
}

function BenefitCard({ data }: { data: AmbassadorReportPayload }) {
  const { partnership: p, ambassador } = data;
  const theme = getBriefingTheme(ambassador.program);
  const isRemuneracao = p.modality === "Remuneração";
  const isAssinatura = p.modality === "Assinatura + Cupom";

  return (
    <section
      className="overflow-hidden rounded-2xl border shadow-soft"
      style={{
        borderColor: theme.accentBorder,
        background: `linear-gradient(135deg, ${theme.accentBgSoft} 0%, white 100%)`,
      }}
    >
      <div className="p-5 md:p-6">
        <div className="flex items-start gap-3">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
            style={{ backgroundColor: theme.accentBg, color: theme.accent }}
          >
            {isRemuneracao ? <Wallet className="h-5 w-5" /> : <GraduationCap className="h-5 w-5" />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
              {isRemuneracao ? "Sua remuneração" : "Seu benefício"}
            </p>
            {isRemuneracao ? (
              <>
                <p className="mt-1 font-serif text-2xl text-ink">{formatMoney(p.agreedValue)}</p>
                <p className="mt-1 text-sm text-muted-foreground">por mês, conforme entregas</p>
              </>
            ) : isAssinatura ? (
              <>
                <p className="mt-1 text-sm text-muted-foreground">Assinatura completa</p>
                <p className="mt-1 font-serif text-xl leading-snug text-ink">
                  {p.courseName || "Plataforma Estratégia"}
                </p>
                {p.courseReleased && p.courseReleaseDate ? (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Liberado em {formatDate(p.courseReleaseDate)}
                  </p>
                ) : null}
              </>
            ) : (
              <p className="mt-1 text-sm text-muted-foreground">{p.modality || "Parceria ativa"}</p>
            )}
            {p.startDate ? (
              <p className="mt-3 text-sm text-muted-foreground">
                Parceria desde{" "}
                <span className="font-medium text-ink">{formatDate(p.startDate)}</span>
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

function CommissionsPlaceholder({ couponCode }: { couponCode: string }) {
  return (
    <PortalCard title="Comissões do cupom">
      <div className="space-y-3">
        <div className="rounded-xl border border-dashed border-hairline bg-canvas/60 px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Seu código
          </p>
          <p className="mt-1 font-mono text-lg font-semibold text-ink">{couponCode}</p>
        </div>
        <p className="text-sm text-muted-foreground">
          Em breve você verá aqui suas vendas e comissões do cupom.
        </p>
      </div>
    </PortalCard>
  );
}

export function AmbassadorReportView({ data }: { data: AmbassadorReportPayload }) {
  const { ambassador, partnership: p } = data;
  const theme = getBriefingTheme(ambassador.program);
  const isRemuneracao = p.modality === "Remuneração";
  const socialLinks = buildAmbassadorSocialLinks(ambassador);

  const currentMonth =
    data.months.find((m) => m.control.monthRef === data.currentMonthRef) ?? data.months[0];
  const pastMonths = data.months.filter((m) => m.control.monthRef !== data.currentMonthRef);

  const currentChannels = currentMonth ? buildChannelStats(currentMonth.control) : [];
  const currentTotals = sumChannelStats(currentChannels);

  const currentCampaignDeliveries = currentMonth?.campaignDeliveries ?? [];
  const currentPartnershipDeliveries = currentMonth?.partnershipDeliveries ?? [];

  const [historyOpen, setHistoryOpen] = useState(false);

  return (
    <div className="space-y-5 md:space-y-6">
      <header className="flex items-start gap-4">
        {ambassador.avatarUrl ? (
          <Image
            src={ambassador.avatarUrl}
            alt=""
            width={64}
            height={64}
            className="h-16 w-16 shrink-0 rounded-full border-2 border-white object-cover shadow-sm"
            style={{ borderColor: theme.accentBorder }}
            unoptimized
          />
        ) : (
          <div
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-lg font-semibold text-white"
            style={{ backgroundColor: theme.accent }}
          >
            {ambassador.displayName.charAt(0)}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm text-muted-foreground">Olá,</p>
          <h1 className="font-serif text-2xl text-ink md:text-3xl">{ambassador.displayName}</h1>
          <p className="mt-0.5 text-sm text-primary">{normalizeHandle(ambassador.instagram)}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <VerticalBadge vertical={ambassador.program} />
            {p.modality ? <NotionPill kind="modality">{p.modality}</NotionPill> : null}
          </div>
          {socialLinks.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
              {socialLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
                >
                  {link.handle}
                  <ExternalLink className="h-3 w-3 opacity-60" />
                </a>
              ))}
            </div>
          ) : null}
        </div>
      </header>

      <BenefitCard data={data} />

      {currentMonth && currentChannels.length > 0 ? (
        <PortalCard title={`Metas de ${formatMonthRefLong(currentMonth.control.monthRef)}`}>
          <div className="space-y-4">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-3xl font-serif tabular-nums text-ink">{currentTotals.pct}%</p>
                <p className="text-sm text-muted-foreground">
                  {currentTotals.totalDelivered} de {currentTotals.totalMeta} entregas do mês
                </p>
              </div>
              {currentTotals.totalRemaining > 0 ? (
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                  Faltam {currentTotals.totalRemaining}
                </span>
              ) : currentTotals.totalMeta > 0 ? (
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                  Meta do mês OK
                </span>
              ) : null}
            </div>

            <div className="space-y-4">
              {currentChannels.map((ch) => (
                <ChannelProgressRow key={ch.key} channel={ch} />
              ))}
            </div>

            {currentTotals.totalExtra > 0 ? (
              <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                Você já fez {currentTotals.totalExtra} entrega
                {currentTotals.totalExtra === 1 ? "" : "s"} a mais neste mês.
              </p>
            ) : null}
          </div>
        </PortalCard>
      ) : null}

      {currentMonth ? (
        <PortalCard title="Entregas do mês">
          <DeliveryList
            deliveries={currentPartnershipDeliveries}
            emptyLabel="Nenhuma entrega de parceria registrada neste mês."
          />
        </PortalCard>
      ) : null}

      {currentCampaignDeliveries.length > 0 ? (
        <PortalCard title="Campanhas (opcional)">
          <p className="mb-3 text-xs text-muted-foreground">
            Entregas extras de campanha — não entram na meta mensal da parceria.
          </p>
          <DeliveryList deliveries={currentCampaignDeliveries} emptyLabel="" />
        </PortalCard>
      ) : null}

      {p.couponCode ? <CommissionsPlaceholder couponCode={p.couponCode} /> : null}

      {pastMonths.length > 0 ? (
        <section className="overflow-hidden rounded-2xl border border-hairline bg-card shadow-soft">
          <button
            type="button"
            onClick={() => setHistoryOpen((v) => !v)}
            className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left md:px-5 md:py-4"
          >
            <span className="text-sm font-semibold text-ink md:text-base">Histórico mensal</span>
            <ChevronDown
              className={cn(
                "h-4 w-4 text-muted-foreground transition-transform",
                historyOpen && "rotate-180"
              )}
            />
          </button>
          {historyOpen ? (
            <div className="border-t border-hairline/60 p-4 md:p-5">
              <AmbassadorReportMonths months={pastMonths} />
            </div>
          ) : null}
        </section>
      ) : null}

      {isRemuneracao ? (
        <PortalCard title="Financeiro">
          {data.months.filter((m) => m.finance).length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum registro financeiro ainda.</p>
          ) : (
            <div className="space-y-3">
              {data.months
                .filter((m) => m.finance)
                .map((m) => (
                  <div
                    key={m.finance!.id}
                    className="rounded-xl border border-hairline/80 bg-background p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-medium capitalize text-ink">
                        {formatMonthRefLong(m.finance!.monthRef)}
                      </p>
                      <NotionPill kind="payment">{m.finance!.paymentStatus}</NotionPill>
                    </div>
                    <dl className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                      <div>
                        <dt className="text-xs text-muted-foreground">Entregas</dt>
                        <dd className="tabular-nums">{m.finance!.pctDelivered.toFixed(0)}%</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-muted-foreground">Acordado</dt>
                        <dd className="tabular-nums">{formatMoney(m.finance!.agreedValue)}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-muted-foreground">A receber</dt>
                        <dd className="tabular-nums font-medium">{formatMoney(m.finance!.amountDue)}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-muted-foreground">Termo</dt>
                        <dd>
                          {m.finance!.termLink ? (
                            <a
                              href={m.finance!.termLink}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-primary hover:underline"
                            >
                              Ver PDF
                            </a>
                          ) : (
                            "—"
                          )}
                        </dd>
                      </div>
                    </dl>
                  </div>
                ))}
            </div>
          )}
        </PortalCard>
      ) : null}
    </div>
  );
}
