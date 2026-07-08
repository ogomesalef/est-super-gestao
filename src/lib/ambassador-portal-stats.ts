import type { ReportMonthlyControl } from "@/lib/ambassador-report";

export type ChannelKey = "feed" | "stories" | "tiktok" | "youtube";

export type ChannelStat = {
  key: ChannelKey;
  label: string;
  meta: number;
  delivered: number;
  remaining: number;
  extra: number;
  weeklyHint: number;
  status: string | null;
};

export function weeklyMetaFromMonthly(meta: number): number {
  if (meta <= 0) return 0;
  return Math.ceil(meta / 4);
}

export function buildChannelStats(control: ReportMonthlyControl): ChannelStat[] {
  const rows: Array<{
    key: ChannelKey;
    label: string;
    meta: number;
    delivered: number;
    status: string | null;
  }> = [
    {
      key: "feed",
      label: "Feed / Reels",
      meta: control.metaFeed,
      delivered: control.deliveredFeed,
      status: control.statusFeed,
    },
    {
      key: "stories",
      label: "Stories",
      meta: control.metaStories,
      delivered: control.deliveredStories,
      status: control.statusStories,
    },
    {
      key: "tiktok",
      label: "TikTok",
      meta: control.metaTiktok,
      delivered: control.deliveredTiktok,
      status: control.statusTiktok,
    },
    {
      key: "youtube",
      label: "YouTube",
      meta: control.metaYoutube,
      delivered: control.deliveredYoutube,
      status: control.statusYoutube,
    },
  ];

  return rows
    .filter((r) => r.meta > 0 || r.delivered > 0)
    .map((r) => ({
      ...r,
      remaining: Math.max(0, r.meta - r.delivered),
      extra: Math.max(0, r.delivered - r.meta),
      weeklyHint: weeklyMetaFromMonthly(r.meta),
    }));
}

export function sumChannelStats(channels: ChannelStat[]): {
  totalMeta: number;
  totalDelivered: number;
  totalRemaining: number;
  totalExtra: number;
  pct: number;
} {
  const totalMeta = channels.reduce((s, c) => s + c.meta, 0);
  const totalDelivered = channels.reduce((s, c) => s + c.delivered, 0);
  const totalRemaining = channels.reduce((s, c) => s + c.remaining, 0);
  const totalExtra = channels.reduce((s, c) => s + c.extra, 0);
  const pct =
    totalMeta <= 0 ? 0 : Math.min(100, Math.round((totalDelivered / totalMeta) * 100));
  return { totalMeta, totalDelivered, totalRemaining, totalExtra, pct };
}
