import type { GroupByKey } from "./types";
import {
  CONTACT_STATUSES,
  FINANCE_PIPELINE_BLOCKED,
  FINANCE_PIPELINE_STAGES,
  MODALITIES,
  PARTNERSHIP_STATUSES,
  POST_ASSIGNMENT_STATUSES,
  VERTICALS,
} from "@/lib/constants";
import { CAMPAIGN_STATUSES } from "@/components/campanhas/types";
import { DELIVERY_STATUSES } from "@/components/entregas/types";
import type { BoardColumnOption } from "@/components/views/board-column-picker";

export function effectiveBoardGroupBy(groupBy: GroupByKey): GroupByKey {
  return groupBy === "none" ? "status" : groupBy;
}

export function boardColumnOptionsFor(
  databaseId: string,
  groupBy: GroupByKey
): BoardColumnOption[] | undefined {
  const gb = effectiveBoardGroupBy(groupBy);

  if (databaseId === "contatos") {
    if (gb === "status") return CONTACT_STATUSES.map((key) => ({ key }));
    if (gb === "vertical") return VERTICALS.map((key) => ({ key }));
  }

  if (databaseId === "parcerias") {
    if (gb === "status") return PARTNERSHIP_STATUSES.map((key) => ({ key }));
    if (gb === "program") return VERTICALS.map((key) => ({ key }));
    if (gb === "modality") return MODALITIES.map((key) => ({ key }));
  }

  if (databaseId === "entregas") {
    if (gb === "status") return DELIVERY_STATUSES.map((key) => ({ key }));
    if (gb === "program") return VERTICALS.map((key) => ({ key }));
  }

  if (databaseId === "entregas-posts" || databaseId === "entregas-posts-v2") {
    if (gb === "status") return POST_ASSIGNMENT_STATUSES.map((key) => ({ key }));
    if (gb === "program") return VERTICALS.map((key) => ({ key }));
  }

  if (databaseId === "financeiro") {
    if (gb === "status") {
      return [
        ...FINANCE_PIPELINE_STAGES.map((s) => ({
          key: s.key,
          label: s.label,
          styleAs: s.pillStatus,
        })),
        { key: "blocked", label: FINANCE_PIPELINE_BLOCKED, styleAs: FINANCE_PIPELINE_BLOCKED },
      ];
    }
    if (gb === "program") return VERTICALS.map((key) => ({ key }));
  }

  if (databaseId === "campanhas") {
    if (gb === "status") return CAMPAIGN_STATUSES.map((key) => ({ key }));
    if (gb === "program") return ["OAB", "ECJ", "—"].map((key) => ({ key }));
  }

  return undefined;
}
