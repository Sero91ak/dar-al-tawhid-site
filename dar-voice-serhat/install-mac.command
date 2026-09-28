#!/bin/bash
set -euo pipefail

VERSION="1.0.1"
REPO="Sero91ak/dar-al-tawhid-site"
TARGET="$HOME/Applications/DAR-Voice-Serhat"
VOICE_ROOT="$HOME/SerhatVoice"
VOICE_HOME="$VOICE_ROOT/DARVoiceStandalone"
VENV="$VOICE_ROOT/.venv"
PY="$VENV/bin/python"
APP="$HOME/Applications/DĀR Voice by Serhat Abu Malik.app"
BACKUPS="$TARGET/backups"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

echo "DĀR Voice by Serhat Abu Malik $VERSION"
echo "Eigenständige App · keine Kids-/Content-Studio-Bindung"

if [ ! -x "$PY" ]; then
  echo "FEHLER: Die vorhandene Serhat-Voice-Python-Umgebung fehlt:"
  echo "$PY"
  echo "Bitte zuerst die bestehende Voice-Studio-Umgebung installieren."
  exit 1
fi

mkdir -p "$HOME/Applications" "$TARGET" "$VOICE_HOME" "$BACKUPS"

curl -fL --retry 3 --retry-delay 2   "https://codeload.github.com/$REPO/zip/refs/heads/main"   -o "$TMP/repo.zip"

unzip -q "$TMP/repo.zip" -d "$TMP/src"
ROOT="$TMP/src/dar-al-tawhid-site-main"

for f in   "$ROOT/dar-voice-serhat/local-engine.py"   "$ROOT/dar-voice-serhat/free-voice.html"   "$ROOT/dar-voice-serhat/DarVoiceSerhatApp.swift"   "$ROOT/voice-studio/speech_flow.py"   "$ROOT/voice-studio/voice-studio-icon.png"   "$ROOT/data/pronunciation/pronunciation-rules.json"   "$ROOT/data/pronunciation/voice-production-profile.json"   "$ROOT/data/pronunciation/islamic-master-library.json"; do
  if [ ! -s "$f" ]; then
    echo "FEHLER: Installationsdatei fehlt: $f"
    exit 1
  fi
done

STAGE="$TMP/stage"
mkdir -p "$STAGE"

cp "$ROOT/dar-voice-serhat/local-engine.py" "$STAGE/local-engine.py"
cp "$ROOT/dar-voice-serhat/free-voice.html" "$STAGE/free-voice.html"
cp "$ROOT/dar-voice-serhat/DarVoiceSerhatApp.swift" "$STAGE/DarVoiceSerhatApp.swift"
cp "$ROOT/voice-studio/speech_flow.py" "$STAGE/speech_flow.py"
cp "$ROOT/voice-studio/voice-studio-icon.png" "$STAGE/voice-studio-icon.png"
cp "$ROOT/data/pronunciation/pronunciation-rules.json" "$STAGE/pronunciation-rules.json"
cp "$ROOT/data/pronunciation/voice-production-profile.json" "$STAGE/voice-production-profile.json"
cp "$ROOT/data/pronunciation/islamic-master-library.json" "$STAGE/islamic-master-library.json"

"$PY" -m py_compile "$STAGE/local-engine.py" "$STAGE/speech_flow.py"

if ! grep -q '"/generate-free"' "$STAGE/local-engine.py"; then
  echo "FEHLER: Freie-Stimme-Endpunkt fehlt."
  exit 1
fi
if ! grep -q 'DĀR Voice by Serhat Abu Malik' "$STAGE/free-voice.html"; then
  echo "FEHLER: App-Oberfläche ist unvollständig."
  exit 1
fi

STAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP="$BACKUPS/$STAMP"
mkdir -p "$BACKUP"
for old in local-engine.py speech_flow.py free-voice.html DarVoiceSerhatApp.swift voice-studio-icon.png pronunciation-rules.json voice-production-profile.json islamic-master-library.json; do
  [ -f "$TARGET/$old" ] && cp "$TARGET/$old" "$BACKUP/$old" || true
done

pkill -f "$TARGET/local-engine.py" >/dev/null 2>&1 || true
pkill -f "$APP/Contents/MacOS/DARVoiceSerhat" >/dev/null 2>&1 || true
sleep 1

for fresh in local-engine.py speech_flow.py free-voice.html DarVoiceSerhatApp.swift voice-studio-icon.png pronunciation-rules.json voice-production-profile.json islamic-master-library.json; do
  cp "$STAGE/$fresh" "$TARGET/$fresh"
done

APP_STAGE="$TMP/DĀR Voice by Serhat Abu Malik.app"
mkdir -p "$APP_STAGE/Contents/MacOS" "$APP_STAGE/Contents/Resources"

xcrun swiftc -parse-as-library -O   "$TARGET/DarVoiceSerhatApp.swift"   -framework Cocoa   -framework WebKit   -o "$APP_STAGE/Contents/MacOS/DARVoiceSerhat"

ICONSET="$TMP/AppIcon.iconset"
mkdir -p "$ICONSET"
SRC_ICON="$TARGET/voice-studio-icon.png"

make_icon() {
  local px="$1"
  local out="$2"
  /usr/bin/sips -z "$px" "$px" "$SRC_ICON" --out "$ICONSET/$out" >/dev/null
}

make_icon 16 icon_16x16.png
make_icon 32 icon_16x16@2x.png
make_icon 32 icon_32x32.png
make_icon 64 icon_32x32@2x.png
make_icon 128 icon_128x128.png
make_icon 256 icon_128x128@2x.png
make_icon 256 icon_256x256.png
make_icon 512 icon_256x256@2x.png
make_icon 512 icon_512x512.png
make_icon 1024 icon_512x512@2x.png

/usr/bin/iconutil -c icns "$ICONSET" -o "$APP_STAGE/Contents/Resources/AppIcon.icns"

cat > "$APP_STAGE/Contents/Info.plist" <<'PLIST'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleName</key><string>DĀR Voice by Serhat Abu Malik</string>
  <key>CFBundleDisplayName</key><string>DĀR Voice by Serhat Abu Malik</string>
  <key>CFBundleIdentifier</key><string>de.daraltawhid.darvoice.serhatabumalik</string>
  <key>CFBundleExecutable</key><string>DARVoiceSerhat</string>
  <key>CFBundlePackageType</key><string>APPL</string>
  <key>CFBundleShortVersionString</key><string>1.0.1</string>
  <key>CFBundleVersion</key><string>101</string>
  <key>CFBundleIconFile</key><string>AppIcon</string>
  <key>LSMinimumSystemVersion</key><string>13.0</string>
  <key>NSHighResolutionCapable</key><true/>
</dict>
</plist>
PLIST

/usr/bin/codesign --force --deep --sign - "$APP_STAGE" >/dev/null

if [ -d "$APP" ]; then
  OLD_APP="$BACKUP/DĀR Voice by Serhat Abu Malik.app"
  mv "$APP" "$OLD_APP"
fi
mv "$APP_STAGE" "$APP"

/usr/bin/xattr -dr com.apple.quarantine "$APP" 2>/dev/null || true
/usr/bin/touch "$APP"
if [ -x "/System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister" ]; then
  "/System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister" -f "$APP" >/dev/null 2>&1 || true
fi

echo
echo "Installiert:"
echo "$APP"
echo
echo "App-Name: DĀR Voice by Serhat Abu Malik"
echo "Engine: 127.0.0.1:8789"
echo "Runtime: $VOICE_HOME"
echo "Backup: $BACKUP"

open "$APP"
