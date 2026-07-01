"use client";

import { VERTICAL_CONFIG, type Vertical } from "@/lib/constants";
import { verticalCardClass, verticalTitleClass } from "@/lib/vertical-styles";
import { cn } from "@/lib/utils";
import { useVertical } from "@/components/vertical-context";

function VerticalCard({
  vertical,
  active,
  onClick,
}: {
  vertical: Vertical;
  active: boolean;
  onClick: () => void;
}) {
  const cfg = VERTICAL_CONFIG[vertical];
  const label = vertical === "OAB" ? "Estratégia OAB" : "Carreira Jurídica";

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(verticalCardClass(vertical, active), "w-full p-4")}
    >
      <div
        className="absolute inset-y-0 left-0 w-1.5"
        style={{ backgroundColor: cfg.color }}
        aria-hidden
      />
      <div className="pl-2">
        <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">
          Vertical
        </p>
        <p className={cn("font-serif text-xl font-bold", verticalTitleClass(vertical))}>
          {vertical}
        </p>
        <p className="mt-0.5 text-sm text-body">{label}</p>
        <p className="mt-1 text-xs text-muted-foreground">{cfg.handle}</p>
      </div>
      {active && (
        <span
          className={cn(
            "absolute right-3 top-3 rounded-full px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wide text-white",
            vertical === "OAB" ? "bg-oab" : "bg-ecj"
          )}
        >
          Ativo
        </span>
      )}
    </button>
  );
}

export function VerticalSelector() {
  const { vertical, setVertical } = useVertical();

  return (
    <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
      <VerticalCard vertical="OAB" active={vertical === "OAB"} onClick={() => setVertical("OAB")} />
      <VerticalCard vertical="ECJ" active={vertical === "ECJ"} onClick={() => setVertical("ECJ")} />
    </div>
  );
}
