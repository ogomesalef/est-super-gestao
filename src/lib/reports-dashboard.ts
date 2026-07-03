import { deliveryTypeGroup, type DeliveryTypeGroup } from "@/lib/delivery-type";
import { prisma } from "@/lib/prisma";
import { formatMonthRefLong, monthsBetween } from "@/lib/utils";

export type ReportsDashboardProgram = "OAB" | "ECJ" | "ALL";

export type ReportsBarPoint = {
  key: string;
  label: string;
  count: number;
};

export type ReportsPostsBarPoint = ReportsBarPoint & {
  byType: Record<DeliveryTypeGroup, number>;
};

export type ReportsDashboardData = {
  activeByMonth: ReportsBarPoint[];
  activeByWeek: ReportsBarPoint[];
  postsByMonth: ReportsPostsBarPoint[];
  postsByWeek: ReportsPostsBarPoint[];
};

function monthRange(monthsBack: number): string[] {
  const end = new Date();
  const start = new Date(end.getFullYear(), end.getMonth() - (monthsBack - 1), 1);
  return monthsBetween(start, end);
}

function weekStarts(weeksBack: number): Date[] {
  const weeks: Date[] = [];
  const now = new Date();
  const day = now.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const currentMonday = new Date(now);
  currentMonday.setHours(12, 0, 0, 0);
  currentMonday.setDate(now.getDate() + mondayOffset);

  for (let i = weeksBack - 1; i >= 0; i--) {
    const monday = new Date(currentMonday);
    monday.setDate(currentMonday.getDate() - i * 7);
    weeks.push(monday);
  }
  return weeks;
}

function weekEndSunday(monday: Date): Date {
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return sunday;
}

function weekLabel(monday: Date): string {
  const sunday = weekEndSunday(monday);
  const fmt = (d: Date) =>
    d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", timeZone: "America/Sao_Paulo" });
  return `${fmt(monday)} – ${fmt(sunday)}`;
}

function weekKey(monday: Date): string {
  return monday.toISOString().slice(0, 10);
}

function isPartnershipActiveInRange(
  startDate: Date | null | undefined,
  endDate: Date | null | undefined,
  rangeStart: Date,
  rangeEnd: Date
): boolean {
  if (!startDate || startDate > rangeEnd) return false;
  if (endDate && endDate < rangeStart) return false;
  return true;
}

function monthBounds(monthRef: string): { start: Date; end: Date } {
  const [y, m] = monthRef.split("-").map(Number);
  return {
    start: new Date(y, m - 1, 1, 0, 0, 0, 0),
    end: new Date(y, m, 0, 23, 59, 59, 999),
  };
}

function emptyByType(): Record<DeliveryTypeGroup, number> {
  return { "Feed/Reels": 0, Stories: 0, TikTok: 0, YouTube: 0, Outro: 0 };
}

export async function getReportsDashboardData(
  program: ReportsDashboardProgram = "ALL"
): Promise<ReportsDashboardData> {
  const programFilter = program === "ALL" ? undefined : program;

  const ambassadors = await prisma.ambassador.findMany({
    where: programFilter ? { program: programFilter } : undefined,
    select: {
      id: true,
      program: true,
      partnership: { select: { startDate: true, endDate: true } },
    },
  });

  const deliveries = await prisma.delivery.findMany({
    where: {
      ambassadorId: { not: null },
      ...(programFilter
        ? {
            OR: [{ program: programFilter }, { ambassador: { program: programFilter } }],
          }
        : {}),
    },
    select: {
      deliveryType: true,
      printUrl: true,
      storiesPrintUrl: true,
      postedAt: true,
      submittedAt: true,
      monthRef: true,
    },
  });

  const monthRefs = monthRange(12);
  const activeByMonth: ReportsBarPoint[] = monthRefs.map((monthRef) => {
    const { start, end } = monthBounds(monthRef);
    const count = ambassadors.filter((a) =>
      a.partnership
        ? isPartnershipActiveInRange(a.partnership.startDate, a.partnership.endDate, start, end)
        : false
    ).length;
    return {
      key: monthRef,
      label: formatMonthRefLong(monthRef).replace(/^\w/, (c) => c.toUpperCase()),
      count,
    };
  });

  const weeks = weekStarts(12);
  const activeByWeek: ReportsBarPoint[] = weeks.map((monday) => {
    const end = weekEndSunday(monday);
    const count = ambassadors.filter((a) =>
      a.partnership
        ? isPartnershipActiveInRange(a.partnership.startDate, a.partnership.endDate, monday, end)
        : false
    ).length;
    return { key: weekKey(monday), label: weekLabel(monday), count };
  });

  const postsByMonth: ReportsPostsBarPoint[] = monthRefs.map((monthRef) => {
    const byType = emptyByType();
    let count = 0;
    for (const d of deliveries) {
      const ref = d.monthRef || (d.postedAt ? d.postedAt.toISOString().slice(0, 7) : null);
      if (ref !== monthRef) continue;
      const group = deliveryTypeGroup(d);
      byType[group] += 1;
      count += 1;
    }
    return {
      key: monthRef,
      label: formatMonthRefLong(monthRef).replace(/^\w/, (c) => c.toUpperCase()),
      count,
      byType,
    };
  });

  const postsByWeek: ReportsPostsBarPoint[] = weeks.map((monday) => {
    const end = weekEndSunday(monday);
    const byType = emptyByType();
    let count = 0;
    for (const d of deliveries) {
      const when = d.postedAt || d.submittedAt;
      if (!when || when < monday || when > end) continue;
      const group = deliveryTypeGroup(d);
      byType[group] += 1;
      count += 1;
    }
    return { key: weekKey(monday), label: weekLabel(monday), count, byType };
  });

  return { activeByMonth, activeByWeek, postsByMonth, postsByWeek };
}
