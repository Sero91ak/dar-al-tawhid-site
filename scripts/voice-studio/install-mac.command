#!/bin/bash
set -e
cd "$(dirname "$0")/../.."
ROOT="$(pwd)"
VOICE_HOME="$HOME/SerhatVoice"
VENV="$VOICE_HOME/.venv"

if [ ! -x "$VENV/bin/python" ]; then
  echo "Fehlt: $VENV"
  echo "Die SerhatVoice-Pythonumgebung muss vorhanden sein."
  read -r -p "Enter zum Beenden …"
  exit 1
fi

TARGET="$HOME/Applications/DAR-Voice-Studio"
mkdir -p "$TARGET"

if ! command -v ffmpeg >/dev/null 2>&1 && command -v brew >/dev/null 2>&1; then
  echo "Installiere einmalig ffmpeg für Audio-Mastering …"
  brew install ffmpeg
fi

cat > "$TARGET/DĀR Voice Engine.command" <<EOF
#!/bin/bash
set -e
ROOT="$ROOT"
VOICE_HOME="$HOME/SerhatVoice"
VENV="$VOICE_HOME/.venv"
if [ -z "\${SERHAT_VOICE_REF:-}" ]; then
  if [ -f "$VOICE_HOME/Serhat_Adobe_MASTER.wav" ]; then
    export SERHAT_VOICE_REF="$VOICE_HOME/Serhat_Adobe_MASTER.wav"
  else
    export SERHAT_VOICE_REF="$VOICE_HOME/Serhat_FINAL_REF.wav"
  fi
fi
cd "$ROOT"
source "$VENV/bin/activate"
python "$ROOT/scripts/voice-studio/engine.py"
EOF

cat > "$TARGET/Voice Studio öffnen.command" <<'EOF'
#!/bin/bash
open "https://dar-al-tawhid.de/voice-studio/"
EOF

chmod +x "$TARGET/DĀR Voice Engine.command" "$TARGET/Voice Studio öffnen.command"

echo "Installiert unter: $TARGET"
echo "Im Alltag: zuerst DĀR Voice Engine.command, danach Voice Studio öffnen.command."
open "$TARGET"
