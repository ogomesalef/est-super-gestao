export type AmbassadorPartnership = {
  modality: string | null;
  agreedValue: number | null;
  valueLocked: boolean;
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
};

export type AmbassadorMonthlyControl = {
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
  notes: string | null;
};

export type AmbassadorMonthlyFinance = {
  id: string;
  monthRef: string;
  paymentStatus: string;
  pctDelivered: number;
  agreedValue: number | null;
  amountDue: number | null;
  termLink: string | null;
  termSigned: boolean;
  log: string | null;
};

export type AmbassadorDelivery = {
  id: string;
  deliveryType: string | null;
  postedAt: string | null;
  postLink: string | null;
  campaignName: string | null;
  driveStatus: string | null;
};

export type AmbassadorEmailLog = {
  id: string;
  emailType: string;
  subject: string | null;
  recipient: string | null;
  status: string;
  sentAt: string | null;
  createdAt: string;
};

export type AmbassadorProfile = {
  id: string;
  program: string;
  fullName: string;
  email: string | null;
  whatsapp: string | null;
  instagram: string;
  tiktok: string | null;
  youtube: string | null;
  status: string;
  alerts: string | null;
  createdAt: string;
  partnership: AmbassadorPartnership | null;
  contact: { id: string; status: string; origin: string | null; notes: string | null } | null;
  monthlyControls: AmbassadorMonthlyControl[];
  monthlyFinances: AmbassadorMonthlyFinance[];
  deliveries: AmbassadorDelivery[];
  emailLogs: AmbassadorEmailLog[];
};
