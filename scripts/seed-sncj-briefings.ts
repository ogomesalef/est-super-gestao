/**
 * Gera páginas de briefing SNCJ para embaixadores selecionados.
 * Uso: npx tsx --env-file=.env scripts/seed-sncj-briefings.ts
 */
import { syncCollabDrive } from "../src/lib/campaign-collab-drive";
import { syncBriefingContent, ambassadorBriefingUrl } from "../src/lib/collab-briefing";
import { prisma } from "../src/lib/prisma";

async function main() {
  const campaign = await prisma.campaign.findFirst({
    where: { name: { contains: "Semana Nacional" } },
  });
  if (!campaign) {
    console.error("Campanha SNCJ não encontrada");
    process.exit(1);
  }

  console.log("Sync Drive…");
  await syncCollabDrive(campaign.id);

  console.log("Seed briefings…");
  const count = await syncBriefingContent(campaign.id);
  console.log(`Briefings criados/atualizados: ${count}`);

  const collab = await prisma.campaignCollab.findUnique({
    where: { campaignId: campaign.id },
    include: {
      assignments: {
        include: { ambassador: true, requests: true },
      },
    },
  });

  console.log("\nLinks públicos (local: http://localhost:3000):");
  for (const a of collab!.assignments) {
    console.log(`\n${a.ambassador.fullName}`);
    console.log(`  http://localhost:3000/p/${a.publicSlug}`);
    console.log(`  Pedidos: ${a.requests.map((r) => `${r.title} (${r.status})`).join(" · ")}`);
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
