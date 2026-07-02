/** Handle cru, sem @ */
export function instagramUsername(handle: string): string {
  return String(handle || "")
    .trim()
    .replace(/^@+/, "")
    .toLowerCase();
}

export function instagramProfileUrl(handle: string): string {
  const user = instagramUsername(handle);
  if (!user) return "#";
  return `https://www.instagram.com/${user}/`;
}

/** URL servida pelo nosso proxy (evita bloqueio do CDN no browser). */
export function instagramAvatarProxyPath(handle: string): string {
  const user = instagramUsername(handle);
  if (!user) return "";
  return `/api/instagram/avatar/${encodeURIComponent(user)}`;
}

/** Aumenta resolução quando a URL vem em miniatura. */
export function upscaleInstagramPicUrl(url: string): string {
  return url.replace(/s\d+x\d+/g, "s320x320").replace(/dst-jpg_s\d+x\d+/g, "dst-jpg_s320x320");
}

const CACHE_TTL_MS = 1000 * 60 * 60 * 12; // 12h
const picCache = new Map<string, { url: string; at: number }>();

const IG_APP_ID = "936619743392459";
const IG_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1";

type IgWebProfileResponse = {
  data?: {
    user?: {
      profile_pic_url_hd?: string;
      profile_pic_url?: string;
    };
  };
};

/**
 * Foto de perfil via API pública web do Instagram (profile_pic_url_hd).
 * Cache em memória por 12h.
 */
export async function fetchInstagramProfilePic(handle: string): Promise<string | null> {
  const user = instagramUsername(handle);
  if (!user) return null;

  const cached = picCache.get(user);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return cached.url;
  }

  try {
    const res = await fetch(
      `https://www.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(user)}`,
      {
        headers: {
          "User-Agent": IG_UA,
          "X-IG-App-ID": IG_APP_ID,
          Accept: "*/*",
          "Accept-Language": "pt-BR,pt;q=0.9",
          Referer: `https://www.instagram.com/${user}/`,
          "Sec-Fetch-Dest": "empty",
          "Sec-Fetch-Mode": "cors",
          "Sec-Fetch-Site": "same-origin",
        },
        next: { revalidate: 43200 },
      }
    );

    if (!res.ok) return cached?.url ?? null;

    const json = (await res.json()) as IgWebProfileResponse;
    const raw = json.data?.user?.profile_pic_url_hd || json.data?.user?.profile_pic_url;
    if (!raw) return cached?.url ?? null;

    const url = upscaleInstagramPicUrl(raw);
    picCache.set(user, { url, at: Date.now() });
    return url;
  } catch {
    return cached?.url ?? null;
  }
}
