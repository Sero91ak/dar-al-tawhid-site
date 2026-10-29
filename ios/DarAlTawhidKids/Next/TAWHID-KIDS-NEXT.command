#!/bin/bash
# Build and launch TAWḤĪD KIDS NEXT from the shared Kids Xcode workspace.
# Run the isolated NEXT tests, then install/launch on an available iPhone simulator.
set -Eeuo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$HERE/../../.." && pwd)"
WORKSPACE="$ROOT/ios/DarAlTawhidKids/DarAlTawhidKids.xcworkspace"
SCHEME="TawhidKidsNext"
OUT="$HERE/.qa/integrated-run"
mkdir -p "$OUT"
PREFLIGHT="$HERE/.qa/launcher-preflight.log"
if ! bash "$HERE/PRE-FLIGHT.command" > "$PREFLIGHT" 2>&1; then
  cat "$PREFLIGHT"
  echo "STOP: Recovery preflight fehlgeschlagen."
  exit 1
fi
cat "$PREFLIGHT"

bounded() {
  local seconds="$1"
  shift
  python3 - "$seconds" "$@" <<'PY'
import subprocess, sys
seconds = float(sys.argv[1])
command = sys.argv[2:]
try:
    result = subprocess.run(command, capture_output=True, text=True, timeout=seconds)
except subprocess.TimeoutExpired as error:
    for output in (error.stdout, error.stderr):
        if output:
            print(output.decode() if isinstance(output, bytes) else output, end="")
    print(f"STOP: nach {seconds:g}s keine Antwort: {' '.join(command)}", file=sys.stderr)
    raise SystemExit(124)
if result.stdout:
    print(result.stdout, end="")
if result.stderr:
    print(result.stderr, end="", file=sys.stderr)
raise SystemExit(result.returncode)
PY
}

if [ "$(uname -s)" != "Darwin" ] || ! command -v xcodebuild >/dev/null 2>&1; then
  echo "STOP: Ein vollständiges Xcode auf macOS ist erforderlich."
  exit 1
fi
if [ ! -d "$WORKSPACE" ]; then
  echo "STOP: Gemeinsamer Kids-Xcode-Workspace fehlt: $WORKSPACE"
  exit 1
fi

if ! command -v xcodegen >/dev/null 2>&1; then
  echo "STOP: xcodegen fehlt. Installiere XcodeGen über die projektübliche Paketverwaltung und starte erneut."
  exit 1
fi
if [ -d "$HERE/TawhidKidsNext.xcodeproj" ]; then
  BACKUP="$OUT/TawhidKidsNext.xcodeproj.before-launcher-$(date '+%Y%m%d-%H%M%S')"
  ditto "$HERE/TawhidKidsNext.xcodeproj" "$BACKUP"
  echo "Vorheriges generiertes Projekt gesichert: $BACKUP"
fi
xcodegen generate --spec "$HERE/project.yml"

open -a Xcode "$WORKSPACE"
xcodebuild -workspace "$WORKSPACE" -list -json > "$OUT/project-list.json"
python3 - "$OUT/project-list.json" "$SCHEME" <<'PY'
import json, sys
with open(sys.argv[1], encoding="utf-8") as source:
    workspace = json.load(source)["workspace"]
if sys.argv[2] not in workspace.get("schemes", []):
    raise SystemExit(f"STOP: Scheme {sys.argv[2]} ist im Kids-Workspace {workspace['name']} nicht verfügbar.")
print(f"Kids-Workspace {workspace['name']} enthält Scheme {sys.argv[2]}.")
PY

xcrun simctl list devices available --json > "$OUT/devices.json"
UDID="$(python3 - "$OUT/devices.json" <<'PY'
import json, sys
with open(sys.argv[1], encoding="utf-8") as source:
    data = json.load(source)
devices = [d for group in data.get("devices", {}).values() for d in group
           if d.get("isAvailable", True) and d.get("udid") and d.get("name", "").startswith("iPhone")]
booted = [d for d in devices if d.get("state") == "Booted"]
duo = next((d for d in (booted or devices) if d.get("name") == "iPhone Duo"), None)
chosen = duo or next(iter(booted or devices), None)
if not chosen:
    raise SystemExit("STOP: Kein verfügbarer iPhone-Simulator gefunden.")
print(chosen["udid"])
PY
)"

if ! xcrun simctl list devices booted | grep -Fq "$UDID"; then
  echo "Starte Simulator $UDID ohne Zurücksetzen ..."
  bounded 60 xcrun simctl boot "$UDID"
fi
bounded 180 xcrun simctl bootstatus "$UDID" -b

xcodebuild -workspace "$WORKSPACE" -scheme "$SCHEME" -configuration Debug \
  -destination "platform=iOS Simulator,id=$UDID" \
  -derivedDataPath "$OUT/DerivedData" CODE_SIGNING_ALLOWED=NO build \
  > "$OUT/build.log" 2>&1 || {
    echo "STOP: Build fehlgeschlagen. Letzte Build-Zeilen:"
    tail -n 50 "$OUT/build.log" || true
    exit 1
  }
xcodebuild -workspace "$WORKSPACE" -scheme "$SCHEME" -configuration Debug \
  -destination "platform=iOS Simulator,id=$UDID" \
  -derivedDataPath "$OUT/DerivedData" CODE_SIGNING_ALLOWED=NO test \
  > "$OUT/test.log" 2>&1 || {
    echo "STOP: NEXT-Tests fehlgeschlagen. Letzte Test-Zeilen:"
    tail -n 70 "$OUT/test.log" || true
    exit 1
  }
APP="$OUT/DerivedData/Build/Products/Debug-iphonesimulator/TawhidKidsNext.app"
if ! open -a /Applications/Xcode.app/Contents/Applications/DeviceHub.app --args -CurrentDeviceUDID "$UDID"; then
  echo "WARN: Device Hub ließ sich nicht erneut per Launch Services aktivieren; Installation und Appstart auf $UDID laufen weiter."
fi
bounded 90 xcrun simctl install "$UDID" "$APP"
bounded 60 xcrun simctl launch "$UDID" de.daraltawhid.kids.next.dev | tee "$OUT/launch.log"
echo "Build und Launch-Aufruf abgeschlossen. Prüfe im Device Hub, ob KIDS NEXT sichtbar läuft."
