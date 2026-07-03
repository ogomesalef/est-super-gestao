import { getActiveAmbassadorReportIndex } from "@/lib/ambassador-report";
import { getReportsDashboardData } from "@/lib/reports-dashboard";
import { AmbassadorReportsIndex } from "@/components/ambassador/ambassador-reports-index";
import { ReportsDashboardPanel } from "@/components/ambassador/reports-dashboard-panel";

export default async function AmbassadorReportsPage() {
  const [items, dataAll, dataOab, dataEcj] = await Promise.all([
    getActiveAmbassadorReportIndex(),
    getReportsDashboardData("ALL"),
    getReportsDashboardData("OAB"),
    getReportsDashboardData("ECJ"),
  ]);

  const activeCounts = {
    ALL: items.length,
    OAB: items.filter((i) => i.program === "OAB").length,
    ECJ: items.filter((i) => i.program === "ECJ").length,
  };

  return (
    <div className="min-h-screen bg-canvas bg-aurora-light">
      <header className="border-b border-hairline bg-card/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Super Gestão · Estratégia
            </p>
            <h1 className="font-serif text-lg text-ink">Relatórios dos embaixadores</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {items.length} embaixadores ativos — clique para ver entregas e pagamentos
            </p>
          </div>
          <div className="hidden h-1 w-16 rounded-full bg-gradient-to-r from-oab to-ecj sm:block" aria-hidden />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <ReportsDashboardPanel
          dataByProgram={{ ALL: dataAll, OAB: dataOab, ECJ: dataEcj }}
          activeCounts={activeCounts}
        />
        <div className="mt-10 space-y-4">
          <div>
            <h2 className="font-serif text-lg text-ink">Embaixadores</h2>
            <p className="text-sm text-muted-foreground">
              Clique em um card para ver o relatório individual
            </p>
          </div>
          <AmbassadorReportsIndex items={items} />
        </div>
      </main>

      <footer className="border-t border-hairline py-6 text-center text-xs text-muted-foreground">
        Gerado automaticamente pelo Super Gestão — Programa Super Embaixadores
      </footer>
    </div>
  );
}
