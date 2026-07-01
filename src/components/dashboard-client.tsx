"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui";
import { useVertical } from "@/components/vertical-context";
import { verticalStatCardClass, verticalTitleClass } from "@/lib/vertical-styles";
import { VERTICAL_CONFIG } from "@/lib/constants";
import { cn } from "@/lib/utils";

type Stats = {
  contacts: number;
  actives: number;
  pendingDeliveries: number;
  pendingFinance: number;
  month: string;
};

export function DashboardClient() {
  const { vertical } = useVertical();
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch(`/api/dashboard?program=${vertical}`)
      .then((r) => r.json())
      .then(setStats);
  }, [vertical]);

  if (!stats) return <p className="text-muted-foreground">Carregando...</p>;

  const cfg = VERTICAL_CONFIG[vertical];

  return (
    <div className="space-y-4">
      <div
        className={cn(
          "rounded-xl border-2 px-4 py-3",
          verticalStatCardClass(vertical)
        )}
        style={{ borderColor: `${cfg.color}55` }}
      >
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Exibindo dados de
        </p>
        <p className={cn("font-serif text-lg font-bold", verticalTitleClass(vertical))}>
          {vertical} — {vertical === "OAB" ? "Estratégia OAB" : "Carreira Jurídica"}
        </p>
        <p className="text-sm text-muted-foreground">Mês de referência: {stats.month}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card title="Contatos CRM" className={verticalStatCardClass(vertical)}>
          <p className={cn("text-3xl font-bold tabular", verticalTitleClass(vertical))}>
            {stats.contacts}
          </p>
          <Link href="/contatos" className={cn("text-sm hover:underline", verticalTitleClass(vertical))}>
            Ver contatos
          </Link>
        </Card>
        <Card title="Embaixadores ativos" className={verticalStatCardClass(vertical)}>
          <p className={cn("text-3xl font-bold tabular", verticalTitleClass(vertical))}>
            {stats.actives}
          </p>
          <Link href="/parcerias" className={cn("text-sm hover:underline", verticalTitleClass(vertical))}>
            Ver parcerias
          </Link>
        </Card>
        <Card title="Entregas pendentes" className={verticalStatCardClass(vertical)}>
          <p className={cn("text-3xl font-bold tabular", verticalTitleClass(vertical))}>
            {stats.pendingDeliveries}
          </p>
          <Link href="/entregas" className={cn("text-sm hover:underline", verticalTitleClass(vertical))}>
            Painel entregas
          </Link>
        </Card>
        <Card title="Pagamentos em aberto" className={verticalStatCardClass(vertical)}>
          <p className={cn("text-3xl font-bold tabular", verticalTitleClass(vertical))}>
            {stats.pendingFinance}
          </p>
          <Link href="/financeiro" className={cn("text-sm hover:underline", verticalTitleClass(vertical))}>
            Financeiro
          </Link>
        </Card>
      </div>
    </div>
  );
}
