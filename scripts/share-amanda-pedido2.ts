/**
 * Compartilha pasta Pedido 2 da Amanda com editor.
 * Uso: npx tsx --env-file=.env scripts/share-amanda-pedido2.ts
 */
import { prisma } from "../src/lib/prisma";
import { sharePedido2FolderWithAmbassador } from "../src/lib/collab-request-drive";

async function main() {
  const assignment = await prisma.campaignCollabAssignment.findFirst({
    where: { publicSlug: "magisnameta" },
    include: { requests: { where: { sortOrder: 2 } } },
  });
  const request = assignment?.requests[0];
  if (!request) {
    console.error("Pedido 2 da Amanda não encontrado");
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
