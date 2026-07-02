export type DeliveryLinkItem = { href: string; label: string };

export type DeliveryLinkSource = {
  postLink?: string | null;
  printUrl?: string | null;
  storiesPrintUrl?: string | null;
  videoLink?: string | null;
  driveOrganizedIn?: string | null;
};

/** Separa URLs coladas com vírgula (comum em prints de Stories no Drive). */
export function splitDeliveryUrls(raw: string | null | undefined): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(/,\s*/)
    .map((s) => s.trim())
    .filter((s) => /^https?:\/\//i.test(s));
}

export function normalizeDriveHref(url: string): string {
  const trimmed = url.trim();
  const openMatch = trimmed.match(/drive\.google\.com\/open\?id=([^&,\s]+)/i);
  if (openMatch) {
    return `https://drive.google.com/file/d/${openMatch[1]}/view`;
  }
  return trimmed;
}

function addLink(links: DeliveryLinkItem[], seen: Set<string>, href: string, label: string) {
  const normalized = normalizeDriveHref(href.trim());
  if (!/^https?:\/\//i.test(normalized) || seen.has(normalized)) return;
  seen.add(normalized);
  links.push({ href: normalized, label });
}

/**
 * Monta links clicáveis para uma entrega.
 * Vários prints no mesmo campo → usa pasta do mês; Stories só se for URL única.
 */
export function buildDeliveryLinks(d: DeliveryLinkSource): DeliveryLinkItem[] {
  const links: DeliveryLinkItem[] = [];
  const seen = new Set<string>();

  const postUrls = splitDeliveryUrls(d.postLink);
  if (postUrls.length === 1) {
    addLink(links, seen, postUrls[0], "Post");
  } else if (postUrls.length > 1) {
    postUrls.forEach((u, i) => addLink(links, seen, u, `Post ${i + 1}`));
  }

  const videoUrls = splitDeliveryUrls(d.videoLink);
  if (videoUrls.length === 1) {
    addLink(links, seen, videoUrls[0], "Vídeo");
  }

  const folderUrls = splitDeliveryUrls(d.driveOrganizedIn);
  if (folderUrls.length >= 1) {
    addLink(links, seen, folderUrls[0], "Pasta");
  }

  const printUrls = splitDeliveryUrls(d.printUrl);
  if (printUrls.length === 1) {
    addLink(links, seen, printUrls[0], "Print");
  } else if (printUrls.length > 1 && folderUrls.length === 0) {
    printUrls.forEach((u, i) => addLink(links, seen, u, `Print ${i + 1}`));
  }

  const storyUrls = splitDeliveryUrls(d.storiesPrintUrl);
  if (storyUrls.length === 1) {
    addLink(links, seen, storyUrls[0], "Stories");
  } else if (storyUrls.length > 1 && folderUrls.length === 0) {
    storyUrls.forEach((u, i) => addLink(links, seen, u, `Stories ${i + 1}`));
  }

  return links;
}
