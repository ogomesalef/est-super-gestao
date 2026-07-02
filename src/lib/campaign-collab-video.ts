import type { CampaignCollabRow } from "@/lib/campaign-collab";

export function getVideoEmbed(url: string): { embedUrl: string | null; isDirect: boolean } {
  const trimmed = url.trim();
  if (!trimmed) return { embedUrl: null, isDirect: false };

  const yt = trimmed.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]+)/i);
  if (yt) return { embedUrl: `https://www.youtube.com/embed/${yt[1]}`, isDirect: false };

  const drive = trimmed.match(/drive\.google\.com\/file\/d\/([^/]+)/i);
  if (drive) return { embedUrl: `https://drive.google.com/file/d/${drive[1]}/preview`, isDirect: false };

  const vimeo = trimmed.match(/vimeo\.com\/(?:video\/)?(\d+)/i);
  if (vimeo) return { embedUrl: `https://player.vimeo.com/video/${vimeo[1]}`, isDirect: false };

  if (/\.(mp4|webm|mov)(\?|$)/i.test(trimmed)) {
    return { embedUrl: trimmed, isDirect: true };
  }

  return { embedUrl: null, isDirect: false };
}

export function collabSectionTitle(collab: CampaignCollabRow): string {
  return collab.title?.trim() || "Vídeo de collab — embaixadores selecionados";
}
