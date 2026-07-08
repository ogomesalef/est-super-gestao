/**
 * Cria pasta "Pedido 1 — Vídeo de collab" dentro da pasta de cada embaixador(a)
 * da SNCJ 2026, move e renomeia o vídeo solto para o padrão:
 *   Collab — {campanha} — {nome} (@handle).mp4
 *
 * Uso: npx tsx --env-file=.env scripts/organize-pedido1-videos.ts
 */
import { prisma } from "../src/lib/prisma";
import {
  withDriveToken,
  listChildFiles,
  createFolder,
  moveFile,
  renameFile,
  driveFileUrl,
  driveFolderUrl,
  extractFolderId,
} from "../src/lib/drive-client";
import { collabVideoFileName } from "../src/lib/campaign-collab-drive";

const PEDIDO1_FOLDER_NAME = "Pedido 1 — Vídeo de collab";

function isVideoFile(f: { name: string; mimeType?: string }): boolean {
  if (f.mimeType?.startsWith("video/")) return true;
  return /\.(mp4|mov|webm|m4v|avi|mkv)$/i.test(f.name);
}

function fileExtension(name: string): string {
  const m = name.match(/(\.[a-z0-9]{2,5})$/i);
  return m ? m[1].toLowerCase() : ".mp4";
}

async function main() {
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
    console.error("Campanha SNCJ não encontrada ou sem collab.");
    process.exit(1);
  }

  console.log(`Campanha: ${campaign.name}\n`);

  const results: Array<{
    name: string;
    oldName: string | null;
    newName: string;
    folderUrl: string;
    videoUrl: string;
  }> = [];

  await withDriveToken(async (token) => {
    for (const assignment of campaign.collab!.assignments) {
      const amb = assignment.ambassador;
      const pedido1Request = assignment.requests.find((r) => r.sortOrder === 1);

      console.log(`→ ${amb.fullName}`);

      const ambassadorFolderId = extractFolderId(assignment.driveFolderUrl);
      if (!ambassadorFolderId) {
        console.log(`  ⚠ Pasta do embaixador não configurada, pulando.\n`);
        continue;
      }

      // Lista arquivos diretos na pasta do embaixador (não entra em subpastas)
      const allFiles = await listChildFiles(token, ambassadorFolderId);
      const videos = allFiles.filter(
        (f) =>
          f.mimeType !== "application/vnd.google-apps.folder" &&
          isVideoFile(f)
      );

      if (videos.length === 0) {
        console.log(`  ⚠ Nenhum vídeo solto encontrado na pasta do embaixador.\n`);
        continue;
      }

      if (videos.length > 1) {
        console.log(`  ℹ ${videos.length} vídeos encontrados, usando o primeiro: ${videos[0].name}`);
      }

      const video = videos[0];
      const ext = fileExtension(video.name);
      const newName = collabVideoFileName(campaign.name, amb, ext);

      // Cria (ou encontra) a pasta Pedido 1
      const pedido1FolderId = await createFolder(token, ambassadorFolderId, PEDIDO1_FOLDER_NAME);
      console.log(`  Pasta Pedido 1: ${pedido1FolderId}`);

      // Renomeia o vídeo
      if (video.name !== newName) {
        console.log(`  Renomeando: "${video.name}" → "${newName}"`);
        await renameFile(token, video.id, newName);
      } else {
        console.log(`  (nome já correto)`);
      }

      // Move para dentro da pasta Pedido 1
      const oldParent = video.parents?.[0] || ambassadorFolderId;
      if (oldParent !== pedido1FolderId) {
        await moveFile(token, video.id, pedido1FolderId, oldParent);
        console.log(`  Movido para a pasta Pedido 1.`);
      }

      const videoUrl = driveFileUrl(video.id);
      const folderUrl = driveFolderUrl(pedido1FolderId);
      console.log(`  Link: ${videoUrl}\n`);

      // Atualiza banco: driveFolderUrl e completedVideoUrl no Pedido 1
      if (pedido1Request) {
        await prisma.campaignCollabRequest.update({
          where: { id: pedido1Request.id },
          data: {
            driveFolderUrl: folderUrl,
            completedVideoUrl: videoUrl,
          },
        });
      }

      results.push({
        name: amb.fullName,
        oldName: video.name !== newName ? video.name : null,
        newName,
        folderUrl,
        videoUrl,
      });
    }
  });

  console.log("=== Resumo ===");
  for (const r of results) {
    console.log(`\n${r.name}`);
    if (r.oldName) console.log(`  Antes:  ${r.oldName}`);
    console.log(`  Agora:  ${r.newName}`);
    console.log(`  Pasta:  ${r.folderUrl}`);
    console.log(`  Vídeo:  ${r.videoUrl}`);
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
