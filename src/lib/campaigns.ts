import type { Campaign } from "@prisma/client";
import { ensureCampaignDriveFolder } from "@/lib/campaign-drive";
import { sendViaAppsScriptBridge } from "@/lib/email-bridge";
import { prisma } from "@/lib/prisma";

export type CampaignLike = Pick<Campaign, "id" | "name" | "status" | "startDate" | "endDate" | "driveFolderUrl">;

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}

function endOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
}

/** Calcula status efetivo com base nas datas de agendamento. */
export function resolveCampaignStatus(
  c: Pick<Campaign, "status" | "startDate" | "endDate">,
  now = new Date()
): string {
  const hasSchedule = Boolean(c.startDate || c.endDate);
  if (!hasSchedule) {
    return c.status === "Ativa" ? "Ativa" : "Inativa";
  }

  const start = c.startDate ? startOfDay(c.startDate) : null;
  const end = c.endDate ? endOfDay(c.endDate) : null;

  if (start && now < start) return "Agendada";
  if (end && now > end) return "Encerrada";
  return "Ativa";
}

export function serializeCampaign(c: Campaign) {
  return {
    id: c.id,
    name: c.name,
    program: c.program,
    status: c.status,
    effectiveStatus: resolveCampaignStatus(c),
    driveFolderUrl: c.driveFolderUrl,
    startDate: c.startDate?.toISOString() ?? null,
    endDate: c.endDate?.toISOString() ?? null,
    eventDate: c.eventDate?.toISOString() ?? null,
    pageUrl: c.pageUrl,
    formLabel: c.formLabel,
    description: c.description,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  };
}

async function maybeCreateDriveFolder(campaign: Campaign): Promise<Campaign | null> {
  if (campaign.driveFolderUrl) return null;
  if (resolveCampaignStatus(campaign) !== "Ativa") return null;

  const result = await ensureCampaignDriveFolder(campaign.name);
  if (!result.ok || !result.folderUrl) return null;

  return prisma.campaign.update({
    where: { id: campaign.id },
    data: { driveFolderUrl: result.folderUrl },
  });
}

export async function syncCampaignFormChoices(): Promise<{ ok: boolean; error?: string }> {
  const active = await prisma.campaign.findMany({
    where: { status: "Ativa" },
    orderBy: { name: "asc" },
  });

  const bridge = await sendViaAppsScriptBridge({
    action: "CAM_SYNC_FORM_CHOICES",
    campaignNames: active.map((c) => c.formLabel || c.name).join("|"),
  });

  if (bridge.ok) return bridge;

  // Bridge legada pode não ter a action — não bloqueia o fluxo.
  return { ok: true, error: bridge.error };
}

export async function syncCampaignStatuses(): Promise<void> {
  const campaigns = await prisma.campaign.findMany();
  let formNeedsSync = false;

  for (const c of campaigns) {
    const nextStatus = resolveCampaignStatus(c);
    if (nextStatus !== c.status) {
      const updated = await prisma.campaign.update({
        where: { id: c.id },
        data: { status: nextStatus },
      });
      formNeedsSync = true;
      if (nextStatus === "Ativa") {
        await maybeCreateDriveFolder(updated);
      }
      continue;
    }

    if (nextStatus === "Ativa" && !c.driveFolderUrl) {
      await maybeCreateDriveFolder(c);
    }
  }

  if (formNeedsSync) {
    await syncCampaignFormChoices();
  }
}

export async function generateCampaignFolder(campaignId: string) {
  const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
  if (!campaign) return { ok: false as const, error: "Campanha não encontrada" };

  const result = await ensureCampaignDriveFolder(campaign.name);
  if (!result.ok || !result.folderUrl) {
    return { ok: false as const, error: result.error || "Erro ao criar pasta" };
  }

  const updated = await prisma.campaign.update({
    where: { id: campaignId },
    data: { driveFolderUrl: result.folderUrl },
  });

  return { ok: true as const, campaign: serializeCampaign(updated) };
}

export async function afterCampaignMutation() {
  await syncCampaignStatuses();
  await syncCampaignFormChoices();
}
