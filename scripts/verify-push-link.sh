#!/usr/bin/env bash
set -euo pipefail

# Verifies Web+App OneSignal linking for a given external ID (dar-…).
# Usage:
#   ONESIGNAL_API_KEY=… ./scripts/verify-push-link.sh dar-abc123…
# Optional: WORKER_URL, ONESIGNAL_APP_ID

EXTERNAL_ID="${1:-}"
APP_ID="${ONESIGNAL_APP_ID:-786d7cd6-0455-4434-ab14-0c10a7bc6b1e}"
API_KEY="${ONESIGNAL_API_KEY_NEW:-${ONESIGNAL_API_KEY:-${ONESIGNAL_APP_API_KEY:-}}}"
WORKER_URL="${PRAYER_PUSH_WORKER_URL:-https://dar-admin-publisher.sero91ak.workers.dev}"

if [[ -z "$EXTERNAL_ID" ]]; then
  echo "Usage: ONESIGNAL_API_KEY=… $0 <external-id>" >&2
  exit 1
fi

echo "==> External ID: $EXTERNAL_ID"

if [[ -n "$API_KEY" ]]; then
  echo "==> OneSignal: lookup user by external_id"
  BODY=$(python3 - <<PY
import json
print(json.dumps({
  "app_id": "$APP_ID",
  "include_aliases": {"external_id": ["$EXTERNAL_ID"]},
  "target_channel": "push",
  "headings": {"en": "[Link-Test] DĀR AL TAWḤĪD"},
  "contents": {"en": "Web+App-Verknüpfungstest für $EXTERNAL_ID"},
  "data": {"type": "link-test", "dar": "link-test"}
}))
PY
)
  for AUTH in "Key" "Basic"; do
    RESP=$(curl -sS -w "\n%{http_code}" -X POST "https://api.onesignal.com/notifications" \
      -H "Content-Type: application/json; charset=utf-8" \
      -H "Authorization: ${AUTH} ${API_KEY}" \
      -d "$BODY") || true
    CODE="${RESP##*$'\n'}"
    JSON="${RESP%$'\n'*}"
    echo "OneSignal HTTP $CODE ($AUTH): $JSON"
    if [[ "$CODE" == "200" ]]; then break; fi
  done
else
  echo "==> OneSignal API key fehlt – überspringe Alias-Versand"
  echo "    Setze ONESIGNAL_API_KEY_NEW und starte erneut."
fi

echo "==> Supabase: Registrierungen für Präfix"
python3 - <<PY
import json, urllib.request, os
prefix = "$EXTERNAL_ID".split("-")[0] + "-"
url = "https://djyfkttjbdraynuxrzno.supabase.co/rest/v1/prayer_push_registrations?select=device_id,subscription_id,user_agent,last_synced_at&device_id=like." + prefix + "*&order=last_synced_at.desc&limit=10"
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqeWZrdHRqYmRyYXludXhyem5vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4NjE1MTUsImV4cCI6MjA5NjQzNzUxNX0.PUzkuxpJVWeW64nSAVW61KqYDE5k1d4sAir2unXKjxw"
req = urllib.request.Request(url)
req.add_header("apikey", key)
req.add_header("Authorization", f"Bearer {key}")
rows = json.loads(urllib.request.urlopen(req, timeout=30).read())
print(f"Treffer für {prefix}*: {len(rows)}")
for r in rows:
    print(f"  {r.get('device_id')} | {r.get('user_agent','?')[:24]} | sub …{(r.get('subscription_id') or '')[-8:]}")
PY

echo "==> Fertig. Im OneSignal-Dashboard: Audience → Users → External ID = $EXTERNAL_ID"
