import { generatePublicSlug } from "@/lib/campaign-public";
import { displayName } from "@/lib/ambassador-name";
import { instagramAvatarProxyPath } from "@/lib/instagram-avatar";
import { prisma } from "@/lib/prisma";
import { currentMonthRef } from "@/lib/utils";

export type ReportDelivery = {
  id: string;
  monthRef: string | null;
  deliveryType: string | null;
  postedAt: string | null;
  submittedAt: string;
  postLink: string | null;
  printUrl: string | null;
  storiesPrintUrl: string | null;
  videoLink: string | null;
  driveOrganizedIn: string | null;
  campaignName: string | null;
};

export type ReportMonthlyControl = {
  id: string;
  monthRef: string;
  pctDelivered: number;
  metaFeed: number;
  deliveredFeed: number;
  statusFeed: string | null;
  metaStories: number;
  deliveredStories: number;
  statusStories: string | null;
  metaTiktok: number;
  deliveredTiktok: number;
  statusTiktok: string | null;
  metaYoutube: number;
  deliveredYoutube: number;
  statusYoutube: string | null;
  proofsLink: string | null;
};

export type ReportMonthlyFinance = {
  id: string;
  monthRef: string;
  paymentStatus: string;
  pctDelivered: number;
  agreedValue: number | null;
  amountDue: number | null;
  termLink: string | null;
  termSigned: boolean;
};

export type ReportMonthBlock = {
  control: ReportMonthlyControl;
  finance: ReportMonthlyFinance | null;
  deliveries: ReportDelivery[];
};

export type AmbassadorReportPayload = {
  reportSlug: string;
  reportUrl: string;
  ambassador: {
    id: string;
    program: string;
    fullName: string;
    socialName: string | null;
    displayName: string;
    email: string | null;
    whatsapp: string | null;
    instagram: string;
    tiktok: string | null;
    youtube: string | null;
    status: string;
  };
  partnership: {
    modality: string | null;
    agreedValue: number | null;
    courseName: string | null;
    courseReleased: boolean;
    courseReleaseDate: string | null;
    couponCode: string | null;
    metaFeed: number;
    metaStories: number;
    metaTiktok: number;
    metaYoutube: number;
    startDate: string | null;
    endDate: string | null;
    proposalSentAt: string | null;
    formalizationSentAt: string | null;
    legalCpf: string | null;
    legalAddress: string | null;
    bankDetails: string | null;
  } | null;
  months: ReportMonthBlock[];
  totals: {
    totalPaid: number;
    totalPending: number;
    totalAgreed: number;
    deliveryCount: number;
  };
};

function serializeDate(d: Date | null | undefined): string | null {
  return d ? d.toISOString() : null;
}

export function ambassadorReportPath(slug: string): string {
  return `/r/${slug}`;
}

export function ambassadorReportUrl(slug: string, origin?: string): string {
  const path = ambassadorReportPath(slug);
  if (origin) return `${origin.replace(/\/$/, "")}${path}`;
  const base = (process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/$/, "");
  return base ? `${base}${path}` : path;
}

function instagramHandle(instagram: string): string {
  return instagram.replace(/^@+/, "").toLowerCase().slice(0, 24);
}

export async function ensureAmbassadorReportSlug(
  ambassadorId: string,
  ambassadorInstagram: string
): Promise<string> {
  const existing = await prisma.ambassador.findUnique({
    where: { id: ambassadorId },
    select: { reportSlug: true },
  });
  if (existing?.reportSlug) return existing.reportSlug;

  const handle = instagramHandle(ambassadorInstagram);
  for (let attempt = 0; attempt < 8; attempt++) {
    const slug = attempt === 0 ? handle : `${handle}-${generatePublicSlug().slice(0, 6)}`;
    try {
      const updated = await prisma.ambassador.update({
        where: { id: ambassadorId },
        data: { reportSlug: slug },
      });
      return updated.reportSlug!;
    } catch {
      /* collision */
    }
  }
  throw new Error(`Não foi possível gerar slug de relatório para ${ambassadorInstagram}`);
}

export async function ensureReportSlugsForActiveAmbassadors(): Promise<
  Array<{ id: string; fullName: string; reportSlug: string; reportUrl: string }>
> {
  const ambassadors = await prisma.ambassador.findMany({
    where: { status: "Ativo" },
    select: { id: true, fullName: true, instagram: true, reportSlug: true },
    orderBy: { fullName: "asc" },
  });

  const results: Array<{ id: string; fullName: string; reportSlug: string; reportUrl: string }> = [];
  for (const a of ambassadors) {
    const slug = a.reportSlug || (await ensureAmbassadorReportSlug(a.id, a.instagram));
    results.push({
      id: a.id,
      fullName: a.fullName,
      reportSlug: slug,
      reportUrl: ambassadorReportUrl(slug),
    });
  }
  return results;
}

export async function getAmbassadorReportBySlug(slug: string): Promise<AmbassadorReportPayload | null> {
  const ambassador = await prisma.ambassador.findUnique({
    where: { reportSlug: slug },
    include: {
      partnership: true,
      monthlyControls: { orderBy: { monthRef: "desc" } },
      monthlyFinances: { orderBy: { monthRef: "desc" } },
      deliveries: { orderBy: [{ postedAt: "desc" }, { submittedAt: "desc" }] },
    },
  });

  if (!ambassador || ambassador.status !== "Ativo") return null;

  const reportSlug =
    ambassador.reportSlug || (await ensureAmbassadorReportSlug(ambassador.id, ambassador.instagram));

  const financeByMonth = new Map(ambassador.monthlyFinances.map((f) => [f.monthRef, f]));
  const deliveriesByMonth = new Map<string, ReportDelivery[]>();

  for (const d of ambassador.deliveries) {
    const monthRef = d.monthRef || "sem-mes";
    const list = deliveriesByMonth.get(monthRef) || [];
    list.push({
      id: d.id,
      monthRef: d.monthRef,
      deliveryType: d.deliveryType,
      postedAt: serializeDate(d.postedAt),
      submittedAt: d.submittedAt.toISOString(),
      postLink: d.postLink,
      printUrl: d.printUrl,
      storiesPrintUrl: d.storiesPrintUrl,
      videoLink: d.videoLink,
      driveOrganizedIn: d.driveOrganizedIn,
      campaignName: d.campaignName,
    });
    deliveriesByMonth.set(monthRef, list);
  }

  const months: ReportMonthBlock[] = ambassador.monthlyControls.map((c) => {
    const f = financeByMonth.get(c.monthRef);
    return {
      control: {
        id: c.id,
        monthRef: c.monthRef,
        pctDelivered: c.pctDelivered,
        metaFeed: c.metaFeed,
        deliveredFeed: c.deliveredFeed,
        statusFeed: c.statusFeed,
        metaStories: c.metaStories,
        deliveredStories: c.deliveredStories,
        statusStories: c.statusStories,
        metaTiktok: c.metaTiktok,
        deliveredTiktok: c.deliveredTiktok,
        statusTiktok: c.statusTiktok,
        metaYoutube: c.metaYoutube,
        deliveredYoutube: c.deliveredYoutube,
        statusYoutube: c.statusYoutube,
        proofsLink: c.proofsLink,
      },
      finance: f
        ? {
            id: f.id,
            monthRef: f.monthRef,
            paymentStatus: f.paymentStatus,
            pctDelivered: f.pctDelivered,
            agreedValue: f.agreedValue,
            amountDue: f.amountDue,
            termLink: f.termLink,
            termSigned: f.termSigned,
          }
        : null,
      deliveries: deliveriesByMonth.get(c.monthRef) || [],
    };
  });

  const p = ambassador.partnership;
  let totalPaid = 0;
  let totalPending = 0;
  let totalAgreed = 0;

  for (const m of months) {
    if (!m.finance) continue;
    const due = m.finance.amountDue ?? 0;
    totalAgreed += m.finance.agreedValue ?? 0;
    if (m.finance.paymentStatus === "Pago") {
      totalPaid += due;
    } else {
      totalPending += due;
    }
  }

  return {
    reportSlug,
    reportUrl: ambassadorReportUrl(reportSlug),
    ambassador: {
      id: ambassador.id,
      program: ambassador.program,
      fullName: ambassador.fullName,
      socialName: ambassador.socialName,
      displayName: displayName(ambassador),
      email: ambassador.email,
      whatsapp: ambassador.whatsapp,
      instagram: ambassador.instagram,
      tiktok: ambassador.tiktok,
      youtube: ambassador.youtube,
      status: ambassador.status,
    },
    partnership: p
      ? {
          modality: p.modality,
          agreedValue: p.agreedValue,
          courseName: p.courseName,
          courseReleased: p.courseReleased,
          courseReleaseDate: serializeDate(p.courseReleaseDate),
          couponCode: p.couponCode,
          metaFeed: p.metaFeed,
          metaStories: p.metaStories,
          metaTiktok: p.metaTiktok,
          metaYoutube: p.metaYoutube,
          startDate: serializeDate(p.startDate),
          endDate: serializeDate(p.endDate),
          proposalSentAt: serializeDate(p.proposalSentAt),
          formalizationSentAt: serializeDate(p.formalizationSentAt),
          legalCpf: p.legalCpf,
          legalAddress: p.legalAddress,
          bankDetails: p.bankDetails,
        }
      : null,
    months,
    totals: {
      totalPaid,
      totalPending,
      totalAgreed,
      deliveryCount: ambassador.deliveries.length,
    },
  };
}

export type AmbassadorReportIndexItem = {
  reportSlug: string;
  displayName: string;
  instagram: string;
  program: string;
  modality: string | null;
  agreedValue: number | null;
  courseName: string | null;
  startDate: string | null;
  deliveryCount: number;
  currentMonthPct: number | null;
  avatarUrl: string | null;
};

export async function getActiveAmbassadorReportIndex(): Promise<AmbassadorReportIndexItem[]> {
  const monthRef = currentMonthRef();

  const ambassadors = await prisma.ambassador.findMany({
    where: { status: "Ativo" },
    include: {
      partnership: true,
      monthlyControls: { where: { monthRef }, take: 1 },
      _count: { select: { deliveries: true } },
    },
    orderBy: { fullName: "asc" },
  });

  const items: AmbassadorReportIndexItem[] = [];

  for (const a of ambassadors) {
    const reportSlug = a.reportSlug || (await ensureAmbassadorReportSlug(a.id, a.instagram));
    const p = a.partnership;

    items.push({
      reportSlug,
      displayName: displayName(a),
      instagram: a.instagram,
      program: a.program,
      modality: p?.modality ?? null,
      agreedValue: p?.agreedValue ?? null,
      courseName: p?.courseName ?? null,
      startDate: serializeDate(p?.startDate),
      deliveryCount: a._count.deliveries,
      currentMonthPct: a.monthlyControls[0]?.pctDelivered ?? null,
      avatarUrl: instagramAvatarProxyPath(a.instagram) || null,
    });
  }

  return items;
}
