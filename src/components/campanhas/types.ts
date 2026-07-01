export type CampaignItem = {
  id: string;
  name: string;
  program: string | null;
  status: string;
  effectiveStatus: string;
  driveFolderUrl: string | null;
  startDate: string | null;
  endDate: string | null;
  pageUrl: string | null;
  description: string | null;
  formLabel: string | null;
};

export const CAMPAIGN_STATUSES = ["Ativa", "Agendada", "Inativa", "Encerrada"] as const;
