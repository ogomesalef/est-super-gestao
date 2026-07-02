import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { VerticalBadge } from "@/components/vertical-badge";
import { NotionPill } from "@/components/views/notion-pill";
import { AmbassadorReportMonths } from "@/components/ambassador/ambassador-report-months";
import type { AmbassadorReportPayload } from "@/lib/ambassador-report";
import { buildAmbassadorSocialLinks } from "@/lib/ambassador-social-links";
import { formatMonthRefLong } from "@/lib/utils";

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
}

function formatMoney(v: number | null | undefined): string {
  if (v == null) return "—";
  return `R$ ${v.toFixed(2)}`;
}

function ReportCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="overflow-hidden rounded-xl border border-hairline bg-card shadow-soft">
      <div className="border-b border-hairline px-5 py-3">
        <h2 className="font-serif text-base text-ink">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

export function AmbassadorReportView({ data }: { data: AmbassadorReportPayload }) {
  const { ambassador, partnership: p } = data;
  const borderColor = ambassador.program === "ECJ" ? "#D08C00" : "#6B0A09";
  const isRemuneracao = p?.modality === "Remuneração";
  const isAssinatura = p?.modality === "Assinatura + Cupom";

  const typeCounts = data.months.reduce(
    (acc, m) => {
      acc.feed += m.control.deliveredFeed;
      acc.stories += m.control.deliveredStories;
      acc.tiktok += m.control.deliveredTiktok;
      acc.youtube += m.control.deliveredYoutube;
      return acc;
    },
    { feed: 0, stories: 0, tiktok: 0, youtube: 0 }
  );

  const types = [
    { label: "Feed", count: typeCounts.feed, meta: p?.metaFeed ?? 0 },
    { label: "Stories", count: typeCounts.stories, meta: p?.metaStories ?? 0 },
    { label: "TikTok", count: typeCounts.tiktok, meta: p?.metaTiktok ?? 0 },
    { label: "YouTube", count: typeCounts.youtube, meta: p?.metaYoutube ?? 0 },
  ].filter((t) => t.meta > 0 || t.count > 0);

  const socialLinks = buildAmbassadorSocialLinks(ambassador);

  return (
    <div className="space-y-6">
      <Link
        href="/relatorios"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
      >
        ← Todos os embaixadores
      </Link>

      <div
        className="overflow-hidden rounded-xl border border-hairline bg-card shadow-soft"
        style={{ borderTopWidth: 4, borderTopColor: borderColor }}
      >
        <div className="p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="font-serif text-2xl text-ink">{ambassador.displayName}</h1>
              {socialLinks.length > 0 ? (
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                  {socialLinks.map((link) => (
                    <a
                      key={link.label}
                      href={link.href}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                    >
                      <span className="text-muted-foreground">{link.label}:</span>
                      {link.handle}
                      <ExternalLink className="h-3 w-3 opacity-60" />
                    </a>
                  ))}
                </div>
              ) : null}
              <div className="mt-2 flex flex-wrap gap-1.5">
                <VerticalBadge vertical={ambassador.program} />
                <NotionPill kind="status">{ambassador.status}</NotionPill>
                {p?.modality ? <NotionPill kind="modality">{p.modality}</NotionPill> : null}
              </div>
              {p?.startDate ? (
                <p className="mt-2 text-sm text-muted-foreground">
                  Início da parceria:{" "}
                  <span className="font-medium text-ink">{formatDate(p.startDate)}</span>
                </p>
              ) : null}
              {isAssinatura && p?.courseName ? (
                <p className="mt-1 text-sm text-muted-foreground">
                  Curso: <span className="font-medium text-ink">{p.courseName}</span>
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-hairline bg-card px-5 py-4">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Entregas registradas
          </p>
          <p className="mt-1 font-serif text-3xl text-ink">{data.totals.deliveryCount}</p>
        </div>

        <div className="rounded-xl border border-hairline bg-card px-5 py-4">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Por tipo
          </p>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
            {types.map((t) => (
              <span key={t.label} className="text-sm tabular-nums text-ink">
                <span className="text-muted-foreground">{t.label}:</span>{" "}
                <span className="font-medium">{t.count}</span>
                {t.meta > 0 ? (
                  <span className="text-muted-foreground"> / {t.meta} por mês</span>
                ) : null}
              </span>
            ))}
          </div>
        </div>
      </div>

      <ReportCard title="Entregas mês a mês">
        <AmbassadorReportMonths months={data.months} />
      </ReportCard>

      {isRemuneracao && (
        <ReportCard title="Financeiro mês a mês">
          {data.months.filter((m) => m.finance).length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum registro financeiro.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[36rem] text-sm">
                <thead>
                  <tr className="border-b border-hairline text-left text-xs text-muted-foreground">
                    <th className="pb-2 pr-4 font-medium">Mês</th>
                    <th className="pb-2 pr-4 font-medium">Status</th>
                    <th className="pb-2 pr-4 font-medium">%</th>
                    <th className="pb-2 pr-4 font-medium">Acordado</th>
                    <th className="pb-2 pr-4 font-medium">A pagar</th>
                    <th className="pb-2 font-medium">Termo</th>
                  </tr>
                </thead>
                <tbody>
                  {data.months
                    .filter((m) => m.finance)
                    .map((m) => (
                      <tr key={m.finance!.id} className="border-b border-hairline/60 last:border-0">
                        <td className="py-2.5 pr-4 font-medium capitalize">
                          {formatMonthRefLong(m.finance!.monthRef)}
                        </td>
                        <td className="py-2.5 pr-4">
                          <NotionPill kind="payment">{m.finance!.paymentStatus}</NotionPill>
                        </td>
                        <td className="py-2.5 pr-4 tabular-nums">{m.finance!.pctDelivered.toFixed(0)}%</td>
                        <td className="py-2.5 pr-4 tabular-nums">{formatMoney(m.finance!.agreedValue)}</td>
                        <td className="py-2.5 pr-4 tabular-nums font-medium">
                          {formatMoney(m.finance!.amountDue)}
                        </td>
                        <td className="py-2.5">
                          {m.finance!.termLink ? (
                            <a
                              href={m.finance!.termLink}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-primary hover:underline"
                            >
                              PDF
                            </a>
                          ) : (
                            "—"
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </ReportCard>
      )}
    </div>
  );
}
