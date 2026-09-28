#!/bin/bash
set -euo pipefail

BRANCH="voice-studio-flow-lab"
TARGET="$HOME/Applications/DAR-Voice-Studio-Flow-Lab"
LAB_HOME="$HOME/SerhatVoice-Flow-Lab"
PROD_HOME="$HOME/SerhatVoice"
PYTHON="$PROD_HOME/.venv/bin/python"
PORT="8788"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

echo "DĀR Voice Studio Flow Lab wird separat installiert."
echo "Produktive Voice-Studio-Dateien werden nicht verändert."

if [ ! -x "$PYTHON" ]; then
  echo "FEHLER: SerhatVoice-Python nicht gefunden: $PYTHON"
  exit 1
fi

curl -fL --retry 3 --retry-delay 2   "https://codeload.github.com/Sero91ak/dar-al-tawhid-site/zip/refs/heads/$BRANCH"   -o "$TMP/lab.zip"

unzip -q "$TMP/lab.zip" -d "$TMP/src"
ROOT="$TMP/src/dar-al-tawhid-site-$BRANCH"

test -f "$ROOT/voice-studio/local-engine.py"
test -f "$ROOT/voice-studio/speech_flow.py"
test -f "$ROOT/voice-studio/index.html"
test -f "$ROOT/voice-studio/free-voice.html"
test -f "$ROOT/data/pronunciation/voice-production-profile.json"

mkdir -p "$TARGET" "$LAB_HOME"
cp -R "$ROOT/voice-studio/." "$TARGET/"

# Die Engine liefert /studio/ aus studio.html. Im Repository heißt die UI index.html.
# Deshalb die aktuelle Lab-Oberfläche bei jedem Install explizit dorthin spiegeln,
# damit kein altes studio.html aus einem früheren Test stehen bleibt.
cp "$ROOT/voice-studio/index.html" "$TARGET/studio.html"
cp "$ROOT/voice-studio/free-voice.html" "$TARGET/free-voice.html"

cp "$ROOT/data/pronunciation/"*.json "$TARGET/" 2>/dev/null || true

# Nur Kopien bestätigter Lern-/Lock-Audios übernehmen. Produktion bleibt unangetastet.
if [ -d "$PROD_HOME/MasterPronunciations" ] && [ ! -d "$LAB_HOME/MasterPronunciations" ]; then
  cp -R "$PROD_HOME/MasterPronunciations" "$LAB_HOME/MasterPronunciations"
fi
if [ -d "$PROD_HOME/PronunciationLearning" ] && [ ! -d "$LAB_HOME/PronunciationLearning" ]; then
  cp -R "$PROD_HOME/PronunciationLearning" "$LAB_HOME/PronunciationLearning"
fi

"$PYTHON" -m py_compile "$TARGET/local-engine.py" "$TARGET/speech_flow.py"

PID_FILE="$TARGET/engine.pid"
if [ -f "$PID_FILE" ]; then
  OLD_PID="$(cat "$PID_FILE" 2>/dev/null || true)"
  if [ -n "$OLD_PID" ] && kill -0 "$OLD_PID" 2>/dev/null; then
    kill "$OLD_PID" 2>/dev/null || true
    sleep 1
  fi
fi

export DAR_VOICE_APP_HOME="$TARGET"
export DAR_VOICE_HOME="$LAB_HOME"
export DAR_VOICE_PORT="$PORT"

if [ -f "$PROD_HOME/Serhat_Adobe_MASTER.wav" ]; then
  export SERHAT_VOICE_REF="$PROD_HOME/Serhat_Adobe_MASTER.wav"
elif [ -f "$PROD_HOME/Serhat_FINAL_REF.wav" ]; then
  export SERHAT_VOICE_REF="$PROD_HOME/Serhat_FINAL_REF.wav"
else
  echo "FEHLER: Keine deutsche Serhat-Referenz gefunden."
  exit 1
fi

if [ -f "$PROD_HOME/Serhat_AR_MASTER.wav" ]; then
  export SERHAT_VOICE_REF_AR="$PROD_HOME/Serhat_AR_MASTER.wav"
fi

nohup "$PYTHON" "$TARGET/local-engine.py"   >"$TARGET/engine.log"   2>"$TARGET/engine-error.log" &
echo $! > "$PID_FILE"

echo "Warte auf Flow-Lab-Engine …"
READY=0
for _ in $(seq 1 60); do
  if curl -fsS "http://127.0.0.1:$PORT/health" >/dev/null 2>&1; then
    READY=1
    break
  fi
  sleep 1
done

if [ "$READY" != "1" ]; then
  echo "FEHLER: Flow Lab wurde nicht bereit."
  tail -n 80 "$TARGET/engine-error.log" 2>/dev/null || true
  exit 1
fi

echo "Flow Lab bereit: http://127.0.0.1:$PORT/studio/"
echo "Freie Stimme: http://127.0.0.1:$PORT/studio/free/"
echo "Produktive App/Port 8787 blieb unverändert."
open "http://127.0.0.1:$PORT/studio/free/"
