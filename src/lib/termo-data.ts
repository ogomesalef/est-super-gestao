import type { Ambassador, MonthlyControl, MonthlyFinance, Partnership } from "@prisma/client";
import { formatMesDisplay, formatMoney, formatPercent } from "@/lib/email-templates";
import { firstName } from "@/lib/utils";

export type TermoFinanceBundle = MonthlyFinance & {
  ambassador: Ambassador & { partnership: Partnership | null };
};

const MESES = [
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

function normalizeIg(ig: string): string {
  const s = String(ig || "").trim();
  return s.startsWith("@") ? s : `@${s}`;
}

function monthPeriodBR(monthRef: string): { start: string; end: string } {
  const [y, m] = monthRef.split("-").map(Number);
  const lastDay = new Date(y, m, 0).getDate();
  const mm = String(m).padStart(2, "0");
  return {
    start: `01/${mm}/${y}`,
    end: `${String(lastDay).padStart(2, "0")}/${mm}/${y}`,
  };
}

function signatureDate(monthRef: string): string {
  const [y, m] = monthRef.split("-").map(Number);
  const nextM = m === 12 ? 1 : m + 1;
  const nextY = m === 12 ? y + 1 : y;
  return `São Paulo, 01 de ${MESES[nextM - 1]} de ${nextY}.`;
}

export function buildTermActivityText(
  monthRef: string,
  control: MonthlyControl | null
): string {
  if (!control) {
    const { start, end } = monthPeriodBR(monthRef);
    return `Entregas referentes ao período de ${start} a ${end}`;
  }

  const { start, end } = monthPeriodBR(monthRef);
  const parts: string[] = [];
  if (control.deliveredFeed > 0) {
    parts.push(`${control.deliveredFeed} reel${control.deliveredFeed > 1 ? "s" : ""}`);
  }
  if (control.deliveredStories > 0) {
    parts.push(
      `${control.deliveredStories} sequência${control.deliveredStories > 1 ? "s" : ""} de stories`
    );
  }
  if (control.deliveredTiktok > 0) {
    parts.push(`${control.deliveredTiktok} vídeo${control.deliveredTiktok > 1 ? "s" : ""} TikTok`);
  }
  if (control.deliveredYoutube > 0) {
    parts.push(`${control.deliveredYoutube} vídeo${control.deliveredYoutube > 1 ? "s" : ""} YouTube`);
  }

  if (!parts.length) return `Entregas referentes ao período de ${start} a ${end}`;
  return `${parts.join(", ")} de ${start} a ${end}`;
}

function signatureDateOnly(monthRef: string): string {
  const [y, m] = monthRef.split("-").map(Number);
  const nextM = m === 12 ? 1 : m + 1;
  const nextY = m === 12 ? y + 1 : y;
  return `01 de ${MESES[nextM - 1]} de ${nextY}`;
}

function addPlaceholder(out: Record<string, string>, token: string, value: string) {
  out[`{{${token}}}`] = value;
  out[`<<${token}>>`] = value;
  out[`[${token}]`] = value;
}

export function buildTermoReplacements(
  fin: TermoFinanceBundle,
  control: MonthlyControl | null
): Record<string, string> {
  const amb = fin.ambassador;
  const p = amb.partnership;
  const fn = firstName(amb.fullName);
  const mesDisplay = formatMesDisplay(fin.monthRef);
  const today = new Date().toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
  const cpf = p?.legalCpf || "";
  const endereco = p?.legalAddress || "";
  const email = amb.email || "";
  const banco = p?.bankDetails || "";
  const atividade = buildTermActivityText(fin.monthRef, control);
  const valorTermo = formatMoney(fin.amountDue ?? fin.agreedValue);
  const dataAssinatura = signatureDateOnly(fin.monthRef);
  const localData = signatureDate(fin.monthRef);
  const intro = `${amb.fullName}, inscrito(a) no CPF/MF sob o nº ${cpf || "___________"} com endereço na ${endereco || "___________________________"}, e-mail ${email || "___________________"}, doravante denominado(a) DIGITAL INFLUENCER, expressamente adere ao presente Termos de Parceira - Digital Influencer, declarando estar integralmente ciente e de acordo com os termos e condições previstos a seguir:`;

  const out: Record<string, string> = {};

  // Placeholders do template oficial (Google Doc / Word convertido)
  addPlaceholder(out, "NOME", amb.fullName);
  addPlaceholder(out, "CPF", cpf);
  addPlaceholder(out, "ENDEREÇO", endereco);
  addPlaceholder(out, "ENDERECO", endereco);
  addPlaceholder(out, "EMAIL", email);
  addPlaceholder(out, "ATIVIDADE", atividade);
  addPlaceholder(out, "VALOR", valorTermo);
  addPlaceholder(out, "DADOS BANCÁRIOS", banco);
  addPlaceholder(out, "DADOS BANCARIOS", banco);
  addPlaceholder(out, "DATA ATUAL", dataAssinatura);
  // typo comum no template Word (fecha só uma chave)
  out["{{DADOS BANCÁRIOS}"] = banco;

  // Variantes com underscore (templates alternativos)
  addPlaceholder(out, "NOME_COMPLETO", amb.fullName);
  addPlaceholder(out, "PRIMEIRO_NOME", fn);
  addPlaceholder(out, "DADOS_BANCARIOS", banco);
  addPlaceholder(out, "VALOR_TERMO", valorTermo);
  addPlaceholder(out, "VALOR_A_PAGAR", valorTermo);
  addPlaceholder(out, "VALOR_ACORDADO", formatMoney(fin.agreedValue));
  addPlaceholder(out, "INTRO_PARAGRAFO", intro);
  addPlaceholder(out, "DATA_ASSINATURA", localData);
  addPlaceholder(out, "LOCAL_DATA", localData);
  addPlaceholder(out, "DATA_HOJE", today);
  addPlaceholder(out, "INSTAGRAM", normalizeIg(amb.instagram));
  addPlaceholder(out, "PROGRAMA", amb.program);
  addPlaceholder(out, "MES", fin.monthRef);
  addPlaceholder(out, "MES_REFERENCIA", fin.monthRef);
  addPlaceholder(out, "MES_DISPLAY", mesDisplay);
  addPlaceholder(out, "PERCENT_ENTREGAS", formatPercent(fin.pctDelivered));
  addPlaceholder(out, "META_FEED", String(control?.metaFeed ?? "—"));
  addPlaceholder(out, "META_STORIES", String(control?.metaStories ?? "—"));
  addPlaceholder(out, "META_TIKTOK", String(control?.metaTiktok ?? "—"));
  addPlaceholder(out, "META_YOUTUBE", String(control?.metaYoutube ?? "0"));
  addPlaceholder(out, "ENTREGAS_FEED", String(control?.deliveredFeed ?? "—"));
  addPlaceholder(out, "ENTREGAS_STORIES", String(control?.deliveredStories ?? "—"));
  addPlaceholder(out, "ENTREGAS_TIKTOK", String(control?.deliveredTiktok ?? "—"));
  addPlaceholder(out, "ENTREGAS_YOUTUBE", String(control?.deliveredYoutube ?? "0"));

  return out;
}

export function termoDataComplete(fin: TermoFinanceBundle): {
  ok: boolean;
  missing: string[];
} {
  const p = fin.ambassador.partnership;
  const missing: string[] = [];
  if (!p?.legalCpf?.trim()) missing.push("CPF");
  if (!p?.legalAddress?.trim()) missing.push("Endereço");
  if (!p?.bankDetails?.trim()) missing.push("Dados bancários");
  if (!fin.ambassador.email?.trim()) missing.push("E-mail");
  return { ok: missing.length === 0, missing };
}
