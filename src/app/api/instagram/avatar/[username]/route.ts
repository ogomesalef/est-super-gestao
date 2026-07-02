import { instagramUsername } from "@/lib/instagram-avatar";
import { resolveInstagramProfilePicUrl } from "@/lib/instagram-avatar-cache";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;
  const user = instagramUsername(username);
  if (!user) {
    return new Response("Handle inválido", { status: 400 });
  }

  const picUrl = await resolveInstagramProfilePicUrl(user);
  if (!picUrl) {
    return new Response("Foto não encontrada", { status: 404 });
  }

  const imgRes = await fetch(picUrl, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15",
      Referer: `https://www.instagram.com/${user}/`,
    },
    cache: "force-cache",
  });

  if (!imgRes.ok) {
    return new Response("Erro ao buscar foto", { status: 502 });
  }

  const bytes = await imgRes.arrayBuffer();
  return new Response(bytes, {
    headers: {
      "Content-Type": imgRes.headers.get("Content-Type") || "image/jpeg",
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
    },
  });
}
