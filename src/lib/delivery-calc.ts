import { prisma } from "./prisma";
import { recalcFinanceAmount } from "./services";

type DeliveryCounts = { feed: number; stories: number; tiktok: number; youtube: number };

type DeliveryLike = {
  deliveryType: string | null;
  printUrl: string | null;
  storiesPrintUrl: string | null;
};

function classifyDelivery(d: DeliveryLike): keyof DeliveryCounts | null {
  const tipo = String(d.deliveryType || "").toLowerCase();
  const hasStoriesPrint = !!d.storiesPrintUrl?.trim();
  const hasPostPrint = !!d.printUrl?.trim();

  if (tipo.includes("stories") || hasStoriesPrint) return "stories";
  if (/(feed|reels?)/i.test(tipo)) return "feed";
  if (/tiktok/i.test(tipo)) return "tiktok";
  if (/youtube/i.test(tipo)) return "youtube";
  if (hasPostPrint) return "feed";
  return null;
}

export function countDeliveriesByType(deliveries: DeliveryLike[]): DeliveryCounts {
  const counts: DeliveryCounts = { feed: 0, stories: 0, tiktok: 0, youtube: 0 };
  for (const d of deliveries) {
    const kind = classifyDelivery(d);
    if (kind) counts[kind] += 1;
  }
  return counts;
}

function blockStatus(delivered: number, meta: number): string {
  if (meta <= 0) return "";
  return delivered >= meta ? "OK" : "Pendente";
}

function calcPctDelivered(
  delivered: DeliveryCounts,
  meta: { feed: number; stories: number; tiktok: number; youtube: number }
): number {
  const totalMeta = meta.feed + meta.stories + meta.tiktok + meta.youtube;
  const totalEnt = delivered.feed + delivered.stories + delivered.tiktok + delivered.youtube;
  if (totalMeta <= 0) return 0;
  return Math.min(100, Math.round((totalEnt / totalMeta) * 10000) / 100);
}

/** Recalcula MonthlyControl a partir das entregas individuais atribuídas. */
export async function recalcMonthlyControl(ambassadorId: string, monthRef: string) {
  const ctrl = await prisma.monthlyControl.findUnique({
    where: { ambassadorId_monthRef: { ambassadorId, monthRef } },
  });
  if (!ctrl) return;

  const deliveries = await prisma.delivery.findMany({
    where: { ambassadorId, monthRef, campaignId: null },
  });

  const counts = countDeliveriesByType(deliveries);
  const meta = {
    feed: ctrl.metaFeed,
    stories: ctrl.metaStories,
    tiktok: ctrl.metaTiktok,
    youtube: ctrl.metaYoutube,
  };

  await prisma.monthlyControl.update({
    where: { id: ctrl.id },
    data: {
      deliveredFeed: counts.feed,
      deliveredStories: counts.stories,
      deliveredTiktok: counts.tiktok,
      deliveredYoutube: counts.youtube,
      statusFeed: blockStatus(counts.feed, meta.feed),
      statusStories: blockStatus(counts.stories, meta.stories),
      statusTiktok: blockStatus(counts.tiktok, meta.tiktok),
      statusYoutube: blockStatus(counts.youtube, meta.youtube),
      pctDelivered: calcPctDelivered(counts, meta),
    },
  });

  await recalcFinanceAmount(ambassadorId, monthRef);
}

/** Recalcula todos os meses afetados por uma lista de ambassadorId+monthRef. */
export async function recalcMonthlyControlsFor(
  pairs: Array<{ ambassadorId: string; monthRef: string }>
) {
  const seen = new Set<string>();
  for (const { ambassadorId, monthRef } of pairs) {
    if (!ambassadorId || !monthRef) continue;
    const key = `${ambassadorId}:${monthRef}`;
    if (seen.has(key)) continue;
    seen.add(key);
    await recalcMonthlyControl(ambassadorId, monthRef);
  }
}

/** Recalcula todo MonthlyControl a partir das entregas atuais (zerar após limpar Delivery). */
export async function recalcAllMonthlyControls(): Promise<number> {
  const controls = await prisma.monthlyControl.findMany({
    select: { ambassadorId: true, monthRef: true },
  });
  await recalcMonthlyControlsFor(controls);
  return controls.length;
}
