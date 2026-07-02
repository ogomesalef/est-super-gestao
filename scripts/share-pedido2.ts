/**
 * Compartilha pasta Pedido 2 com editor para um embaixador.
 * Uso: npx tsx --env-file=.env scripts/share-pedido2.ts vou.serjuiza
 */
import { prisma } from "../src/lib/prisma";
import { sharePedido2FolderWithAmbassador } from "../src/lib/collab-request-drive";

async function main() {
  const slug = process.argv[2]?.trim();
  if (!slug) {
    console.error("Informe o slug público, ex.: vou.serjuiza");
    process.exit(1);
  }

  const assignment = await prisma.campaignCollabAssignment.findFirst({
    where: { publicSlug: slug },
    include: { requests: { where: { sortOrder: 2 } } },
  });
  const request = assignment?.requests[0];
  if (!request) {
    console.error(`Pedido 2 não encontrado para slug: ${slug}`);
    process.exit(1);
  }

  const result = await sharePedido2FolderWithAmbassador(request.id);
  console.log(JSON.stringify(result, null, 2));
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
