export type AmbassadorSocialLink = {
  label: "Instagram" | "TikTok" | "YouTube";
  handle: string;
  href: string;
};

const INVALID_HANDLE =
  /^(n[aã]o tenho|nao tenho|sem|n\/a|—|-|\.)$|n[aã]o tenho/i;

function rawHandle(value: string | null | undefined): string {
  return String(value || "").trim();
}

function isInvalidHandle(value: string): boolean {
  const cleaned = value.replace(/^@+/, "").trim();
  if (!cleaned) return true;
  return INVALID_HANDLE.test(cleaned.toLowerCase());
}

function displayHandle(value: string): string {
  const trimmed = value.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return trimmed.startsWith("@") ? trimmed : `@${trimmed.replace(/^@+/, "")}`;
}

function instagramUrl(value: string): string {
  if (/^https?:\/\//i.test(value)) return value;
  const user = value.replace(/^@+/, "");
  return `https://www.instagram.com/${user}/`;
}

function tiktokUrl(value: string): string {
  if (/^https?:\/\//i.test(value)) return value;
  const user = value.replace(/^@+/, "");
  return `https://www.tiktok.com/@${user}`;
}

function youtubeUrl(value: string): string {
  if (/^https?:\/\//i.test(value)) return value;
  const user = value.replace(/^@+/, "");
  return `https://www.youtube.com/@${user}`;
}

export function buildAmbassadorSocialLinks(input: {
  instagram?: string | null;
  tiktok?: string | null;
  youtube?: string | null;
}): AmbassadorSocialLink[] {
  const links: AmbassadorSocialLink[] = [];

  const ig = rawHandle(input.instagram);
  if (ig && !isInvalidHandle(ig)) {
    links.push({ label: "Instagram", handle: displayHandle(ig), href: instagramUrl(ig) });
  }

  const tk = rawHandle(input.tiktok);
  if (tk && !isInvalidHandle(tk)) {
    links.push({ label: "TikTok", handle: displayHandle(tk), href: tiktokUrl(tk) });
  }

  const yt = rawHandle(input.youtube);
  if (yt && !isInvalidHandle(yt)) {
    links.push({ label: "YouTube", handle: displayHandle(yt), href: youtubeUrl(yt) });
  }

  return links;
}
