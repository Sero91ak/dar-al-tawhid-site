#!/bin/bash
set -e
cd "$(dirname "$0")/../.."
ROOT="$(pwd)"
VOICE_HOME="$HOME/SerhatVoice"
VENV="$VOICE_HOME/.venv"
if [ ! -x "$VENV/bin/python" ]; then
  osascript -e 'display dialog "Die SerhatVoice-Pythonumgebung wurde nicht gefunden. Bitte zuerst install-mac.command starten." buttons {"OK"} default button 1 with icon caution'
  exit 1
fi
export SERHAT_VOICE_REF="${SERHAT_VOICE_REF:-$VOICE_HOME/Serhat_FINAL_REF.wav}"
source "$VENV/bin/activate"
python "$ROOT/scripts/voice-studio/engine.py"
