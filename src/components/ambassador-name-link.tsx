"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

export function AmbassadorNameLink({
  id,
  children,
  className,
  stopPropagation,
}: {
  id: string;
  children: React.ReactNode;
  className?: string;
  stopPropagation?: boolean;
}) {
  return (
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
}
