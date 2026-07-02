import { normalizeHandle } from "@/lib/utils";

export function instagramProfileUrl(instagram: string | null | undefined): string | null {
  const handle = normalizeHandle(instagram).replace(/^@/, "");
  if (!handle) return null;
  return `https://instagram.com/${handle}`;
}
