/**
 * Busca foto no Instagram (local) e grava URL no Turso para produção.
 * Uso: npx tsx --env-file=.env scripts/seed-instagram-avatars.ts [handle...]
 */
import { fetchInstagramProfilePic } from "../src/lib/instagram-avatar";
import { saveInstagramProfilePicCache } from "../src/lib/instagram-avatar-cache";
import { prisma } from "../src/lib/prisma";

async function main() {
  const handles = process.argv.slice(2).length
    ? process.argv.slice(2)
    : ["magisnameta", "vou.serjuiza", "faverimatheus.adv"];

  for (const handle of handles) {
    const url = await fetchInstagramProfilePic(handle);
    if (!url) {
      console.error(`❌ ${handle}: não encontrada`);
      continue;
    }
    await saveInstagramProfilePicCache(handle, url);
    console.log(`✓ ${handle}`);
    console.log(`  ${url.slice(0, 80)}…`);
  }

  await prisma.$disconnect();
}

main();
