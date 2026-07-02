import { PARTNERSHIP_STATUSES, PARTNERSHIP_STATUS_ALIASES } from "./constants";
import { parseSheetDate } from "./sheet-date";
import { normalizeHandle, parseBool } from "./utils";
import { pickRow, sheetRowToObject, type SheetRow } from "./delivery-row";

export { pickRow, sheetRowToObject, type SheetRow };

/** Colunas operacionais da aba Respostas (não são perguntas do form). */
export const RESPOSTAS_OPERATIONAL_COLUMNS = new Set([
  "Status",
  "Ação",
  "Log",
  "Modalidade da parceria",
  "Meta Feed/Reels",
  "Meta Stories",
  "Meta TikTok",
  "Meta YouTube",
  "Valor definido da proposta",
  "Nome curso liberado",
  "Data início da parceria",
  "Data envio próximos passos",
  "Data envio proposta",
  "Data envio formalização",
  "Data liberação do curso",
  "Data fim de parceria",
  "Data reprovação",
  "Proposta enviada?",
  "Curso liberado?",
  "OBS (Alertas)",
  "Sugestão de metas",
  "Pontuação",
  "Gmail Thread ID",
]);

export type ParsedRespostasRow = {
  program: string;
  instagram: string;
  fullName: string;
  email: string | null;
  whatsapp: string | null;
  tiktok: string | null;
  youtube: string | null;
  otherNetworks: string | null;
  status: string;
  alerts: string | null;
  gmailThreadId: string | null;
  submittedAt: Date | null;
  applicationFormData: Record<string, string>;
  partnership: {
    modality: string | null;
    agreedValue: number | null;
    courseName: string | null;
    courseReleased: boolean;
    courseReleaseDate: Date | null;
    metaFeed: number;
    metaStories: number;
    metaTiktok: number;
    metaYoutube: number;
    startDate: Date | null;
    endDate: Date | null;
    proposalSentAt: Date | null;
    formalizationSentAt: Date | null;
    metaSuggestion: boolean;
    score: string | null;
  };
};

function parseNumber(v: string): number | null {
  const n = Number(String(v || "").replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

function normalizePartnershipStatus(raw: string): string {
  const s = String(raw || "").trim();
  if (!s) return "Pendente";
  const alias = PARTNERSHIP_STATUS_ALIASES[s];
  if (alias) return alias;
  const match = PARTNERSHIP_STATUSES.find((x) => x.toLowerCase() === s.toLowerCase());
  return match || s;
}

export function extractFormOnlyFields(row: SheetRow): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(row)) {
    if (!key || RESPOSTAS_OPERATIONAL_COLUMNS.has(key)) continue;
    const v = String(value || "").trim();
    if (v) out[key] = v;
  }
  return out;
}

export function parseRespostasSheetRow(row: SheetRow, program: string): ParsedRespostasRow | null {
  const instagram = normalizeHandle(pickRow(row, "Seu Instagram (@)", "Instagram", "INSTAGRAM"));
  if (!instagram || instagram === "@") return null;

  const fullName =
    pickRow(row, "Nome completo", "NOME", "Nome") || instagram.replace(/^@/, "");
  const submittedAt = parseSheetDate(pickRow(row, "Carimbo de data/hora"));

  const proposalSentAt =
    parseSheetDate(pickRow(row, "Data envio proposta")) ||
    (parseBool(pickRow(row, "Proposta enviada?")) ? submittedAt : null);

  const formalizationSentAt = parseSheetDate(pickRow(row, "Data envio formalização"));

  return {
    program,
    instagram,
    fullName,
    email: pickRow(row, "E-mail", "email") || null,
    whatsapp: pickRow(row, "WhatsApp com DDD", "WhatsApp") || null,
    tiktok: normalizeHandle(pickRow(row, "Seu TikTok (@)", "TikTok", "TIKTOK")) || null,
    youtube: pickRow(row, "Seu YouTube (@)", "YouTube", "YOUTUBE") || null,
    otherNetworks: pickRow(row, "Outras redes (X, Threads, etc.)") || null,
    status: normalizePartnershipStatus(pickRow(row, "Status", "STATUS")),
    alerts: pickRow(row, "OBS (Alertas)", "OBSERVAÇÕES") || null,
    gmailThreadId: pickRow(row, "Gmail Thread ID") || null,
    submittedAt,
    applicationFormData: extractFormOnlyFields(row),
    partnership: {
      modality: pickRow(row, "Modalidade da parceria", "MODALIDADE") || null,
      agreedValue: parseNumber(pickRow(row, "Valor definido da proposta", "VALOR ACORDADO")),
      courseName: pickRow(row, "Nome curso liberado", "CURSO") || null,
      courseReleased: parseBool(pickRow(row, "Curso liberado?")),
      courseReleaseDate: parseSheetDate(pickRow(row, "Data liberação do curso")),
      metaFeed: parseNumber(pickRow(row, "Meta Feed/Reels", "META FEED/REELS")) ?? 0,
      metaStories: parseNumber(pickRow(row, "Meta Stories", "META STORIES")) ?? 0,
      metaTiktok: parseNumber(pickRow(row, "Meta TikTok", "META TIKTOK")) ?? 0,
      metaYoutube: parseNumber(pickRow(row, "Meta YouTube", "META YOUTUBE")) ?? 0,
      startDate: parseSheetDate(pickRow(row, "Data início da parceria")),
      endDate: parseSheetDate(pickRow(row, "Data fim de parceria")),
      proposalSentAt,
      formalizationSentAt,
      metaSuggestion: parseBool(pickRow(row, "Sugestão de metas")),
      score: pickRow(row, "Pontuação") || null,
    },
  };
}

export function parseApplicationFormData(
  raw: string | Record<string, string> | null | undefined
): Record<string, string> | null {
  if (!raw) return null;
  if (typeof raw === "object") return raw;
  try {
    const parsed = JSON.parse(raw) as Record<string, string>;
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

export function buildRespostasSheetSyncKey(
  spreadsheetId: string,
  sheetName: string,
  rowNumber: number
): string {
  return `respostas:${spreadsheetId}:${sheetName}:${rowNumber}`;
}

/** Campos-chave para exibição rápida na UI. */
export function respostasHighlightFields(
  form: Record<string, string> | null | undefined,
  program: string
): Array<{ label: string; value: string }> {
  if (!form) return [];
  const keys =
    program === "ECJ"
      ? [
          "Seu foco principal hoje é:",
          "Em qual perfil você mais se encaixa hoje?",
          "Em poucas linhas, por que seu perfil se encaixa bem no Super Embaixadores?",
          "Você é aluno(a) do Estratégia hoje?",
          "Qual carreira jurídica é seu foco principal hoje?",
          "Quais formatos você consegue entregar com consistência?",
          "Frequência que você consegue manter hoje",
          "O que você mais busca com esse projeto?",
          "Qual curso/produto do Estratégia Carreira Jurídica você teria mais interesse em acessar?",
        ]
      : [
          "Seu foco principal hoje é:",
          "Em qual perfil você mais se encaixa hoje?",
          "Em poucas linhas, por que seu perfil se encaixa bem no Super Embaixadores?",
          "Você é aluno(a) do Estratégia hoje?",
          "Você está estudando para a OAB atualmente?",
          "Quais formatos você consegue entregar com consistência?",
          "Frequência que você consegue manter hoje",
          "O que você mais busca com esse projeto?",
          "Qual curso/produto do Estratégia OAB você teria mais interesse em acessar?",
        ];
  return keys
    .map((label) => ({ label, value: form[label] || "" }))
    .filter((x) => x.value);
}
