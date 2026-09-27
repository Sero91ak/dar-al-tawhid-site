#!/bin/bash
set -euo pipefail

TARGET="$HOME/Applications/DAR-Voice-Studio"
UPDATER_DIR="$TARGET/.updater"
LOG="$TARGET/update.log"
REMOTE_INSTALLER="https://api.github.com/repos/Sero91ak/dar-al-tawhid-site/contents/voice-studio/install-mac.command?ref=main"
TMP="$UPDATER_DIR/install-current.command"
RUNNER="$UPDATER_DIR/run-update.command"

mkdir -p "$UPDATER_DIR" "$TARGET"
touch "$LOG"

{
  echo ""
  echo "=== $(date '+%Y-%m-%d %H:%M:%S') DĀR Voice Studio Update ==="
  echo "Lade aktuellen Installer …"
} >>"$LOG"

curl -fsSL \
  -H "Accept: application/vnd.github.raw+json" \
  -H "User-Agent: DAR-Voice-Studio-Updater" \
  "$REMOTE_INSTALLER" -o "$TMP"
chmod +x "$TMP"

/bin/bash -n "$TMP"

cat > "$RUNNER" <<'RUNNER_EOF'
#!/bin/bash
set -u
INSTALLER="$1"
LOG="$2"

{
  echo "Starte validierten Voice-Studio-Installer …"
  if /bin/bash "$INSTALLER"; then
    echo "Update erfolgreich abgeschlossen: $(date '+%Y-%m-%d %H:%M:%S')"
    /usr/bin/osascript -e 'display notification "Update erfolgreich installiert." with title "DĀR Voice Studio"' >/dev/null 2>&1 || true
    exit 0
  fi

  code=$?
  echo "UPDATE-FEHLER: Installer beendet mit Code $code"
  /usr/bin/osascript -e 'display notification "Update fehlgeschlagen. Voice Studio wurde nicht ersetzt. Details: update.log" with title "DĀR Voice Studio"' >/dev/null 2>&1 || true
  exit "$code"
} >>"$LOG" 2>&1
RUNNER_EOF
chmod +x "$RUNNER"

# Runner und Installer liegen außerhalb des App-Bundles und überleben dessen Austausch.
nohup /bin/bash "$RUNNER" "$TMP" "$LOG" >/dev/null 2>&1 </dev/null &
PID=$!

echo "Updater gestartet: PID $PID" >>"$LOG"
/usr/bin/osascript -e 'display notification "Update wird installiert. DĀR Voice Studio startet danach automatisch neu." with title "DĀR Voice Studio"' >/dev/null 2>&1 || true

exit 0
