import { cn } from "@/lib/utils";
import type { Vertical } from "@/lib/constants";
import { isVertical } from "@/lib/vertical-styles";

export function VerticalBadge({
  vertical,
  className,
}: {
  vertical: string | null | undefined;
  className?: string;
}) {
  const v: Vertical = isVertical(vertical || "") ? (vertical as Vertical) : "OAB";
  const isOab = v === "OAB";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide",
        isOab
          ? "border-oab/35 bg-oab-light text-oab"
          : "border-ecj/40 bg-ecj-light text-ecj",
        className
      )}
    >
      {v}
    </span>
  );
}
