import type { PartnershipAlertItem } from "./partnership-alerts";
import { needsAnalysis } from "./partnership-alerts";

export type PartnershipPipelineStage = {
  key: string;
  label: string;
  dropStatus: string;
};

export const PARTNERSHIP_PIPELINE_STAGES: PartnershipPipelineStage[] = [
  { key: "analisar", label: "Analisar candidatura", dropStatus: "Pendente" },
  { key: "pendente", label: "Pendente", dropStatus: "Pendente" },
  { key: "proposta", label: "Proposta", dropStatus: "Proposta" },
  { key: "desinteressado", label: "Desinteressado", dropStatus: "Desinteressado" },
  { key: "ativo", label: "Ativo", dropStatus: "Ativo" },
  { key: "inativo", label: "Inativo", dropStatus: "Inativo" },
];

export function getPartnershipPipelineStage(item: PartnershipAlertItem & { status: string }) {
  if (item.status === "Pendente" && needsAnalysis(item)) {
    return PARTNERSHIP_PIPELINE_STAGES.find((s) => s.key === "analisar")!;
  }
  if (item.status === "Pendente") {
    return PARTNERSHIP_PIPELINE_STAGES.find((s) => s.key === "pendente")!;
  }
  const direct = PARTNERSHIP_PIPELINE_STAGES.find((s) => s.dropStatus === item.status);
  return direct || PARTNERSHIP_PIPELINE_STAGES[2];
}

export function groupPartnershipPipelineItems<T extends PartnershipAlertItem & { status: string }>(
  items: T[]
): Array<{ key: string; label: string; dropStatus: string; items: T[] }> {
  const buckets = PARTNERSHIP_PIPELINE_STAGES.map((s) => ({ ...s, items: [] as T[] }));
  const byKey = new Map(buckets.map((b) => [b.key, b]));

  for (const item of items) {
    const stage = getPartnershipPipelineStage(item);
    byKey.get(stage.key)?.items.push(item);
  }

  return buckets;
}
