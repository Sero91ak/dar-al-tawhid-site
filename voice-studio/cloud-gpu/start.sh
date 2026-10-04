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

exec python /app/runtime/local-engine.py
