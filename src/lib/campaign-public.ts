import { randomBytes } from "crypto";

export function generatePublicSlug(): string {
  return randomBytes(9).toString("base64url");
}

export function publicCampaignPath(slug: string): string {
  return `/c/${slug}`;
}

export function publicCampaignUrl(slug: string): string {
  const base = (process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/$/, "");
  const path = publicCampaignPath(slug);
  return base ? `${base}${path}` : path;
}
