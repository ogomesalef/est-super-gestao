"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Copy, ExternalLink, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui";
import { CampaignCollabEditor } from "@/components/campanhas/campaign-collab-editor";
import { CampaignDetailView } from "@/components/campanhas/campaign-detail-view";
import type { CampaignDetailPayload } from "@/lib/campaign-detail";

export function CampaignDetailClient({ campaignId }: { campaignId: string }) {
  const [data, setData] = useState<CampaignDetailPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/campanhas/${campaignId}`, { cache: "no-store" });
      const text = await res.text();
      if (!res.ok || !text.trim()) {
        setError("Campanha não encontrada");
        setData(null);
        return;
      }
      setData(JSON.parse(text));
    } catch {
      setError("Erro ao carregar campanha");
    } finally {
      setLoading(false);
    }
  }, [campaignId]);

  useEffect(() => {
    load();
  }, [load]);

  async function copyPublicLink() {
    if (!data?.campaign.publicUrl) return;
    const url =
      data.campaign.publicUrl.startsWith("http")
        ? data.campaign.publicUrl
        : `${window.location.origin}${data.campaign.publicUrl}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Carregando campanha…
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-4 py-12 text-center">
        <p className="text-muted-foreground">{error || "Campanha não encontrada."}</p>
        <Link href="/campanhas" className="text-sm text-primary hover:underline">
          Voltar às campanhas
        </Link>
      </div>
    );
  }

  const publicHref = data.campaign.publicUrl.startsWith("http")
    ? data.campaign.publicUrl
    : data.campaign.publicUrl;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/campanhas"
          className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-surface hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" />
          Campanhas
        </Link>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={load}>
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </Button>
          <Button variant="secondary" size="sm" onClick={copyPublicLink}>
            {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copiado!" : "Copiar link público"}
          </Button>
          <a
            href={publicHref.startsWith("/") ? publicHref : data.campaign.publicUrl}
            target="_blank"
            rel="noreferrer"
          >
            <Button size="sm">
              <ExternalLink className="h-4 w-4" />
              Abrir página pública
            </Button>
          </a>
        </div>
      </div>

      <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-950">
        <p className="font-medium">Link para compartilhar (sem login)</p>
        <p className="mt-1 break-all font-mono text-xs">
          {data.campaign.publicUrl.startsWith("http")
            ? data.campaign.publicUrl
            : `(seu domínio)${data.campaign.publicUrl}`}
        </p>
        <p className="mt-1 text-xs text-sky-800/80">
          Envie este link para a chefe — ela vê entregas, links, pasta Drive e período da campanha.
        </p>
      </div>

      <CampaignCollabEditor
        campaignId={campaignId}
        campaignName={data.campaign.name}
        campaignProgram={data.campaign.program}
        collab={data.collab}
        onSaved={setData}
      />

      <CampaignDetailView data={data} showAmbassadorLinks />
    </div>
  );
}
