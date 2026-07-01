import fs from "fs";
import path from "path";
import { firstName, monthNameFromRef, parseDate } from "@/lib/utils";
import { VERTICAL_CONFIG } from "@/lib/constants";
import {
  buildBioFormalizacaoBlock,
  buildComprovacaoBlock,
  buildFormalizacaoAcessoBlock,
  buildFormalizacaoCupomBlock,
  buildFormalizacaoEntregasBlock,
  buildNossasRedesBlock,
  buildPrimeiroPostBlock,
  buildPropostaEntregasBlock,
  buildPropostaIncludedBlock,
  buildPropostaPassosBlock,
  buildPropostaRodapeBlock,
  getVerticalTheme,
} from "@/lib/email-ambassador-blocks";

export const EMAIL_THEME = {
  OAB_BG: "#6B0A09",
  ECJ_BG: "#D08C00",
  CADASTRO: "https://perfil.estrategia.com",
  CATALOGO_OAB: "https://oab.estrategia.com/",
  CATALOGO_ECJ: "https://cj.estrategia.com/",
  CUPOM_OAB: "https://estrategiaeducacional.typeform.com/embaixadoresoab",
  CUPOM_ECJ: "https://forms.gle/FkUgVntiSHN47pti9",
  FORM_ENTREGAS:
    "https://docs.google.com/forms/d/e/1FAIpQLScAfuntqtprs_jMG-WaxdIu-k4_9z_BGjKYxKV5rXaC6mUCcg/viewform",
  PLATAFORMA_OAB: "https://oab.estrategia.com/todos-os-cursos",
  PLATAFORMA_ECJ: "https://cj.estrategia.com/todos-os-cursos",
  LINK_FORM_FIN:
    "https://docs.google.com/forms/d/e/1FAIpQLSdDOLhSNxsbHjgTCjhjovomWhFgu1nynhf1PSoZ7PIN-Z2ISw/viewform?fbzx=-6003903932834534796",
  REGULAMENTO_OAB:
    "https://drive.google.com/file/d/145BjCgWTeFH_xm9EDjzOowTz8XOEO5Ls/view",
  REGULAMENTO_ECJ:
    "https://drive.google.com/file/d/145BjCgWTeFH_xm9EDjzOowTz8XOEO5Ls/view",
} as const;

const AMBASSADOR_ACTION_TEMPLATES: Record<string, string> = {
  "Enviar proposta (Assinatura + Cupom)": "email_proposta_assinatura",
  "Enviar proposta (Remuneração)": "email_proposta_remuneracao",
  "Enviar próximos passos (Assinatura + Cupom)": "email_proximos_passos_assinatura",
  "Enviar formalização (Assinatura + Cupom)": "email_formalizacao_assinatura",
  "Enviar formalização (Remuneração)": "email_formalizacao_remuneracao",
  "Enviar reprovação": "email_reprovacao",
  "Enviar cancelamento de parceria": "email_parceria_cancelamento",
};

const FINANCE_ACTION_TEMPLATES: Record<string, string> = {
  "Enviar fechamento do mês (com termo)": "email_fin_fechamento_mes",
  "Enviar lembrete do termo": "email_fin_lembrete_termo",
  "Cobrar Form Financeiro": "email_fin_cobrar_form_financeiro",
  "Enviar solicitação ao Financeiro": "email_fin_solicitacao_financeiro",
  "Avisar embaixador: pagamento solicitado": "email_fin_aviso_pagamento_solicitado",
};

const templateCache = new Map<string, string>();

function loadTemplate(fileName: string): string {
  if (!templateCache.has(fileName)) {
    const file = path.join(process.cwd(), "templates/emails", `${fileName}.html`);
    templateCache.set(fileName, fs.readFileSync(file, "utf-8"));
  }
  return templateCache.get(fileName)!;
}

function esc(v: unknown): string {
  return String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeHtml(v: unknown): string {
  return esc(v);
}

function toIntSafe(v: unknown): number {
  const s = String(v ?? "").trim();
  if (!s) return 0;
  const m = s.replace(",", ".").match(/-?\d+(\.\d+)?/);
  if (!m) return 0;
  const n = Number(m[0]);
  if (!isFinite(n) || n <= 0) return 0;
  return Math.floor(n);
}

export function perWeekFromMonthly(v: unknown): string {
  const s = String(v ?? "").trim();
  if (!s) return "0";
  const m = s.replace(",", ".").match(/-?\d+(\.\d+)?/);
  if (!m) return "0";
  const n = Number(m[0]);
  if (!isFinite(n) || n <= 0) return "0";
  return String(Math.ceil(n / 4));
}

function formatDateBR(v: unknown): string {
  const d = parseDate(v);
  if (!d) return String(v ?? "");
  return d.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
}

export function formatMoney(value: unknown): string {
  if (typeof value === "number" && isFinite(value)) {
    return (
      "R$ " +
      value
        .toFixed(2)
        .replace(".", ",")
        .replace(/\B(?=(\d{3})+(?!\d))/g, ".")
    );
  }
  const s = String(value || "")
    .replace(/[R$\s]/g, "")
    .replace(/\./g, "")
    .replace(",", ".");
  const n = parseFloat(s);
  if (isNaN(n)) return String(value || "");
  return (
    "R$ " +
    n
      .toFixed(2)
      .replace(".", ",")
      .replace(/\B(?=(\d{3})+(?!\d))/g, ".")
  );
}

export function formatPercent(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "number") {
    const pct = value <= 1 ? value * 100 : value;
    return pct.toFixed(2).replace(".", ",") + "%";
  }
  const s = String(value).replace("%", "").replace(",", ".").trim();
  const n = parseFloat(s);
  if (isNaN(n)) return String(value);
  const pct = n <= 1 ? n * 100 : n;
  return pct.toFixed(2).replace(".", ",") + "%";
}

export function formatMesDisplay(ym: string): string {
  if (!ym || !/^\d{4}-\d{2}$/.test(ym)) return String(ym || "");
  const nomes = [
    "",
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];
  const year = parseInt(ym.substring(0, 4), 10);
  const month = parseInt(ym.substring(5, 7), 10);
  return (nomes[month] || ym) + "/" + year;
}

function formatProgramaFullName(programa: string): string {
  return programa === "OAB" ? "Super Embaixador OAB" : "Super Embaixador Carreira Jurídica";
}

function computePrazoPagamento(ym: string): string {
  if (!ym || !/^\d{4}-\d{2}$/.test(ym)) return "";
  let year = parseInt(ym.substring(0, 4), 10);
  let month = parseInt(ym.substring(5, 7), 10) + 1;
  if (month > 12) {
    month = 1;
    year++;
  }
  const nomes = [
    "janeiro",
    "fevereiro",
    "março",
    "abril",
    "maio",
    "junho",
    "julho",
    "agosto",
    "setembro",
    "outubro",
    "novembro",
    "dezembro",
  ];
  return `15 de ${nomes[month - 1]} de ${year}`;
}

function rowHtml(label: string, value: string): string {
  return `
    <tr>
      <td style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#344054;padding:6px 0;">${escapeHtml(label)}</td>
      <td align="right" style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#111827;font-weight:700;padding:6px 0;">${escapeHtml(value)}</td>
    </tr>`;
}

function buildEntregasCardHtml(
  feedSemana: string,
  storiesSemana: string,
  tiktokSemana: string,
  youtubeMes: string,
  linkCatalogoCursos: string
): string {
  const feed = toIntSafe(feedSemana);
  const stories = toIntSafe(storiesSemana);
  const tk = toIntSafe(tiktokSemana);
  const yt = toIntSafe(youtubeMes);
  if (feed === 0 && stories === 0 && tk === 0 && yt === 0) return "";

  const igRows: string[] = [];
  if (feed > 0) igRows.push(rowHtml("Feed/Reels:", `${feed} / semana`));
  if (stories > 0) {
    igRows.push(rowHtml("Sequências de stories (link):", `${stories} seq. / semana`));
    igRows.push(`
      <tr>
        <td colspan="2" style="font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#667085;padding:2px 0 6px;line-height:1.4;">
          Cada sequência é composta por 3 stories consecutivos com link
        </td>
      </tr>`);
  }

  const igBlock = igRows.length
    ? `
    <div style="margin-top:12px;padding:12px;border-radius:10px;background:#ffffff;border:1px solid #eef2f7;">
      <div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;color:#111827;">Instagram</div>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:8px;">
        ${igRows.join("")}
      </table>
    </div>`
    : "";

  const tkBlock =
    tk > 0
      ? `
    <div style="margin-top:10px;padding:12px;border-radius:10px;background:#ffffff;border:1px solid #eef2f7;">
      <div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;color:#111827;">TikTok</div>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:8px;">
        ${rowHtml("Vídeos:", `${tk} / semana`)}
      </table>
    </div>`
      : "";

  const ytBlock =
    yt > 0
      ? `
    <div style="margin-top:10px;padding:12px;border-radius:10px;background:#ffffff;border:1px solid #eef2f7;">
      <div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;color:#111827;">YouTube</div>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:8px;">
        ${rowHtml("Vídeos:", `${yt} / semana`)}
      </table>
    </div>`
      : "";

  const note = `
    <div style="margin-top:12px;padding:12px;border-left:4px solid #2563eb;background:#ffffff;border-radius:10px;border-top:1px solid #eef2f7;border-right:1px solid #eef2f7;border-bottom:1px solid #eef2f7;">
      <div style="font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.55;color:#344054;">
        Link importante para divulgação: nos stories, direcione para páginas e ações oficiais do Estratégia.
        Pode usar a página de cursos, por exemplo: <strong style="word-break:break-all;">${escapeHtml(linkCatalogoCursos)}</strong>
      </div>
    </div>`;

  return `
    <div style="margin-top:18px;padding:18px;border:1px solid #e6eaf2;border-radius:12px;background:#fbfcff;">
      <div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;color:#111827;margin-bottom:10px;">
        Entregas combinadas
      </div>
      <div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.55;color:#344054;">
        Reforçando as entregas combinadas para a parceria:
      </div>
      ${igBlock}
      ${tkBlock}
      ${ytBlock}
      ${note}
    </div>`;
}

function buildTikTokBlockHtml(tiktokSemana: string): string {
  const tk = toIntSafe(tiktokSemana);
  if (tk <= 0) return "";
  return `
    <div style="margin-top:10px;padding:12px;border-radius:10px;background:#ffffff;border:1px solid #eef2f7;">
      <div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;color:#111827;">TikTok</div>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:8px;">
        ${rowHtml("Vídeos:", `${tk} / semana`)}
      </table>
    </div>`;
}

function buildYoutubeBlockHtml(youtubeMes: string): string {
  const yt = toIntSafe(youtubeMes);
  if (yt <= 0) return "";
  return `
    <div style="margin-top:10px;padding:12px;border-radius:10px;background:#ffffff;border:1px solid #eef2f7;">
      <div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;color:#111827;">YouTube</div>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:8px;">
        ${rowHtml("Vídeos:", `${yt} / semana`)}
      </table>
    </div>`;
}

function buildEmbaixadoresSectionBlock(
  cupomCodigo: string,
  headerBg: string,
  accentSecondary: string,
  verticalDisplay: string,
  regulamentoLink: string
): string {
  const code = String(cupomCodigo || "").trim();
  if (!code) return "";

  return `
                <div style="text-align:center;margin:14px 0;font-family:Arial,Helvetica,sans-serif;font-size:20px;color:#aab4c8;">↓</div>

                <div style="padding:16px;border:1px solid #e6eaf2;border-radius:12px;background:#fbfcff;">
                  <div style="margin-bottom:10px;">
                    <span style="font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:700;color:#ffffff;background:${accentSecondary};padding:3px 10px;border-radius:20px;letter-spacing:0.5px;">PROGRAMA DE EMBAIXADORES</span>
                  </div>
                  <div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;color:#111827;margin-bottom:10px;">Você segue como Embaixador(a)</div>
                  <div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;color:#344054;">
                    O Programa de Embaixadores é um modelo diferente — sem remuneração fixa e sem obrigação de entregas. Seu cupom continua ativo e você pode seguir divulgando normalmente.
                  </div>
                  <div style="margin-top:12px;padding:12px;border-radius:10px;background:#ffffff;border:1px solid #eef2f7;">
                    <div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#667085;margin-bottom:4px;">Seu cupom</div>
                    <div style="font-family:Arial,Helvetica,sans-serif;font-size:18px;color:${headerBg};font-weight:700;letter-spacing:1px;">${escapeHtml(code)}</div>
                  </div>
                  <div style="margin-top:12px;padding:12px;border-radius:10px;background:#ffffff;border:1px solid #eef2f7;">
                    <div style="font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:700;color:#111827;margin-bottom:8px;">Como funciona esse modelo</div>
                    <ul style="margin:0;padding:0 0 0 18px;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#344054;line-height:1.8;">
                      <li style="margin:4px 0;">Sem compromisso de entregas semanais ou mensais</li>
                      <li style="margin:4px 0;">Sem envio de comprovação pelo formulário</li>
                      <li style="margin:4px 0;">Você divulga quando e como quiser</li>
                      <li style="margin:4px 0;">Seus seguidores ganham <strong>10% de desconto</strong> com o seu cupom</li>
                      <li style="margin:4px 0;">Você recebe <strong>comissão sobre cada venda</strong> realizada com ele</li>
                    </ul>
                  </div>
                  <div style="margin-top:14px;padding:12px;border-width:1px 1px 1px 4px;border-style:solid;border-color:#eef2f7 #eef2f7 #eef2f7 ${headerBg};background:#ffffff;border-radius:0 10px 10px 0;">
                    <div style="font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.6;color:#344054;">
                      Para consultar as regras completas do Programa de Embaixadores, acesse o documento abaixo:<br /><br />
                      <a href="${escapeHtml(regulamentoLink)}" style="color:${headerBg};text-decoration:none;font-weight:700;">Regulamento – Programa de Embaixadores ${escapeHtml(verticalDisplay)}</a>
                    </div>
                  </div>
                  <div style="margin-top:12px;padding:12px;border-radius:10px;background:#fff8f8;border:1px solid #f2d4d4;">
                    <div style="font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.6;color:#344054;">
                      Caso não tenha interesse em continuar no Programa de Embaixadores, basta responder este e-mail solicitando o cancelamento do cupom.
                    </div>
                  </div>
                </div>`;
}

function applyAmbassadorPlaceholders(html: string, data: Record<string, unknown>): string {
  const rawKeys = [
    "entregasCard",
    "tiktokBlock",
    "youtubeBlock",
    "includedPropostaBlock",
    "entregasPropostaBlock",
    "passosPropostaBlock",
    "rodapePropostaBlock",
    "acessoFormalizacaoBlock",
    "cupomFormalizacaoBlock",
    "entregasFormalizacaoBlock",
    "primeiroPostBlock",
    "nossasRedesBlock",
    "bioFormalizacaoBlock",
    "comprovacaoBlock",
    "embaixadoresSectionBlock",
  ];
  const rawMap: Record<string, string> = {};
  for (const k of rawKeys) {
    rawMap[`{{${k}}}`] = String(data[k] ?? "");
  }

  const map: Record<string, string> = {
    "{{firstName}}": esc(data.firstName),
    "{{fullName}}": esc(data.fullName),
    "{{email}}": esc(data.email),
    "{{valor}}": esc(data.valor),
    "{{vertical}}": esc(data.vertical),
    "{{verticalDisplay}}": esc(data.verticalDisplay),
    "{{verticalFull}}": esc(data.verticalFull),
    "{{bioLinha}}": esc(data.bioLinha),
    "{{headerBg}}": esc(data.headerBg),
    "{{linkCatalogoCursos}}": esc(data.linkCatalogoCursos),
    "{{linkCadastro}}": esc(data.linkCadastro),
    "{{linkCupom}}": esc(data.linkCupom),
    "{{linkPlataforma}}": esc(data.linkPlataforma),
    "{{linkFormEntregas}}": esc(data.linkFormEntregas),
    "{{cursoNome}}": esc(data.cursoNome),
    "{{cursoData}}": esc(data.cursoData),
    "{{cupomCodigo}}": esc(data.cupomCodigo),
    "{{qtdFeedReelsSemana}}": esc(data.qtdFeedReelsSemana),
    "{{qtdStoriesSemana}}": esc(data.qtdStoriesSemana),
    "{{qtdTiktoksSemana}}": esc(data.qtdTiktoksSemana),
    "{{qtdYoutubesSemana}}": esc(String(data.qtdYoutubesSemana ?? 0)),
    "{{cupomDesconto}}": esc(data.cupomDesconto),
    "{{cupomComissaoMax}}": esc(data.cupomComissaoMax),
    "{{verticalBrand}}": esc(data.verticalBrand),
    "{{mesEncerramento}}": esc(data.mesEncerramento),
    "{{regulamentoLink}}": esc(data.regulamentoLink),
    "{{accentSecondary}}": esc(data.accentSecondary),
  };

  let out = String(html || "");
  for (const [k, v] of Object.entries(rawMap)) out = out.split(k).join(v);
  for (const [k, v] of Object.entries(map)) out = out.split(k).join(v);
  return out;
}

function applyFinancePlaceholders(html: string, data: Record<string, unknown>): string {
  const map: Record<string, string> = {
    "{{firstName}}": esc(data.firstName),
    "{{fullName}}": esc(data.fullName),
    "{{mes}}": esc(data.mes),
    "{{programa}}": esc(data.programa),
    "{{instagram}}": esc(data.instagram),
    "{{headerBg}}": esc(data.headerBg),
    "{{percentEntregas}}": esc(data.percentEntregas),
    "{{valorAcordado}}": esc(data.valorAcordado),
    "{{valorAPagar}}": esc(data.valorAPagar),
    "{{metaFeed}}": esc(data.metaFeed),
    "{{metaStories}}": esc(data.metaStories),
    "{{metaTk}}": esc(data.metaTk),
    "{{metaYt}}": esc(data.metaYt || "0"),
    "{{entFeed}}": esc(data.entFeed),
    "{{entStories}}": esc(data.entStories),
    "{{entTk}}": esc(data.entTk),
    "{{entYt}}": esc(data.entYt || "0"),
    "{{mesDisplay}}": esc(data.mesDisplay),
    "{{programaFullName}}": esc(data.programaFullName),
    "{{linkTermoPdf}}": String(data.linkTermoPdf || ""),
    "{{linkTermo}}": String(data.linkTermo || ""),
    "{{linkTermoAssinado}}": String(data.linkTermoAssinado || ""),
    "{{linkFormFinanceiro}}": String(data.linkFormFinanceiro || ""),
    "{{prazoPagamento}}": esc(data.prazoPagamento),
    "{{dataEnvioFinanceiro}}": esc(data.dataEnvioFinanceiro),
    "{{replyToEmail}}": esc(data.replyToEmail),
    "{{emailFinanceiro}}": esc(data.emailFinanceiro),
    "{{nomeFinanceiro}}": esc(data.nomeFinanceiro),
  };

  let out = html;
  for (const [k, v] of Object.entries(map)) out = out.split(k).join(v);
  return out;
}

export type AmbassadorLike = {
  fullName: string;
  email?: string | null;
  program: string;
  partnership?: {
    modality?: string | null;
    agreedValue?: number | null;
    courseName?: string | null;
    couponCode?: string | null;
    courseReleaseDate?: Date | null;
    metaFeed?: number;
    metaStories?: number;
    metaTiktok?: number;
    metaYoutube?: number;
  } | null;
};

export function buildAmbassadorTemplateData(
  ambassador: AmbassadorLike,
  extra?: Record<string, string | number | undefined>
): Record<string, unknown> {
  const vertical = ambassador.program;
  const p = ambassador.partnership;
  const theme = getVerticalTheme(vertical);
  const headerBg = vertical === "OAB" ? EMAIL_THEME.OAB_BG : EMAIL_THEME.ECJ_BG;
  const accentSecondary = vertical === "OAB" ? "#8B1A0A" : "#B87300";
  const cfg = VERTICAL_CONFIG[vertical as keyof typeof VERTICAL_CONFIG];
  const cancellationMonthRef = String(extra?.cancellationMonthRef || "");

  const qtdFeedReelsSemana = perWeekFromMonthly(p?.metaFeed ?? extra?.metaFeed ?? 0);
  const qtdStoriesSemana = perWeekFromMonthly(p?.metaStories ?? extra?.metaStories ?? 0);
  const qtdTiktoksSemana = perWeekFromMonthly(p?.metaTiktok ?? extra?.metaTiktok ?? 0);
  const qtdYoutubesSemana = perWeekFromMonthly(p?.metaYoutube ?? extra?.metaYoutube ?? 0);
  const linkCatalogoCursos = vertical === "OAB" ? EMAIL_THEME.CATALOGO_OAB : EMAIL_THEME.CATALOGO_ECJ;
  const cursoNome = String(p?.courseName || extra?.courseName || "");
  const cursoData = formatDateBR(p?.courseReleaseDate || extra?.releaseDate);
  const cupomCodigo =
    extra?.couponCode !== undefined
      ? String(extra.couponCode || "").trim()
      : String(p?.couponCode || "").trim();
  const productValue = p?.agreedValue ?? extra?.productValue ?? extra?.valor;

  const entregasOpts = {
    program: vertical,
    feed: qtdFeedReelsSemana,
    stories: qtdStoriesSemana,
    tiktok: qtdTiktoksSemana,
    youtube: qtdYoutubesSemana,
  };

  return {
    firstName: firstName(ambassador.fullName),
    fullName: ambassador.fullName,
    email: ambassador.email || "",
    valor: p?.agreedValue != null ? formatMoney(p.agreedValue) : String(extra?.valor || ""),
    vertical,
    verticalDisplay: theme.verticalDisplay,
    verticalFull: theme.verticalFull,
    headerBg,
    linkCatalogoCursos,
    linkCadastro: EMAIL_THEME.CADASTRO,
    linkCupom: vertical === "OAB" ? EMAIL_THEME.CUPOM_OAB : EMAIL_THEME.CUPOM_ECJ,
    linkFormEntregas: EMAIL_THEME.FORM_ENTREGAS,
    linkPlataforma: vertical === "OAB" ? EMAIL_THEME.PLATAFORMA_OAB : EMAIL_THEME.PLATAFORMA_ECJ,
    bioLinha: `Embaixador(a) ${cfg?.handle || ""}`,
    cursoNome,
    cursoData,
    cupomCodigo,
    qtdFeedReelsSemana,
    qtdStoriesSemana,
    qtdTiktoksSemana,
    qtdYoutubesSemana,
    cupomDesconto: "10%",
    cupomComissaoMax: "20%",
    verticalBrand: theme.brand,
    mesEncerramento: cancellationMonthRef
      ? monthNameFromRef(cancellationMonthRef)
      : monthNameFromRef(new Date().toISOString().slice(0, 7)),
    regulamentoLink:
      vertical === "OAB" ? EMAIL_THEME.REGULAMENTO_OAB : EMAIL_THEME.REGULAMENTO_ECJ,
    accentSecondary,
    embaixadoresSectionBlock: buildEmbaixadoresSectionBlock(
      cupomCodigo,
      headerBg,
      accentSecondary,
      theme.verticalDisplay,
      vertical === "OAB" ? EMAIL_THEME.REGULAMENTO_OAB : EMAIL_THEME.REGULAMENTO_ECJ
    ),
    includedPropostaBlock: buildPropostaIncludedBlock({
      program: vertical,
      courseName: cursoNome,
      courseDescription: extra?.courseDescription as string | undefined,
      courseUrl: extra?.courseUrl as string | undefined,
      careerUrl: extra?.careerUrl as string | undefined,
      productValue,
    }),
    entregasPropostaBlock: buildPropostaEntregasBlock(entregasOpts),
    passosPropostaBlock: buildPropostaPassosBlock(vertical),
    rodapePropostaBlock: buildPropostaRodapeBlock(vertical),
    acessoFormalizacaoBlock: buildFormalizacaoAcessoBlock({
      program: vertical,
      courseName: cursoNome,
      courseDate: cursoData,
    }),
    cupomFormalizacaoBlock: buildFormalizacaoCupomBlock({
      program: vertical,
      couponCode: cupomCodigo,
    }),
    entregasFormalizacaoBlock: buildFormalizacaoEntregasBlock(entregasOpts),
    primeiroPostBlock: buildPrimeiroPostBlock(vertical),
    nossasRedesBlock: buildNossasRedesBlock(vertical),
    bioFormalizacaoBlock: buildBioFormalizacaoBlock(vertical),
    comprovacaoBlock: buildComprovacaoBlock(vertical),
    entregasCard: buildEntregasCardHtml(
      qtdFeedReelsSemana,
      qtdStoriesSemana,
      qtdTiktoksSemana,
      qtdYoutubesSemana,
      linkCatalogoCursos
    ),
    tiktokBlock: buildTikTokBlockHtml(qtdTiktoksSemana),
    youtubeBlock: buildYoutubeBlockHtml(qtdYoutubesSemana),
    ...extra,
  };
}

export function resolveAmbassadorEmailAction(
  emailType: string,
  modality?: string | null
): string {
  const mod = modality || "Assinatura + Cupom";
  const shortcuts: Record<string, string> = {
    proposta:
      mod === "Remuneração"
        ? "Enviar proposta (Remuneração)"
        : "Enviar proposta (Assinatura + Cupom)",
    formalizacao:
      mod === "Remuneração"
        ? "Enviar formalização (Remuneração)"
        : "Enviar formalização (Assinatura + Cupom)",
    proximos_passos: "Enviar próximos passos (Assinatura + Cupom)",
    reprovacao: "Enviar reprovação",
    cancelamento: "Enviar cancelamento de parceria",
  };
  if (shortcuts[emailType]) return shortcuts[emailType];
  if (AMBASSADOR_ACTION_TEMPLATES[emailType]) return emailType;
  return "Enviar proposta (Assinatura + Cupom)";
}

function buildAmbassadorSubject(
  action: string,
  firstName: string,
  verticalDisplay: string
): string {
  if (action === "Enviar proposta (Assinatura + Cupom)") {
    return `${firstName}, sua proposta do Programa Super Embaixador ${verticalDisplay}`;
  }
  if (action === "Enviar formalização (Assinatura + Cupom)") {
    return `${firstName}, formalização da sua parceria Super Embaixador ${verticalDisplay}`;
  }
  if (action === "Enviar cancelamento de parceria") {
    const brand = verticalDisplay === "OAB" ? "Estratégia OAB" : "Estratégia Carreira Jurídica";
    return `${brand} — Atualização da sua parceria`;
  }
  return `${firstName}, Super Embaixadores (${verticalDisplay})`;
}

export function renderAmbassadorEmail(
  action: string,
  ambassador: AmbassadorLike,
  extra?: Record<string, string | number | undefined>
): { subject: string; html: string; action: string } {
  const resolved = resolveAmbassadorEmailAction(action, ambassador.partnership?.modality);
  const fileName = AMBASSADOR_ACTION_TEMPLATES[resolved];
  if (!fileName) {
    throw new Error(`Ação de e-mail desconhecida: ${action}`);
  }
  const data = buildAmbassadorTemplateData(ambassador, extra);
  const subject = buildAmbassadorSubject(
    resolved,
    String(data.firstName),
    String(data.verticalDisplay)
  );
  const html = applyAmbassadorPlaceholders(loadTemplate(fileName), data);
  return { subject, html, action: resolved };
}

export type FinanceLike = {
  monthRef: string;
  pctDelivered: number;
  agreedValue?: number | null;
  amountDue?: number | null;
  termLink?: string | null;
  signedTermLink?: string | null;
  ambassador: AmbassadorLike & { instagram: string };
};

export type ControlLike = {
  metaFeed?: number;
  metaStories?: number;
  metaTiktok?: number;
  metaYoutube?: number;
  deliveredFeed?: number;
  deliveredStories?: number;
  deliveredTiktok?: number;
  deliveredYoutube?: number;
  pctDelivered?: number;
} | null;

export function buildFinanceSubject(firstName: string, monthRef: string, program: string): string {
  return `${firstName}, Fechamento ${monthRef} | Super Embaixadores (${program})`;
}

export function renderFinanceEmail(
  action: string,
  fin: FinanceLike,
  control?: ControlLike
): { subject: string; html: string; recipient?: string } {
  const fileName = FINANCE_ACTION_TEMPLATES[action];
  if (!fileName) throw new Error(`Ação financeira sem template: ${action}`);

  const amb = fin.ambassador;
  const program = amb.program;
  const headerBg = program === "OAB" ? EMAIL_THEME.OAB_BG : EMAIL_THEME.ECJ_BG;
  const fromAddr =
    program === "OAB" ? "embaixadores.oab@estrategia.com" : "embaixadores.ecj@estrategia.com";
  const fn = firstName(amb.fullName);
  const mesDisplay = formatMesDisplay(fin.monthRef);
  const perc = formatPercent(control?.pctDelivered ?? fin.pctDelivered);

  const base = {
    firstName: fn,
    fullName: amb.fullName,
    mes: fin.monthRef,
    mesDisplay,
    programa: program,
    instagram: amb.instagram,
    headerBg,
    percentEntregas: perc,
    valorAcordado: formatMoney(fin.agreedValue),
    valorAPagar: formatMoney(fin.amountDue),
    metaFeed: control ? String(control.metaFeed ?? "—") : "—",
    metaStories: control ? String(control.metaStories ?? "—") : "—",
    metaTk: control ? String(control.metaTiktok ?? "—") : "—",
    metaYt: control ? String(control.metaYoutube ?? "0") : "0",
    entFeed: control ? String(control.deliveredFeed ?? "—") : "—",
    entStories: control ? String(control.deliveredStories ?? "—") : "—",
    entTk: control ? String(control.deliveredTiktok ?? "—") : "—",
    entYt: control ? String(control.deliveredYoutube ?? "0") : "0",
    linkTermoPdf: fin.termLink || "",
    linkTermo: fin.signedTermLink || "",
    linkTermoAssinado: fin.signedTermLink || "",
    linkFormFinanceiro: EMAIL_THEME.LINK_FORM_FIN,
    prazoPagamento: computePrazoPagamento(fin.monthRef),
    dataEnvioFinanceiro: new Date().toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" }),
    replyToEmail: fromAddr,
    programaFullName: formatProgramaFullName(program),
    emailFinanceiro: process.env.FINANCE_TEAM_EMAIL || "alefgomesandre+financeiro@gmail.com",
    nomeFinanceiro: amb.fullName,
  };

  const html = applyFinancePlaceholders(loadTemplate(fileName), base);

  if (action === "Enviar solicitação ao Financeiro") {
    return {
      subject: `Solicitação de pagamento | ${mesDisplay} | ${base.programaFullName} | ${amb.fullName}`,
      html,
      recipient: process.env.FINANCE_TEAM_EMAIL || "alefgomesandre+financeiro@gmail.com",
    };
  }

  return {
    subject: buildFinanceSubject(fn, fin.monthRef, program),
    html,
    recipient: amb.email || undefined,
  };
}

/** @deprecated Use renderAmbassadorEmail */
export function renderSimpleEmail(
  type: string,
  vars: Record<string, string | number | undefined>
): { subject: string; html: string } {
  const ambassador: AmbassadorLike = {
    fullName: String(vars.fullName || vars.firstName || "Embaixador"),
    email: String(vars.email || ""),
    program: String(vars.vertical || "OAB"),
    partnership: {
      modality: vars.modality as string | undefined,
      agreedValue: typeof vars.agreedValue === "number" ? vars.agreedValue : undefined,
      courseName: vars.courseName as string | undefined,
      couponCode: vars.couponCode as string | undefined,
    },
  };
  try {
    const { subject, html } = renderAmbassadorEmail(type, ambassador, vars);
    return { subject, html };
  } catch {
    const fn = firstName(ambassador.fullName);
    return {
      subject: `${fn}, Super Embaixadores (${ambassador.program})`,
      html: `<p>Olá, ${fn}!</p><p>${vars.message || "Mensagem do programa Super Embaixadores."}</p>`,
    };
  }
}
