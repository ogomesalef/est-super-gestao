import { notFound } from "next/navigation";
import { AmbassadorReportView } from "@/components/ambassador/ambassador-report-view";
import { getAmbassadorReportBySlug } from "@/lib/ambassador-report";

export default async function AmbassadorReportPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getAmbassadorReportBySlug(slug);
  if (!data) notFound();

  const accent = data.ambassador.program === "ECJ" ? "#D08C00" : "#6B0A09";

  return (
    <div className="min-h-screen bg-[#faf8f4]">
      <header className="border-b border-hairline/60 bg-card/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-4 px-4 py-4 sm:max-w-xl md:max-w-2xl lg:max-w-3xl">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Super Embaixadores · Estratégia
            </p>
            <p className="font-serif text-sm text-ink">Minha parceria</p>
          </div>
          <div className="h-1 w-12 rounded-full" style={{ backgroundColor: accent }} aria-hidden />
        </div>
      </header>

      <main className="mx-auto w-full max-w-lg px-4 py-6 sm:max-w-xl sm:px-6 sm:py-8 md:max-w-2xl lg:max-w-3xl">
        <AmbassadorReportView data={data} />
      </main>

      <footer className="border-t border-hairline/60 py-6 text-center text-xs text-muted-foreground">
        Programa Super Embaixadores — Estratégia
      </footer>
    </div>
  );
}
