#!/bin/bash
set -euo pipefail

TARGET="$HOME/Applications/DAR-Voice-Studio"
UPDATER_DIR="$TARGET/.updater"
LOG="$TARGET/update.log"
REMOTE_INSTALLER="https://raw.githubusercontent.com/Sero91ak/dar-al-tawhid-site/main/voice-studio/install-mac.command"
TMP="$UPDATER_DIR/install-current.command"

mkdir -p "$UPDATER_DIR" "$TARGET"
touch "$LOG"

{
  echo ""
  echo "=== $(date '+%Y-%m-%d %H:%M:%S') DĀR Voice Studio Update ==="
  echo "Lade aktuellen Installer …"
} >>"$LOG"

curl -fsSL "${REMOTE_INSTALLER}?cb=$(date +%s)" -o "$TMP"
chmod +x "$TMP"

/bin/bash -n "$TMP"

# Der eigentliche Installer muss unabhängig von der aktuell laufenden App leben,
# weil er die App während des atomaren Austauschs selbst beendet.
nohup /bin/bash "$TMP" >>"$LOG" 2>&1 </dev/null &
PID=$!

echo "Updater gestartet: PID $PID" >>"$LOG"
/usr/bin/osascript -e 'display notification "Update wird installiert. DĀR Voice Studio startet danach automatisch neu." with title "DĀR Voice Studio"' >/dev/null 2>&1 || true

exit 0
