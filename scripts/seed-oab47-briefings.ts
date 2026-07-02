/**
 * Configura briefing OAB 47 para Desesperados — Catarina.
 * Uso: npx tsx --env-file=.env scripts/seed-oab47-briefings.ts
 */
import { syncCollabDrive } from "../src/lib/campaign-collab-drive";
import { upsertCampaignCollab } from "../src/lib/campaign-collab";
import { syncOab47BriefingContent, ambassadorBriefingUrl } from "../src/lib/collab-briefing";
import { shareRequestFolderWithAmbassador } from "../src/lib/collab-request-drive";
import { prisma } from "../src/lib/prisma";

const CAMPAIGN_NAME = "Oab 47 para Desesperados";
const CATARINA_IG = "catarina_mvogmann";

async function main() {
  const campaign = await prisma.campaign.findFirst({
    where: { name: CAMPAIGN_NAME },
  });
  if (!campaign) {
    console.error(`Campanha "${CAMPAIGN_NAME}" não encontrada`);
    process.exit(1);
  }

  const catarina = await prisma.ambassador.findFirst({
    where: { instagram: { contains: CATARINA_IG } },
  });
  if (!catarina) {
    console.error(`Embaixadora @${CATARINA_IG} não encontrada`);
    process.exit(1);
  }

  console.log("Configurando collab…");
  await upsertCampaignCollab(campaign.id, {
    videoUrl: "https://www.instagram.com/catarina_mvogmann",
    title: "OAB 47 para Desesperados",
    driveFolderName: "OAB 47 para Desesperados",
    ambassadorIds: [catarina.id],
  });

  console.log("Sync Drive…");
  await syncCollabDrive(campaign.id);

  console.log("Seed briefing…");
  const count = await syncOab47BriefingContent(campaign.id);
  console.log(`Briefings criados/atualizados: ${count}`);

  const assignment = await prisma.campaignCollabAssignment.findFirst({
    where: {
      collab: { campaignId: campaign.id },
      ambassadorId: catarina.id,
    },
    include: { requests: { where: { sortOrder: 1 } } },
  });

  const request = assignment?.requests[0];
  if (request) {
    console.log("Compartilhando pasta (Pedido 1)…");
    const share = await shareRequestFolderWithAmbassador(request.id);
    console.log(JSON.stringify(share, null, 2));
  }

  if (assignment?.publicSlug) {
    console.log("\nLink público:");
    console.log(`  http://localhost:3000/p/${assignment.publicSlug}`);
    console.log(`  https://est-super-gestao.vercel.app/p/${assignment.publicSlug}`);
    console.log(`  ${ambassadorBriefingUrl(assignment.publicSlug, "https://est-super-gestao.vercel.app")}`);
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
