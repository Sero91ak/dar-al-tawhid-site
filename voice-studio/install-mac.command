#!/bin/bash
set -euo pipefail

SITE="https://dar-al-tawhid.de"
TARGET="$HOME/Applications/DAR-Voice-Studio"
VOICE_HOME="$HOME/SerhatVoice"
VENV="$VOICE_HOME/.venv"
APP="$HOME/Applications/DĀR Voice Engine.app"
MACOS="$APP/Contents/MacOS"
PLIST="$APP/Contents/Info.plist"
LAUNCH="$HOME/Library/LaunchAgents/com.daraltawhid.voice-engine.plist"

mkdir -p "$TARGET" "$VOICE_HOME" "$MACOS" "$HOME/Library/LaunchAgents"

say_status() {
  /usr/bin/osascript -e "display notification \"$1\" with title \"DĀR Voice Studio\"" >/dev/null 2>&1 || true
}

say_status "Einrichtung wird vorbereitet …"

curl -fsSL "$SITE/voice-studio/local-engine.py?setup=6" -o "$TARGET/local-engine.py"
curl -fsSL "$SITE/data/pronunciation/pronunciation-rules.json?setup=6" -o "$TARGET/pronunciation-rules.json"
curl -fsSL "$SITE/data/pronunciation/voice-production-profile.json?setup=6" -o "$TARGET/voice-production-profile.json"

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
    say_status "Python wird einmalig installiert …"
    brew install python@3.11
    PY="/opt/homebrew/bin/python3.11"
    [ -x "$PY" ] || PY="$(brew --prefix python@3.11)/bin/python3.11"
  fi
  if [ -z "$PY" ]; then
    /usr/bin/osascript -e 'display dialog "Python 3.10–3.13 fehlt. Bitte Python 3.11 installieren und die Einrichtung danach erneut öffnen." buttons {"Python öffnen","Abbrechen"} default button 1 with icon caution' >/dev/null 2>&1 && open "https://www.python.org/downloads/macos/"
    exit 1
  fi
  "$PY" -m venv "$VENV"
  PY="$VENV/bin/python"
fi

if ! "$PY" -c 'from chatterbox.mtl_tts import ChatterboxMultilingualTTS' >/dev/null 2>&1; then
  say_status "Chatterbox wird einmalig installiert. Das kann einige Minuten dauern …"
  "$PY" -m pip install --upgrade pip setuptools wheel
  "$PY" -m pip install chatterbox-tts
fi

if ! command -v ffmpeg >/dev/null 2>&1 && command -v brew >/dev/null 2>&1; then
  brew install ffmpeg >/dev/null 2>&1 || true
fi

cat > "$MACOS/dar-voice-engine" <<'RUNNER'
#!/bin/bash
set -e
TARGET="$HOME/Applications/DAR-Voice-Studio"
VENV="$HOME/SerhatVoice/.venv"
URL="\${1:-}"
OPEN_STUDIO=1
[ "$URL" = "--background" ] && OPEN_STUDIO=0

if curl -fsS --max-time 1 "http://127.0.0.1:8787/health" >/dev/null 2>&1; then
  [ "$OPEN_STUDIO" = "1" ] && open "https://dar-al-tawhid.de/voice-studio/?engine=running"
  exit 0
fi

export DAR_VOICE_APP_HOME="$TARGET"
if [ -f "$HOME/SerhatVoice/Serhat_Adobe_MASTER.wav" ]; then
  export SERHAT_VOICE_REF="$HOME/SerhatVoice/Serhat_Adobe_MASTER.wav"
elif [ -f "$HOME/SerhatVoice/Serhat_FINAL_REF.wav" ]; then
  export SERHAT_VOICE_REF="$HOME/SerhatVoice/Serhat_FINAL_REF.wav"
fi

nohup "$VENV/bin/python" "$TARGET/local-engine.py" >> "$TARGET/engine.log" 2>&1 &
for i in $(seq 1 30); do
  sleep 1
  if curl -fsS --max-time 1 "http://127.0.0.1:8787/health" >/dev/null 2>&1; then
    [ "$OPEN_STUDIO" = "1" ] && open "https://dar-al-tawhid.de/voice-studio/?engine=running"
    exit 0
  fi
done

/usr/bin/osascript -e 'display dialog "Die Serhat Engine konnte nicht starten. Öffne ~/Applications/DAR-Voice-Studio/engine.log für den Fehler." buttons {"OK"} default button 1 with icon caution'
exit 1
RUNNER
chmod +x "$MACOS/dar-voice-engine"

cat > "$PLIST" <<'PLIST'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleName</key><string>DĀR Voice Engine</string>
  <key>CFBundleDisplayName</key><string>DĀR Voice Engine</string>
  <key>CFBundleIdentifier</key><string>de.dar-al-tawhid.voice-engine</string>
  <key>CFBundleVersion</key><string>1.0.0</string>
  <key>CFBundlePackageType</key><string>APPL</string>
  <key>CFBundleExecutable</key><string>dar-voice-engine</string>
  <key>LSUIElement</key><true/>
  <key>CFBundleURLTypes</key>
  <array>
    <dict>
      <key>CFBundleURLName</key><string>DĀR Voice Engine</string>
      <key>CFBundleURLSchemes</key><array><string>darvoice</string></array>
    </dict>
  </array>
</dict>
</plist>
PLIST

cat > "$LAUNCH" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>com.daraltawhid.voice-engine</string>
  <key>ProgramArguments</key>
  <array>
    <string>$MACOS/dar-voice-engine</string>
    <string>--background</string>
  </array>
  <key>RunAtLoad</key><true/>
  <key>StandardOutPath</key><string>$TARGET/launch.log</string>
  <key>StandardErrorPath</key><string>$TARGET/launch-error.log</string>
</dict>
</plist>
PLIST

/usr/bin/plutil -lint "$PLIST" >/dev/null
/usr/bin/plutil -lint "$LAUNCH" >/dev/null
/System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister -f "$APP" >/dev/null 2>&1 || true

launchctl bootout "gui/$UID/com.daraltawhid.voice-engine" >/dev/null 2>&1 || true
launchctl bootstrap "gui/$UID" "$LAUNCH" >/dev/null 2>&1 || true
launchctl kickstart -k "gui/$UID/com.daraltawhid.voice-engine" >/dev/null 2>&1 || true

say_status "Einrichtung fertig – Serhat Engine wird gestartet."
sleep 2
open "$APP"
