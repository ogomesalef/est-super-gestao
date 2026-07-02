import { firstName } from "@/lib/utils";

export type AmbassadorNameFields = {
  fullName: string;
  socialName?: string | null;
};

/** Nome civil / cadastro oficial — termos, financeiro interno, pastas no Drive. */
export function legalName(a: AmbassadorNameFields): string {
  return String(a.fullName || "").trim();
}

/** Nome usado em UI e comunicações com o embaixador. */
export function displayName(a: AmbassadorNameFields): string {
  const social = String(a.socialName || "").trim();
  return social || legalName(a);
}

export function displayFirstName(a: AmbassadorNameFields): string {
  return firstName(displayName(a));
}
