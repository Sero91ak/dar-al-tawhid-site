#!/usr/bin/env bash
set -euo pipefail

ROOT="${1:-$(pwd)}"
cd "$ROOT/voice-studio/cloud-gpu"

if ! command -v nvidia-smi >/dev/null 2>&1; then
  echo "FEHLER: NVIDIA GPU/Driver nicht gefunden. Nutze ein NVIDIA-GPU-Image." >&2
  exit 2
fi

if ! command -v docker >/dev/null 2>&1; then
  echo "FEHLER: Docker fehlt. Auf DigitalOcean das AI/ML-ready NVIDIA-Image verwenden." >&2
  exit 3
fi

if ! docker compose version >/dev/null 2>&1; then
  echo "FEHLER: Docker Compose Plugin fehlt." >&2
  exit 4
fi

if [[ ! -f .env ]]; then
  cp .env.example .env
  echo "STOPP: .env wurde angelegt. Domain und Token eintragen, dann dieses Skript erneut starten." >&2
  exit 5
fi

set -a
source ./.env
set +a

: "${DAR_VOICE_DOMAIN:?DAR_VOICE_DOMAIN fehlt in .env}"
: "${DAR_VOICE_PAIR_TOKEN:?DAR_VOICE_PAIR_TOKEN fehlt in .env}"

DATA="${DAR_VOICE_DATA_DIR:-/var/lib/dar-voice}"
sudo mkdir -p "$DATA"
sudo chmod 700 "$DATA"

if [[ ! -s "$DATA/Serhat_Adobe_MASTER.wav" ]]; then
  echo "STOPP: Private Voice-Referenz fehlt: $DATA/Serhat_Adobe_MASTER.wav" >&2
  echo "Kopiere zuerst die bestehende Master-WAV sicher auf den Server." >&2
  exit 6
fi

if [[ ! -s "$DATA/Serhat_AR_MASTER.wav" ]]; then
  echo "HINWEIS: Serhat_AR_MASTER.wav fehlt; die Engine fällt auf die deutsche Referenz zurück." >&2
fi

nvidia-smi

docker compose build --pull
docker compose up -d

echo "Warte auf DĀR Voice Engine …"
for i in $(seq 1 60); do
  if docker compose exec -T voice python - <<'PY' >/dev/null 2>&1
import urllib.request
urllib.request.urlopen("http://127.0.0.1:8787/health",timeout=3).read()
PY
  then
    echo "DĀR Voice GPU Engine ist gesund."
    echo "Origin: https://$DAR_VOICE_DOMAIN"
    exit 0
  fi
  sleep 5
done

docker compose ps
docker compose logs --tail=120 voice
echo "FEHLER: Engine wurde nicht rechtzeitig gesund." >&2
exit 7
