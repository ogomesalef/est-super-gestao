import type { AmbassadorQuickNote } from "@/lib/ambassador-quick-notes";

export type FinanceiroPartnership = {
  legalCpf: string | null;
  legalAddress: string | null;
  bankDetails: string | null;
  agreedValue?: number | null;
} | null;

export type FinanceiroRow = {
  id: string;
  monthRef: string;
  paymentStatus: string;
  pctDelivered: number;
  agreedValue: number | null;
  valueLocked: boolean;
  amountDue: number | null;
  log: string | null;
  termLink: string | null;
  termDocLink: string | null;
  termSigned: boolean;
  signedTermLink: string | null;
  termActivityAuto: string;
  ambassador: {
    id: string;
    fullName: string;
    socialName: string | null;
    instagram: string;
    program: string;
    email: string | null;
    partnership: FinanceiroPartnership;
    quickNotes?: AmbassadorQuickNote[];
  };
};
