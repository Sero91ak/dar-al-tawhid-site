#!/bin/bash
set -e
cd "$(dirname "$0")/../.."
ROOT="$(pwd)"
VOICE_HOME="$HOME/SerhatVoice"
VENV="$VOICE_HOME/.venv"
if [ ! -x "$VENV/bin/python" ]; then
  echo "Fehlt: $VENV"
  echo "Die bisherige SerhatVoice-Umgebung muss vorhanden sein."
  read -r -p "Enter zum Beenden …"
  exit 1
fi
mkdir -p "$HOME/Applications/DAR-Voice-Studio"
cp "$ROOT/scripts/voice-studio/DĀR Voice Engine.command" "$HOME/Applications/DAR-Voice-Studio/DĀR Voice Engine.command"
chmod +x "$HOME/Applications/DAR-Voice-Studio/DĀR Voice Engine.command"
cat > "$HOME/Applications/DAR-Voice-Studio/Voice Studio öffnen.command" <<'EOF'
#!/bin/bash
open "https://dar-al-tawhid.de/test/voice-studio/"
EOF
chmod +x "$HOME/Applications/DAR-Voice-Studio/Voice Studio öffnen.command"
echo "Installiert unter: $HOME/Applications/DAR-Voice-Studio"
open "$HOME/Applications/DAR-Voice-Studio"
