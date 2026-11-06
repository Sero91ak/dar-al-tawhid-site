#!/bin/bash
# TAWḤĪD KIDS NEXT: create isolated Xcode project + test available simulators.
# No signing, App Store, Cloudflare deployment, live writes, ElevenLabs, or paid API calls.
set -Eeuo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
cd "$HERE"
mkdir -p .qa
echo "TAWḤĪD KIDS NEXT · NUR SIMULATOR / keine Live-Veröffentlichung"
bash "$HERE/PRE-FLIGHT.command"
# Existing generated project may contain uncommitted Xcode restoration work.
# Preserve it before XcodeGen regenerates the project, even though it is git-ignored.
if [ -d "TawhidKidsNext.xcodeproj" ]; then
  BACKUP=".qa/TawhidKidsNext.xcodeproj.backup.$(date +%Y%m%d-%H%M%S)"
  cp -R "TawhidKidsNext.xcodeproj" "$BACKUP"
  echo "Existing generated simulator project secured: $BACKUP"
fi

if [ "$(uname -s)" != "Darwin" ]; then
  echo "STOP: Xcode und iOS Simulator benötigen einen Mac."
  exit 1
fi
if ! command -v xcodebuild >/dev/null 2>&1; then
  echo "STOP: Xcode/Command Line Tools fehlen. Xcode 27.1 oder neuer installieren und auswählen."
  exit 1
fi
xcodebuild -version | tee .qa/xcode-version.txt
if ! command -v xcodegen >/dev/null 2>&1; then
  if command -v brew >/dev/null 2>&1; then
    echo "XcodeGen fehlt. Installiere die kostenlose lokale Projektgenerator-Abhängigkeit ..."
    brew install xcodegen
  else
    echo "STOP: XcodeGen fehlt; ohne Homebrew bitte XcodeGen installieren und diesen Befehl erneut ausführen."
    exit 1
  fi
fi
xcodegen generate --spec project.yml
if [ ! -d "TawhidKidsNext.xcodeproj" ]; then
  echo "STOP: Simulator-Projekt konnte nicht erzeugt werden."
  exit 1
fi

xcrun simctl list devices available --json > .qa/available-devices.json
python3 - .qa/available-devices.json > .qa/device-matrix.txt <<'PY'
import json,sys
with open(sys.argv[1],encoding="utf-8") as f: data=json.load(f)
devices=[]
for runtime,arr in data.get("devices",{}).items():
    for d in arr:
        if d.get("isAvailable", True) and d.get("udid"):
            devices.append((runtime,d.get("name",""),d["udid"]))
devices.sort(reverse=True)
for label,selector in (
    ("Duo",lambda n:n=="iPhone Duo"),
    ("iPhone",lambda n:n.startswith("iPhone") and n!="iPhone Duo"),
    ("iPad",lambda n:n.startswith("iPad")),
):
    hit=next(((name,udid) for _,name,udid in devices if selector(name)),None)
    if hit:print("|".join([label,hit[0],hit[1]]))
PY

if [ ! -s .qa/device-matrix.txt ]; then
  echo "STOP: Keine verfügbaren iOS-Simulatoren. Xcode > Settings > Components prüfen."
  exit 1
fi

TOTAL=0
Duo=0
iPhone=0
iPad=0
BOOT_UDID=""
while IFS='|' read -r CATEGORY DEVICE_NAME UDID; do
  echo "Prüfe $CATEGORY · $DEVICE_NAME ($UDID)"
  xcodebuild test -project TawhidKidsNext.xcodeproj -scheme TawhidKidsNext \
    -configuration Debug -destination "platform=iOS Simulator,id=$UDID" \
    -derivedDataPath "$HERE/.qa/DerivedData" \
    CODE_SIGNING_ALLOWED=NO > ".qa/test-$CATEGORY.log" 2>&1 || {
      echo "STOP: $CATEGORY-Build/Tests fehlgeschlagen. Protokoll: .qa/test-$CATEGORY.log"
      tail -n 35 ".qa/test-$CATEGORY.log" || true
      exit 1
    }
  TOTAL=$((TOTAL+1))
  case "$CATEGORY" in
    Duo) Duo=1 ;;
    iPhone) iPhone=1 ;;
    iPad) iPad=1 ;;
  esac
  if [ -z "$BOOT_UDID" ] || [ "$CATEGORY" = "Duo" ]; then BOOT_UDID="$UDID"; fi
done < .qa/device-matrix.txt

APP="$HERE/.qa/DerivedData/Build/Products/Debug-iphonesimulator/TawhidKidsNext.app"
if [ ! -d "$APP" ]; then
  echo "STOP: Fertig gebautes Simulator-App-Bundle nicht gefunden: $APP"
  exit 1
fi

xcrun simctl boot "$BOOT_UDID" >/dev/null 2>&1 || true
xcrun simctl bootstatus "$BOOT_UDID" -b
xcrun simctl install "$BOOT_UDID" "$APP"
open -a Simulator
xcrun simctl launch "$BOOT_UDID" de.daraltawhid.kids.next.dev | tee .qa/launch.txt
xcrun simctl io "$BOOT_UDID" screenshot "$HERE/.qa/kids-next-initial-screen.png" >/dev/null 2>&1 || true

echo "TECHNISCHER SIMULATOR-STATUS: $TOTAL Gerätetyp(en) gebaut/getestet."
echo "GitHub-Daten und alle App Store-Besucherstände wurden nicht verändert."
echo "Vollständige inhaltliche/visuelle Parität und echte Hardware wurden damit NICHT nachgewiesen."
if [ "$Duo" -ne 1 ] || [ "$iPhone" -ne 1 ] || [ "$iPad" -ne 1 ]; then
  echo "QA UNVOLLSTÄNDIG: Für vollständige Simulator-Matrix fehlen Gerätetypen."
  echo "Bei iPhone Duo Xcode 27.1 + iOS 27.1 Runtime installieren."
  exit 2
fi
echo "TECHNISCHE SIMULATOR-MATRIX PASS; Paritäts-/Hardware-Freigabe weiter GESPERRT."
