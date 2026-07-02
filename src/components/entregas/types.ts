import type { AmbassadorQuickNote } from "@/lib/ambassador-quick-notes";

export type EntregaControl = {
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
  notes: string | null;
  ambassador: {
    id: string;
    fullName: string;
    socialName?: string | null;
    instagram: string;
    program: string;
    quickNotes?: AmbassadorQuickNote[];
  };
};

export const DELIVERY_STATUSES = ["Pendente", "Parcial", "OK"] as const;

export function deliveryStatus(c: EntregaControl): string {
  const statuses = [c.statusFeed, c.statusStories, c.statusTiktok].filter(Boolean) as string[];
  if (statuses.some((s) => s === "Pendente")) return "Pendente";
  if (statuses.length > 0 && statuses.every((s) => s === "OK")) return "OK";
  return "Parcial";
}
