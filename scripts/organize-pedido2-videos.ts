/**
 * Renomeia vídeos nas pastas "Pedido 2" de embaixadoras específicas
 * para o padrão: Collab — {campanha} — {nome} (@handle).mp4
 *
 * Uso: npx tsx --env-file=.env scripts/organize-pedido2-videos.ts [filtro de nome]
 * Ex:  npx tsx --env-file=.env scripts/organize-pedido2-videos.ts amanda camila
 */
import { prisma } from "../src/lib/prisma";
import {
  withDriveToken,
  listChildFiles,
  findChildFolder,
  renameFile,
  driveFileUrl,
} from "../src/lib/drive-client";
import {
  collabVideoFileName,
  COLLAB_ROOT_FOLDER_ID,
} from "../src/lib/campaign-collab-drive";
import { normalizeHandle } from "../src/lib/utils";

const PEDIDO2_FOLDER_NAME = "Pedido 2 — Reels promocional";

function isVideoFile(f: { name: string; mimeType?: string }): boolean {
  if (f.mimeType?.startsWith("video/")) return true;
  return /\.(mp4|mov|webm|m4v|avi|mkv)$/i.test(f.name);
}

function fileExtension(name: string): string {
  const m = name.match(/(\.[a-z0-9]{2,5})$/i);
  return m ? m[1].toLowerCase() : ".mp4";
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

  console.log(`Campanha: ${campaign.name}`);

  const assignments = campaign.collab.assignments.filter((a) => {
    if (filters.length === 0) return true;
    const name = a.ambassador.fullName.toLowerCase();
    return filters.some((f) => name.includes(f));
  });

  if (assignments.length === 0) {
    console.error("Nenhuma embaixadora encontrada com os filtros:", filters);
    process.exit(1);
  }

  console.log(
    `Embaixadoras encontradas: ${assignments.map((a) => a.ambassador.fullName).join(", ")}\n`
  );

  const results: Array<{
    name: string;
    handle: string;
    oldName: string | null;
    newName: string;
    url: string;
  }> = [];

  await withDriveToken(async (token) => {
    for (const assignment of assignments) {
      const amb = assignment.ambassador;
      const handle = normalizeHandle(amb.instagram);
      console.log(`→ ${amb.fullName} (${handle})`);

      let ambassadorFolderId: string | null = null;

      if (assignment.driveFolderUrl) {
        const m = assignment.driveFolderUrl.match(/\/folders\/([^/?]+)/);
        ambassadorFolderId = m?.[1] ?? null;
      }

      if (!ambassadorFolderId) {
        console.log(`  ⚠ Pasta do embaixador não configurada, pulando.`);
        continue;
      }

      const pedido2Id = await findChildFolder(
        token,
        ambassadorFolderId,
        PEDIDO2_FOLDER_NAME
      );

      if (!pedido2Id) {
        console.log(
          `  ⚠ Pasta "${PEDIDO2_FOLDER_NAME}" não encontrada, pulando.`
        );
        continue;
      }

      console.log(`  Pasta Pedido 2: ${pedido2Id}`);

      const files = await listChildFiles(token, pedido2Id);
      const videos = files.filter(isVideoFile);

      if (videos.length === 0) {
        console.log(`  ⚠ Nenhum vídeo encontrado na pasta Pedido 2.`);
        continue;
      }

      if (videos.length > 1) {
        console.log(
          `  ℹ ${videos.length} vídeos encontrados, renomeando o mais recente: ${videos[0].name}`
        );
      }

      const video = videos[0];
      const ext = fileExtension(video.name);
      const newName = collabVideoFileName(campaign.name, amb, ext);

      console.log(`  Renomeando: "${video.name}" → "${newName}"`);

      if (video.name !== newName) {
        await renameFile(token, video.id, newName);
      } else {
        console.log(`  (já está com o nome correto)`);
      }

      const url = driveFileUrl(video.id);

      await prisma.campaignCollabAssignment.update({
        where: { id: assignment.id },
        data: { driveVideoUrl: url },
      });

      results.push({
        name: amb.fullName,
        handle,
        oldName: video.name !== newName ? video.name : null,
        newName,
        url,
      });

      console.log(`  Link: ${url}\n`);
    }
  });

  console.log("\n=== Resumo ===");
  for (const r of results) {
    console.log(`\n${r.name} (${r.handle})`);
    if (r.oldName) console.log(`  Antes: ${r.oldName}`);
    console.log(`  Agora: ${r.newName}`);
    console.log(`  Link:  ${r.url}`);
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
