/**
 * Marca Pedido 2 como concluído quando há vídeo na pasta correspondente.
 * Uso: npx tsx --env-file=.env scripts/complete-pedido2-requests.ts [filtro de nome]
 */
import { prisma } from "../src/lib/prisma";
import {
  withDriveToken,
  listChildFiles,
  findChildFolder,
  driveFileUrl,
  extractFolderId,
} from "../src/lib/drive-client";
import { PEDIDO2_FOLDER_NAME } from "../src/lib/collab-request-drive";

function isVideoFile(f: { name: string; mimeType?: string }): boolean {
  if (f.mimeType?.startsWith("video/")) return true;
  return /\.(mp4|mov|webm|m4v|avi|mkv)$/i.test(f.name);
}

async function main() {
  const filters = process.argv.slice(2).map((s) => s.toLowerCase());

  const campaign = await prisma.campaign.findFirst({
    where: { name: { contains: "Semana Nacional" } },
    include: {
      collab: {
        include: {
          assignments: {
            include: {
              ambassador: true,
              requests: { orderBy: { sortOrder: "asc" } },
            },
          },
        },
      },
    },
  });

  if (!campaign?.collab) {
    console.error("Campanha SNCJ não encontrada.");
    process.exit(1);
  }

  const assignments = campaign.collab.assignments.filter((a) => {
    if (filters.length === 0) return true;
    return filters.some((f) => a.ambassador.fullName.toLowerCase().includes(f));
  });

  await withDriveToken(async (token) => {
    for (const assignment of assignments) {
      const pedido2 = assignment.requests.find((r) => r.sortOrder === 2);
      if (!pedido2) {
        console.log(`→ ${assignment.ambassador.fullName}: Pedido 2 não encontrado`);
        continue;
      }

      if (pedido2.status === "completed") {
        console.log(`→ ${assignment.ambassador.fullName}: já concluído`);
        continue;
      }

      const ambassadorFolderId = extractFolderId(assignment.driveFolderUrl);
      if (!ambassadorFolderId) {
        console.log(`→ ${assignment.ambassador.fullName}: sem pasta no Drive`);
        continue;
      }

      const pedido2FolderId =
        extractFolderId(pedido2.driveFolderUrl) ??
        (await findChildFolder(token, ambassadorFolderId, PEDIDO2_FOLDER_NAME));

      if (!pedido2FolderId) {
        console.log(`→ ${assignment.ambassador.fullName}: pasta Pedido 2 não encontrada`);
        continue;
      }

      const files = await listChildFiles(token, pedido2FolderId);
      const video = files.find(isVideoFile);
      if (!video) {
        console.log(`→ ${assignment.ambassador.fullName}: nenhum vídeo na pasta Pedido 2`);
        continue;
      }

      const videoUrl = driveFileUrl(video.id);

      await prisma.campaignCollabRequest.update({
        where: { id: pedido2.id },
        data: {
          status: "completed",
          completedVideoUrl: videoUrl,
          driveFolderUrl: pedido2.driveFolderUrl ?? `https://drive.google.com/drive/folders/${pedido2FolderId}`,
        },
      });

      console.log(`→ ${assignment.ambassador.fullName}: Pedido 2 concluído ✓`);
      console.log(`  Vídeo: ${videoUrl}`);
    }
  });

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
