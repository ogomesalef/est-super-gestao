"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Check,
  ChevronDown,
  Copy,
  ExternalLink,
  Mail,
  MessageCircle,
} from "lucide-react";
import { NotionPill } from "@/components/views/notion-pill";
import { AmbassadorNameLink } from "@/components/ambassador-name-link";
import type { AtivoItem, AtivoMonthlySummary } from "@/lib/ativos";
import { buildChannelStats } from "@/lib/ambassador-portal-stats";
import { formatMonthRefLong, cn } from "@/lib/utils";
import { formatWhatsAppDisplay } from "@/lib/whatsapp-link";

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
}

function formatMoney(v: number | null): string {
  if (v == null) return "—";
  return `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function metasLabel(p: AtivoItem["partnership"]): string {
  const parts: string[] = [];
  if (p.metaFeed) parts.push(`Feed ${p.metaFeed}`);
  if (p.metaStories) parts.push(`Stories ${p.metaStories}`);
  if (p.metaTiktok) parts.push(`TikTok ${p.metaTiktok}`);
  if (p.metaYoutube) parts.push(`YouTube ${p.metaYoutube}`);
  return parts.length ? parts.join(" · ") : "—";
}

function pctColor(pct: number | null): string {
  if (pct == null) return "text-muted-foreground";
  if (pct >= 100) return "text-emerald-700";
  if (pct >= 50) return "text-amber-800";
  return "text-orange-700";
}

export function AtivoAvatar({
  item,
  size = "md",
}: {
  item: AtivoItem;
  size?: "sm" | "md" | "lg";
}) {
  const [failed, setFailed] = useState(false);
  const accent = item.program === "ECJ" ? "#D08C00" : "#6B0A09";
  const dim = size === "sm" ? "h-10 w-10" : size === "lg" ? "h-16 w-16" : "h-12 w-12";
  const text = size === "lg" ? "text-lg" : "text-sm";

  return (
    <div
      className={cn("relative shrink-0 overflow-hidden rounded-full border border-hairline bg-surface", dim)}
    >
      {item.avatarUrl && !failed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.avatarUrl}
          alt=""
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <div
          className={cn("flex h-full w-full items-center justify-center font-bold text-white", text)}
          style={{ backgroundColor: accent }}
        >
          {item.displayName.charAt(0).toUpperCase()}
        </div>
      )}
    </div>
  );
}

function CopyableEmail({ email }: { email: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="inline-flex max-w-full items-center gap-1.5 rounded-md px-1.5 py-0.5 text-left text-sm text-primary hover:bg-primary/5"
      title="Clique para copiar"
    >
      <Mail className="h-3.5 w-3.5 shrink-0" />
      <span className="truncate">{email}</span>
      {copied ? (
        <Check className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
      ) : (
        <Copy className="h-3.5 w-3.5 shrink-0 opacity-50" />
      )}
    </button>
  );
}

export function AtivoContactRow({ item }: { item: AtivoItem }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm">
      {item.socialLinks.map((link) => (
        <a
          key={link.label}
          href={link.href}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
        >
          {link.label}
          <ExternalLink className="h-3 w-3 opacity-60" />
        </a>
      ))}
      {item.email ? <CopyableEmail email={item.email} /> : null}
      {item.whatsappUrl ? (
        <a
          href={item.whatsappUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-emerald-700 hover:underline"
        >
          <MessageCircle className="h-3.5 w-3.5" />
          {formatWhatsAppDisplay(item.whatsapp)}
        </a>
      ) : item.whatsapp ? (
        <span className="text-muted-foreground">{formatWhatsAppDisplay(item.whatsapp)}</span>
      ) : null}
    </div>
  );
}

export function AtivoPartnershipBlock({ item }: { item: AtivoItem }) {
  const p = item.partnership;

  return (
    <dl className="grid gap-2 text-sm sm:grid-cols-2">
      <div>
        <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          Modalidade
        </dt>
        <dd className="mt-0.5">
          {p.modality ? <NotionPill kind="modality">{p.modality}</NotionPill> : "—"}
        </dd>
      </div>
      <div>
        <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          Início
        </dt>
        <dd className="mt-0.5 font-medium text-ink">{formatDate(p.startDate)}</dd>
      </div>
      {p.modality === "Remuneração" ? (
        <div>
          <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Valor mensal
          </dt>
          <dd className="mt-0.5 font-medium tabular-nums text-ink">{formatMoney(p.agreedValue)}</dd>
        </div>
      ) : null}
      {p.modality === "Assinatura + Cupom" ? (
        <>
          <div>
            <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Curso liberado
            </dt>
            <dd className="mt-0.5 font-medium text-ink">
              {p.courseReleased ? (
                <>
                  {p.courseName || "Sim"}
                  {p.courseReleaseDate ? (
                    <span className="ml-1 text-xs font-normal text-muted-foreground">
                      ({formatDate(p.courseReleaseDate)})
                    </span>
                  ) : null}
                </>
              ) : (
                <span className="text-muted-foreground">
                  {p.courseName ? `${p.courseName} — pendente` : "Não"}
                </span>
              )}
            </dd>
          </div>
          {p.couponCode ? (
            <div>
              <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Cupom
              </dt>
              <dd className="mt-0.5 font-mono text-sm font-medium text-ink">{p.couponCode}</dd>
            </div>
          ) : null}
        </>
      ) : null}
      <div className="sm:col-span-2">
        <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          Entregas combinadas (mensal)
        </dt>
        <dd className="mt-0.5 text-ink">{metasLabel(p)}</dd>
      </div>
    </dl>
  );
}

function MonthMiniRow({ month }: { month: AtivoMonthlySummary }) {
  const channels = buildChannelStats({ ...month, id: month.monthRef });

  return (
    <div className="rounded-lg border border-hairline/80 bg-background px-3 py-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-medium capitalize text-ink">
          {formatMonthRefLong(month.monthRef)}
        </span>
        <span className={cn("text-sm font-bold tabular-nums", pctColor(month.pctDelivered))}>
          {month.pctDelivered.toFixed(0)}%
        </span>
      </div>
      <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5">
        {channels.map((ch) => (
          <span key={ch.key} className="text-xs text-muted-foreground">
            {ch.label}: {ch.delivered}/{ch.meta}
            {ch.remaining > 0 ? ` (−${ch.remaining})` : null}
          </span>
        ))}
      </div>
      {month.proofsLink ? (
        <a
          href={month.proofsLink}
          target="_blank"
          rel="noreferrer"
          className="mt-1.5 inline-flex items-center gap-1 text-xs text-primary hover:underline"
        >
          Comprovantes <ExternalLink className="h-3 w-3" />
        </a>
      ) : null}
    </div>
  );
}

export function AtivoDeliveryReport({ item }: { item: AtivoItem }) {
  const [expanded, setExpanded] = useState(false);
  const current = item.monthlyHistory.find((m) => m.monthRef === item.currentMonthRef);
  const previous = item.monthlyHistory.find((m) => m.monthRef === item.previousMonthRef);
  const older = item.monthlyHistory.filter(
    (m) => m.monthRef !== item.currentMonthRef && m.monthRef !== item.previousMonthRef
  );

  return (
    <div className="space-y-2">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        Entregas
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="rounded-lg border border-hairline bg-surface/60 px-3 py-2">
          <p className="text-xs text-muted-foreground">Mês atual</p>
          <p className={cn("mt-0.5 text-xl font-bold tabular-nums", pctColor(item.currentMonthPct))}>
            {item.currentMonthPct != null ? `${item.currentMonthPct.toFixed(0)}%` : "—"}
          </p>
          {current ? (
            <p className="mt-1 text-[11px] text-muted-foreground capitalize">
              {formatMonthRefLong(item.currentMonthRef)}
            </p>
          ) : null}
        </div>
        <div className="rounded-lg border border-hairline bg-surface/60 px-3 py-2">
          <p className="text-xs text-muted-foreground">Mês anterior</p>
          <p className={cn("mt-0.5 text-xl font-bold tabular-nums", pctColor(item.previousMonthPct))}>
            {item.previousMonthPct != null ? `${item.previousMonthPct.toFixed(0)}%` : "—"}
          </p>
          {previous ? (
            <p className="mt-1 text-[11px] text-muted-foreground capitalize">
              {formatMonthRefLong(item.previousMonthRef)}
            </p>
          ) : null}
        </div>
      </div>

      {current ? <MonthMiniRow month={current} /> : null}
      {previous && previous.monthRef !== current?.monthRef ? <MonthMiniRow month={previous} /> : null}

      {older.length > 0 ? (
        <>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", expanded && "rotate-180")} />
            {expanded ? "Ocultar histórico" : `Ver todos os meses (${item.monthlyHistory.length})`}
          </button>
          {expanded ? (
            <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
              {item.monthlyHistory.map((m) => (
                <MonthMiniRow key={m.monthRef} month={m} />
              ))}
            </div>
          ) : null}
        </>
      ) : item.monthlyHistory.length === 0 ? (
        <p className="text-xs text-muted-foreground">Sem histórico desde o início da parceria.</p>
      ) : null}
    </div>
  );
}

export function AtivoCardHeader({
  item,
  avatarSize = "md",
}: {
  item: AtivoItem;
  avatarSize?: "sm" | "md" | "lg";
}) {
  return (
    <div className="flex items-start gap-3">
      <AtivoAvatar item={item} size={avatarSize} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <AmbassadorNameLink id={item.id} className="font-serif text-base text-ink">
            {item.displayName}
          </AmbassadorNameLink>
          <NotionPill kind="vertical">{item.program}</NotionPill>
          {item.partnership.modality ? (
            <NotionPill kind="modality">{item.partnership.modality}</NotionPill>
          ) : null}
        </div>
        <p className="mt-0.5 text-sm text-muted-foreground">{item.instagram}</p>
        <div className="mt-2">
          <AtivoContactRow item={item} />
        </div>
      </div>
      {item.reportSlug ? (
        <Link
          href={`/r/${item.reportSlug}`}
          target="_blank"
          rel="noreferrer"
          className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-surface hover:text-primary"
          title="Relatório público"
        >
          <ExternalLink className="h-4 w-4" />
        </Link>
      ) : null}
    </div>
  );
}

export function AtivoFullCard({ item }: { item: AtivoItem }) {
  const accent = item.program === "ECJ" ? "#D08C00" : "#6B0A09";

  return (
    <article className="overflow-hidden rounded-xl border border-hairline bg-card shadow-soft">
      <div className="h-1.5 w-full" style={{ backgroundColor: accent }} />
      <div className="space-y-4 p-4">
        <AtivoCardHeader item={item} avatarSize="lg" />
        <AtivoPartnershipBlock item={item} />
        <AtivoDeliveryReport item={item} />
      </div>
    </article>
  );
}

export { formatDate, formatMoney, metasLabel, pctColor };
