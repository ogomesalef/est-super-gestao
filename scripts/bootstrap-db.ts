/**
 * Cria usuários padrão (admin + chefe) no banco remoto ou local.
 * Uso: npm run db:bootstrap
 */
import { ensureDefaultUsers } from "../src/lib/auth";

async function main() {
  await ensureDefaultUsers();
  console.log("Usuários padrão prontos.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
