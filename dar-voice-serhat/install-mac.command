#!/bin/bash
set -euo pipefail

VERSION="1.0.2"
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
cat > "$STAGE/serhat-app-icon.b64" <<'SERHATICON'
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
SERHATICON
/usr/bin/base64 -D "$STAGE/serhat-app-icon.b64" > "$STAGE/serhat-app-icon.png"
rm -f "$STAGE/serhat-app-icon.b64"
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
for old in local-engine.py speech_flow.py free-voice.html DarVoiceSerhatApp.swift voice-studio-icon.png serhat-app-icon.png pronunciation-rules.json voice-production-profile.json islamic-master-library.json; do
  [ -f "$TARGET/$old" ] && cp "$TARGET/$old" "$BACKUP/$old" || true
done

pkill -f "$TARGET/local-engine.py" >/dev/null 2>&1 || true
pkill -f "$APP/Contents/MacOS/DARVoiceSerhat" >/dev/null 2>&1 || true
sleep 1

for fresh in local-engine.py speech_flow.py free-voice.html DarVoiceSerhatApp.swift voice-studio-icon.png serhat-app-icon.png pronunciation-rules.json voice-production-profile.json islamic-master-library.json; do
  cp "$STAGE/$fresh" "$TARGET/$fresh"
done

APP_STAGE="$TMP/DĀR Voice by Serhat Abu Malik.app"
mkdir -p "$APP_STAGE/Contents/MacOS" "$APP_STAGE/Contents/Resources"

xcrun swiftc -parse-as-library -O   "$TARGET/DarVoiceSerhatApp.swift"   -framework Cocoa   -framework WebKit   -o "$APP_STAGE/Contents/MacOS/DARVoiceSerhat"

ICONSET="$TMP/AppIcon.iconset"
mkdir -p "$ICONSET"
SRC_ICON="$TARGET/serhat-app-icon.png"

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
  <key>CFBundleShortVersionString</key><string>1.0.2</string>
  <key>CFBundleVersion</key><string>102</string>
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
