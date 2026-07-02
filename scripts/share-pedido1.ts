/**
 * Compartilha pasta do Pedido 1 com editor para um embaixador.
 * Uso: npx tsx --env-file=.env scripts/share-pedido1.ts catarina_mvogmann
 */
import { prisma } from "../src/lib/prisma";
import { shareRequestFolderWithAmbassador } from "../src/lib/collab-request-drive";

async function main() {
  const slug = process.argv[2]?.trim();
  if (!slug) {
    console.error("Informe o slug público, ex.: catarina_mvogmann");
    process.exit(1);
  }

  const assignment = await prisma.campaignCollabAssignment.findFirst({
    where: { publicSlug: slug },
    include: { requests: { where: { sortOrder: 1 } } },
  });
  const request = assignment?.requests[0];
  if (!request) {
    console.error(`Pedido 1 não encontrado para slug: ${slug}`);
    process.exit(1);
  }

  const result = await shareRequestFolderWithAmbassador(request.id);
  console.log(JSON.stringify(result, null, 2));
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
