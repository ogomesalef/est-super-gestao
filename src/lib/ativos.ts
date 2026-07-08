import { displayName } from "@/lib/ambassador-name";
import { buildAmbassadorSocialLinks } from "@/lib/ambassador-social-links";
import type { AmbassadorSocialLink } from "@/lib/ambassador-social-links";
import { instagramAvatarProxyPath } from "@/lib/instagram-avatar";
import { prisma } from "@/lib/prisma";
import {
  currentMonthRef,
  monthRefFromDate,
  previousMonthRef,
} from "@/lib/utils";
import { whatsappWaMeUrl } from "@/lib/whatsapp-link";

export type AtivoMonthlySummary = {
  monthRef: string;
  pctDelivered: number;
  metaFeed: number;
  deliveredFeed: number;
  metaStories: number;
  deliveredStories: number;
  metaTiktok: number;
  deliveredTiktok: number;
  metaYoutube: number;
  deliveredYoutube: number;
  statusFeed: string | null;
  statusStories: string | null;
  statusTiktok: string | null;
  statusYoutube: string | null;
  proofsLink: string | null;
};

export type AtivoPartnership = {
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
};

export type AtivoItem = {
  id: string;
  reportSlug: string | null;
  displayName: string;
  email: string | null;
  whatsapp: string | null;
  whatsappUrl: string | null;
  instagram: string;
  tiktok: string | null;
  youtube: string | null;
  program: string;
  avatarUrl: string | null;
  socialLinks: AmbassadorSocialLink[];
  partnership: AtivoPartnership;
  currentMonthRef: string;
  previousMonthRef: string;
  currentMonthPct: number | null;
  previousMonthPct: number | null;
  monthlyHistory: AtivoMonthlySummary[];
};

function serializeDate(d: Date | null | undefined): string | null {
  return d ? d.toISOString() : null;
}

function serializeControl(c: {
  monthRef: string;
  pctDelivered: number;
  metaFeed: number;
  deliveredFeed: number;
  metaStories: number;
  deliveredStories: number;
  metaTiktok: number;
  deliveredTiktok: number;
  metaYoutube: number;
  deliveredYoutube: number;
  statusFeed: string | null;
  statusStories: string | null;
  statusTiktok: string | null;
  statusYoutube: string | null;
  proofsLink: string | null;
}): AtivoMonthlySummary {
  return {
    monthRef: c.monthRef,
    pctDelivered: c.pctDelivered,
    metaFeed: c.metaFeed,
    deliveredFeed: c.deliveredFeed,
    metaStories: c.metaStories,
    deliveredStories: c.deliveredStories,
    metaTiktok: c.metaTiktok,
    deliveredTiktok: c.deliveredTiktok,
    metaYoutube: c.metaYoutube,
    deliveredYoutube: c.deliveredYoutube,
    statusFeed: c.statusFeed,
    statusStories: c.statusStories,
    statusTiktok: c.statusTiktok,
    statusYoutube: c.statusYoutube,
    proofsLink: c.proofsLink,
  };
}

export async function getAtivosList(program?: string): Promise<AtivoItem[]> {
  const currentRef = currentMonthRef();
  const prevRef = previousMonthRef(currentRef);

  const ambassadors = await prisma.ambassador.findMany({
    where: {
      status: "Ativo",
      ...(program ? { program } : {}),
    },
    include: {
      partnership: true,
      monthlyControls: { orderBy: { monthRef: "desc" } },
    },
    orderBy: { fullName: "asc" },
  });

  const items: AtivoItem[] = [];

  for (const a of ambassadors) {
    const p = a.partnership;
    if (!p) continue;

    const startRef = monthRefFromDate(p.startDate);
    const history = a.monthlyControls
      .filter((c) => !startRef || c.monthRef >= startRef)
      .map(serializeControl);

    const currentCtrl = a.monthlyControls.find((c) => c.monthRef === currentRef);
    const prevCtrl = a.monthlyControls.find((c) => c.monthRef === prevRef);

    items.push({
      id: a.id,
      reportSlug: a.reportSlug,
      displayName: displayName(a),
      email: a.email,
      whatsapp: a.whatsapp,
      whatsappUrl: whatsappWaMeUrl(a.whatsapp),
      instagram: a.instagram,
      tiktok: a.tiktok,
      youtube: a.youtube,
      program: a.program,
      avatarUrl: instagramAvatarProxyPath(a.instagram) || null,
      socialLinks: buildAmbassadorSocialLinks({
        instagram: a.instagram,
        tiktok: a.tiktok,
        youtube: a.youtube,
      }),
      partnership: {
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
      },
      currentMonthRef: currentRef,
      previousMonthRef: prevRef,
      currentMonthPct: currentCtrl?.pctDelivered ?? null,
      previousMonthPct: prevCtrl?.pctDelivered ?? null,
      monthlyHistory: history,
    });
  }

  return items;
}
