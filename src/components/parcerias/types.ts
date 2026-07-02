import type { AmbassadorQuickNote } from "@/lib/ambassador-quick-notes";

export type ParceriaPartnership = {
  modality: string | null;
  agreedValue: number | null;
  valueLocked: boolean;
  courseName: string | null;
  courseReleased: boolean;
  couponCode: string | null;
  metaFeed: number;
  metaStories: number;
  metaTiktok: number;
  metaYoutube: number;
  startDate: string | null;
  legalCpf: string | null;
  legalAddress: string | null;
  bankDetails: string | null;
};

export type ParceriaItem = {
  id: string;
  program: string;
  fullName: string;
  email: string | null;
  whatsapp: string | null;
  instagram: string;
  status: string;
  alerts: string | null;
  quickNotes?: AmbassadorQuickNote[];
  partnership: ParceriaPartnership | null;
};
