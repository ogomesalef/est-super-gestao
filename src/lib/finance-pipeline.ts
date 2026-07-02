import {
  FINANCE_PIPELINE_BLOCKED,
  FINANCE_PIPELINE_HIDDEN,
  FINANCE_PIPELINE_STAGES,
} from "@/lib/constants";

export type FinancePipelineColumnKind = "stage" | "blocked" | "hidden";

export type FinancePipelineColumn =
  | { kind: "stage"; key: string; label: string; dropStatus: string; pillStatus: string }
  | { kind: "blocked"; key: "blocked"; label: string }
  | { kind: "hidden"; key: "hidden"; label: string };

export function getFinancePipelineColumn(paymentStatus: string): FinancePipelineColumn {
  if ((FINANCE_PIPELINE_HIDDEN as readonly string[]).includes(paymentStatus)) {
    return { kind: "hidden", key: "hidden", label: "Oculto" };
  }
  if (paymentStatus === FINANCE_PIPELINE_BLOCKED) {
    return { kind: "blocked", key: "blocked", label: FINANCE_PIPELINE_BLOCKED };
  }
  for (const stage of FINANCE_PIPELINE_STAGES) {
    if ((stage.statuses as readonly string[]).includes(paymentStatus)) {
      return {
        kind: "stage",
        key: stage.key,
        label: stage.label,
        dropStatus: stage.dropStatus,
        pillStatus: stage.pillStatus,
      };
    }
  }
  const fallback = FINANCE_PIPELINE_STAGES[3];
  return {
    kind: "stage",
    key: fallback.key,
    label: fallback.label,
    dropStatus: fallback.dropStatus,
    pillStatus: fallback.pillStatus,
  };
}

export function getFinancePipelineStageColumns(): Array<{
  key: string;
  label: string;
  dropStatus: string;
  pillStatus: string;
}> {
  return FINANCE_PIPELINE_STAGES.map((s) => ({
    key: s.key,
    label: s.label,
    dropStatus: s.dropStatus,
    pillStatus: s.pillStatus,
  }));
}

export function groupFinancePipelineItems<T extends { paymentStatus: string }>(
  items: T[]
): {
  stages: Array<{ key: string; label: string; dropStatus: string; pillStatus: string; items: T[] }>;
  blocked: T[];
} {
  const stages = getFinancePipelineStageColumns().map((col) => ({
    ...col,
    items: [] as T[],
  }));
  const stageByKey = new Map(stages.map((s) => [s.key, s]));
  const blocked: T[] = [];

  for (const item of items) {
    const col = getFinancePipelineColumn(item.paymentStatus);
    if (col.kind === "hidden") continue;
    if (col.kind === "blocked") {
      blocked.push(item);
      continue;
    }
    stageByKey.get(col.key)?.items.push(item);
  }

  return { stages, blocked };
}
