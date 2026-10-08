#!/bin/bash
# Einmalige, lokale Signierung fuer DAR AL TAWḤĪD (Erwachsene + Android TV).
# Kein Android Studio erforderlich. Schluessel bleiben auf diesem Mac und in GitHub Actions Secrets.
set -euo pipefail
umask 077

REPO="Sero91ak/dar-al-tawhid-site"
BASE="$HOME/.dar-al-tawhid/website-apk-signing"
mkdir -p "$BASE"
chmod 700 "$BASE"

echo ""
echo "DAR AL TAWḤĪD · Android-Signierung einmalig einrichten"
echo "Erstellt 2 getrennte, dauerhaft verwendete Schluessel: Besucher-App und Android TV."
echo "Die Schluessel werden NICHT ins GitHub-Repository geladen."
echo ""

if ! command -v keytool >/dev/null 2>&1; then
  if [[ -x /usr/libexec/java_home ]]; then
    export JAVA_HOME="$(/usr/libexec/java_home -v 17 2>/dev/null || true)"
    if [[ -n "$JAVA_HOME" ]]; then export PATH="$JAVA_HOME/bin:$PATH"; fi
  fi
fi
if ! command -v keytool >/dev/null 2>&1; then
  echo "FEHLT: Java keytool. Auf dem Mac einmal JDK 17 installieren."
  echo "Beispiel mit Homebrew: brew install --cask temurin@17"
  exit 2
fi
if ! command -v gh >/dev/null 2>&1; then
  echo "FEHLT: GitHub CLI (gh). Einmalig installieren: brew install gh"
  echo "Danach mit gh auth login bei GitHub anmelden."
  exit 2
fi
if ! gh auth status -h github.com >/dev/null 2>&1; then
  echo "GitHub-Anmeldung ist erforderlich. Browseranmeldung wird gestartet."
  gh auth login --hostname github.com --git-protocol https --web
fi
if ! gh repo view "$REPO" --json name >/dev/null 2>&1; then
  echo "GitHub-Repository nicht zugaenglich: $REPO"
  exit 3
fi

echo ""
echo "Sicherungsordner auf dem Mac: $BASE"
echo "WICHTIG: Ohne diese Schluessel sind spaetere APK-Updates nicht signierbar."
read -r -p "Die Schluessel dort lokal erzeugen und als GitHub Secrets hinterlegen? [ja/NEIN] " CONFIRM
if [[ "$CONFIRM" != "ja" && "$CONFIRM" != "JA" ]]; then
  echo "Abgebrochen. Es wurde kein Schluessel angelegt."
  exit 0
fi

generate_and_store() {
  local tag="$1" alias="$2" prefix="$3"
  local keyfile="$BASE/$tag-signing.p12"
  local passfile="$BASE/$tag-signing-password.txt"
  local password
  if [[ -f "$keyfile" || -f "$passfile" ]]; then
    if [[ ! -s "$keyfile" || ! -s "$passfile" ]]; then
      echo "FEHLER: Unvollstaendiger vorhandener Schluessel. Bestehende Dateien werden NICHT ueberschrieben: $tag"
      return 1
    fi
    password="$(cat "$passfile")"
    echo "$tag: Vorhandenen Originalschluessel wiederverwenden."
  else
    password="$(openssl rand -hex 32)"
    printf '%s' "$password" > "$passfile"
    chmod 600 "$passfile"
    echo "$tag: Neuen Originalschluessel erzeugen ..."
    keytool -genkeypair -noprompt \
      -keystore "$keyfile" -storetype PKCS12 \
      -alias "$alias" -keyalg RSA -keysize 3072 -validity 10000 \
      -storepass "$password" -keypass "$password" \
      -dname "CN=DAR AL TAWHID, OU=Android Distribution, O=DAR AL TAWHID, C=DE"
    chmod 600 "$keyfile"
  fi
  keytool -list -keystore "$keyfile" -storepass "$password" -alias "$alias" >/dev/null
  printf 'GitHub-Secrets hochladen fuer %s ...\n' "$tag"
  base64 < "$keyfile" | tr -d '\n' | gh secret set "${prefix}_KEYSTORE_BASE64" --repo "$REPO"
  printf '%s' "$password" | gh secret set "${prefix}_STORE_PASSWORD" --repo "$REPO"
  printf '%s' "$alias" | gh secret set "${prefix}_KEY_ALIAS" --repo "$REPO"
  printf '%s' "$password" | gh secret set "${prefix}_KEY_PASSWORD" --repo "$REPO"
  echo "$tag: GitHub Actions Secrets gesichert."
}

generate_and_store "besucher" "dar-adult" "DAR_ANDROID_UPLOAD"
generate_and_store "fernseher" "dar-tv" "DAR_ANDROID_TV"

echo ""
echo "EINRICHTUNG ERFOLGREICH."
echo "Originalschluessel + Passwort-Sicherung befinden sich ausschliesslich in:"
echo "$BASE"
echo "Diesen Ordner zusaetzlich in einem verschluesselten, privaten Backup aufbewahren."
echo "Die geheimen Passwoerter niemals an ChatGPT senden oder ins Repository committen."
echo ""
echo "Naechster Schritt: signierte Release-APK/AAB ueber die GitHub Actions Android Pipeline bauen."
echo "Besucher-App und Android TV nutzen dauerhaft dieselben jeweiligen Schluessel."
