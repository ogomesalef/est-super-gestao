import { prisma } from "@/lib/prisma";
import { displayName } from "@/lib/ambassador-name";
import { collabAmbassadorFolderName, collabVideoFileName } from "@/lib/campaign-collab-drive";
import { ambassadorBriefingUrl } from "@/lib/collab-briefing";

export type CampaignCollabAssignmentRow = {
  id: string;
  ambassadorId: string;
  fullName: string;
  instagram: string;
  program: string;
  email: string | null;
  deliveryCount: number;
  hasDelivery: boolean;
  driveFolderUrl: string | null;
  driveVideoUrl: string | null;
  driveUploadPublic: boolean;
  publicSlug: string | null;
  publicUrl: string | null;
  expectedVideoName: string;
  folderName: string;
  requestCount: number;
  pedido1VideoDueDate: string | null;
  pedido2RequestId: string | null;
  pedido2EditorShared: boolean;
  pedido2FolderUrl: string | null;
  pedido2ShareEmail: string | null;
};

export type CampaignCollabRow = {
  id: string;
  title: string | null;
  videoUrl: string;
  notes: string | null;
  driveFolderUrl: string | null;
  driveInboxUrl: string | null;
  driveFolderName: string | null;
  assignments: CampaignCollabAssignmentRow[];
};

async function deliveryCountsForCampaign(
  campaignId: string,
  campaignName: string,
  ambassadorIds: string[]
): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  if (!ambassadorIds.length) return counts;

  const grouped = await prisma.delivery.groupBy({
    by: ["ambassadorId"],
    where: {
      ambassadorId: { in: ambassadorIds },
      OR: [{ campaignId }, { campaignName }],
    },
    _count: true,
  });

  for (const g of grouped) {
    if (g.ambassadorId) counts.set(g.ambassadorId, g._count);
  }
  return counts;
}

export async function fetchCampaignCollab(campaignId: string): Promise<CampaignCollabRow | null> {
  const collab = await prisma.campaignCollab.findUnique({
    where: { campaignId },
    include: {
      assignments: {
        include: {
          ambassador: { select: { id: true, fullName: true, socialName: true, instagram: true, program: true, email: true } },
          requests: {
            select: {
              id: true,
              sortOrder: true,
              videoDueDate: true,
              driveFolderUrl: true,
              driveEditorShared: true,
              driveShareEmail: true,
            },
          },
        },
        orderBy: { ambassador: { fullName: "asc" } },
      },
    },
  });

  if (!collab) return null;

  const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
  const ambassadorIds = collab.assignments.map((a) => a.ambassadorId);
  const countsByAmbassador = campaign
    ? await deliveryCountsForCampaign(campaignId, campaign.name, ambassadorIds)
    : new Map<string, number>();

  return {
    id: collab.id,
    title: collab.title,
    videoUrl: collab.videoUrl,
    notes: collab.notes,
    driveFolderUrl: collab.driveFolderUrl,
    driveInboxUrl: collab.driveInboxUrl,
    driveFolderName: collab.driveFolderName,
    assignments: collab.assignments.map((a) => ({
      id: a.id,
      ambassadorId: a.ambassadorId,
      fullName: displayName(a.ambassador),
      instagram: a.ambassador.instagram,
      program: a.ambassador.program,
      email: a.ambassador.email,
      deliveryCount: countsByAmbassador.get(a.ambassadorId) ?? 0,
      hasDelivery: (countsByAmbassador.get(a.ambassadorId) ?? 0) > 0,
      driveFolderUrl: a.driveFolderUrl,
      driveVideoUrl: a.driveVideoUrl,
      driveUploadPublic: a.driveUploadPublic,
      publicSlug: a.publicSlug,
      publicUrl: a.publicSlug ? ambassadorBriefingUrl(a.publicSlug) : null,
      folderName: collabAmbassadorFolderName(a.ambassador),
      expectedVideoName: campaign
        ? collabVideoFileName(campaign.name, a.ambassador)
        : collabVideoFileName("Campanha", a.ambassador),
      requestCount: a.requests.length,
      pedido1VideoDueDate:
        a.requests.find((r) => r.sortOrder === 1)?.videoDueDate?.toISOString() ?? null,
      pedido2RequestId: a.requests.find((r) => r.sortOrder === 2)?.id ?? null,
      pedido2EditorShared: a.requests.find((r) => r.sortOrder === 2)?.driveEditorShared ?? false,
      pedido2FolderUrl: a.requests.find((r) => r.sortOrder === 2)?.driveFolderUrl ?? null,
      pedido2ShareEmail: a.requests.find((r) => r.sortOrder === 2)?.driveShareEmail ?? null,
    })),
  };
}

export async function upsertCampaignCollab(
  campaignId: string,
  data: {
    videoUrl: string;
    title?: string | null;
    notes?: string | null;
    driveFolderName?: string | null;
    ambassadorIds: string[];
  }
): Promise<CampaignCollabRow | null> {
  const videoUrl = data.videoUrl.trim();
  if (!videoUrl) {
    await prisma.campaignCollab.deleteMany({ where: { campaignId } });
    return null;
  }

  const collab = await prisma.campaignCollab.upsert({
    where: { campaignId },
    create: {
      campaignId,
      videoUrl,
      title: data.title?.trim() || null,
      notes: data.notes?.trim() || null,
      driveFolderName: data.driveFolderName?.trim() || null,
    },
    update: {
      videoUrl,
      title: data.title?.trim() || null,
      notes: data.notes?.trim() || null,
      ...(data.driveFolderName !== undefined
        ? { driveFolderName: data.driveFolderName?.trim() || null }
        : {}),
    },
  });

  const ids = [...new Set(data.ambassadorIds.filter(Boolean))];

  if (ids.length === 0) {
    await prisma.campaignCollabAssignment.deleteMany({ where: { collabId: collab.id } });
  } else {
    await prisma.campaignCollabAssignment.deleteMany({
      where: { collabId: collab.id, ambassadorId: { notIn: ids } },
    });
    for (const ambassadorId of ids) {
      await prisma.campaignCollabAssignment.upsert({
        where: { collabId_ambassadorId: { collabId: collab.id, ambassadorId } },
        create: { collabId: collab.id, ambassadorId },
        update: {},
      });
    }
  }

  return fetchCampaignCollab(campaignId);
}
