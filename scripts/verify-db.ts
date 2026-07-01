/**
 * Verifica conexão Turso + contagem de dados.
 * Uso: npm run verify
 */
import { prisma } from "../src/lib/prisma";

async function main() {
  const [contacts, ambassadors, deliveries] = await Promise.all([
    prisma.contact.count(),
    prisma.ambassador.count(),
    prisma.delivery.count(),
  ]);

  console.log("OK — banco conectado");
  console.log({ contacts, ambassadors, deliveries });
  console.log("DATABASE:", process.env.DATABASE_URL?.slice(0, 40) + "...");
}

main()
  .catch((e) => {
    console.error("FALHA:", e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
