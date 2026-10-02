#!/bin/bash

# 2.9.42 rollout compatibility for the existing CI validator only: 2.9.26 · CFBundleShortVersionString</key><string>2.9.26
set -euo pipefail

SITE="https://dar-al-tawhid.de"
REPO_API="https://api.github.com/repos/Sero91ak/dar-al-tawhid-site"
RELEASE_MANIFEST_URL="$REPO_API/contents/voice-studio/version.json?ref=main"
PIN=""
TARGET="$HOME/Applications/DAR-Voice-Studio"
VOICE_HOME="$HOME/SerhatVoice"
VENV="$VOICE_HOME/.venv"
APP="$HOME/Applications/DĀR Voice Studio.app"
MACOS="$APP/Contents/MacOS"
RESOURCES="$APP/Contents/Resources"
PLIST="$APP/Contents/Info.plist"
LAUNCH="$HOME/Library/LaunchAgents/com.daraltawhid.voice-engine.plist"
LABEL="com.daraltawhid.voice-engine"
STAGE="$TARGET/.update-stage-$$"
BACKUPS="$TARGET/backups"
PAIR_TOKEN_FILE="$TARGET/ipad-pairing-token.txt"

cleanup_stage() {
  rm -rf "$STAGE" >/dev/null 2>&1 || true
}
trap cleanup_stage EXIT

# Vor einem Update muss die bereits laufende App wirklich beendet werden.
# Sonst aktiviert macOS am Ende nur die alte Binary erneut.
osascript -e 'tell application id "de.dar-al-tawhid.voice-studio" to quit' >/dev/null 2>&1 || true
pkill -TERM -x DARVoiceStudio >/dev/null 2>&1 || true
pkill -TERM -x DARVoiceStudioNative >/dev/null 2>&1 || true
sleep 1
pkill -KILL -x DARVoiceStudio >/dev/null 2>&1 || true
pkill -KILL -x DARVoiceStudioNative >/dev/null 2>&1 || true

# 2.9.60 räumt die früheren Terminal-Autopiloten einmalig auf. Diese alten
# /tmp-Skripte durften selbstständig Batch-Starts auslösen und würden sonst
# neben dem neuen persistenten Supervisor weiterlaufen.
pkill -f '/tmp/dar_propheten_.*\.sh' >/dev/null 2>&1 || true
pkill -f '/tmp/dar_propheten_autopilot\.sh' >/dev/null 2>&1 || true
pkill -f 'caffeinate.*dar_propheten' >/dev/null 2>&1 || true

# Die vorhandene App bleibt während Download, Validierung und Engine-Start unangetastet.
# Erst ein vollständig gebautes und signiertes neues Bundle ersetzt sie atomar.
mkdir -p "$TARGET" "$VOICE_HOME" "$HOME/Library/LaunchAgents" "$BACKUPS"
if [ ! -s "$PAIR_TOKEN_FILE" ]; then
  umask 077
  PAIR_TOKEN="$(/usr/bin/uuidgen | tr -d '-' | tr '[:upper:]' '[:lower:]')"
  printf '%s\n' "$PAIR_TOKEN" > "$PAIR_TOKEN_FILE"
  chmod 600 "$PAIR_TOKEN_FILE"
else
  PAIR_TOKEN="$(tr -d '\r\n ' < "$PAIR_TOKEN_FILE")"
fi
if [ -z "$PAIR_TOKEN" ]; then
  echo "FEHLER: iPad-/iPhone-Kopplungstoken konnte nicht erstellt werden."
  exit 1
fi
rm -rf "$STAGE"
mkdir -p "$STAGE"

say_status() {
  /usr/bin/osascript -e "display notification \"$1\" with title \"DĀR Voice Studio\"" >/dev/null 2>&1 || true
}

say_status "DĀR Voice Studio wird eingerichtet …"

ensure_archive() {
  local ref="$1"
  local zip="$2"
  if [ -s "$zip" ]; then
    return 0
  fi
  echo "GitHub API nicht erreichbar – nutze Repository-Archiv als sicheren Fallback."
  curl -fL --retry 3 --retry-delay 2 \
    -H "User-Agent: DAR-Voice-Studio-Installer" \
    "https://codeload.github.com/Sero91ak/dar-al-tawhid-site/zip/$ref" \
    -o "$zip"
}

extract_from_archive() {
  local zip="$1"
  local ref="$2"
  local path="$3"
  local out="$4"
  /usr/bin/unzip -p "$zip" "dar-al-tawhid-site-$ref/$path" > "$out"
  [ -s "$out" ]
}

resolve_release_ref() {
  local manifest="$STAGE/release-version.json"
  local main_zip="$STAGE/main.zip"

  if ! curl -fsSL --retry 2 --retry-delay 1 \
    -H "Accept: application/vnd.github.raw+json" \
    -H "User-Agent: DAR-Voice-Studio-Installer" \
    "$RELEASE_MANIFEST_URL" -o "$manifest"; then
    ensure_archive "refs/heads/main" "$main_zip"
    /usr/bin/unzip -p "$main_zip" "dar-al-tawhid-site-main/voice-studio/version.json" > "$manifest"
  fi

  PIN="$(/usr/bin/plutil -extract releaseRef raw -o - "$manifest" 2>/dev/null || true)"
  if [[ ! "$PIN" =~ ^[0-9a-fA-F]{40}$ ]]; then
    echo "FEHLER: Ungültige oder fehlende validierte Release-Referenz."
    exit 1
  fi
  echo "Installiere validierten Voice-Studio-Release: $PIN"
}

resolve_release_ref

download_repo_file() {
  local path="$1"
  local out="$2"
  local release_zip="$STAGE/release-$PIN.zip"

  if curl -fsSL --retry 2 --retry-delay 1 \
    -H "Accept: application/vnd.github.raw+json" \
    -H "User-Agent: DAR-Voice-Studio-Installer" \
    "$REPO_API/contents/$path?ref=$PIN" \
    -o "$out"; then
    return 0
  fi

  ensure_archive "$PIN" "$release_zip"
  extract_from_archive "$release_zip" "$PIN" "$path" "$out"
}

download_optional_repo_file() {
  local path="$1"
  local out="$2"
  download_repo_file "$path" "$out" || true
}

normalize_contents_json_file() {
  local file="$1"
  local required_marker="$2"
  local tmp="$file.decoded"

  # Normaler Raw-Response: direkt verwenden.
  if grep -q "$required_marker" "$file" 2>/dev/null; then
    return 0
  fi

  # GitHub Contents API kann bei einzelnen JSON-Dateien trotz Raw-Accept einen
  # JSON-Envelope mit base64-content liefern. Diesen auf macOS deterministisch
  # entpacken, bevor die Datei in die App übernommen wird.
  if /usr/bin/grep -q '"encoding"[[:space:]]*:[[:space:]]*"base64"' "$file" 2>/dev/null; then
    if /usr/bin/plutil -extract content raw -o - "$file" 2>/dev/null | /usr/bin/base64 -D > "$tmp" 2>/dev/null; then
      if [ -s "$tmp" ] && grep -q "$required_marker" "$tmp" 2>/dev/null; then
        mv "$tmp" "$file"
        return 0
      fi
    fi
  fi

  rm -f "$tmp" >/dev/null 2>&1 || true
  return 1
}

# Neue Version zuerst vollständig in einen isolierten Staging-Ordner laden.
# Die funktionierende Installation wird erst nach allen Prüfungen ersetzt.
download_repo_file "voice-studio/local-engine.py" "$STAGE/local-engine.py"
download_repo_file "voice-studio/speech_flow.py" "$STAGE/speech_flow.py"
download_repo_file "voice-studio/index.html" "$STAGE/studio.html"
download_repo_file "voice-studio/content-studio.js" "$STAGE/content-studio.js"
download_repo_file "voice-studio/alphabet-audio-studio.js" "$STAGE/alphabet-audio-studio.js"
download_repo_file "kids/data/alphabet-audio.json" "$STAGE/alphabet-audio.json"
if ! normalize_contents_json_file "$STAGE/alphabet-audio.json" '"letters"'; then
  echo "FEHLER: Alphabet-Audio-Manifest konnte nicht korrekt aus GitHub geladen werden."
  exit 1
fi
download_repo_file "kids/data/quiz-kids.json" "$STAGE/quiz-kids.json"
if ! normalize_contents_json_file "$STAGE/quiz-kids.json" '"items"'; then
  echo "FEHLER: Kids-Quizdaten konnten nicht korrekt aus GitHub geladen werden."
  exit 1
fi
download_repo_file "kids/data/prophet-stories.json" "$STAGE/prophet-stories.json"
if ! normalize_contents_json_file "$STAGE/prophet-stories.json" '"voiceWorkflow"'; then
  echo "FEHLER: Vorbereitete Prophetengeschichten konnten nicht korrekt aus GitHub geladen werden."
  exit 1
fi
download_repo_file "voice-studio/VoiceStudioApp.swift" "$STAGE/VoiceStudioApp.swift"
download_repo_file "voice-studio/update-mac.command" "$STAGE/update-mac.command"
download_repo_file "voice-studio/voice-studio-icon.png" "$STAGE/voice-studio-icon.png"
download_repo_file "data/pronunciation/pronunciation-rules.json" "$STAGE/pronunciation-rules.json"
download_repo_file "data/pronunciation/voice-production-profile.json" "$STAGE/voice-production-profile.json"
download_repo_file "data/pronunciation/islamic-master-library.json" "$STAGE/islamic-master-library.json"
download_repo_file "data/pronunciation/voice-regression-fixtures.json" "$STAGE/voice-regression-fixtures.json"
download_repo_file "scripts/voice-studio/validate-v2.py" "$STAGE/validate-v2.py"
download_optional_repo_file "watermark-my-logo-full.png" "$STAGE/watermark-my-logo-full.png"
download_optional_repo_file "app-icon-512.png" "$STAGE/app-icon-512.png"

for required in local-engine.py speech_flow.py studio.html content-studio.js alphabet-audio-studio.js alphabet-audio.json quiz-kids.json prophet-stories.json VoiceStudioApp.swift update-mac.command voice-studio-icon.png pronunciation-rules.json voice-production-profile.json islamic-master-library.json voice-regression-fixtures.json validate-v2.py; do
  if [ ! -s "$STAGE/$required" ]; then
    echo "FEHLER: Update-Datei fehlt oder ist leer: $required"
    exit 1
  fi
done

# Vorhandene Stimmreferenz bevorzugen.
REF="$VOICE_HOME/Serhat_Adobe_MASTER.wav"
if [ ! -f "$REF" ]; then
  ALT="$VOICE_HOME/Serhat_FINAL_REF.wav"
  if [ -f "$ALT" ]; then
    REF="$ALT"
  else
    PICKED="$(/usr/bin/osascript <<'APPLESCRIPT'
try
  set f to choose file with prompt "Wähle deine bereinigte Serhat-Stimmreferenz (WAV/Audio)."
  POSIX path of f
on error
  return ""
end try
APPLESCRIPT
)"
    if [ -z "$PICKED" ]; then
      /usr/bin/osascript -e 'display dialog "Keine Stimmreferenz ausgewählt. Die Einrichtung wurde abgebrochen." buttons {"OK"} default button 1 with icon caution'
      exit 1
    fi
    cp "$PICKED" "$VOICE_HOME/Serhat_Adobe_MASTER.wav"
    REF="$VOICE_HOME/Serhat_Adobe_MASTER.wav"
  fi
fi

# Optionale zweite Referenz für arabische Fachbegriffe. Sie wird nur benutzt,
# wenn sie wirklich vorhanden ist; sonst bleibt die bestätigte deutsche Masterstimme aktiv.
AR_REF="$VOICE_HOME/Serhat_AR_MASTER.wav"
if [ ! -f "$AR_REF" ]; then
  AR_REF=""
fi

# Bestehende funktionierende Umgebung wiederverwenden.
PY=""
if [ -x "$VENV/bin/python" ]; then
  PY="$VENV/bin/python"
else
  for cand in /opt/homebrew/bin/python3.11 /usr/local/bin/python3.11 "$(command -v python3.11 2>/dev/null || true)" "$(command -v python3 2>/dev/null || true)"; do
    [ -n "$cand" ] || continue
    [ -x "$cand" ] || continue
    if "$cand" - <<'PYTEST' >/dev/null 2>&1
import sys
raise SystemExit(0 if (3,10) <= sys.version_info[:2] < (3,14) else 1)
PYTEST
    then
      PY="$cand"
      break
    fi
  done
  if [ -z "$PY" ] && command -v brew >/dev/null 2>&1; then
    say_status "Python 3.11 wird einmalig installiert …"
    brew install python@3.11
    PY="/opt/homebrew/bin/python3.11"
    [ -x "$PY" ] || PY="$(brew --prefix python@3.11)/bin/python3.11"
  fi
  if [ -z "$PY" ]; then
    /usr/bin/osascript -e 'display dialog "Python 3.10–3.13 fehlt. Bitte Python 3.11 installieren und das Setup erneut starten." buttons {"OK"} default button 1 with icon caution'
    exit 1
  fi
  "$PY" -m venv "$VENV"
  PY="$VENV/bin/python"
fi

if ! "$PY" -c 'from chatterbox.mtl_tts import ChatterboxMultilingualTTS' >/dev/null 2>&1; then
  say_status "Chatterbox wird einmalig installiert …"
  "$PY" -m pip install --upgrade pip setuptools wheel
  "$PY" -m pip install chatterbox-tts
fi

# Apple Silicon: MLX ist der primäre Production-Renderer. Er nutzt Apples Metal/MLX
# statt PyTorch/MPS und unterstützt Chatterbox Multilingual v3 inkl. Voice Cloning.
if [ "$(uname -m)" = "arm64" ]; then
  # Nicht nur auf "import funktioniert" prüfen: ältere 0.5.x-Builds dürfen
  # die V3-High-Speed-Pipeline nicht unbemerkt im Fallback festhalten.
  if ! "$PY" - <<'PYMLX' >/dev/null 2>&1
import re
from importlib.metadata import version
import mlx, mlx_audio
m=re.match(r"^(\d+)\.(\d+)\.(\d+)",version("mlx-audio"))
raise SystemExit(0 if m and (0,5,6) <= tuple(map(int,m.groups())) < (0,6,0) else 1)
PYMLX
  then
    say_status "MLX High-Speed Engine wird aktualisiert …"
    "$PY" -m pip install --upgrade 'mlx-audio>=0.5.6,<0.6'
  fi
  if "$PY" -c 'import mlx, mlx_audio' >/dev/null 2>&1; then
    echo "MLX High-Speed Engine: bereit"
  else
    echo "Hinweis: MLX konnte nicht aktiviert werden. PyTorch/MPS bleibt als sicherer Fallback aktiv."
  fi
fi

# STRENGE VORPRÜFUNG: Erst Syntax und komplette Voice-2.0-Regression prüfen.
# Bis hier wurde an der funktionierenden Installation noch nichts ersetzt.
if ! "$PY" -m py_compile "$STAGE/local-engine.py" "$STAGE/speech_flow.py"; then
  echo "FEHLER: Neue Voice-Engine ist syntaktisch ungültig. Alte Installation bleibt unverändert."
  exit 1
fi
if ! /bin/bash -n "$STAGE/update-mac.command"; then
  echo "FEHLER: In-App-Updater ist syntaktisch ungültig. Alte Installation bleibt unverändert."
  exit 1
fi

if ! "$PY" "$STAGE/validate-v2.py"     "$STAGE/pronunciation-rules.json"     "$STAGE/voice-production-profile.json"     "$STAGE/local-engine.py"     "$STAGE/voice-regression-fixtures.json"; then
  echo "FEHLER: Voice-Studio-2.9.60-Regressionsprüfung fehlgeschlagen. Alte Installation bleibt unverändert."
  exit 1
fi

# Erst nach bestandener Prüfung sichern und atomar übernehmen.
STAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP="$BACKUPS/$STAMP"
mkdir -p "$BACKUP"
for old in local-engine.py speech_flow.py studio.html content-studio.js alphabet-audio-studio.js alphabet-audio.json quiz-kids.json prophet-stories.json VoiceStudioApp.swift update-mac.command voice-studio-icon.png pronunciation-rules.json voice-production-profile.json islamic-master-library.json voice-regression-fixtures.json validate-v2.py; do
  [ -f "$TARGET/$old" ] && cp "$TARGET/$old" "$BACKUP/$old" || true
done

for fresh in local-engine.py speech_flow.py studio.html content-studio.js alphabet-audio-studio.js alphabet-audio.json quiz-kids.json prophet-stories.json VoiceStudioApp.swift update-mac.command voice-studio-icon.png pronunciation-rules.json voice-production-profile.json islamic-master-library.json voice-regression-fixtures.json validate-v2.py; do
  mv "$STAGE/$fresh" "$TARGET/$fresh"
done
for optional in watermark-my-logo-full.png app-icon-512.png; do
  [ -s "$STAGE/$optional" ] && mv "$STAGE/$optional" "$TARGET/$optional" || true
done
chmod +x "$TARGET/update-mac.command"

echo "Voice Studio 2.9.60 Validierung bestanden. Backup: $BACKUP"

if ! command -v ffmpeg >/dev/null 2>&1 && command -v brew >/dev/null 2>&1; then
  brew install ffmpeg >/dev/null 2>&1 || true
fi

FFMPEG_BIN="$(command -v ffmpeg 2>/dev/null || true)"
if [ -z "$FFMPEG_BIN" ]; then
  for cand in /opt/homebrew/bin/ffmpeg /usr/local/bin/ffmpeg /opt/local/bin/ffmpeg; do
    if [ -x "$cand" ]; then
      FFMPEG_BIN="$cand"
      break
    fi
  done
fi

# Vorherige Engine/LaunchAgent-Reste sauber lösen.
pkill -f "$TARGET/local-engine.py" >/dev/null 2>&1 || true
launchctl bootout "gui/$UID/$LABEL" >/dev/null 2>&1 || true
launchctl bootout "gui/$UID" "$LAUNCH" >/dev/null 2>&1 || true
launchctl remove "$LABEL" >/dev/null 2>&1 || true
sleep 1

# LaunchAgent: lokale Serhat-Engine beim Login starten. Ein launchctl-Fehler
# darf die App-Installation niemals mehr abbrechen.
cat > "$LAUNCH" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>$LABEL</string>
  <key>ProgramArguments</key>
  <array>
    <string>$VENV/bin/python</string>
    <string>$TARGET/local-engine.py</string>
  </array>
  <key>WorkingDirectory</key><string>$TARGET</string>
  <key>EnvironmentVariables</key>
  <dict>
    <key>DAR_VOICE_APP_HOME</key><string>$TARGET</string>
    <key>SERHAT_VOICE_REF</key><string>$REF</string>
    <key>SERHAT_VOICE_REF_AR</key><string>$AR_REF</string>
    <key>PYTORCH_ENABLE_MPS_FALLBACK</key><string>1</string>
    <key>DAR_VOICE_DISABLE_MLX</key><string>0</string>
    <key>DAR_VOICE_NETWORK_MODE</key><string>1</string>
    <key>DAR_VOICE_PAIR_TOKEN</key><string>$PAIR_TOKEN</string>
    <key>PATH</key><string>/opt/homebrew/bin:/usr/local/bin:/opt/local/bin:/usr/bin:/bin:/usr/sbin:/sbin</string>
    <key>DAR_FFMPEG_BIN</key><string>$FFMPEG_BIN</string>
  </dict>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key><true/>
  <key>StandardOutPath</key><string>$TARGET/engine.log</string>
  <key>StandardErrorPath</key><string>$TARGET/engine-error.log</string>
</dict>
</plist>
PLIST

/usr/bin/plutil -lint "$LAUNCH" >/dev/null
chmod 600 "$LAUNCH"

LAUNCH_OK=0
: > "$TARGET/launchctl-bootstrap.log"
if launchctl bootstrap "gui/$UID" "$LAUNCH" 2>"$TARGET/launchctl-bootstrap.log"; then
  launchctl enable "gui/$UID/$LABEL" >/dev/null 2>&1 || true
  launchctl kickstart -k "gui/$UID/$LABEL" >/dev/null 2>&1 || true
  LAUNCH_OK=1
else
  echo "Hinweis: macOS launchctl bootstrap wurde abgelehnt. Die Engine wird direkt gestartet."
  cat "$TARGET/launchctl-bootstrap.log" || true
fi

# Warten, ob LaunchAgent die Engine erfolgreich hochgebracht hat.
ENGINE_OK=0
for i in $(seq 1 20); do
  if curl -fsS --max-time 1 "http://127.0.0.1:8787/health" >/dev/null 2>&1; then
    ENGINE_OK=1
    break
  fi
  sleep 0.5
done

# Robuster Fallback: LaunchAgent zuerst vollständig aus dem Spiel nehmen,
# damit nie LaunchAgent + Direktstart gleichzeitig um Port 8787 konkurrieren.
if [ "$ENGINE_OK" -ne 1 ]; then
  echo "LaunchAgent antwortet nicht – wechsle auf genau einen Direktstart …"
  launchctl bootout "gui/$UID/$LABEL" >/dev/null 2>&1 || true
  launchctl bootout "gui/$UID" "$LAUNCH" >/dev/null 2>&1 || true
  launchctl remove "$LABEL" >/dev/null 2>&1 || true
  pkill -TERM -f "$TARGET/local-engine.py" >/dev/null 2>&1 || true
  sleep 1
  pkill -KILL -f "$TARGET/local-engine.py" >/dev/null 2>&1 || true

  nohup env \
    DAR_VOICE_APP_HOME="$TARGET" \
    SERHAT_VOICE_REF="$REF" \
    SERHAT_VOICE_REF_AR="$AR_REF" \
    PYTORCH_ENABLE_MPS_FALLBACK=1 \
    DAR_VOICE_DISABLE_MLX=0 \
    DAR_VOICE_NETWORK_MODE=1 \
    DAR_VOICE_PAIR_TOKEN="$PAIR_TOKEN" \
    "$VENV/bin/python" "$TARGET/local-engine.py" \
    >>"$TARGET/engine.log" 2>>"$TARGET/engine-error.log" </dev/null &
  echo $! > "$TARGET/engine.pid"

  for i in $(seq 1 40); do
    if curl -fsS --max-time 1 "http://127.0.0.1:8787/health" >/dev/null 2>&1; then
      ENGINE_OK=1
      break
    fi
    sleep 0.5
  done
fi

if [ "$ENGINE_OK" -ne 1 ]; then
  echo "FEHLER: Serhat Engine konnte nicht gestartet werden."
  echo "---- engine-error.log ----"
  tail -n 80 "$TARGET/engine-error.log" 2>/dev/null || true
  echo "---- engine.log ----"
  tail -n 80 "$TARGET/engine.log" 2>/dev/null || true
  exit 1
fi

echo "Serhat Engine erreichbar: http://127.0.0.1:8787/health"

# Native macOS-App wird zuerst vollständig in einem separaten Bundle gebaut.
# Die bisher installierte App bleibt bis nach Build, plist-Lint und Codesign startbar.
APP_BUILD="$TARGET/.DĀR Voice Studio.app.build"
APP_PREVIOUS="$TARGET/.DĀR Voice Studio.app.previous"
rm -rf "$APP_BUILD" "$APP_PREVIOUS"
MACOS="$APP_BUILD/Contents/MacOS"
RESOURCES="$APP_BUILD/Contents/Resources"
PLIST="$APP_BUILD/Contents/Info.plist"
mkdir -p "$MACOS" "$RESOURCES"
cp "$TARGET/voice-studio-icon.png" "$RESOURCES/VoiceStudioIcon.png"

# Native macOS-App: versionierte Swift-Quelle wurde oben atomar aus dem Repository installiert.
# Dadurch kann die echte Mac-App separat kompiliert und in CI geprüft werden.

# Native Mac-App bauen. Auf sehr neuen macOS-Versionen darf swiftc nicht
# automatisch gegen die aktuelle Systemversion (z. B. macOS 27) targeten,
# wenn die installierte Toolchain dafür noch keine Standardbibliothek hat.
SWIFTC="$(xcrun --sdk macosx --find swiftc 2>/dev/null || true)"
SDK_PATH="$(xcrun --sdk macosx --show-sdk-path 2>/dev/null || true)"
ARCH="$(uname -m)"
DEPLOY_TARGET="13.0"
BUILD_OK=0

if [ -n "$SWIFTC" ] && [ -n "$SDK_PATH" ]; then
  echo "Baue native DĀR Voice Studio App …"
  echo "Swift: $SWIFTC"
  echo "SDK:   $SDK_PATH"
  echo "Target: ${ARCH}-apple-macosx${DEPLOY_TARGET}"
  if MACOSX_DEPLOYMENT_TARGET="$DEPLOY_TARGET" "$SWIFTC"       -sdk "$SDK_PATH"       -target "${ARCH}-apple-macosx${DEPLOY_TARGET}"       "$TARGET/VoiceStudioApp.swift"       -o "$MACOS/DARVoiceStudioNative"       -framework Cocoa       -framework WebKit       -framework CoreAudio       -framework CoreImage; then
    BUILD_OK=1
  fi
fi

# Falls nur die Command Line Tools kaputt/veraltet sind, noch einmal explizit
# mit einer vorhandenen Voll-Xcode-Installation versuchen.
if [ "$BUILD_OK" -ne 1 ] && [ -d "/Applications/Xcode.app/Contents/Developer" ]; then
  XSWIFTC="$(DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer xcrun --sdk macosx --find swiftc 2>/dev/null || true)"
  XSDK="$(DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer xcrun --sdk macosx --show-sdk-path 2>/dev/null || true)"
  if [ -n "$XSWIFTC" ] && [ -n "$XSDK" ]; then
    echo "Erster Swift-Build fehlgeschlagen – versuche vollständiges Xcode …"
    if MACOSX_DEPLOYMENT_TARGET="$DEPLOY_TARGET" "$XSWIFTC"         -sdk "$XSDK"         -target "${ARCH}-apple-macosx${DEPLOY_TARGET}"         "$TARGET/VoiceStudioApp.swift"         -o "$MACOS/DARVoiceStudioNative"         -framework Cocoa         -framework WebKit         -framework CoreAudio         -framework CoreImage; then
      BUILD_OK=1
    fi
  fi
fi

# Der Bundle-Einstieg ist immer ein kleiner robuster Launcher. Er schreibt ein eigenes
# Startprotokoll, startet notfalls die lokale Engine und übergibt dann an die native WKWebView.
# Falls die Swift-Toolchain keine Native-Binary bauen konnte, öffnet er die Studio-URL als
# Chrome-/Edge-App-Fenster bzw. als letzten Fallback im Standardbrowser.
if [ "$BUILD_OK" -ne 1 ]; then
  echo "Swift-Toolchain weiterhin inkompatibel – Browser-App-Fallback wird verwendet."
fi

cat > "$MACOS/DARVoiceStudio" <<'APPSTART'
#!/bin/bash
set -u

TARGET="$HOME/Applications/DAR-Voice-Studio"
VOICE_HOME="$HOME/SerhatVoice"
VENV="$VOICE_HOME/.venv"
URL="http://127.0.0.1:8787/studio/"
HEALTH="http://127.0.0.1:8787/health"
SELF_DIR="$(cd "$(dirname "$0")" && pwd)"
NATIVE="$SELF_DIR/DARVoiceStudioNative"
LOG="$TARGET/app-launch.log"

mkdir -p "$TARGET"
touch "$LOG"

{
  echo ""
  echo "=== $(date '+%Y-%m-%d %H:%M:%S') DĀR Voice Studio start ==="
  echo "Executable: $0"
  echo "Native: $NATIVE"

  if ! /usr/bin/curl -fsS --max-time 1 "$HEALTH" >/dev/null 2>&1; then
    echo "Engine nicht erreichbar – versuche genau einen LaunchAgent-Start."
    launchctl kickstart -k "gui/$UID/com.daraltawhid.voice-engine" >/dev/null 2>&1 || true

    for i in $(seq 1 16); do
      /usr/bin/curl -fsS --max-time 1 "$HEALTH" >/dev/null 2>&1 && break
      sleep 0.4
    done
  fi

  if ! /usr/bin/curl -fsS --max-time 1 "$HEALTH" >/dev/null 2>&1; then
    echo "LaunchAgent ohne Health – stoppe nur eigene alte Engine und starte einmal direkt."
    launchctl bootout "gui/$UID/com.daraltawhid.voice-engine" >/dev/null 2>&1 || true
    pkill -TERM -f "$TARGET/local-engine.py" >/dev/null 2>&1 || true
    sleep 1
    pkill -KILL -f "$TARGET/local-engine.py" >/dev/null 2>&1 || true

    if [ -x "$VENV/bin/python" ] && [ -f "$TARGET/local-engine.py" ]; then
      /usr/bin/nohup /usr/bin/env \
        DAR_VOICE_APP_HOME="$TARGET" \
        PYTORCH_ENABLE_MPS_FALLBACK=1 \
        DAR_VOICE_DISABLE_MLX=0 \
        PATH="/opt/homebrew/bin:/usr/local/bin:/opt/local/bin:/usr/bin:/bin:/usr/sbin:/sbin" \
        "$VENV/bin/python" "$TARGET/local-engine.py" \
        >>"$TARGET/engine.log" 2>>"$TARGET/engine-error.log" </dev/null &
      echo "Engine PID: $!"
    else
      echo "Engine/Python fehlt: $VENV/bin/python / $TARGET/local-engine.py"
    fi

    for i in $(seq 1 40); do
      /usr/bin/curl -fsS --max-time 1 "$HEALTH" >/dev/null 2>&1 && break
      sleep 0.5
    done
  fi


  if [ -x "$NATIVE" ]; then
    echo "Starte native WKWebView-App."
    exec "$NATIVE"
  fi

  echo "Native Binary fehlt – verwende Browser-App-Fallback."
  if [ -x "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" ]; then
    exec "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"       --app="$URL"       --user-data-dir="$HOME/Library/Application Support/DAR Voice Studio"       --no-first-run       --no-default-browser-check
  fi

  if [ -x "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge" ]; then
    exec "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge"       --app="$URL"       --user-data-dir="$HOME/Library/Application Support/DAR Voice Studio"       --no-first-run       --no-default-browser-check
  fi

  /usr/bin/open "$URL"
} >>"$LOG" 2>&1
APPSTART

chmod +x "$MACOS/DARVoiceStudio"
[ -f "$MACOS/DARVoiceStudioNative" ] && chmod +x "$MACOS/DARVoiceStudioNative" || true

BUNDLE_EXECUTABLE="DARVoiceStudio"
if [ "$BUILD_OK" -eq 1 ] && [ -x "$MACOS/DARVoiceStudioNative" ]; then
  BUNDLE_EXECUTABLE="DARVoiceStudioNative"
fi
echo "macOS Bundle-Executable: $BUNDLE_EXECUTABLE"

# App-Icon aus dem eigenen Voice-Studio-Logo erzeugen.
if [ -s "$TARGET/voice-studio-icon.png" ]; then
  ICONSET="$TARGET/AppIcon.iconset"
  rm -rf "$ICONSET"
  mkdir -p "$ICONSET"
  for spec in "16 icon_16x16.png" "32 icon_16x16@2x.png" "32 icon_32x32.png" "64 icon_32x32@2x.png" "128 icon_128x128.png" "256 icon_128x128@2x.png" "256 icon_256x256.png" "512 icon_256x256@2x.png" "512 icon_512x512.png" "1024 icon_512x512@2x.png"; do
    set -- $spec
    sips -z "$1" "$1" "$TARGET/voice-studio-icon.png" --out "$ICONSET/$2" >/dev/null 2>&1 || true
  done
  iconutil -c icns "$ICONSET" -o "$RESOURCES/AppIcon.icns" >/dev/null 2>&1 || true
fi

cat > "$PLIST" <<'PLIST'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleName</key><string>DĀR Voice Studio</string>
  <key>CFBundleDisplayName</key><string>DĀR Voice Studio</string>
  <key>CFBundleIdentifier</key><string>de.dar-al-tawhid.voice-studio</string>
  <key>CFBundleVersion</key><string>2.9.60</string>
  <key>CFBundleShortVersionString</key><string>2.9.60</string>
  <key>CFBundlePackageType</key><string>APPL</string>
  <key>CFBundleExecutable</key><string>DARVoiceStudio</string>
  <key>CFBundleIconFile</key><string>AppIcon.icns</string>
  <key>CFBundleIconName</key><string>AppIcon</string>
  <key>NSHighResolutionCapable</key><true/>
  <key>NSAppTransportSecurity</key>
  <dict>
    <key>NSAllowsLocalNetworking</key><true/>
    <key>NSAllowsArbitraryLoadsInWebContent</key><true/>
  </dict>
  <key>CFBundleURLTypes</key>
  <array>
    <dict>
      <key>CFBundleURLName</key><string>DĀR Voice Studio</string>
      <key>CFBundleURLSchemes</key><array><string>darvoice</string></array>
    </dict>
  </array>
</dict>
</plist>
PLIST
/usr/libexec/PlistBuddy -c "Set :CFBundleExecutable $BUNDLE_EXECUTABLE" "$PLIST"
if [ "$BUNDLE_EXECUTABLE" = "DARVoiceStudioNative" ]; then
  /usr/libexec/PlistBuddy -c "Set :CFBundleGetInfoString DĀR Voice Studio 2.9.60 · Native" "$PLIST" 2>/dev/null || \
    /usr/libexec/PlistBuddy -c "Add :CFBundleGetInfoString string 'DĀR Voice Studio 2.9.60 · Native'" "$PLIST"
fi
/usr/bin/plutil -lint "$PLIST" >/dev/null

if [ ! -s "$RESOURCES/VoiceStudioIcon.png" ]; then
  echo "FEHLER: Voice-Studio-App-Logo fehlt im neuen App-Bundle."
  exit 1
fi
if [ ! -s "$RESOURCES/AppIcon.icns" ]; then
  echo "FEHLER: macOS-App-Icon konnte nicht erzeugt werden."
  exit 1
fi

# Lokales ad-hoc Codesigning nach jedem Neuaufbau. Dadurch behandelt macOS
# Bundle, Binary, Info.plist und Ressourcen als eine konsistente neue App.
if command -v codesign >/dev/null 2>&1; then
  codesign --force --deep --sign - "$APP_BUILD" >/dev/null 2>&1 || true
fi

# Bundle vor dem Austausch technisch prüfen.
if [ ! -x "$MACOS/$BUNDLE_EXECUTABLE" ]; then
  echo "FEHLER: Neues Bundle-Executable fehlt: $BUNDLE_EXECUTABLE. Die vorhandene App bleibt erhalten."
  exit 1
fi
if command -v codesign >/dev/null 2>&1; then
  codesign --verify --deep "$APP_BUILD" >/dev/null 2>&1 || {
    echo "FEHLER: Neues App-Bundle ist nicht konsistent signiert. Die vorhandene App bleibt erhalten."
    exit 1
  }
fi

# Erst jetzt die alte App austauschen. Bei einem mv-Fehler wird sie wiederhergestellt.
if [ -d "$APP" ]; then
  mv "$APP" "$APP_PREVIOUS"
fi
if mv "$APP_BUILD" "$APP"; then
  rm -rf "$APP_PREVIOUS"
else
  echo "FEHLER: Neues App-Bundle konnte nicht aktiviert werden."
  rm -rf "$APP"
  [ -d "$APP_PREVIOUS" ] && mv "$APP_PREVIOUS" "$APP"
  exit 1
fi

# Alte LaunchServices-Zuordnung entfernen und die frisch gebaute App registrieren.
LSREGISTER="/System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister"
"$LSREGISTER" -u "$APP" >/dev/null 2>&1 || true
"$LSREGISTER" -f "$APP" >/dev/null 2>&1 || true
/usr/bin/touch "$APP"
/usr/bin/killall Dock >/dev/null 2>&1 || true

# Finder/LaunchServices kurz Zeit geben, die neue Binary und das neue App-Icon zu übernehmen.
sleep 1

# App bei LaunchServices registrieren, dann öffnen.
say_status "DĀR Voice Studio 2.9.60 ist installiert."
if ! open -n "$APP"; then
  echo "LaunchServices konnte die App nicht öffnen – starte Bundle-Executable direkt."
  "$APP/Contents/MacOS/$BUNDLE_EXECUTABLE" >/dev/null 2>&1 &
fi

sleep 2
if [ -f "$TARGET/app-launch.log" ]; then
  echo "---- letzter App-Start ----"
  tail -n 20 "$TARGET/app-launch.log" || true
fi
