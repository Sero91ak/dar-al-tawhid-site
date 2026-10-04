#!/usr/bin/env bash
set -euo pipefail

: "${DAR_VOICE_PAIR_TOKEN:?DAR_VOICE_PAIR_TOKEN muss als Secret gesetzt sein}"

export DAR_VOICE_NETWORK_MODE=1
export DAR_VOICE_DEVICE="${DAR_VOICE_DEVICE:-cuda}"
export DAR_VOICE_PORT="${DAR_VOICE_PORT:-${PORT:-8787}}"
export SERHAT_VOICE_REF="${SERHAT_VOICE_REF:-/root/SerhatVoice/Serhat_Adobe_MASTER.wav}"
export SERHAT_VOICE_REF_AR="${SERHAT_VOICE_REF_AR:-/root/SerhatVoice/Serhat_AR_MASTER.wav}"

if [[ ! -s "$SERHAT_VOICE_REF" ]]; then
  echo "FEHLER: Deutsche Voice-Referenz fehlt: $SERHAT_VOICE_REF" >&2
  exit 64
fi

if [[ ! -s "$SERHAT_VOICE_REF_AR" ]]; then
  echo "HINWEIS: Separate arabische Referenz fehlt; deutsche Referenz wird als Fallback verwendet." >&2
  export SERHAT_VOICE_REF_AR="$SERHAT_VOICE_REF"
fi

python - <<'PY'
import torch
if not torch.cuda.is_available():
    raise SystemExit("FEHLER: CUDA-GPU ist im Container nicht verfügbar.")
print("DĀR Voice CUDA:", torch.cuda.get_device_name(0), flush=True)
PY

python /app/runtime/local-engine.py &
ENGINE_PID=$!

shutdown(){
  kill -TERM "$ENGINE_PID" >/dev/null 2>&1 || true
  wait "$ENGINE_PID" >/dev/null 2>&1 || true
}
trap shutdown TERM INT

READY=0
for _ in $(seq 1 90); do
  if python - <<'PY' >/dev/null 2>&1
import os, urllib.request
port=os.environ.get("DAR_VOICE_PORT","8787")
urllib.request.urlopen("http://127.0.0.1:"+port+"/health",timeout=2).read()
PY
  then
    READY=1
    break
  fi
  if ! kill -0 "$ENGINE_PID" >/dev/null 2>&1; then
    wait "$ENGINE_PID"
    exit $?
  fi
  sleep 2
done

if [[ "$READY" != "1" ]]; then
  echo "FEHLER: DĀR Voice Engine hat den Health-Port nicht rechtzeitig geöffnet." >&2
  shutdown
  exit 65
fi

if [[ "${DAR_VOICE_AUTOWARM:-1}" != "0" ]]; then
  echo "DĀR Voice: CUDA-Modell wird im Hintergrund vorgewärmt …"
  python - <<'PY' || true
import os, urllib.request
port=os.environ.get("DAR_VOICE_PORT","8787")
req=urllib.request.Request(
    "http://127.0.0.1:"+port+"/warmup",
    data=b"{}",
    headers={"Content-Type":"application/json"},
    method="POST",
)
urllib.request.urlopen(req,timeout=5).read()
PY

  (
    for _ in $(seq 1 180); do
      STATE="$(python - <<'PY' 2>/dev/null || true
import json, os, urllib.request
port=os.environ.get("DAR_VOICE_PORT","8787")
try:
    data=json.loads(urllib.request.urlopen("http://127.0.0.1:"+port+"/health",timeout=2).read())
    print(data.get("model_state",""))
except Exception:
    print("")
PY
)"
      if [[ "$STATE" == "ready" ]]; then
        echo "DĀR Voice: CUDA-Modell ist warm und renderbereit."
        exit 0
      fi
      sleep 2
    done
    echo "DĀR Voice: Warmup läuft länger als erwartet; Server bleibt verfügbar." >&2
  ) &
fi

wait "$ENGINE_PID"
