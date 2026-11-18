# DĀR AL TAWḤĪD KIDS — ausführbarer Work-Auftrag: Ṣidq vollständig LIVE

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
