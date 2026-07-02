"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { groupFormDataBySections, countFormFields } from "@/lib/respostas-form-sections";
import { parseApplicationFormData } from "@/lib/respostas-row";
import { cn } from "@/lib/utils";

export type ApplicationOperationalHints = {
  alerts?: string | null;
  score?: string | null;
  metaSuggestion?: boolean;
  modality?: string | null;
  agreedValue?: number | null;
  metaFeed?: number;
  metaStories?: number;
  metaTiktok?: number;
  metaYoutube?: number;
};

type Props = {
  program: string;
  applicationFormData: Record<string, string> | null | undefined;
  applicationReceivedAt?: string | null;
  respostasSheetName?: string | null;
  respostasSheetRow?: number | null;
  operational?: ApplicationOperationalHints | null;
  /** analysis = todas as seções visíveis (para decidir proposta); compact = resumo */
  variant?: "analysis" | "compact";
  className?: string;
};

export { parseApplicationFormData };

export function ApplicationFormSummary({
  program,
  applicationFormData,
  applicationReceivedAt,
  respostasSheetName,
  respostasSheetRow,
  operational,
  variant = "analysis",
  className,
}: Props) {
  const [compactExpanded, setCompactExpanded] = useState(false);
  const form = applicationFormData;

  if (!form || countFormFields(form) === 0) {
    return (
      <div
        className={cn(
          "rounded-lg border border-dashed border-amber-300/80 bg-amber-50/20 px-4 py-3 text-sm text-amber-900/80",
          className
        )}
      >
        Nenhuma resposta do formulário no app. Rode <strong>Sync Respostas</strong> em Parcerias para
        importar da planilha.
      </div>
    );
  }

  const sections = groupFormDataBySections(form, program);
  const fieldCount = countFormFields(form);

  return (
    <div
      className={cn(
        "rounded-lg border border-amber-200/80 bg-amber-50/40 text-sm",
        className
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-200/60 px-3 py-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-900">
            Candidatura — formulário completo
          </p>
          <p className="text-[11px] text-amber-800/80">
            {fieldCount} respostas importadas
            {applicationReceivedAt &&
              ` · ${new Date(applicationReceivedAt).toLocaleString("pt-BR", {
                dateStyle: "short",
                timeStyle: "short",
              })}`}
            {respostasSheetName && (
              <>
                {" · "}
                {respostasSheetName}
                {respostasSheetRow ? ` linha ${respostasSheetRow}` : ""}
              </>
            )}
          </p>
        </div>
      </div>

      {operational && (operational.alerts || operational.score || operational.modality) && (
        <div className="border-b border-amber-200/60 bg-white/50 px-3 py-2">
          <p className="mb-1 text-[11px] font-semibold uppercase text-amber-900/70">
            Planilha (operacional)
          </p>
          <dl className="grid gap-1 text-xs sm:grid-cols-2">
            {operational.modality && (
              <div>
                <dt className="text-muted-foreground">Modalidade sugerida</dt>
                <dd className="font-medium">{operational.modality}</dd>
              </div>
            )}
            {operational.score && (
              <div>
                <dt className="text-muted-foreground">Pontuação</dt>
                <dd className="font-medium">{operational.score}</dd>
              </div>
            )}
            {(operational.metaFeed || operational.metaStories || operational.metaTiktok) && (
              <div>
                <dt className="text-muted-foreground">Metas na planilha</dt>
                <dd className="font-medium tabular">
                  Feed {operational.metaFeed ?? 0} · Stories {operational.metaStories ?? 0} · TikTok{" "}
                  {operational.metaTiktok ?? 0}
                  {operational.metaYoutube ? ` · YT ${operational.metaYoutube}` : ""}
                </dd>
              </div>
            )}
            {operational.agreedValue != null && operational.agreedValue > 0 && (
              <div>
                <dt className="text-muted-foreground">Valor na planilha</dt>
                <dd className="font-medium">R$ {operational.agreedValue}</dd>
              </div>
            )}
          </dl>
          {operational.alerts && (
            <p className="mt-2 rounded border border-amber-200 bg-amber-50 px-2 py-1.5 text-xs text-amber-950">
              {operational.alerts}
            </p>
          )}
        </div>
      )}

      {variant === "analysis" ? (
        <div className="max-h-[min(70vh,520px)] space-y-4 overflow-y-auto p-3">
          {sections.map((section) => (
            <section key={section.title}>
              <h4 className="mb-2 text-[11px] font-bold uppercase tracking-wide text-amber-900/80">
                {section.title}
              </h4>
              <dl className="space-y-2.5 rounded-md border border-amber-100/80 bg-white/60 p-2.5">
                {section.entries.map(({ label, value }) => (
                  <div key={label}>
                    <dt className="text-[11px] font-medium leading-snug text-muted-foreground">
                      {label}
                    </dt>
                    <dd className="whitespace-pre-wrap text-sm leading-relaxed text-ink">{value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </div>
      ) : (
        <div className="p-3">
          <dl className="space-y-2">
            {sections[0]?.entries.slice(0, 4).map(({ label, value }) => (
              <div key={label}>
                <dt className="text-[11px] font-medium text-amber-900/70">{label}</dt>
                <dd className="line-clamp-3 whitespace-pre-wrap text-ink">{value}</dd>
              </div>
            ))}
          </dl>
          {fieldCount > 4 && (
            <>
              <button
                type="button"
                onClick={() => setCompactExpanded((v) => !v)}
                className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-amber-900 hover:underline"
              >
                {compactExpanded ? (
                  <>
                    <ChevronUp className="h-3.5 w-3.5" />
                    Ocultar
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3.5 w-3.5" />
                    Ver formulário completo ({fieldCount} campos)
                  </>
                )}
              </button>
              {compactExpanded && (
                <div className="mt-3 max-h-96 space-y-4 overflow-y-auto border-t border-amber-200/60 pt-3">
                  {sections.map((section) => (
                    <section key={section.title}>
                      <h4 className="mb-1 text-[11px] font-bold uppercase text-amber-900/70">
                        {section.title}
                      </h4>
                      <dl className="space-y-2">
                        {section.entries.map(({ label, value }) => (
                          <div key={label}>
                            <dt className="text-[11px] text-muted-foreground">{label}</dt>
                            <dd className="whitespace-pre-wrap text-sm">{value}</dd>
                          </div>
                        ))}
                      </dl>
                    </section>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
