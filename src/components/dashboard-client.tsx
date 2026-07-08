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
  needsReview: number;
  staleProposals: number;
  staleContacts: number;
  respostasPending: number;
  respostasSyncConfigured?: boolean;
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

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Ações pendentes
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card title="Candidatos para analisar" className="border-amber-200/80 bg-amber-50/30">
            <p className="text-3xl font-bold tabular text-amber-950">{stats.needsReview}</p>
            <Link href="/contatos" className="text-sm text-amber-900 hover:underline">
              Ver em Parcerias
            </Link>
          </Card>
          {stats.respostasPending > 0 && (
            <Card title="Planilha Respostas" className="border-amber-200/80 bg-amber-50/30">
              <p className="text-3xl font-bold tabular text-amber-950">{stats.respostasPending}</p>
              <p className="text-xs text-amber-900/80">
                {stats.respostasSyncConfigured
                  ? "linhas novas aguardando sync"
                  : "conecte Google Sheets em Parcerias"}
              </p>
              <Link href="/contatos" className="text-sm text-amber-900 hover:underline">
                Sincronizar candidaturas
              </Link>
            </Card>
          )}
          <Card title="Propostas sem retorno" className="border-orange-200/80 bg-orange-50/30">
            <p className="text-3xl font-bold tabular text-orange-950">{stats.staleProposals}</p>
            <Link href="/contatos" className="text-sm text-orange-900 hover:underline">
              Cobrar proposta
            </Link>
          </Card>
          <Card title="Contatos para refazer" className="border-orange-200/80 bg-orange-50/30">
            <p className="text-3xl font-bold tabular text-orange-950">{stats.staleContacts}</p>
            <Link href="/contatos" className="text-sm text-orange-900 hover:underline">
              Ver contatos
            </Link>
          </Card>
        </div>
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
          <Link href="/contatos" className={cn("text-sm hover:underline", verticalTitleClass(vertical))}>
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
