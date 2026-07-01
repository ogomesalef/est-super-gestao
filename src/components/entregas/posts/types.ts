export type PostDelivery = {
  id: string;
  monthRef: string | null;
  needsReview: boolean;
  program: string | null;
  instagram: string | null;
  fullName: string | null;
  email: string | null;
  deliveryType: string | null;
  postedAt: string | null;
  submittedAt: string;
  postLink: string | null;
  printUrl: string | null;
  storiesPrintUrl: string | null;
  videoLink: string | null;
  campaignName: string | null;
  driveStatus: string | null;
  driveOrganizedIn: string | null;
  campaignDriveStatus: string | null;
  syncedAt: string | null;
  ambassador: {
    id: string;
    fullName: string;
    instagram: string;
    program: string;
  } | null;
  campaign: { id: string; name: string } | null;
};

export function postAssignmentStatus(row: PostDelivery): string {
  return row.needsReview || !row.ambassador ? "Sem atribuição" : "Atribuído";
}

export function postTypeGroup(row: PostDelivery): string {
  const tipo = String(row.deliveryType || "").toLowerCase();
  if (tipo.includes("stories") || row.storiesPrintUrl) return "Stories";
  if (/(feed|reels?)/i.test(tipo)) return "Feed/Reels";
  if (/tiktok/i.test(tipo)) return "TikTok";
  if (/youtube/i.test(tipo)) return "YouTube";
  return "Outro";
}

export function formatPostDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}
