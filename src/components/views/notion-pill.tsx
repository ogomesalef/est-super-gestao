import { cn } from "@/lib/utils";
import { groupHeaderColor, modalityColor, statusColor } from "@/lib/status-colors";

export { groupHeaderColor } from "@/lib/status-colors";

export function NotionPill({
  children,
  kind = "default",
  className,
  styleAs,
}: {
  children: React.ReactNode;
  kind?: "status" | "modality" | "vertical" | "payment" | "default";
  className?: string;
  /** Usa as cores de outro rótulo (ex.: título da coluna com estilo de um status). */
  styleAs?: string;
}) {
  const label = String(children);
  const styleKey = styleAs || label;
  let style = "bg-surface text-body border border-hairline/80";

  if (kind === "status" || kind === "payment") {
    style = statusColor(styleKey);
  } else if (kind === "modality") {
    style = modalityColor(label);
  } else if (kind === "vertical") {
    style =
      label === "ECJ"
        ? "bg-ecj-light text-ecj border border-ecj/30"
        : "bg-oab-light text-oab border border-oab/30";
  }

  return (
    <span
      className={cn(
        "inline-flex max-w-full truncate rounded px-2 py-0.5 text-xs font-medium",
        style,
        className
      )}
    >
      {children}
    </span>
  );
}
