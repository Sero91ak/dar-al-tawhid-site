#!/usr/bin/env bash
# Only restores the explicitly pinned, previously used native SDK.
set -euo pipefail
VENDOR="ios/DarAlTawhid/Vendor/OneSignal"
mkdir -p "$VENDOR"
COMPLETE=true
for name in OneSignalFramework OneSignalUser OneSignalNotifications OneSignalLiveActivities OneSignalExtension OneSignalOutcomes OneSignalOSCore OneSignalCore; do
  [[ -f "$VENDOR/$name.xcframework/Info.plist" ]] || COMPLETE=false
done
if [[ "$COMPLETE" == true ]]; then
  echo "Original OneSignal-Vendor-Bibliotheken gefunden; keine Änderung."
  exit 0
fi
if [[ ! "$SDK_VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "::error::Acht OneSignal-XCFrameworks fehlen. Bitte die GENAU bisherige iOS-OneSignal-SDK-Version in GitHub Variable DAR_IOS_ONESIGNAL_SDK_VERSION eintragen. Kein stiller SDK-Wechsel."
  exit 1
fi
PACKAGE="$RUNNER_TEMP/Dar-OneSignal-Package.swift"
curl -fLsS --retry 3 --connect-timeout 20 --max-time 90 \
  "https://raw.githubusercontent.com/OneSignal/OneSignal-XCFramework/$SDK_VERSION/Package.swift" -o "$PACKAGE"
for name in OneSignalFramework OneSignalUser OneSignalNotifications OneSignalLiveActivities OneSignalExtension OneSignalOutcomes OneSignalOSCore OneSignalCore; do
  checksum="$(python3 - "$PACKAGE" "$name" "$SDK_VERSION" <<'PY'
import re, sys
with open(sys.argv[1], encoding="utf-8") as f:
    package = f.read()
name, version = sys.argv[2], sys.argv[3]
pattern = r'\.binaryTarget\(\s*name:\s*"' + re.escape(name) + r'",\s*url:\s*"([^"]+)",\s*checksum:\s*"([A-Fa-f0-9]{64})"'
target = re.search(pattern, package, re.S)
if target is None:
    raise SystemExit("Missing official OneSignal binary checksum for " + name)
url = "https://github.com/OneSignal/OneSignal-iOS-SDK/releases/download/" + version + "/" + name + ".xcframework.zip"
if target.group(1) != url:
    raise SystemExit("Unexpected SDK URL for " + name)
print(target.group(2).lower())
PY
)"
  ZIP="$RUNNER_TEMP/$name.xcframework.zip"
  url="https://github.com/OneSignal/OneSignal-iOS-SDK/releases/download/$SDK_VERSION/$name.xcframework.zip"
  curl -fLsS --retry 3 --connect-timeout 20 --max-time 180 "$url" -o "$ZIP"
  printf '%s  %s\n' "$checksum" "$ZIP" | shasum -a 256 -c -
  unzip -oq "$ZIP" -d "$VENDOR"
  test -f "$VENDOR/$name.xcframework/Info.plist"
done
echo "Originalfreigegebene OneSignal-Version $SDK_VERSION mit Upstream-SHA256-Werten geprüft."
