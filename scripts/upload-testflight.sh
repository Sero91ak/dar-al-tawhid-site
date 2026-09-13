#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ -f "$HOME/.appstoreconnect/asc.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "$HOME/.appstoreconnect/asc.env"
  set +a
fi

: "${ASC_KEY_ID:?ASC_KEY_ID missing}"
: "${ASC_ISSUER_ID:?ASC_ISSUER_ID missing}"

KEY_FILE="${ASC_KEY_PATH:-$HOME/.appstoreconnect/private_keys/AuthKey_${ASC_KEY_ID}.p8}"
[[ -f "$KEY_FILE" ]] || { echo "API key not found: $KEY_FILE" >&2; exit 1; }

BUILD="${1:-60}"
VERSION="${2:-1.0.3}"
ARCHIVE="${TMPDIR:-/tmp}/DarAlTawhid-build${BUILD}.xcarchive"
EXPORT="${TMPDIR:-/tmp}/DarAlTawhid-upload${BUILD}"

echo "==> Archive Build ${BUILD} (${VERSION})"
rm -rf "$ARCHIVE" "$EXPORT"
xcodebuild \
  -project DarAlTawhid.xcodeproj \
  -scheme DarAlTawhid \
  -destination 'generic/platform=iOS' \
  -configuration Release \
  -archivePath "$ARCHIVE" \
  DEVELOPMENT_TEAM="${ASC_TEAM_ID:-ALVZ35NL2N}" \
  CURRENT_PROJECT_VERSION="$BUILD" \
  MARKETING_VERSION="$VERSION" \
  archive

echo "==> Verify embedded extensions"
ls "$ARCHIVE/Products/Applications/DarAlTawhid.app/PlugIns/"

echo "==> Upload to TestFlight"
xcodebuild \
  -exportArchive \
  -archivePath "$ARCHIVE" \
  -exportPath "$EXPORT" \
  -exportOptionsPlist ExportOptions-upload.plist \
  -allowProvisioningUpdates \
  -authenticationKeyPath "$KEY_FILE" \
  -authenticationKeyID "$ASC_KEY_ID" \
  -authenticationKeyIssuerID "$ASC_ISSUER_ID"

echo "==> Done. Build ${BUILD} (${VERSION}) uploaded."
