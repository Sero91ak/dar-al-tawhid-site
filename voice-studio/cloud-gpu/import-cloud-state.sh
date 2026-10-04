#!/usr/bin/env bash
set -euo pipefail

BUNDLE="${1:-}"
TARGET="${DAR_VOICE_DATA_DIR:-/var/lib/dar-voice}"

if [[ -z "$BUNDLE" || ! -s "$BUNDLE" ]]; then
  echo "Nutzung: $0 /pfad/DAR_Voice_Cloud_State_*.tar.gz" >&2
  exit 2
fi

python - "$BUNDLE" <<'PY'
import sys, tarfile
p=sys.argv[1]
with tarfile.open(p,"r:gz") as tf:
    for m in tf.getmembers():
        name=m.name.replace("\\","/")
        if name.startswith("/") or name.startswith("../") or "/../" in ("/"+name+"/"):
            raise SystemExit("Unsicherer Archivpfad: "+name)
print("Archivpfade geprüft.")
PY

if [[ "$(id -u)" -eq 0 ]]; then
  mkdir -p "$TARGET"
  chmod 700 "$TARGET"
  tar -C "$TARGET" -xzf "$BUNDLE"
  chown -R root:root "$TARGET" || true
else
  sudo mkdir -p "$TARGET"
  sudo chmod 700 "$TARGET"
  sudo tar -C "$TARGET" -xzf "$BUNDLE"
fi

for ref in Serhat_Adobe_MASTER.wav Serhat_FINAL_REF.wav; do
  if [[ -s "$TARGET/$ref" ]]; then
    echo "Master-Referenz gefunden: $TARGET/$ref"
    break
  fi
done

if [[ ! -s "$TARGET/Serhat_Adobe_MASTER.wav" && ! -s "$TARGET/Serhat_FINAL_REF.wav" ]]; then
  echo "FEHLER: Import enthält keine deutsche Master-Referenz." >&2
  exit 3
fi

echo "DĀR Voice Cloud-State importiert: $TARGET"
echo "Container danach neu starten: docker compose restart voice"
