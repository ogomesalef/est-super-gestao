import { prisma } from "@/lib/prisma";
import { fetchInstagramProfilePic, instagramUsername } from "@/lib/instagram-avatar";

function cacheKey(username: string): string {
  return `ig:avatar:${instagramUsername(username)}`;
}

export async function getInstagramProfilePicFromCache(username: string): Promise<string | null> {
  const user = instagramUsername(username);
  if (!user) return null;
  const row = await prisma.appSetting.findUnique({ where: { key: cacheKey(user) } });
  return row?.value || null;
}

export async function saveInstagramProfilePicCache(username: string, url: string): Promise<void> {
  const user = instagramUsername(username);
  if (!user || !url) return;
  await prisma.appSetting.upsert({
    where: { key: cacheKey(user) },
    create: { key: cacheKey(user), value: url },
    update: { value: url },
  });
}

/** Cache Turso → fetch Instagram → persiste no Turso. */
export async function resolveInstagramProfilePicUrl(username: string): Promise<string | null> {
  const cached = await getInstagramProfilePicFromCache(username);
  if (cached) return cached;

  const fresh = await fetchInstagramProfilePic(username);
  if (fresh) {
    await saveInstagramProfilePicCache(username, fresh);
  }
  return fresh;
}
