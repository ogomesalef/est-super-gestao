import type { ParceriaItem } from "@/components/parcerias/types";
import type { ApplicationOperationalHints } from "@/components/parcerias/application-form-summary";
import { countFormFields } from "@/lib/respostas-form-sections";

export function buildParceriaOperationalHints(item: ParceriaItem): ApplicationOperationalHints {
  const p = item.partnership;
  return {
    alerts: item.alerts,
    modality: p?.modality,
    agreedValue: p?.agreedValue,
    metaFeed: p?.metaFeed,
    metaStories: p?.metaStories,
    metaTiktok: p?.metaTiktok,
    metaYoutube: p?.metaYoutube,
  };
}

/** Linha curta para triagem na lista/board (seguidores, formatos, interesse). */
export function parceriaFormQuickLine(item: ParceriaItem): string | null {
  const f = item.applicationFormData;
  if (!f || countFormFields(f) === 0) return null;

  const parts = [
    f["Quantos seguidores você tem hoje? (aprox.)"],
    f["Média de visualizações por vídeo (aprox.)"],
    f["Quais formatos você consegue entregar com consistência?"],
    f["O que você mais busca com esse projeto?"],
  ]
    .map((v) => String(v || "").trim())
    .filter(Boolean);

  return parts.length > 0 ? parts.join(" · ") : null;
}
