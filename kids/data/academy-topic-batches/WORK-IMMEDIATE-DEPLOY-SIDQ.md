# DĀR AL TAWḤĪD KIDS — ausführbarer Work-Auftrag: Ṣidq vollständig LIVE


## AKTUALISIERTE PRODUKTIONSLAGE — 20.11.2026 (VORRANG VOR DEM HISTORISCHEN 18.11.-PLAN)

Die 58 kanonischen Ṣidq-V4-Sprachdateien sind bereits im produktiven Audio-Manifest `kids/data/academy-audio.json` verzeichnet; nach dem GitHub-Live-Prüfprotokoll wurden deren originale Dateien gegen Cloudflare per SHA-256 abgeglichen. **Das beweist noch keine vollständige Endgeräte-/iOS-Abnahme.** Die historischen Angaben unten zum fehlenden Import *dieser 58 Dateien* sind überholt und dürfen keinesfalls zu erneuter kostenpflichtiger Produktion oder blindem Reimport führen.

Die zusätzlichen **14 tatsächlich anklickbaren, aber noch nicht mit genau passendem Audio versorgten Inhalte** wurden seitdem separat ermittelt: neun kindgerechte Begriffserklärungen (`Ṣidq`, `Sunnah`, `Qurʾān` in je drei Altersgruppen), vier Antworten und eine Frage. Alle notwendigen **20 neuen Originalsegmente** sind im vorhandenen ElevenLabs-V4-Flow abgeschlossen und in `akhlaq-sidq-14-missing-real-v4-plan-v1.json` mit **exakten `sessionId`/`generationId`-Paaren** hinterlegt; das bestehende Salawāt-Original `GBmSBMXAo9AwPA58e87w` ist wiederzuverwenden. Der zugehörige Klicklücken-Abgleich liegt in `akhlaq-sidq-visible-click-gaps-v1.json`. **Diese 14 fertig aufgenommenen Inhalte sind nicht in der App hörbar**, solange die neuen Original-Bytes nicht sicher importiert und die neun gemischtsprachigen Fassungen nicht exakt zusammengesetzt wurden. Nicht neu generieren.

**Jetzt allein diese Produktionslücke abschließen:**
1. Die 20 vorhandenen Generationen anhand der dokumentierten IDs sicher aus dem bereits existierenden Flow exportieren; keine neuen TTS-Aufrufe, keine signierten Links committen.
2. Die neun Erklärungstexte aus ihren exakten DE+AR-Segmenten zu jeweils drei Altersfassungen zusammensetzen; die fünf bereits vollständigen Frage-/Antwort-Originale unverändert übernehmen. Verwende das vorhandene Salawāt-Original dort, wo es im Plan angegeben ist. Keine Quellenkommentare, Audiozahlen oder Metadaten als Kinder-Audio einbauen.
**Ab sofort vorhandener ausführbarer Offline-Importer (keine neuen Credits):**

```sh
python3 kids/tools/import-academy-sidq-click-gaps-v1.py --dry-run
python3 kids/tools/import-academy-sidq-click-gaps-v1.py --import --source-dir /privat/elevenlabs-sidq-originals
node kids/tools/test-academy-term-coach-v24.cjs
```

Das Original-Verzeichnis muss **21 echte MP3** enthalten: 20 neue Generationen plus `GBmSBMXAo9AwPA58e87w.mp3` aus der früheren Ṣidq-Produktion. Der Importer akzeptiert nur die im aktuellen Plan geprüften IDs und wandelt Dateien nicht durch TTS um. Die erzeugten `kids/assets/kids-academy-audio/sidq-click-*.m4a`, das aktualisierte öffentliche Manifest und beide Topic-Statusdateien zusammen committen. Anschließend nach Cloudflare-Live-Prüfung den tatsächlichen Release-Status separat bestätigen.

3. Alle 14 endgültigen `.m4a`-Dateien akustisch-technisch (Codec, Länge, Segmentfolge), per SHA-256 und exaktem sichtbarem Sprechtext kontrollieren, im öffentlichen Academy-Manifest eintragen und jeden Hörbutton mit **genau diesem** verifizierten Original verbinden. Für vorhandene 58 Clips keine doppelten Gebühren.
4. Nur den notwendigen Code + reale Audiodateien durch die bestehenden GitHub-Guards und den produktiven Cloudflare-Deploy schicken. Prüfe öffentliche Audio-URLs, angeklickte Worterklärungen, Fragen und Antworten in drei Altersgruppen und Jungen-/Mädchenprofilen. Erst danach wird der 14er-Block auf **live** gesetzt.
5. Die Kinder-App verwendet seit Commit `760a821ab842359f693deecf339b8acf0a105a8b` eine reparierte Quellen-/Begriffslogik; der zugehörige Cloudflare-Deploy `44718879100` wurde mit `success` abgeschlossen. Diese Korrektur bewahren und nicht durch einen alten PR-Stand überschreiben.
6. Erst nach Abschluss von Ṣidq den nächsten Unterricht **Akhlāq / Ṣabr** in allen drei Altersgruppen produzieren und live veröffentlichen.

Die folgende älteste Aufgabenbeschreibung bleibt ausschließlich zur historischen Nachvollziehbarkeit erhalten. Vor allem die dortige 76er-Importreihenfolge darf **nicht** mehr als einziger heutiger Blocker verstanden werden.

## Autorisierung und Ziel

Der Besitzer hat am 18.11.2026 ausdrücklich vollständige Produktion und direkte Live-Veröffentlichung ohne vorgelagerte Hörproben freigegeben. **Keine weiteren kostenpflichtigen ElevenLabs-Generierungen durchführen.** Es liegen bereits **76 reale, abgeschlossene ElevenLabs V4-Masteraufnahmen** unter der **bestehenden** geklonten Stimme `Serhat Abu Malik – Master` (`DkU7j9uO4ZEtLD2iRZSH`) im ElevenLabs-Flow `zrB4zGdz9OTndLryQtIB`:

https://elevenlabs.io/app/flows/zrB4zGdz9OTndLryQtIB

Die 76 Tondateien umfassen 45 komplette deutsche Ṣidq-Sprechtexte, 9 arabische, vokalisierte Fuṣḥā-Aufnahmen (darunter die komplette Salām-Formel) und 22 deutsche Fragmente für neun gemischtsprachige Sätze. Drei genau passende ältere V4-Pilot-Audiodateien sind bereits im GitHub-Repository und werden wiederverwendet.

**Nur ein Thema**: Akhlāq / Ṣidq. Nicht zu Ṣabr, Adab, Fiqh oder ʿAqīdah wechseln, bevor Ṣidq vollständig live ist.

## Eigentliche verbleibende Aufgabe: Dateien, Assemblierung und Live-Deployment

1. Das verbundene GitHub-Repo `Sero91ak/dar-al-tawhid-site` öffnen, PR #1792 / Zweig `codex/academy-source-numbers-not-spoken` verwenden. Bisherigen App-Stand auf main nicht überschreiben.
2. Im **bestehenden** ElevenLabs-Flow alle 76 bereits bezahlten MP3-Originale über ihre `generationId` exportieren. Die ID-Zuordnung steht vollständig in:
   - `akhlaq-sidq-elevenlabs-v4-generations-b01.json`
   - `akhlaq-sidq-elevenlabs-v4-generations-b02.json`
   - `akhlaq-sidq-elevenlabs-v4-generations-b03.json`
   - `akhlaq-sidq-elevenlabs-v4-generations-b04.json`
   - `akhlaq-sidq-de-fragments-b05.json`
   - `akhlaq-sidq-de-fragments-b06.json`
   - `akhlaq-sidq-fusha-term-audio-v1.json` (9 Arabic masters).
   
   Die 76 Downloads in einem Arbeitsverzeichnis **nach ihrer Generation-ID** als `<generationId>.mp3` speichern. **Keine erneute TTS-Erzeugung, keine privaten signierten Downloadlinks in öffentliche GitHub-Commits oder Logs schreiben.** Vorhandene Generierungen nicht ersetzen.
3. Einmalig den kostenlosen Manifest-Test ausführen:

   ```bash
   python3 kids/tools/import-publish-academy-sidq-v4-v1.py --dry-run
   ```

   Erwartet: `canonicalPhrases:58`, `reusedPriorV4:3`, `directV4:45`, `mixedSentenceAssemblies:9`, `nativeArabicTerms:9`, `originalGenerationFilesRequired:76`.
4. Bei real vorhandenen Dateien den Besitzerauftrag sofort ausführen:

   ```bash
   python3 kids/tools/import-publish-academy-sidq-v4-v1.py --import --source-dir /pfad/zum/heruntergeladenen/originalverzeichnis
   ```

   Das Skript konvertiert 76 tatsächliche Originale nach `.m4a`, verbindet die neun DE+AR-Sätze mit getrennten Fuṣḥā-Begriffen, nutzt drei historische Serhat-V4-Aufnahmen wieder und trägt genau **58 individuelle Ṣidq-Sprachtexte** in das öffentliche, exakte Manifest `kids/data/academy-audio.json` ein.
5. Wegen der expliziten Nutzerfreigabe **keine zusätzliche manuelle Nutzer-Hörprobe** als Voraussetzung verlangen. Automatische Integritätsprüfung (Dateiformat/SHA, Quelle/IDs, Quelle/Kontext, Erreichbarkeit) beibehalten. **Nicht behaupten, die Audioaufnahmen seien menschlich abgehört worden.** Die Creative-TTS-Verbindung unterstützt V4-`stability:0.62`/`similarity:0.88`, aber nicht die alte Geschwindigkeit `speed:0.91` oder eine per TTS angehängte private PLS-Dictionary-ID; die Audios dürfen nicht als unter diesem nicht unterstützten Parameter gerendert ausgegeben werden. Native arabische Segmente wurden stattdessen mit voller Vokalisation und `language_code:ar` generiert.
6. Alle tatsächlichen `.m4a`-Dateien, das aktualisierte Audio-Manifest sowie `release-state-v1.json` sauber committen, PR #1792 nach erfolgreichen Repository-Guards mergen und die **produktive** Cloudflare-Workers-Static-Assets-Webseite `https://dar-al-tawhid.de/kids/akademie/` aktualisieren. Die produktive URL gegen den realen `main`-Stand und das aktuelle Manifest verifizieren; jedes der 58 benötigten Audio-URLs muss real auslieferbar sein. iPhone/iPad und Jungen-/Mädchenprofile technisch überprüfen, damit kein Text ohne verknüpfte Serhat-Aufnahme bleibt.
7. Nur nach erfolgreichem **wirklichen Live-Push** in `release-state-v1.json` `liveConfirmed:true` samt Commit und Prüfzeit eintragen. Dann erst Akhlāq / Ṣabr als nächstes Thema bearbeiten.

## Schutz gegen falsche Erfolgsmeldungen

Aktueller geprüfter Zustand: 76 ElevenLabs-Generierungen vorhanden; originale Audio-Dateien **noch nicht als Bytes in GitHub importiert**, neun Mischsprach-Sätze noch nicht zusammengesetzt, neuer produktiver Ṣidq-V4-Player-Stand noch nicht live. Eine fertige Generation im ElevenLabs-Canvas ist **keine** live verfügbare Audio-Datei in der Kids-App.

Die ältere geschützte Akademie-Staging-Logik und gespeicherte Lernfortschritte der Kinder bleiben unberührt. Alle Sprechtext-Schlüssel sind exakt; Qurʾān-Rezitationen verbleiben bei authentischen Rezitatoren, nicht bei synthetischem ElevenLabs-TTS.

## 18.11.2026 · Neuer gesicherter Null-Credit-Download (bevorzugt statt manuellem Umbenennen)

Ein zusätzlicher Downloader ist verbindlich vorbereitet:
`kids/tools/download-academy-elevenlabs-originals-v1.py`.

Alle Dateien stammen aus dem **bestehenden** Flow und werden anhand der 76 kanonischen Paare aus `sessionId` und `generationId` zugeordnet. In Work die **aktuellen** vollständigen signierten URLs der vorhandenen Generationen lesen (keine neuen TTS-Generierungen) und lokal in einer **nicht committen** JSON-Datei speichern:

```json
{
  "items": [
    {
      "generationId": "EINE_BEREITS_BESTEHENDE_GENERATION_ID",
      "contentUrl": "https://elevenlabsusercontent.com/database/workspace/.../content_generation/SESSION_ID/GENERATION_ID/content.mp3?Expires=...&KeyName=...&Signature=..."
    }
  ]
}
```

Alle 76 realen Einträge sind erforderlich; hier wird nur das Datenformat dargestellt. **Echte private signierte URLs oder Zugangstokens niemals öffentlich in GitHub oder das Chat-Protokoll schreiben.** Auch die private URL-Datei darf nicht in Git landen.

Zuerst kostenlos und ohne Netzwerkanfrage prüfen:

```sh
python3 kids/tools/test-academy-download-gate-v1.py
python3 kids/tools/download-academy-elevenlabs-originals-v1.py --status --source-dir /tmp/dar-kids-sidq-originals
```

Dann vorhandene, schon bezahlte Originale sicher laden, ohne ElevenLabs erneut aufzurufen:

```sh
python3 kids/tools/download-academy-elevenlabs-originals-v1.py \
 --download \
 --signed-urls /tmp/elevenlabs-sidq-signed-urls-private.json \
 --source-dir /tmp/dar-kids-sidq-originals

python3 kids/tools/import-publish-academy-sidq-v4-v1.py --dry-run
python3 kids/tools/import-publish-academy-sidq-v4-v1.py \
 --import --source-dir /tmp/dar-kids-sidq-originals
```

Der neue Downloader verifiziert den Host gegen `elevenlabsusercontent.com`, konkrete Session-/Generation-ID, Signaturfelder, URL-Ablaufzeit, MP3-Codec, Laufzeit und Dateigröße, lädt in eine temporäre Datei und verschiebt sie atomar nach `<generationId>.mp3`. Wiederholungen verwenden die vorhandenen Originale ohne doppelte Downloads; es wird ein SHA-256-Provenienzregister neben den Dateien ausgegeben. **Keine TTS-Credits** durch diesen Ablauf.

Status dieses Chats: Der Downloadpfad und Sicherheitstests sind im PR hinterlegt. Der hier vorhandene Chat-Container kann keine Originale aus den kurzlebigen ElevenLabs-Links beziehen und hat keinen GitHub-Binary-Upload-Token. Daher wurden weiterhin keine echten Bytes importiert und kein Live-Deployment behauptet. Diesen Schritt mit der verbundenen Work-Cloud-Computer-Umgebung ausführen.
