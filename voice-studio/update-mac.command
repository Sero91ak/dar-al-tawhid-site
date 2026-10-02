#!/bin/bash
set -euo pipefail

TARGET="$HOME/Applications/DAR-Voice-Studio"
UPDATER_DIR="$TARGET/.updater"
LOG="$TARGET/update.log"
REMOTE_INSTALLER="https://api.github.com/repos/Sero91ak/dar-al-tawhid-site/contents/voice-studio/install-mac.command?ref=main"
SITE_INSTALLER="https://dar-al-tawhid.de/voice-studio/install-mac.command"
CODELOAD="https://codeload.github.com/Sero91ak/dar-al-tawhid-site/zip/refs/heads/main"
TMP="$UPDATER_DIR/install-current.command"
TMP_PART="$TMP.part"
ARCHIVE="$UPDATER_DIR/main.zip"
RUNNER="$UPDATER_DIR/run-update.command"

mkdir -p "$UPDATER_DIR" "$TARGET"
touch "$LOG"

log() {
  printf '%s\n' "$*" >>"$LOG"
}

log ""
log "=== $(date '+%Y-%m-%d %H:%M:%S') DĀR Voice Studio Update ==="
log "Lade aktuellen Installer …"

fetch_installer() {
  rm -f "$TMP_PART" "$ARCHIVE"

  log "Transport 1/3: GitHub Contents API"
  if /usr/bin/curl -fsSL --connect-timeout 5 --max-time 30 --retry 3 --retry-delay 1 \
      -H "Accept: application/vnd.github.raw+json" \
      -H "User-Agent: DAR-Voice-Studio-Updater/2.9.56" \
      "$REMOTE_INSTALLER" -o "$TMP_PART" >>"$LOG" 2>&1 \
      && [ -s "$TMP_PART" ] \
      && /usr/bin/head -n 1 "$TMP_PART" | /usr/bin/grep -q '^#!/bin/bash'; then
    mv "$TMP_PART" "$TMP"
    return 0
  fi

  rm -f "$TMP_PART"
  log "Transport 2/3: Website"
  if /usr/bin/curl -fsSL --connect-timeout 5 --max-time 30 --retry 2 --retry-delay 1 \
      -H "Cache-Control: no-cache" \
      -H "User-Agent: DAR-Voice-Studio-Updater/2.9.56" \
      "$SITE_INSTALLER?update=$(date +%s)" -o "$TMP_PART" >>"$LOG" 2>&1 \
      && [ -s "$TMP_PART" ] \
      && /usr/bin/head -n 1 "$TMP_PART" | /usr/bin/grep -q '^#!/bin/bash'; then
    mv "$TMP_PART" "$TMP"
    return 0
  fi

  rm -f "$TMP_PART"
  log "Transport 3/3: GitHub Repository-Archiv"
  if /usr/bin/curl -fL --connect-timeout 5 --max-time 60 --retry 3 --retry-delay 1 \
      -H "User-Agent: DAR-Voice-Studio-Updater/2.9.56" \
      "$CODELOAD" -o "$ARCHIVE" >>"$LOG" 2>&1 \
      && /usr/bin/unzip -p "$ARCHIVE" "dar-al-tawhid-site-main/voice-studio/install-mac.command" >"$TMP_PART" 2>>"$LOG" \
      && [ -s "$TMP_PART" ] \
      && /usr/bin/head -n 1 "$TMP_PART" | /usr/bin/grep -q '^#!/bin/bash'; then
    mv "$TMP_PART" "$TMP"
    return 0
  fi

  rm -f "$TMP_PART"
  return 1
}

if ! fetch_installer; then
  log "UPDATE-FEHLER: Installer konnte über keinen der drei Transporte geladen werden."
  exit 11
fi

chmod +x "$TMP"
if ! /bin/bash -n "$TMP" >>"$LOG" 2>&1; then
  log "UPDATE-FEHLER: Geladener Installer ist syntaktisch ungültig."
  exit 12
fi

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

log "Updater gestartet: PID $PID"
/usr/bin/osascript -e 'display notification "Update wird installiert. DĀR Voice Studio startet danach automatisch neu." with title "DĀR Voice Studio"' >/dev/null 2>&1 || true

exit 0
