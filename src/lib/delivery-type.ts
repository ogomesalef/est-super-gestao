export type DeliveryTypeGroup = "Feed/Reels" | "Stories" | "TikTok" | "YouTube" | "Outro";

export const DELIVERY_TYPE_GROUPS: DeliveryTypeGroup[] = [
  "Feed/Reels",
  "Stories",
  "TikTok",
  "YouTube",
  "Outro",
];

export function deliveryTypeGroup(d: {
  deliveryType: string | null;
  storiesPrintUrl?: string | null;
  printUrl?: string | null;
}): DeliveryTypeGroup {
  const tipo = String(d.deliveryType || "").toLowerCase();
  if (tipo.includes("stories") || d.storiesPrintUrl) return "Stories";
  if (/(feed|reels?)/i.test(tipo)) return "Feed/Reels";
  if (/tiktok/i.test(tipo)) return "TikTok";
  if (/youtube/i.test(tipo)) return "YouTube";
  if (d.printUrl) return "Feed/Reels";
  return "Outro";
}
