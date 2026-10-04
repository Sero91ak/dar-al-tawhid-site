#!/usr/bin/env bash
set -euo pipefail

MODE="plan"
if [[ "${1:-}" == "--apply" ]]; then MODE="apply"; fi

NAME="${DO_DROPLET_NAME:-dar-voice-gpu}"
REGION="${DO_REGION:-tor1}"
# Current NVIDIA single-GPU offering exposed by the connected DigitalOcean account in TOR1.
SIZE="${DO_GPU_SIZE:-gpu-h100x1-80gb}"
# DigitalOcean's NVIDIA AI/ML-ready base image. Can be overridden when the account exposes another image slug.
IMAGE="${DO_GPU_IMAGE:-gpu-h100x1-base}"
SSH_KEY="${DO_SSH_KEY:-}"
TAG="${DO_TAG:-dar-voice-gpu}"

if ! command -v doctl >/dev/null 2>&1; then
  echo "FEHLER: doctl fehlt. Installiere die DigitalOcean CLI und authentifiziere sie." >&2
  exit 2
fi
if ! command -v python3 >/dev/null 2>&1; then
  echo "FEHLER: python3 fehlt; wird für die sichere DigitalOcean-Vorabprüfung benötigt." >&2
  exit 3
fi

echo "DĀR Voice GPU – DigitalOcean"
echo "  Modus:  $MODE"
echo "  Name:   $NAME"
echo "  Region: $REGION"
echo "  GPU:    $SIZE"
echo "  Image:  $IMAGE"
echo "  Tag:    $TAG"

ACCOUNT_JSON="$(doctl account get --output json 2>/dev/null || true)"
if [[ -n "$ACCOUNT_JSON" ]]; then
  ACCOUNT_JSON="$ACCOUNT_JSON" python3 - "$MODE" <<'PY'
import json, os, sys
mode=sys.argv[1]
try:
    raw=json.loads(os.environ.get("ACCOUNT_JSON","{}"))
    account=(raw[0] if isinstance(raw,list) and raw else raw) or {}
except Exception:
    account={}
status=str(account.get("status") or "")
message=str(account.get("status_message") or "")
limit=account.get("droplet_limit")
print(f"  Konto:  {status or 'unbekannt'} · Droplet-Limit: {limit if limit is not None else 'unbekannt'}")
if message:
    print("  Hinweis:", message)
if mode=="apply" and status and status not in ("active","ok"):
    print("FEHLER: DigitalOcean-Konto ist für eine neue kostenpflichtige GPU nicht freigegeben.", file=sys.stderr)
    sys.exit(41)
PY
fi

REGIONS_JSON="$(doctl compute region list --output json 2>/dev/null || true)"
if [[ -z "$REGIONS_JSON" ]]; then
  echo "FEHLER: DigitalOcean-Regionen konnten nicht gelesen werden." >&2
  exit 4
fi

if ! REGIONS_JSON="$REGIONS_JSON" python3 - "$REGION" "$SIZE" <<'PY'
import json, os, sys
region, size=sys.argv[1:3]
rows=json.loads(os.environ.get("REGIONS_JSON","[]"))
match=next((r for r in rows if str(r.get("slug") or "")==region),None)
if not match:
    print(f"FEHLER: Region '{region}' ist für dieses Konto nicht verfügbar.", file=sys.stderr)
    sys.exit(1)
sizes=set(match.get("sizes") or [])
if size not in sizes:
    gpu=sorted(x for x in sizes if str(x).startswith("gpu-"))
    print(f"FEHLER: GPU-Size '{size}' ist in {region} aktuell nicht verfügbar.", file=sys.stderr)
    if gpu:
        print("GPU-Pläne in dieser Region:", ", ".join(gpu), file=sys.stderr)
    sys.exit(2)
print("  GPU-Verfügbarkeit: bestätigt")
PY
then
  exit 5
fi

if [[ "$MODE" != "apply" ]]; then
  if [[ -z "$SSH_KEY" ]]; then
    echo "  SSH-Key: fehlt noch (für PLAN okay; vor --apply erforderlich)"
  else
    echo "  SSH-Key: gesetzt"
  fi
  echo
  echo "PLAN ONLY – es wurde keine kostenpflichtige GPU erstellt."
  echo "Für die echte Erstellung müssen Kontostatus, SSH-Key und GPU-Freigabe grün sein."
  echo "Danach: DO_SSH_KEY=<id-oder-fingerprint> $0 --apply"
  exit 0
fi

if [[ -z "$SSH_KEY" ]]; then
  echo "FEHLER: DO_SSH_KEY muss vor --apply die DigitalOcean SSH-Key-ID oder den Fingerprint enthalten." >&2
  exit 6
fi

if doctl compute droplet list --format Name --no-header | grep -Fxq "$NAME"; then
  echo "FEHLER: Ein Droplet mit Namen '$NAME' existiert bereits." >&2
  exit 7
fi

echo "Erstelle GPU-Droplet …"
doctl compute droplet create "$NAME" \
  --region "$REGION" \
  --size "$SIZE" \
  --image "$IMAGE" \
  --ssh-keys "$SSH_KEY" \
  --enable-monitoring \
  --enable-public-networking=true \
  --tag-names "$TAG" \
  --wait

IP=""
for _ in $(seq 1 30); do
  IP="$(doctl compute droplet get "$NAME" --format PublicIPv4 --no-header 2>/dev/null | head -1 | tr -d '[:space:]')"
  [[ -n "$IP" ]] && break
  sleep 2
done

if [[ -z "$IP" ]]; then
  echo "FEHLER: Droplet wurde erstellt, aber die öffentliche IPv4 konnte nicht gelesen werden." >&2
  exit 8
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
