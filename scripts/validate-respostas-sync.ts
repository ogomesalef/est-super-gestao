import { prisma } from "../src/lib/prisma";
import { parseApplicationFormData } from "../src/lib/respostas-row";
import { countFormFields } from "../src/lib/respostas-form-sections";
import { getCandidaturasSyncStatus } from "../src/lib/candidaturas-sync";

async function main() {
  const sync = await getCandidaturasSyncStatus();
  const ambassadors = await prisma.ambassador.findMany({
    select: {
      fullName: true,
      program: true,
      status: true,
      needsReview: true,
      applicationFormData: true,
      respostasSheetName: true,
      respostasSheetRow: true,
    },
  });

  const withForm = ambassadors.filter(
    (a) => countFormFields(parseApplicationFormData(a.applicationFormData) || {}) >= 10
  );
  const pendente = ambassadors.filter((a) => a.status === "Pendente");
  const pendenteSemForm = pendente.filter(
    (a) => countFormFields(parseApplicationFormData(a.applicationFormData) || {}) === 0
  );
  const needsReview = ambassadors.filter((a) => a.needsReview);

  console.log("=== Sync Respostas ===");
  console.log("Google Sheets configurado:", sync.configured);
  for (const s of sync.sheets) {
    console.log(
      `  ${s.sheetName}: linha ${s.lastRow}/${s.sheetLastRow}, pendentes sync: ${s.pendingRows}`
    );
  }

  console.log("\n=== Embaixadores ===");
  console.log("Total:", ambassadors.length);
  console.log("Com formulário (10+ campos):", withForm.length);
  console.log("Pendente:", pendente.length);
  console.log("Pendente sem formulário:", pendenteSemForm.length);
  console.log("needsReview:", needsReview.length);

  if (pendente.length > 0) {
    console.log("\nPendentes:");
    for (const p of pendente) {
      const n = countFormFields(parseApplicationFormData(p.applicationFormData) || {});
      console.log(
        `  - ${p.fullName} (${p.program}) · ${n} campos · needsReview=${p.needsReview ? "sim" : "não"}`
      );
    }
  }

  if (pendenteSemForm.length > 0) {
    console.error("\nERRO: candidatos Pendente sem formulário — rode npm run sync:respostas -- --full");
    process.exit(1);
  }

  if (withForm.length === 0) {
    console.error("\nERRO: nenhum embaixador com formulário importado");
    process.exit(1);
  }

  console.log("\nOK — sync e dados de candidatura válidos.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
