import { cn } from "@/lib/utils";
import type { Vertical } from "@/lib/constants";

export function isVertical(v: string): v is Vertical {
  return v === "OAB" || v === "ECJ";
}

export function verticalRowClass(program: string | null | undefined): string {
  if (program === "ECJ") {
    return "border-l-[3px] border-l-ecj bg-ecj-light/40";
  }
  if (program === "OAB") {
    return "border-l-[3px] border-l-oab bg-oab-light/40";
  }
  return "";
}

export function verticalCardClass(vertical: Vertical, active: boolean): string {
  if (vertical === "OAB") {
    return cn(
      "relative overflow-hidden rounded-xl border-2 text-left transition-all duration-200",
      active
        ? "border-oab bg-oab-light shadow-[inset_0_2px_8px_rgba(107,10,9,0.12)] ring-2 ring-oab/25 scale-[0.98]"
        : "border-hairline bg-card hover:border-oab/40 hover:bg-oab-light/50 hover:shadow-soft"
    );
  }
  return cn(
    "relative overflow-hidden rounded-xl border-2 text-left transition-all duration-200",
    active
      ? "border-ecj bg-ecj-light shadow-[inset_0_2px_8px_rgba(208,140,0,0.15)] ring-2 ring-ecj/25 scale-[0.98]"
      : "border-hairline bg-card hover:border-ecj/40 hover:bg-ecj-light/50 hover:shadow-soft"
  );
}

export function verticalTitleClass(vertical: Vertical): string {
  return vertical === "OAB" ? "text-oab" : "text-ecj";
}

export function verticalStatCardClass(vertical: Vertical): string {
  return vertical === "OAB"
    ? "border-oab/30 bg-oab-light/60"
    : "border-ecj/30 bg-ecj-light/60";
}
