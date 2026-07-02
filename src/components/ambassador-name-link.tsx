"use client";

import Link from "next/link";
import { QuickNoteContextTarget } from "@/components/ambassador/ambassador-quick-notes";
import { cn } from "@/lib/utils";

export function AmbassadorNameLink({
  id,
  children,
  className,
  stopPropagation,
  onNotesChanged,
  contextMenu = true,
}: {
  id: string;
  children: React.ReactNode;
  className?: string;
  stopPropagation?: boolean;
  onNotesChanged?: () => void;
  contextMenu?: boolean;
}) {
  const ambassadorName = typeof children === "string" ? children : "Embaixador";

  const link = (
    <Link
      href={`/embaixadores/${id}`}
      className={cn(
        "font-medium text-ink transition-colors hover:text-primary hover:underline underline-offset-2",
        className
      )}
      onClick={stopPropagation ? (e) => e.stopPropagation() : undefined}
      onPointerDown={stopPropagation ? (e) => e.stopPropagation() : undefined}
    >
      {children}
    </Link>
  );

  if (!contextMenu) return link;

  return (
    <QuickNoteContextTarget
      ambassadorId={id}
      ambassadorName={ambassadorName}
      onChanged={onNotesChanged}
      className="inline"
    >
      {link}
    </QuickNoteContextTarget>
  );
}
