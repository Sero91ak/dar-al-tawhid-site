#!/usr/bin/env bash
# Owner-operated Android TV / Google TV remote smoke test.
# Installs only de.daraltawhid.tv.debug, NEVER the public TV package.
# Requires ADB connection and the internal debug APK from the successful QA run.
set -euo pipefail

APK="${1:-}"
SERIAL="${2:-}"
if [[ -z "$APK" || ! -f "$APK" ]]; then
  echo >&2 "Aufruf: bash tv_device_remote_qa.sh /Pfad/zur/tv-debug.apk [ADB-SERIAL]"
  exit 2
fi
if [[ "$(basename "$APK")" != "tv-debug.apk" ]]; then
  echo >&2 "Sicherheitssperre: Nur tv-debug.apk, niemals die öffentliche signierte APK."
  exit 2
fi
command -v adb >/dev/null || { echo >&2 "Android Platform-Tools (adb) fehlen."; exit 2; }
ADB=(adb)
if [[ -n "$SERIAL" ]]; then ADB+=( -s "$SERIAL" ); fi
if [[ "$("${ADB[@]}" get-state)" != "device" ]]; then
  echo >&2 "Kein freigegebenes Android-TV-Gerät per ADB erreichbar."
  exit 2
fi

OUTPUT="$PWD/TV_QA_$(date +%Y%m%d-%H%M%S)"
mkdir -p "$OUTPUT"
printf '%s\n' "DĀR AL TAWḤĪD TV · Native ADB smoke test" \
  "Testgerät: $("${ADB[@]}" shell getprop ro.product.model | tr -d '\r')" \
  "Android: $("${ADB[@]}" shell getprop ro.build.version.release | tr -d '\r')" \
  "Paket: de.daraltawhid.tv.debug" \
  "Datum: $(date -u +%Y-%m-%dT%H:%M:%SZ)" > "$OUTPUT/INFO.txt"

echo "Installiere ausschließlich Debug-App, ohne bestehende öffentliche TV-App zu verändern ..."
"${ADB[@]}" install -r "$APK" >/dev/null
"${ADB[@]}" shell pm list packages de.daraltawhid.tv.debug | grep -Fq 'package:de.daraltawhid.tv.debug' ||
  { echo >&2 "Debug-Paket fehlt – Stopp."; exit 1; }

"${ADB[@]}" shell am force-stop de.daraltawhid.tv.debug
"${ADB[@]}" shell am start -W -n de.daraltawhid.tv.debug/de.daraltawhid.tv.TvActivity \
  > "$OUTPUT/LAUNCH.txt"
sleep 4

capture() {
  local label="$1"
  "${ADB[@]}" exec-out screencap -p > "$OUTPUT/$label.png"
  test -s "$OUTPUT/$label.png"
}

capture "01_gebetszeiten"
for pair in "02_heute" "03_kalender" "04_quran"; do
  "${ADB[@]}" shell input keyevent KEYCODE_DPAD_RIGHT
  "${ADB[@]}" shell input keyevent KEYCODE_DPAD_CENTER
  sleep 3
  capture "$pair"
done

# Back should first return home; without any back stack crashes.
"${ADB[@]}" shell input keyevent KEYCODE_BACK
sleep 2
capture "05_zurueck"

echo "Warte 65 Sekunden für den in-App-Leerlauf-Bildschirmschoner ..."
sleep 65
capture "06_bildschirmschoner_65s"
"${ADB[@]}" shell input keyevent KEYCODE_DPAD_CENTER
sleep 2
capture "07_bildschirmschoner_aufwecken"

"${ADB[@]}" shell dumpsys activity activities > "$OUTPUT/ACTIVITY.txt"
"${ADB[@]}" logcat -d -t 8000 -v time > "$OUTPUT/LOGCAT.txt"

if grep -Eq '(FATAL EXCEPTION:|Process: de\.daraltawhid\.tv\.debug.*FATAL)' "$OUTPUT/LOGCAT.txt"; then
  echo >&2 "Warnung: Crash-Meldung im Log. QA NICHT BESTANDEN."
else
  echo "Keine offensichtliche FATAL EXCEPTION im gesammelten Log."
fi

cat <<EOF >> "$OUTPUT/INFO.txt"

Noch manuell visuell und akustisch zu prüfen:
- Vier Originalbereiche; D-pad Focus, keine fehlerhaften Kacheln.
- 1080p und 4K: Titel/Text/arabischer Qurʾān und Hintergrundposition.
- Rezitator-Picker, Āyah Play/Pause/Stop/Weiter, Audio ohne Überlagerung.
- Faǧr- und regulärer Adhān, zeitgenaue Auslösung, keine Duplikate.
- Kaaba-Szenenauswahl und gespeicherte Auswahl nach Neustart.
- Bildschirmwache nach 60s, erste Taste darf keinen darunterliegenden Button aktivieren.
- Offline/WLAN-Ausfall und Wiederverbindung mit stabiler Inhaltsanzeige.
- Alte öffentliche App bleibt installiert und ist weiterhin unverändert.
EOF
echo "QA-Dateien unter: $OUTPUT"
echo "HINWEIS: ADB-Screenshots ersetzen keine Audio-/Hardware- und Nutzerabnahme."
