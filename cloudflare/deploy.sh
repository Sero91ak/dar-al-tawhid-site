#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

echo "→ Deploy: dar-admin-publisher"
echo "→ Repo: Sero91ak/dar-al-tawhid-site"

if ! command -v wrangler >/dev/null 2>&1; then
  echo "Wrangler nicht gefunden. Installiere mit: npm install -g wrangler"
  exit 1
fi

if ! wrangler whoami >/dev/null 2>&1; then
  echo "Bitte zuerst anmelden: wrangler login"
  exit 1
fi

echo "→ Cloudflare-Konto:"
wrangler whoami

echo ""
echo "Hinweis: Secrets nur beim ersten Mal nötig:"
echo "  wrangler secret put GITHUB_TOKEN"
echo "  wrangler secret put ADMIN_PUBLISH_SECRET"
echo ""

wrangler deploy

echo ""
echo "✓ Fertig. Health prüfen:"
echo "  curl https://dar-admin-publisher.sero91ak.workers.dev/health"
