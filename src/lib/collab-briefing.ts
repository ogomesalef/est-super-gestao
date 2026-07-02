import { generatePublicSlug } from "@/lib/campaign-public";
import { resolveInstagramProfilePicUrl } from "@/lib/instagram-avatar-cache";
import { instagramAvatarProxyPath } from "@/lib/instagram-avatar";
import { displayFirstName, displayName } from "@/lib/ambassador-name";
import { prisma } from "@/lib/prisma";
import {
  collabScriptMarkdown,
  getCampaignBrief,
  oab47ScriptMarkdownFor,
  promoScriptMarkdownFor,
  resolveBriefingKind,
  type CampaignBrief,
} from "@/lib/collab-briefing-content";

export type CollabRequestRow = {
  id: string;
  sortOrder: number;
  title: string;
  status: string;
  introText: string | null;
  scriptMarkdown: string | null;
  videoDueDate: string | null;
  publishDueDate: string | null;
  completedVideoUrl: string | null;
  driveFolderUrl: string | null;
  driveEditorShared: boolean;
};

export type AmbassadorBriefingPayload = {
  assignmentId: string;
  publicSlug: string;
  publicUrl: string;
  driveFolderUrl: string | null;
  driveUploadPublic: boolean;
  ambassador: {
    id: string;
    fullName: string;
    firstName: string;
    instagram: string;
    program: string;
    avatarUrl: string | null;
  };
  campaign: {
    id: string;
    name: string;
    program: string | null;
    driveFolderUrl: string | null;
    brief: CampaignBrief;
  };
  collab: {
    title: string | null;
    notes: string | null;
  };
  requests: CollabRequestRow[];
};

function serializeRequest(r: {
  id: string;
  sortOrder: number;
  title: string;
  status: string;
  introText: string | null;
  scriptMarkdown: string | null;
  videoDueDate: Date | null;
  publishDueDate: Date | null;
  completedVideoUrl: string | null;
  driveFolderUrl: string | null;
  driveEditorShared: boolean;
}): CollabRequestRow {
  return {
    id: r.id,
    sortOrder: r.sortOrder,
    title: r.title,
    status: r.status,
    introText: r.introText,
    scriptMarkdown: r.scriptMarkdown,
    videoDueDate: r.videoDueDate?.toISOString() ?? null,
    publishDueDate: r.publishDueDate?.toISOString() ?? null,
    completedVideoUrl: r.completedVideoUrl,
    driveFolderUrl: r.driveFolderUrl,
    driveEditorShared: r.driveEditorShared,
  };
}

export function ambassadorBriefingUrl(slug: string, origin?: string): string {
  const path = `/p/${slug}`;
  if (origin) return `${origin.replace(/\/$/, "")}${path}`;
  return path;
}

async function ensureAssignmentSlug(assignmentId: string, ambassadorInstagram: string): Promise<string> {
  const existing = await prisma.campaignCollabAssignment.findUnique({
    where: { id: assignmentId },
    select: { publicSlug: true },
  });
  if (existing?.publicSlug) return existing.publicSlug;

  const handle = ambassadorInstagram.replace(/^@+/, "").toLowerCase().slice(0, 20);
  for (let attempt = 0; attempt < 8; attempt++) {
    const slug = attempt === 0 ? handle : `${handle}-${generatePublicSlug().slice(0, 6)}`;
    try {
      const updated = await prisma.campaignCollabAssignment.update({
        where: { id: assignmentId },
        data: { publicSlug: slug },
      });
      return updated.publicSlug!;
    } catch {
      /* collision */
    }
  }
  throw new Error("Não foi possível gerar link público do embaixador");
}

export async function getAmbassadorBriefingBySlug(slug: string): Promise<AmbassadorBriefingPayload | null> {
  const assignment = await prisma.campaignCollabAssignment.findUnique({
    where: { publicSlug: slug },
    include: {
      ambassador: true,
      collab: { include: { campaign: true } },
      requests: { orderBy: { sortOrder: "asc" } },
    },
  });

  if (!assignment?.collab?.campaign) return null;

  const campaign = assignment.collab.campaign;
  const publicSlug = assignment.publicSlug || (await ensureAssignmentSlug(assignment.id, assignment.ambassador.instagram));
  await resolveInstagramProfilePicUrl(assignment.ambassador.instagram);
  const avatarUrl = instagramAvatarProxyPath(assignment.ambassador.instagram) || null;

  return {
    assignmentId: assignment.id,
    publicSlug,
    publicUrl: ambassadorBriefingUrl(publicSlug),
    driveFolderUrl: assignment.driveFolderUrl,
    driveUploadPublic: assignment.driveUploadPublic,
    ambassador: {
      id: assignment.ambassador.id,
      fullName: displayName(assignment.ambassador),
      firstName: displayFirstName(assignment.ambassador),
      instagram: assignment.ambassador.instagram,
      program: assignment.ambassador.program,
      avatarUrl,
    },
    campaign: {
      id: campaign.id,
      name: campaign.name,
      program: campaign.program,
      driveFolderUrl: campaign.driveFolderUrl,
      brief: getCampaignBrief(campaign.name, campaign.program),
    },
    collab: {
      title: assignment.collab.title,
      notes: assignment.collab.notes,
    },
    requests: assignment.requests.map(serializeRequest),
  };
}

export async function syncOab47BriefingContent(campaignId: string): Promise<number> {
  const collab = await prisma.campaignCollab.findUnique({
    where: { campaignId },
    include: {
      assignments: {
        include: { ambassador: true, requests: true },
      },
    },
  });
  if (!collab) return 0;

  const videoDue = new Date("2026-06-05T23:59:59-03:00");

  let count = 0;

  for (const assignment of collab.assignments) {
    await ensureAssignmentSlug(assignment.id, assignment.ambassador.instagram);

    await prisma.campaignCollabRequest.deleteMany({ where: { assignmentId: assignment.id } });

    await prisma.campaignCollabRequest.create({
      data: {
        assignmentId: assignment.id,
        sortOrder: 1,
        title: "Pedido 1 — Reels OAB 47 para Desesperados",
        status: assignment.driveVideoUrl ? "completed" : "open",
        introText: null,
        scriptMarkdown: oab47ScriptMarkdownFor(assignment.ambassador.instagram),
        videoDueDate: videoDue,
        publishDueDate: null,
        completedVideoUrl: assignment.driveVideoUrl,
        driveFolderUrl: assignment.driveFolderUrl,
      },
    });

    count++;
  }

  return count;
}

export async function syncBriefingContent(campaignId: string): Promise<number> {
  const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
  if (!campaign) return 0;

  const kind = resolveBriefingKind(campaign.name, campaign.program);
  if (kind === "sncj") return syncSncjBriefingContent(campaignId);
  if (kind === "oab47") return syncOab47BriefingContent(campaignId);
  return 0;
}

export async function syncSncjBriefingContent(campaignId: string): Promise<number> {
  const collab = await prisma.campaignCollab.findUnique({
    where: { campaignId },
    include: {
      assignments: {
        include: { ambassador: true, requests: true },
      },
    },
  });
  if (!collab) return 0;

  const videoDue1 = new Date("2026-06-22T23:59:59-03:00");
  const publishDue1 = new Date("2026-07-01T23:59:59-03:00");

  let count = 0;

  for (const assignment of collab.assignments) {
    await ensureAssignmentSlug(assignment.id, assignment.ambassador.instagram);

    await prisma.campaignCollabRequest.deleteMany({ where: { assignmentId: assignment.id } });

    await prisma.campaignCollabRequest.create({
      data: {
        assignmentId: assignment.id,
        sortOrder: 1,
        title: "Pedido 1 — Vídeo de collab",
        status: assignment.driveVideoUrl ? "completed" : "open",
        introText: null,
        scriptMarkdown: collabScriptMarkdown(),
        videoDueDate: videoDue1,
        publishDueDate: publishDue1,
        completedVideoUrl: assignment.driveVideoUrl,
        driveFolderUrl: assignment.driveFolderUrl,
      },
    });

    await prisma.campaignCollabRequest.create({
      data: {
        assignmentId: assignment.id,
        sortOrder: 2,
        title: "Pedido 2 — Reels promocional SNCJ",
        status: "open",
        introText: null,
        scriptMarkdown: promoScriptMarkdownFor(assignment.ambassador.instagram),
        videoDueDate: null,
        publishDueDate: null,
        driveFolderUrl: assignment.driveFolderUrl,
      },
    });

    count++;
  }

  return count;
}

/** @deprecated use syncBriefingContent */
export async function seedSncjBriefingRequests(campaignId: string): Promise<number> {
  return syncBriefingContent(campaignId);
}
