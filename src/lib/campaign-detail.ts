import type { Campaign, Delivery, Ambassador } from "@prisma/client";
import type { CampaignCollabRow } from "@/lib/campaign-collab";
import { displayName } from "@/lib/ambassador-name";
import { fetchCampaignCollab } from "@/lib/campaign-collab";
import { generatePublicSlug, publicCampaignUrl } from "@/lib/campaign-public";
import { serializeCampaign } from "@/lib/campaigns";
import { prisma } from "@/lib/prisma";

type DeliveryWithAmbassador = Delivery & {
  ambassador: Pick<Ambassador, "id" | "fullName" | "socialName" | "instagram" | "program"> | null;
};

export type CampaignDeliveryRow = {
  id: string;
  fullName: string | null;
  instagram: string | null;
  program: string | null;
  deliveryType: string | null;
  typeGroup: string;
  postedAt: string | null;
  submittedAt: string;
  postLink: string | null;
  printUrl: string | null;
  storiesPrintUrl: string | null;
  videoLink: string | null;
  driveStatus: string | null;
  driveOrganizedIn: string | null;
  campaignDriveStatus: string | null;
  ambassador: {
    id: string;
    fullName: string;
    instagram: string;
    program: string;
  } | null;
};

export type CampaignDetailPayload = {
  campaign: ReturnType<typeof serializeCampaign> & {
    publicSlug: string;
    publicUrl: string;
  };
  stats: {
    totalDeliveries: number;
    uniqueAmbassadors: number;
    byType: Record<string, number>;
  };
  collab: CampaignCollabRow | null;
  selectedDeliveries: CampaignDeliveryRow[];
  otherDeliveries: CampaignDeliveryRow[];
  deliveries: CampaignDeliveryRow[];
};

function deliveryTypeGroup(d: DeliveryWithAmbassador): string {
  const tipo = String(d.deliveryType || "").toLowerCase();
  if (tipo.includes("stories") || d.storiesPrintUrl) return "Stories";
  if (/reels?/i.test(tipo)) return "Reels";
  if (/feed/i.test(tipo)) return "Feed";
  if (/tiktok/i.test(tipo)) return "TikTok";
  if (/youtube/i.test(tipo)) return "YouTube";
  return d.deliveryType || "Outro";
}

function serializeDelivery(d: DeliveryWithAmbassador): CampaignDeliveryRow {
  return {
    id: d.id,
    fullName: d.fullName,
    instagram: d.instagram,
    program: d.program,
    deliveryType: d.deliveryType,
    typeGroup: deliveryTypeGroup(d),
    postedAt: d.postedAt?.toISOString() ?? null,
    submittedAt: d.submittedAt.toISOString(),
    postLink: d.postLink,
    printUrl: d.printUrl,
    storiesPrintUrl: d.storiesPrintUrl,
    videoLink: d.videoLink,
    driveStatus: d.driveStatus,
    driveOrganizedIn: d.driveOrganizedIn,
    campaignDriveStatus: d.campaignDriveStatus,
    ambassador: d.ambassador
      ? {
          id: d.ambassador.id,
          fullName: displayName(d.ambassador),
          instagram: d.ambassador.instagram,
          program: d.ambassador.program,
        }
      : null,
  };
}

function buildStats(deliveries: CampaignDeliveryRow[]) {
  const byType: Record<string, number> = {};
  const ambassadors = new Set<string>();

  for (const d of deliveries) {
    byType[d.typeGroup] = (byType[d.typeGroup] || 0) + 1;
    const key = d.ambassador?.id || d.instagram || d.fullName;
    if (key) ambassadors.add(key);
  }

  return {
    totalDeliveries: deliveries.length,
    uniqueAmbassadors: ambassadors.size,
    byType,
  };
}

async function ensurePublicSlug(campaign: Campaign): Promise<string> {
  if (campaign.publicSlug) return campaign.publicSlug;

  for (let attempt = 0; attempt < 5; attempt++) {
    const slug = generatePublicSlug();
    try {
      const updated = await prisma.campaign.update({
        where: { id: campaign.id },
        data: { publicSlug: slug },
      });
      return updated.publicSlug!;
    } catch {
      /* slug collision — retry */
    }
  }
  throw new Error("Não foi possível gerar link público");
}

async function fetchCampaignDeliveries(campaign: Campaign): Promise<CampaignDeliveryRow[]> {
  const rows = await prisma.delivery.findMany({
    where: {
      OR: [{ campaignId: campaign.id }, { campaignName: campaign.name }],
    },
    include: {
      ambassador: { select: { id: true, fullName: true, socialName: true, instagram: true, program: true } },
    },
    orderBy: [{ postedAt: "desc" }, { submittedAt: "desc" }],
  });

  return rows.map(serializeDelivery);
}

function splitDeliveries(
  deliveries: CampaignDeliveryRow[],
  selectedAmbassadorIds: Set<string>
): { selected: CampaignDeliveryRow[]; other: CampaignDeliveryRow[] } {
  if (selectedAmbassadorIds.size === 0) {
    return { selected: [], other: deliveries };
  }

  const selected: CampaignDeliveryRow[] = [];
  const other: CampaignDeliveryRow[] = [];

  for (const d of deliveries) {
    const id = d.ambassador?.id;
    if (id && selectedAmbassadorIds.has(id)) {
      selected.push(d);
    } else {
      other.push(d);
    }
  }

  return { selected, other };
}

function buildPayload(
  campaign: Campaign,
  deliveries: CampaignDeliveryRow[],
  slug: string,
  collab: CampaignCollabRow | null
): CampaignDetailPayload {
  const selectedIds = new Set(collab?.assignments.map((a) => a.ambassadorId) ?? []);
  const { selected, other } = splitDeliveries(deliveries, selectedIds);

  return {
    campaign: {
      ...serializeCampaign(campaign),
      publicSlug: slug,
      publicUrl: publicCampaignUrl(slug),
    },
    stats: buildStats(deliveries),
    collab,
    selectedDeliveries: selected,
    otherDeliveries: other,
    deliveries,
  };
}

export async function getCampaignDetailById(id: string): Promise<CampaignDetailPayload | null> {
  const campaign = await prisma.campaign.findUnique({ where: { id } });
  if (!campaign) return null;

  const slug = await ensurePublicSlug(campaign);
  const refreshed = await prisma.campaign.findUnique({ where: { id } });
  if (!refreshed) return null;

  const deliveries = await fetchCampaignDeliveries(refreshed);
  const collab = await fetchCampaignCollab(refreshed.id);
  return buildPayload(refreshed, deliveries, slug, collab);
}

export async function getCampaignDetailByPublicSlug(slug: string): Promise<CampaignDetailPayload | null> {
  const campaign = await prisma.campaign.findUnique({ where: { publicSlug: slug } });
  if (!campaign) return null;

  const deliveries = await fetchCampaignDeliveries(campaign);
  const collab = await fetchCampaignCollab(campaign.id);
  return buildPayload(campaign, deliveries, slug, collab);
}

export async function backfillCampaignPublicSlugs(): Promise<number> {
  const missing = await prisma.campaign.findMany({ where: { publicSlug: null } });
  let count = 0;
  for (const c of missing) {
    await ensurePublicSlug(c);
    count++;
  }
  return count;
}
