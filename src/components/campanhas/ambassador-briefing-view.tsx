"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import {
  ChevronDown,
  ExternalLink,
  Upload,
  CheckCircle2,
  Clock,
  FileText,
} from "lucide-react";
import type { AmbassadorBriefingPayload } from "@/lib/collab-briefing";
import { getBriefingTheme, type BriefingTheme } from "@/lib/briefing-theme";
import {
  instagramProfileUrl,
  instagramUsername,
} from "@/lib/instagram-avatar";
import { cn, normalizeHandle } from "@/lib/utils";

const BriefingThemeContext = createContext<BriefingTheme>(getBriefingTheme("ECJ"));

function useBriefingTheme(): BriefingTheme {
  return useContext(BriefingThemeContext);
}

function formatDateBr(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  });
}

function renderInline(text: string): ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-ink">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

function isReferenceUrl(line: string): boolean {
  return /^https?:\/\//i.test(line.trim());
}

function referenceLabel(url: string): string {
  if (/drive\.google\.com/i.test(url)) return "Abrir imagem no Drive";
  if (/tiktok\.com/i.test(url)) return "Ver referência no TikTok";
  if (/instagram\.com/i.test(url)) return "Ver referência no Instagram";
  return "Ver referência";
}

function isImageAssetLine(line: string): boolean {
  return /\.(png|jpe?g|webp|gif)$/i.test(line.trim());
}

function isDriveUrl(url: string): boolean {
  return /drive\.google\.com/i.test(url.trim());
}

function extractScreenImages(lines: string[]): {
  pairs: { name: string; url: string }[];
  remaining: string[];
} {
  const pairs: { name: string; url: string }[] = [];
  const remaining: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const next = lines[i + 1];
    if (isImageAssetLine(line) && next && isReferenceUrl(next) && isDriveUrl(next)) {
      pairs.push({ name: line.trim(), url: next.trim() });
      i++;
      continue;
    }
    remaining.push(line);
  }

  return { pairs, remaining };
}

function ScriptScreenImage({ name, url }: { name: string; url: string }) {
  const t = useBriefingTheme();
  return (
    <div className={cn("mt-4 rounded-xl border border-dashed px-4 py-3", t.screenImageBorder, t.screenImageBg)}>
      <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
        Imagem para colocar na tela
      </p>
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className={cn(
          "inline-flex items-center gap-2 rounded-lg border border-hairline bg-card px-3 py-2 font-mono text-sm font-medium transition",
          t.accent,
          t.refLinkHover
        )}
      >
        <ExternalLink className="h-4 w-4 shrink-0" />
        {name}
      </a>
    </div>
  );
}

function VideoReferenceLink({ url }: { url: string }) {
  const t = useBriefingTheme();
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className={cn(
        "group my-1 flex items-start gap-3 rounded-xl border border-hairline bg-card p-4 transition",
        t.refLinkHover
      )}
    >
      <ExternalLink className={cn("mt-0.5 h-5 w-5 shrink-0", t.refLinkIcon)} />
      <div className="min-w-0 flex-1">
        <p className={cn("font-semibold text-ink", t.refLinkTitleHover)}>{referenceLabel(url)}</p>
        <p className="mt-0.5 break-all text-sm text-muted-foreground">{url}</p>
      </div>
    </a>
  );
}
function capitalizeFirst(text: string): string {
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function renderCtaText(text: string): ReactNode {
  const withMarks = text.replace(/(três mil reais|três mil)/gi, "**$1**");
  return renderInline(withMarks);
}

function ScriptSectionTitle({ children }: { children: ReactNode }) {
  const t = useBriefingTheme();
  return (
    <h4
      className={cn(
        "mb-3 mt-6 border-b pb-2 text-[11px] font-bold uppercase tracking-[0.16em] first:mt-0 md:text-xs",
        t.sectionTitleBorder,
        t.accent
      )}
    >
      {children}
    </h4>
  );
}

function ScriptBriefingBox({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-hairline bg-card px-4 py-4 md:px-5 md:py-5">
      <p className="text-[15px] leading-[1.65] text-ink md:text-base md:leading-relaxed">
        {renderInline(capitalizeFirst(text))}
      </p>
    </div>
  );
}

function ScriptCtaBox({ text }: { text: string }) {
  const t = useBriefingTheme();
  return (
    <div className="space-y-3 rounded-xl border border-hairline bg-card px-4 py-4 md:px-5 md:py-5">
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Destaque da promo</p>
      <p className={cn("font-serif text-2xl font-semibold leading-tight md:text-[1.65rem]", t.ctaHighlight)}>
        + de 3 mil reais de desconto
      </p>
      <p className="border-t border-hairline/60 pt-3 text-[15px] leading-[1.65] text-ink md:text-base md:leading-relaxed">
        {renderCtaText(text)}
      </p>
    </div>
  );
}

function ScriptEntregaBadge({ children }: { children: ReactNode }) {
  const t = useBriefingTheme();
  return (
    <div className={cn("inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold", t.entregaBadge)}>
      <span className={cn("flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white", t.entregaBadgeNum)}>
        1
      </span>
      {children}
    </div>
  );
}

function MarkdownBlock({ md }: { md: string }) {
  const t = useBriefingTheme();
  type Block =
    | { type: "h2"; text: string }
    | { type: "section"; title: string; lines: string[] };

  const blocks: Block[] = [];
  let current: { type: "section"; title: string; lines: string[] } | null = null;

  for (const line of md.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.startsWith("## ")) {
      if (current) blocks.push(current);
      current = null;
      blocks.push({ type: "h2", text: trimmed.slice(3) });
      continue;
    }
    if (trimmed.startsWith("### ")) {
      if (current) blocks.push(current);
      current = { type: "section", title: trimmed.slice(4), lines: [] };
      continue;
    }
    if (!trimmed) continue;
    const normalized = trimmed.startsWith("-> ") ? `> ${trimmed.slice(3)}` : trimmed;
    if (current) current.lines.push(normalized);
    else {
      current = { type: "section", title: "", lines: [trimmed] };
    }
  }
  if (current) blocks.push(current);

  function sectionKey(title: string): string {
    return title
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  }

  function renderSectionLines(title: string, lines: string[]) {
    const key = sectionKey(title);
    const { pairs: screenImages, remaining: contentLines } = extractScreenImages(lines);
    const listItems = contentLines.filter((l) => l.startsWith("- ") || l.startsWith("* "));
    const numbered = contentLines.filter((l) => /^\d+\.\s/.test(l));
    const quotes = contentLines.filter((l) => l.startsWith("> "));
    const refUrls = contentLines.filter((l) => isReferenceUrl(l));
    const paragraphs = contentLines.filter(
      (l) =>
        !l.startsWith("- ") &&
        !l.startsWith("* ") &&
        !/^\d+\.\s/.test(l) &&
        !l.startsWith("> ") &&
        !isReferenceUrl(l) &&
        !/^\*\*[^*]+\*\*$/.test(l)
    );

    if (key === "entrega" && listItems.length) {
      return listItems.map((item, i) => (
        <ScriptEntregaBadge key={i}>{renderInline(item.slice(2))}</ScriptEntregaBadge>
      ));
    }

    if (key === "referencia" || key === "referência") {
      return refUrls.map((url) => <VideoReferenceLink key={url} url={url} />);
    }

    if (key === "pedido") {
      const text = paragraphs.join(" ");
      if (text) return <ScriptBriefingBox text={text} />;
    }

    if (key === "importante" && listItems.length) {
      return (
        <ul className={cn("space-y-2.5 rounded-xl border px-4 py-3.5", t.importantBox)}>
          {listItems.map((item, i) => (
            <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-ink md:text-[15px]">
              <span className={cn("mt-2 h-1.5 w-1.5 shrink-0 rounded-full", t.dot)} />
              <span>{renderInline(item.slice(2))}</span>
            </li>
          ))}
        </ul>
      );
    }

    if (key === "o que fazer" || key === "briefing") {
      return (
        <div className="space-y-3">
          {paragraphs.map((p, i) => (
            <ScriptBriefingBox key={i} text={p} />
          ))}
        </div>
      );
    }

    if (key === "narracao" || key === "narração") {
      return (
        <div className="space-y-3">
          {quotes.map((q, i) => (
            <blockquote
              key={i}
              className={cn(
                "rounded-r-lg border-l-[3px] py-3 pl-4 pr-3 text-sm leading-relaxed text-ink md:text-[15px]",
                t.quoteBorder,
                t.quoteBg
              )}
            >
              {renderInline(q.slice(2))}
            </blockquote>
          ))}
        </div>
      );
    }

    if (key === "fechamento" || key === "cta final") {
      const text = [...quotes.map((q) => q.slice(2)), ...paragraphs].join(" ");
      if (!text) return null;
      return (
        <div className={cn("rounded-xl border px-4 py-3 text-sm font-semibold md:text-[15px]", t.fechamentoBox)}>
          {renderInline(text)}
        </div>
      );
    }

    if (key === "cta") {
      const text = paragraphs.join(" ");
      if (text) return <ScriptCtaBox text={text} />;
    }

    const nodes: ReactNode[] = [];

    if (numbered.length) {
      nodes.push(
        <ol key="ol" className="my-3 space-y-2.5">
          {numbered.map((item, i) => {
            const body = item.replace(/^\d+\.\s*/, "");
            return (
              <li key={i} className="flex gap-3 text-sm leading-relaxed text-ink/90 md:text-[15px]">
                <span className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold", t.numberedBg, t.numberedText)}>
                  {i + 1}
                </span>
                <span className="pt-0.5">{renderInline(body)}</span>
              </li>
            );
          })}
        </ol>
      );
    }

    if (listItems.length && key !== "entrega") {
      nodes.push(
        <ul key="ul" className="my-3 space-y-2">
          {listItems.map((item, i) => (
            <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-ink/90 md:text-[15px]">
              <span className={cn("mt-2 h-1.5 w-1.5 shrink-0 rounded-full", t.dot)} />
              <span>{renderInline(item.slice(2))}</span>
            </li>
          ))}
        </ul>
      );
    }

    for (const q of quotes) {
      nodes.push(
        <blockquote
          key={q}
          className={cn(
            "my-3 rounded-r-lg border-l-[3px] py-3 pl-4 pr-3 text-sm italic leading-relaxed text-ink md:text-[15px]",
            t.quoteBorder,
            t.quoteBg
          )}
        >
          {renderInline(q.slice(2))}
        </blockquote>
      );
    }

    for (const img of screenImages) {
      nodes.push(<ScriptScreenImage key={`${img.name}-${img.url}`} name={img.name} url={img.url} />);
    }

    for (const url of refUrls) {
      nodes.push(<VideoReferenceLink key={url} url={url} />);
    }

    for (const p of paragraphs) {
      nodes.push(
        <p key={p} className="my-2.5 text-sm leading-relaxed text-ink/85 md:text-[15px]">
          {renderInline(p)}
        </p>
      );
    }

    return nodes;
  }

  return (
    <div className="space-y-1">
      {blocks.map((block, i) => {
        if (block.type === "h2") {
          return (
            <h3 key={i} className="mb-3 font-serif text-xl text-ink md:text-[1.35rem]">
              {block.text}
            </h3>
          );
        }
        return (
          <div
            key={i}
            className={cn(
              "border-b border-hairline/50 pb-6 last:border-b-0 last:pb-0",
              block.title && "mb-1"
            )}
          >
            {block.title ? <ScriptSectionTitle>{block.title}</ScriptSectionTitle> : null}
            {renderSectionLines(block.title, block.lines)}
          </div>
        );
      })}
    </div>
  );
}

function AmbassadorAvatar({
  instagram,
  firstName,
  avatarUrl,
}: {
  instagram: string;
  firstName: string;
  avatarUrl: string | null;
}) {
  const t = useBriefingTheme();
  const [failed, setFailed] = useState(false);
  const handle = instagramUsername(instagram);
  const src = avatarUrl && !failed ? avatarUrl : null;
  const initial = (firstName || handle || "?").charAt(0).toUpperCase();

  const ring = (
    <div className="relative h-20 w-20 shrink-0 sm:h-24 sm:w-24 md:h-28 md:w-28">
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#f09433] via-[#dc2743] to-[#bc1888] p-[3px] shadow-md">
        <div className="relative h-full w-full overflow-hidden rounded-full bg-canvas ring-2 ring-canvas">
          {src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={src}
              alt={`Foto de perfil de @${handle}`}
              className="h-full w-full object-cover"
              onError={() => setFailed(true)}
            />
          ) : (
            <div className={cn("flex h-full w-full items-center justify-center bg-gradient-to-br font-serif text-3xl font-semibold sm:text-4xl", t.avatarFallback)}>
              {initial}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (!handle) return ring;

  return (
    <a
      href={instagramProfileUrl(instagram)}
      target="_blank"
      rel="noreferrer"
      className="block shrink-0 transition-opacity hover:opacity-90"
      title={`@${handle} no Instagram`}
    >
      {ring}
    </a>
  );
}

function DueDateBox({
  label,
  iso,
  asap,
}: {
  label: string;
  iso: string | null;
  asap: boolean;
}) {
  return (
    <div className="rounded-lg bg-surface px-3 py-2 text-xs md:text-sm">
      <p className="font-medium text-muted-foreground">{label}</p>
      <p className="mt-0.5 font-semibold tabular text-ink">
        {iso ? formatDateBr(iso) : asap ? "O quanto antes" : "—"}
      </p>
    </div>
  );
}

function CollapsiblePanel({
  title,
  icon,
  defaultOpen = false,
  children,
}: {
  title: string;
  icon?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="overflow-hidden rounded-xl border border-hairline bg-canvas/30">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-canvas/60 md:px-5"
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-ink md:text-base">
          {icon}
          {title}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>
      {open && <div className="border-t border-hairline/60 px-4 py-4 md:px-5 md:py-5">{children}</div>}
    </div>
  );
}

function RequestCard({
  request,
  uploadFolderUrl,
  uploadEnabled,
}: {
  request: AmbassadorBriefingPayload["requests"][0];
  uploadFolderUrl: string | null;
  uploadEnabled: boolean;
}) {
  const t = useBriefingTheme();
  const completed = request.status === "completed";
  const folderUrl = request.driveFolderUrl || uploadFolderUrl;
  const [open, setOpen] = useState(!completed);

  return (
    <article
      className={cn(
        "overflow-hidden rounded-2xl border bg-card shadow-soft",
        completed ? "border-emerald-200" : t.openBorder
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={cn(
          "flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors md:px-5 md:py-3.5",
          completed ? "bg-emerald-50 hover:bg-emerald-100/80" : t.openHeaderBg
        )}
      >
        <div className="flex min-w-0 items-center gap-2.5">
          {completed ? (
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
          ) : (
            <Clock className={cn("h-5 w-5 shrink-0", t.openIcon)} />
          )}
          <span className="text-sm font-semibold text-ink md:text-base">{request.title}</span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span
            className={cn(
              "rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
              completed ? "bg-emerald-600 text-white" : cn(t.openStatusBadge, "text-white")
            )}
          >
            {completed ? "Concluído" : "Em aberto"}
          </span>
          <ChevronDown
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform duration-200",
              open && "rotate-180"
            )}
          />
        </div>
      </button>

      {open && (
        <div className="space-y-4 border-t border-hairline/60 p-4 md:p-5">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <DueDateBox
              label="Enviar vídeo até"
              iso={request.videoDueDate}
              asap={!completed && !request.videoDueDate}
            />
            {request.publishDueDate ? (
              <DueDateBox
                label="Publicar no perfil até"
                iso={request.publishDueDate}
                asap={false}
              />
            ) : null}
          </div>

          {request.scriptMarkdown && (
            <div className="rounded-xl border border-hairline bg-gradient-to-b from-canvas/80 to-card p-4 md:p-5">
              <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                Roteiro sugerido
              </p>
              <MarkdownBlock md={request.scriptMarkdown} />
            </div>
          )}

          {completed && request.completedVideoUrl && (
            <a
              href={request.completedVideoUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 md:py-3.5"
            >
              Ver vídeo enviado
              <ExternalLink className="h-4 w-4" />
            </a>
          )}

          {!completed && folderUrl && (
            <div className="space-y-2">
              <a
                href={folderUrl}
                target="_blank"
                rel="noreferrer"
                className={cn(
                  "flex items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-semibold text-white shadow-sm transition md:text-base",
                  t.btnPrimary,
                  t.btnPrimaryHover
                )}
              >
                <Upload className="h-5 w-5" />
                Enviar vídeo no Google Drive
                <ExternalLink className="h-4 w-4 opacity-80" />
              </a>
              <p className="text-center text-xs text-muted-foreground md:text-sm">
                {uploadEnabled
                  ? "A pasta está compartilhada com você como editora — pode enviar o vídeo direto aí."
                  : "Se não conseguir acessar a pasta, avise a equipe para liberar o envio."}
              </p>
            </div>
          )}
        </div>
      )}
    </article>
  );
}

type CampaignSection = {
  id: string;
  brief: AmbassadorBriefingPayload["campaign"]["brief"];
  requests: AmbassadorBriefingPayload["requests"];
  driveFolderUrl: string | null;
  driveUploadPublic: boolean;
};

function CampaignSectionCard({ campaign }: { campaign: CampaignSection }) {
  const t = useBriefingTheme();
  const { brief, requests } = campaign;
  const openCount = requests.filter((r) => r.status !== "completed").length;
  const [open, setOpen] = useState(openCount > 0);

  return (
    <section className="overflow-hidden rounded-2xl border border-hairline bg-card shadow-soft">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={cn("flex w-full items-center justify-between gap-3 px-4 py-4 text-left transition-opacity hover:opacity-95 md:px-6 md:py-5", t.headerGradient)}
      >
        <div className="min-w-0">
          <p className={cn("text-[11px] font-semibold uppercase tracking-widest md:text-xs", t.headerAccent)}>
            {brief.shortName}
          </p>
          <h2 className="mt-1 font-serif text-lg leading-snug text-[#eceae2] md:text-xl">
            {brief.tagline}
          </h2>
          <p className={cn("mt-1.5 line-clamp-2 text-xs md:text-sm", t.headerMuted)}>{brief.lede}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {openCount > 0 ? (
            <span className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-semibold text-white", t.openBadge)}>
              {openCount} em aberto
            </span>
          ) : (
            <span className="rounded-full bg-emerald-600/90 px-2.5 py-0.5 text-[11px] font-semibold text-white">
              Tudo entregue
            </span>
          )}
          <ChevronDown
            className={cn("h-5 w-5 transition-transform duration-200", t.chevronAccent, open && "rotate-180")}
          />
        </div>
      </button>

      {open && (
        <div className="space-y-4 border-t border-hairline/60 p-4 md:space-y-5 md:p-6">
          <CollapsiblePanel
            title="Descrição da campanha"
            icon={<FileText className={cn("h-4 w-4", t.iconAccent)} />}
            defaultOpen={false}
          >
            <MarkdownBlock md={brief.description} />
            {(brief.careers?.length ?? 0) > 0 ? (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {brief.careers!.map((c) => (
                  <span
                    key={c}
                    className={cn("rounded-full border px-2.5 py-0.5 text-[10px] uppercase tracking-wide md:text-[11px]", t.pillBorder, t.pillBg, t.pillText)}
                  >
                    {c}
                  </span>
                ))}
              </div>
            ) : brief.highlights.length > 0 ? (
              <ul className="mt-4 space-y-2">
                {brief.highlights.map((h) => (
                  <li key={h} className="flex gap-2 text-sm text-ink/85 md:text-[15px]">
                    <span className={cn("mt-2 h-1.5 w-1.5 shrink-0 rounded-full", t.dot)} />
                    {h}
                  </li>
                ))}
              </ul>
            ) : null}
          </CollapsiblePanel>

          {brief.materials.length > 0 && (
            <CollapsiblePanel
              title="Materiais"
              icon={<ExternalLink className={cn("h-4 w-4", t.iconAccent)} />}
              defaultOpen={false}
            >
              <ul className="space-y-3">
                {brief.materials.map((m) => (
                  <li key={m.url}>
                    <a
                      href={m.url}
                      target="_blank"
                      rel="noreferrer"
                      className={cn("group flex items-start gap-3 rounded-xl border border-hairline bg-card p-4 transition", t.refLinkHover)}
                    >
                      <FileText className={cn("mt-0.5 h-5 w-5 shrink-0", t.iconAccent)} />
                      <div className="min-w-0">
                        <p className={cn("font-semibold text-ink", t.refLinkTitleHover)}>{m.title}</p>
                        <p className="mt-0.5 text-sm text-muted-foreground">{m.description}</p>
                      </div>
                      <ExternalLink className="ml-auto h-4 w-4 shrink-0 text-muted-foreground opacity-60" />
                    </a>
                  </li>
                ))}
              </ul>
            </CollapsiblePanel>
          )}

          <div className="space-y-3 md:space-y-4">
            <h3 className="font-serif text-base text-ink md:text-lg">Pedidos de vídeo</h3>
            {requests.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum pedido configurado ainda.</p>
            ) : (
              requests.map((r) => (
                <RequestCard
                  key={r.id}
                  request={r}
                  uploadFolderUrl={r.driveFolderUrl || campaign.driveFolderUrl}
                  uploadEnabled={r.driveEditorShared}
                />
              ))
            )}
          </div>
        </div>
      )}
    </section>
  );
}

export function AmbassadorBriefingView({ data }: { data: AmbassadorBriefingPayload }) {
  const { ambassador, campaign, requests } = data;
  const handle = normalizeHandle(ambassador.instagram);
  const program = ambassador.program === "OAB" || campaign.program === "OAB" ? "OAB" : "ECJ";
  const theme = getBriefingTheme(program);
  const headerBrand =
    program === "OAB"
      ? "Estratégia OAB · Super Embaixadores"
      : "Estratégia Carreira Jurídica · Super Embaixadores";

  const campaigns: CampaignSection[] = [
    {
      id: campaign.id,
      brief: campaign.brief,
      requests,
      driveFolderUrl: data.driveFolderUrl,
      driveUploadPublic: data.driveUploadPublic,
    },
  ];

  return (
    <BriefingThemeContext.Provider value={theme}>
      <div className="mx-auto w-full space-y-6 pb-10 md:space-y-8">
        <header className="space-y-5 pt-1 md:pt-2">
          <p className={cn("text-xs font-semibold uppercase tracking-widest md:text-[13px]", theme.accent)}>
            {headerBrand}
          </p>

        <div className="grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-1 sm:gap-x-5 md:gap-x-6">
          <div className="row-span-2 self-center">
            <AmbassadorAvatar
              instagram={ambassador.instagram}
              firstName={ambassador.firstName}
              avatarUrl={ambassador.avatarUrl}
            />
          </div>
          <h1 className="self-end font-serif text-2xl leading-tight text-ink sm:text-3xl md:text-[2rem]">
            Olá, {ambassador.firstName}!
          </h1>
          <a
            href={instagramProfileUrl(ambassador.instagram)}
            target="_blank"
            rel="noreferrer"
            className={cn("self-start text-sm text-muted-foreground transition-colors sm:text-base", theme.linkHover)}
          >
            {handle}
          </a>
        </div>
      </header>

      <div className="space-y-4 md:space-y-5">
        {campaigns.map((c) => (
          <CampaignSectionCard key={c.id} campaign={c} />
        ))}
      </div>

      <footer className="border-t border-hairline pt-6 text-center text-xs text-muted-foreground md:text-sm">
        Programa Super Embaixadores · Estratégia
      </footer>
    </div>
    </BriefingThemeContext.Provider>
  );
}
