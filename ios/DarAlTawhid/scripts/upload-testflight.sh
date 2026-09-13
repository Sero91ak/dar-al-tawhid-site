#!/bin/zsh
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="${ASC_ENV_FILE:-$HOME/.appstoreconnect/asc.env}"
if [[ -f "$ENV_FILE" ]]; then
  set -a
  source "$ENV_FILE"
  set +a
fi
KEY_ID="${ASC_KEY_ID:-7292JUQ8TY}"
ISSUER="${ASC_ISSUER_ID:-}"
TEAM="${ASC_TEAM_ID:-ALVZ35NL2N}"
ARCHIVE="${1:-$HOME/Library/Developer/Xcode/Archives/$(date +%Y-%m-%d)/DarAlTawhid-54.xcarchive}"
if [[ -z "$ISSUER" ]]; then
  echo "ASC_ISSUER_ID fehlt. In App Store Connect: Nutzer und Zugriff → Integrationen → App Store Connect API → Issuer ID (UUID) nach $ENV_FILE schreiben."
  exit 2
fi
EXPORT="$ROOT/build/testflight-export"
mkdir -p "$EXPORT"
PLIST="$ROOT/ExportOptions.plist"
xcodebuild -exportArchive \
  -archivePath "$ARCHIVE" \
  -exportOptionsPlist "$PLIST" \
  -exportPath "$EXPORT" \
  -allowProvisioningUpdates \
  -authenticationKeyPath "$HOME/.appstoreconnect/private_keys/AuthKey_${KEY_ID}.p8" \
  -authenticationKeyID "$KEY_ID" \
  -authenticationKeyIssuerID "$ISSUER"
echo "Upload-Versuch beendet. Team $TEAM"
