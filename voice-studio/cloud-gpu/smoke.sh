#!/usr/bin/env bash
set -euo pipefail

BASE="${DAR_VOICE_PUBLIC_BASE:-https://dar-al-tawhid.de}"
CODE="${DAR_VOICE_WEB_TOKEN:-}"
COOKIE_JAR="$(mktemp)"
trap 'rm -f "$COOKIE_JAR"' EXIT

if [[ -z "$CODE" ]]; then
  echo "FEHLER: DAR_VOICE_WEB_TOKEN fehlt." >&2
  exit 2
fi

ACCESS_JSON="$(python - "$CODE" <<'PY'
import json,sys
print(json.dumps({"code":sys.argv[1]}))
PY
)"

ACCESS_RESPONSE="$(curl -fsS   -c "$COOKIE_JAR"   -H 'Content-Type: application/json'   --data-binary "$ACCESS_JSON"   "$BASE/voice-studio/api/access")"

python - "$ACCESS_RESPONSE" <<'PY'
import json,sys
data=json.loads(sys.argv[1])
if not data.get("ok"):
    raise SystemExit("Cloud access exchange failed")
print("Cloud access session: OK")
PY

health(){
  curl -fsS -b "$COOKIE_JAR" "$BASE/voice-studio/api/engine/health"
}

HEALTH="$(health)"
python - "$HEALTH" <<'PY'
import json,sys
data=json.loads(sys.argv[1])
if not data.get("ok"):
    raise SystemExit("GPU engine health failed: "+str(data))
print("GPU gateway health: OK · engine",data.get("engine_version",""),"·",data.get("model_state",""))
PY

STATE="$(python - "$HEALTH" <<'PY'
import json,sys
print(json.loads(sys.argv[1]).get("model_state",""))
PY
)"

if [[ "$STATE" != "ready" ]]; then
  curl -fsS -b "$COOKIE_JAR" -H 'Content-Type: application/json' -d '{}'     "$BASE/voice-studio/api/engine/warmup" >/dev/null
  echo "Warmup angefordert …"
  for _ in $(seq 1 120); do
    HEALTH="$(health)"
    STATE="$(python - "$HEALTH" <<'PY'
import json,sys
print(json.loads(sys.argv[1]).get("model_state",""))
PY
)"
    if [[ "$STATE" == "ready" ]]; then
      echo "CUDA-Modell: bereit"
      exit 0
    fi
    sleep 2
  done
  echo "FEHLER: GPU-Modell wurde nicht rechtzeitig renderbereit." >&2
  exit 3
fi

echo "DĀR Voice Cloud-Smoke vollständig grün."
