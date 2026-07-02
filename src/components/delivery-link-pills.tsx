"use client";

import { ExternalLink } from "lucide-react";
import { buildDeliveryLinks, type DeliveryLinkSource } from "@/lib/delivery-links";

export function DeliveryLinkPills({ delivery }: { delivery: DeliveryLinkSource }) {
  const links = buildDeliveryLinks(delivery);

  if (!links.length) return <span className="text-muted-foreground">—</span>;

  return (
    <div className="flex flex-wrap gap-1">
      {links.map((l) => (
        <a
          key={`${l.label}-${l.href}`}
          href={l.href}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-0.5 rounded bg-primary/10 px-1.5 py-0.5 text-[11px] font-medium text-primary hover:bg-primary/15"
        >
          {l.label}
          <ExternalLink className="h-3 w-3" />
        </a>
      ))}
    </div>
  );
}
