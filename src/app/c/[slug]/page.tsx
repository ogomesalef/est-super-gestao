import { notFound } from "next/navigation";
import { CampaignDetailView } from "@/components/campanhas/campaign-detail-view";
import { getCampaignDetailByPublicSlug } from "@/lib/campaign-detail";

export default async function PublicCampaignPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getCampaignDetailByPublicSlug(slug);
  if (!data) notFound();

  const accent = data.campaign.program === "ECJ" ? "#D08C00" : "#6B0A09";

  return (
    <div className="min-h-screen bg-canvas bg-aurora-light">
      <header className="border-b border-hairline bg-card/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Super Gestão · Estratégia
            </p>
            <p className="font-serif text-sm text-ink">Relatório de campanha</p>
          </div>
          <div
            className="h-1 w-16 rounded-full"
            style={{ backgroundColor: accent }}
            aria-hidden
          />
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
        <CampaignDetailView data={data} showAmbassadorLinks={false} />
      </main>

      <footer className="border-t border-hairline py-6 text-center text-xs text-muted-foreground">
        Gerado automaticamente pelo Super Gestão — Programa Super Embaixadores
      </footer>
    </div>
  );
}
