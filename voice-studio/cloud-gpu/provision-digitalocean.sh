#!/usr/bin/env bash
set -euo pipefail

MODE="plan"
if [[ "${1:-}" == "--apply" ]]; then MODE="apply"; fi

NAME="${DO_DROPLET_NAME:-dar-voice-gpu}"
REGION="${DO_REGION:-tor1}"
SIZE="${DO_GPU_SIZE:-gpu-4000adax1-20gb}"
IMAGE="${DO_GPU_IMAGE:-gpu-h100x1-base}"
SSH_KEY="${DO_SSH_KEY:-}"
TAG="${DO_TAG:-dar-voice-gpu}"

if ! command -v doctl >/dev/null 2>&1; then
  echo "FEHLER: doctl fehlt. Installiere die DigitalOcean CLI und authentifiziere sie." >&2
  exit 2
fi

if [[ -z "$SSH_KEY" ]]; then
  echo "FEHLER: DO_SSH_KEY muss die DigitalOcean SSH-Key-ID oder den Fingerprint enthalten." >&2
  exit 3
fi

echo "DĀR Voice GPU – DigitalOcean"
echo "  Name:   $NAME"
echo "  Region: $REGION"
echo "  GPU:    $SIZE"
echo "  Image:  $IMAGE"
echo "  Tag:    $TAG"

if ! doctl compute size list --format Slug --no-header | grep -Fxq "$SIZE"; then
  echo "FEHLER: GPU-Size '$SIZE' ist für dieses Konto aktuell nicht in der Size-Liste." >&2
  echo "Verfügbare GPU-Pläne:"
  doctl compute size list --format Slug,PriceHourly,Regions --no-header | grep '^gpu-' || true
  exit 4
fi

if [[ "$MODE" != "apply" ]]; then
  echo
  echo "PLAN ONLY – es wird noch keine kostenpflichtige GPU erstellt."
  echo "Zum Erstellen: $0 --apply"
  exit 0
fi

if doctl compute droplet list --format Name --no-header | grep -Fxq "$NAME"; then
  echo "FEHLER: Ein Droplet mit Namen '$NAME' existiert bereits." >&2
  exit 5
fi

echo "Erstelle GPU-Droplet …"
doctl compute droplet create "$NAME"   --region "$REGION"   --size "$SIZE"   --image "$IMAGE"   --ssh-keys "$SSH_KEY"   --enable-monitoring   --enable-public-networking=true   --tag-names "$TAG"   --wait

IP=""
for _ in $(seq 1 30); do
  IP="$(doctl compute droplet get "$NAME" --format PublicIPv4 --no-header 2>/dev/null | head -1 | tr -d '[:space:]')"
  [[ -n "$IP" ]] && break
  sleep 2
done

if [[ -z "$IP" ]]; then
  echo "FEHLER: Droplet wurde erstellt, aber die öffentliche IPv4 konnte nicht gelesen werden." >&2
  exit 6
fi

echo
echo "GPU-Droplet bereit:"
echo "  IPv4: $IP"
echo
echo "Nächste Schritte:"
echo "  1. voice-gpu.dar-al-tawhid.de als A-Record auf $IP setzen."
echo "  2. Private SerhatVoice-Daten nach /var/lib/dar-voice übertragen."
echo "  3. Repo klonen und voice-studio/cloud-gpu/bootstrap.sh starten."
echo "  4. Cloudflare-Secrets DAR_VOICE_GPU_ORIGIN, DAR_VOICE_GPU_TOKEN und DAR_VOICE_WEB_TOKEN setzen."
