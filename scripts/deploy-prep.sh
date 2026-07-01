#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> Super Gestão — preparação de deploy"
echo ""

if ! command -v turso >/dev/null 2>&1; then
  echo "Turso CLI não encontrado. Instale:"
  echo "  curl -sSfL https://get.tur.so/install.sh | bash"
  echo ""
fi

if ! command -v vercel >/dev/null 2>&1; then
  echo "Vercel CLI não encontrado. Use:"
  echo "  npm i -g vercel"
  echo "  ou: npx vercel"
  echo ""
fi

echo "1) Criar banco Turso (se ainda não existir):"
echo "   turso auth login"
echo "   turso db create super-gestao"
echo "   turso db show super-gestao --url"
echo "   turso db tokens create super-gestao"
echo ""

echo "2) Aplicar schema no Turso:"
echo "   export DATABASE_URL=\"libsql://...\""
echo "   export DATABASE_AUTH_TOKEN=\"...\""
echo "   npm run db:push"
echo "   npm run db:bootstrap"
echo ""

echo "3) Importar planilha (uma vez):"
echo "   npm run import:xlsx -- \"/caminho/SUPER EMBAIXADORES ECJ + OAB.xlsx\""
echo ""

echo "4) Variáveis na Vercel (Settings → Environment Variables):"
echo "   DATABASE_URL, DATABASE_AUTH_TOKEN, AUTH_SECRET"
echo "   ADMIN_EMAIL, ADMIN_PASSWORD, EXECUTIVE_EMAIL, EXECUTIVE_PASSWORD"
echo "   APPS_SCRIPT_BRIDGE_URL, APPS_SCRIPT_SECRET, WEBHOOK_SECRET"
echo "   FINANCE_TEAM_EMAIL, FINANCE_CC_EMAIL"
echo ""

echo "5) Deploy:"
echo "   vercel --prod"
echo ""

if [[ -f "$ROOT/.env" ]]; then
  AUTH=$(grep -E '^AUTH_SECRET=' "$ROOT/.env" | cut -d= -f2- | tr -d '"' || true)
  if [[ "$AUTH" == "change-me-use-openssl-rand-base64-32" || -z "$AUTH" ]]; then
    NEW_SECRET=$(openssl rand -base64 32)
    echo "Sugestão AUTH_SECRET (copie para .env e Vercel):"
    echo "   AUTH_SECRET=\"$NEW_SECRET\""
    echo ""
  fi
fi

echo "Build local de produção:"
npm run build
echo ""
echo "OK — projeto pronto para deploy."
