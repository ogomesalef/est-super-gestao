/**
 * Importa planilha xlsx para SQLite.
 * Uso: npm run import:xlsx -- "/caminho/SUPER EMBAIXADORES ECJ + OAB.xlsx"
 */
import * as XLSX from "xlsx";
import { prisma } from "../src/lib/prisma";
import { upsertAmbassadorFromRespostas } from "../src/lib/candidaturas-sync";
import { parseRespostasSheetRow } from "../src/lib/respostas-row";
import {
  normalizeHandle,
  parseBool,
  parseDate,
  parseMonthRef,
  parseNumber,
} from "../src/lib/utils";

function sheetRows(wb: XLSX.WorkBook, name: string): Record<string, unknown>[] {
  const sh = wb.Sheets[name];
  if (!sh) {
    console.warn(`Aba não encontrada: ${name}`);
    return [];
  }
  return XLSX.utils.sheet_to_json(sh, { defval: "", raw: false }) as Record<string, unknown>[];
}

function pick(row: Record<string, unknown>, ...keys: string[]): unknown {
  for (const k of keys) {
    if (row[k] !== undefined && row[k] !== "") return row[k];
  }
  return "";
}

async function upsertAmbassador(
  program: string,
  row: Record<string, unknown>,
  defaults: { status?: string; fromForm?: boolean } = {}
) {
  const instagram = normalizeHandle(String(pick(row, "Instagram", "INSTAGRAM", "Seu Instagram (@)") || ""));
  if (!instagram || instagram === "@") return null;

  const fullName = String(pick(row, "Nome completo", "NOME", "Nome") || instagram);
  const email = String(pick(row, "E-mail", "E-mail", "email") || "") || null;
  const now = new Date();
  const fromForm = defaults.fromForm === true;

  const amb = await prisma.ambassador.upsert({
    where: { program_instagram: { program, instagram } },
    create: {
      program,
      instagram,
      fullName,
      email,
      whatsapp: String(pick(row, "WhatsApp com DDD", "WhatsApp") || "") || null,
      tiktok: normalizeHandle(String(pick(row, "TikTok", "TIKTOK", "Seu TikTok (@)") || "")) || null,
      youtube: String(pick(row, "YouTube", "YOUTUBE") || "") || null,
      status: String(pick(row, "Status", "STATUS") || defaults.status || "Pendente"),
      alerts: String(pick(row, "OBS (Alertas)", "OBSERVAÇÕES") || "") || null,
      source: fromForm ? "import" : undefined,
      needsReview: fromForm,
      applicationReceivedAt: fromForm ? now : undefined,
      partnership: {
        create: {
          modality: String(pick(row, "Modalidade da parceria", "MODALIDADE") || "") || null,
          agreedValue: parseNumber(pick(row, "Valor definido da proposta", "VALOR ACORDADO")),
          courseName: String(pick(row, "Nome curso liberado", "CURSO") || "") || null,
          courseReleased: parseBool(pick(row, "Curso liberado?")),
          courseReleaseDate: parseDate(pick(row, "Data liberação do curso")),
          metaFeed: parseNumber(pick(row, "Meta Feed/Reels", "META FEED/REELS")) ?? 0,
          metaStories: parseNumber(pick(row, "Meta Stories", "META STORIES")) ?? 0,
          metaTiktok: parseNumber(pick(row, "Meta TikTok", "META TIKTOK")) ?? 0,
          metaYoutube: parseNumber(pick(row, "Meta YouTube", "META YOUTUBE")) ?? 0,
          startDate: parseDate(pick(row, "Data início da parceria")),
          endDate: parseDate(pick(row, "Data fim de parceria")),
        },
      },
    },
    update: {
      fullName,
      email,
      status: String(pick(row, "Status", "STATUS") || "") || undefined,
      ...(fromForm
        ? {
            needsReview: true,
            applicationReceivedAt: now,
            source: "import",
          }
        : {}),
    },
    include: { partnership: true },
  });

  return amb;
}

async function main() {
  const filePath = process.argv[2] || "/Users/alefgomes/Downloads/Estratégia/SUPER EMBAIXADORES ECJ + OAB.xlsx";
  console.log("Importando:", filePath);

  const wb = XLSX.readFile(filePath);
  const stats = {
    contacts: 0,
    ambassadors: 0,
    controls: 0,
    finances: 0,
    deliveries: 0,
    campaigns: 0,
  };

  // CONTATOS
  for (const row of sheetRows(wb, "CONTATOS")) {
    const ig = normalizeHandle(String(pick(row, "INSTAGRAM (@)", "Instagram") || ""));
    if (!ig || ig === "@") continue;
    await prisma.contact.create({
      data: {
        legacyId: String(pick(row, "ID") || "") || null,
        vertical: String(pick(row, "VERTICAL", "VERTICAL (SUGESTÃO)") || "") || null,
        status: String(pick(row, "STATUS PIPELINE", "STATUS CAPTAÇÃO") || "Novo"),
        instagram: ig,
        tiktok: normalizeHandle(String(pick(row, "TIKTOK (@)") || "")) || null,
        linkIg: String(pick(row, "LINK IG") || "") || null,
        linkTiktok: String(pick(row, "LINK TIKTOK") || "") || null,
        notes: String(pick(row, "OBSERVAÇÕES", "OBS / HISTÓRICO") || "") || null,
        contactedBy: String(pick(row, "CONTATADO POR", "INDICADO POR") || "") || null,
        prospectedAt: parseDate(pick(row, "DATA PROSPECÇÃO", "DATA CADASTRO")),
      },
    });
    stats.contacts++;
  }

  // BASE ATIVOS + Respostas
  for (const [sheet, program] of [
    ["BASE ATIVOS OAB", "OAB"],
    ["BASE ATIVOS ECJ", "ECJ"],
    ["Respostas OAB", "OAB"],
    ["Respostas ECJ", "ECJ"],
  ] as const) {
    for (const row of sheetRows(wb, sheet)) {
      const isRespostas = sheet.startsWith("Respostas");
      if (isRespostas) {
        const sheetRow: Record<string, string> = {};
        for (const [k, v] of Object.entries(row)) {
          sheetRow[k] = String(v ?? "");
        }
        const parsed = parseRespostasSheetRow(sheetRow, program);
        if (!parsed) continue;
        await upsertAmbassadorFromRespostas(parsed, {
          source: "import",
          respostasSheetName: sheet,
          markNeedsReview: parsed.status === "Pendente",
        });
        stats.ambassadors++;
        continue;
      }
      const amb = await upsertAmbassador(program, row, {
        status: sheet.startsWith("BASE") ? "Ativo" : "Pendente",
        fromForm: false,
      });
      if (amb) stats.ambassadors++;
    }
  }

  // CONTROLE ENTREGAS
  for (const row of sheetRows(wb, "CONTROLE ENTREGAS")) {
    const monthRef = parseMonthRef(pick(row, "MÊS REFERÊNCIA"));
    const program = String(pick(row, "PROGRAMA") || "OAB");
    const ig = normalizeHandle(String(pick(row, "INSTAGRAM") || ""));
    if (!monthRef || !ig || ig === "@") continue;

    const amb = await prisma.ambassador.findUnique({
      where: { program_instagram: { program, instagram: ig } },
    });
    if (!amb) {
      const created = await upsertAmbassador(program, {
        NOME: pick(row, "NOME"),
        INSTAGRAM: ig,
        Status: "Ativo",
      });
      if (!created) continue;
    }
    const ambassadorId = (amb || (await prisma.ambassador.findUnique({
      where: { program_instagram: { program, instagram: ig } },
    })))!.id;

    await prisma.monthlyControl.upsert({
      where: { ambassadorId_monthRef: { ambassadorId, monthRef } },
      create: {
        ambassadorId,
        monthRef,
        pctDelivered: parseNumber(pick(row, "% ENTREGAS")) ?? 0,
        proofsLink: String(pick(row, "LINK PUBLICAÇÕES") || "") || null,
        metaFeed: parseNumber(pick(row, "META FEED/REELS")) ?? 0,
        deliveredFeed: parseNumber(pick(row, "ENTREGAS FEED/REELS")) ?? 0,
        statusFeed: String(pick(row, "STATUS FEED/REELS") || "") || null,
        metaTiktok: parseNumber(pick(row, "META TIKTOK")) ?? 0,
        deliveredTiktok: parseNumber(pick(row, "ENTREGAS TIKTOK")) ?? 0,
        statusTiktok: String(pick(row, "STATUS TIKTOK") || "") || null,
        metaYoutube: parseNumber(pick(row, "META YOUTUBE")) ?? 0,
        deliveredYoutube: parseNumber(pick(row, "ENTREGAS YOUTUBE")) ?? 0,
        statusYoutube: String(pick(row, "STATUS YOUTUBE") || "") || null,
        metaStories: parseNumber(pick(row, "META STORIES")) ?? 0,
        deliveredStories: parseNumber(pick(row, "ENTREGAS STORIES")) ?? 0,
        statusStories: String(pick(row, "STATUS STORIES") || "") || null,
        metaLocked: parseBool(pick(row, "META TRAVADA?")),
      },
      update: {},
    });
    stats.controls++;
  }

  // FINANCEIRO
  for (const row of sheetRows(wb, "FINANCEIRO")) {
    const monthRef = parseMonthRef(pick(row, "MÊS REFERÊNCIA"));
    const program = String(pick(row, "PROGRAMA") || "OAB");
    const ig = normalizeHandle(String(pick(row, "INSTAGRAM") || ""));
    if (!monthRef || !ig || ig === "@") continue;

    let amb = await prisma.ambassador.findUnique({
      where: { program_instagram: { program, instagram: ig } },
    });
    if (!amb) {
      amb = await upsertAmbassador(program, { NOME: pick(row, "NOME"), INSTAGRAM: ig, Status: "Ativo" });
    }
    if (!amb) continue;

    await prisma.monthlyFinance.upsert({
      where: { ambassadorId_monthRef: { ambassadorId: amb.id, monthRef } },
      create: {
        ambassadorId: amb.id,
        monthRef,
        paymentStatus: String(pick(row, "STATUS PAGAMENTO") || "Pendente"),
        pctDelivered: parseNumber(pick(row, "% ENTREGAS")) ?? 0,
        agreedValue: parseNumber(pick(row, "VALOR ACORDADO")),
        valueLocked: parseBool(pick(row, "VALOR ACORDADO TRAVADO?")),
        amountDue: parseNumber(pick(row, "VALOR A PAGAR")),
        termLink: String(pick(row, "LINK TERMO") || "") || null,
        termSigned: parseBool(pick(row, "TERMO ASSINADO?")),
        signedTermLink: String(pick(row, "LINK TERMO ASSINADO") || "") || null,
        termSentAt: parseDate(pick(row, "DATA ENVIO TERMO")),
        closingSentAt: parseDate(pick(row, "DATA ENVIO FECHAMENTO")),
        financeFormOk: parseBool(pick(row, "FORM FINANCEIRO OK?")),
        paymentSent: parseBool(pick(row, "PGTO ENVIADO?")),
        financeSentAt: parseDate(pick(row, "DATA ENVIO FINANCEIRO")),
        gmailThreadId: String(pick(row, "Gmail Thread ID") || "") || null,
        log: String(pick(row, "LOG") || "") || null,
      },
      update: {},
    });
    stats.finances++;
  }

  // ENTREGAS
  for (const row of sheetRows(wb, "ENTREGAS")) {
    const program = String(pick(row, "Programa") || "");
    const ig = normalizeHandle(String(pick(row, "Seu Instagram (@)") || ""));
    let ambassadorId: string | undefined;
    if (program && ig && ig !== "@") {
      const amb = await prisma.ambassador.findUnique({
        where: { program_instagram: { program, instagram: ig } },
      });
      ambassadorId = amb?.id;
    }
    await prisma.delivery.create({
      data: {
        ambassadorId,
        program: program || null,
        instagram: ig || null,
        fullName: String(pick(row, "Seu nome completo") || "") || null,
        email: String(pick(row, "Seu e-mail", "Endereço de e-mail") || "") || null,
        deliveryType: String(pick(row, "Tipo de entrega") || "") || null,
        postedAt: parseDate(pick(row, "Data da postagem")),
        submittedAt: parseDate(pick(row, "Carimbo de data/hora")) || new Date(),
        postLink: String(pick(row, "Link da postagem") || "") || null,
        printUrl: String(pick(row, "Print da postagem") || "") || null,
        storiesPrintUrl: String(pick(row, "Print (Stories)") || "") || null,
        videoLink: String(pick(row, "Link do vídeo") || "") || null,
        campaignName: String(pick(row, "Esta entrega faz parte de alguma campanha?") || "") || null,
        driveStatus: String(pick(row, "Drive status") || "") || null,
        driveOrganizedIn: String(pick(row, "Drive organizado em") || "") || null,
        campaignDriveStatus: String(pick(row, "Campanha Drive status") || "") || null,
      },
    });
    stats.deliveries++;
  }

  // CAMPANHAS
  for (const row of sheetRows(wb, "CAMPANHAS")) {
    const name = String(pick(row, "NOME") || "").trim();
    if (!name) continue;
    await prisma.campaign.upsert({
      where: { name },
      create: {
        name,
        status: String(pick(row, "STATUS") || "Inativa"),
        program: String(pick(row, "VERTICAL", "PROGRAMA") || "") || null,
        driveFolderUrl: String(pick(row, "LINK PASTA") || "") || null,
        formLabel: name,
      },
      update: {
        status: String(pick(row, "STATUS") || "Inativa"),
        program: String(pick(row, "VERTICAL", "PROGRAMA") || "") || undefined,
        driveFolderUrl: String(pick(row, "LINK PASTA") || "") || null,
      },
    });
    stats.campaigns++;
  }

  await prisma.appSetting.upsert({
    where: { key: "migration_date" },
    create: { key: "migration_date", value: new Date().toISOString() },
    update: { value: new Date().toISOString() },
  });

  console.log("Import concluído:", stats);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
