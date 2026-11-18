# DĀR AL TAWḤĪD KIDS · VOLLSTÄNDIGE LERNAKADEMIE

## Verbindlicher ausführbarer Auftrag an ChatGPT Work

**Nutzerfreigabe:** Die Produktion mit der bestehenden Serhat-V4-Masterstimme, Verarbeitung der Fuṣḥā-Audiobibliothek, technisch gesicherte Übernahme der Medien und direkte Veröffentlichung sind freigegeben. Keine vorgeschalteten Einzel-Hörproben anfordern. **Keine Wiederholung kostenpflichtiger Generierungen, wenn dieselbe authentische Aufnahme bereits existiert.**

**Ziel:** Die **gesamte** Lernakademie nach und nach bis zum tatsächlichen Live-Stand aller **208** vorgesehenen Unterrichtseinheiten fertigstellen; **ein ganzes Thema fertig → veröffentlichen → auf realem Gerät prüfen → erst dann das nächste Thema**. Nicht 208 gleichzeitig veröffentlichen. Sorgfalt bei Unterricht, Fakten, Quellen, Aussprache, Schülerschutz und Bestandssicherung. „Erzeugt“ und „live“ strikt unterscheiden.

### 1. Projekt und bestehende Arbeitsgrundlage

Repository: `Sero91ak/dar-al-tawhid-site`, produktiver Branch `main`. Vorhandener Arbeitszweig `codex/academy-source-numbers-not-spoken`, PR **#1792**. Produktive Kinder-Akademie: `https://dar-al-tawhid.de/kids/akademie/`.

Hauptregister: `kids/data/academy-full-release-sequence-v1.json`.
Es enthält **66 codegestützte Lektionen**, für die inzwischen alle Quelldialoge in 9 Sprachplänen erfasst sind, sowie **142 nur redaktionell skizzierte Themen**, die bisher **weder freigeschaltete Lektionen noch authentifizierte Quellenausarbeitungen** sind. Alter **4–5**, **6–8**, **9–10**. Jungens- und Mädchenprofile mit korrekter Anrede.

Kanonische Unterrichtsdateien: `kids/akademie/index.html`, `kids/akademie/curriculum-v1.js`, `curriculum-v2.js`, `curriculum-v22.js`, `curriculum-v25.js`, `curriculum-v26.js`, `curriculum-v27.js`, `curriculum-v28.js`, `curriculum-v29.js`. Bestehende V9/V18/V22/V24/V25/V26/V27 Sprachpläne und **neu erstellte** `kids/data/academy-voice-plan-v28.json` (164 Quelltexte) sowie `academy-voice-plan-v29.json` (163 Quelltexte) berücksichtigen.

Bei jeder Änderung `node kids/tools/test-academy-full-208-release-v1.cjs` sowie `node scripts/test-kids-academy-audio-queue-v18.js` ausführen. Die neue Gesamtabdeckung muss **alle 66** heutigen Unterrichtslektionen und **142** geplante, ausdrücklich gesperrte Rohentwürfe exakt unterscheiden.

### 2. Thema 1 sofort vollständig LIVE: Akhlāq / Ṣidq

Die Sachtexte und V4-TTS-Generierungen wurden vorbereitet. In **einem** bestehenden ElevenLabs-Flow `zrB4zGdz9OTndLryQtIB` gibt es **76 bereits bezahlte und als abgeschlossen dokumentierte Generationen**:

45 komplette deutsche Audiotexte, 22 deutsche Sprachsegmente für gemischte Sätze, 9 in arabischer Schrift vokalisierte Fuṣḥā-Master (einschließlich vollständigem Salām). Die 9 gemischten Sätze nach vorhandenen Segmentplänen zusammenfügen. Drei alte, exakt passende V4-Pilotaufnahmen nur bei gültigem Medien-Hash wiederverwenden.

**Keine neuen TTS-Generierungen für Ṣidq.** Bestehende `generationId` und `sessionId` stehen in den sechs registrierten V4-Batch-Dateien `akhlaq-sidq-elevenlabs-v4-generations-b01..b04.json`, `akhlaq-sidq-de-fragments-b05..b06.json` und `akhlaq-sidq-fusha-term-audio-v1.json`.

Für die Übernahme die 76 **originalen** ElevenLabs-MP3s herunterladen. Dazu entweder Work Cloud Browser mit verbundenem ElevenLabs-Konto oder eine andere autorisierte Umgebung verwenden; **keine ausgedachten Audio-Dateien oder Shell-Befehle, die so tun, als wären Dateien heruntergeladen**. Die echten, kurzlebigen signierten Content-URLs niemals in Git, Commit-Logs oder öffentliche Chat-Antworten kopieren.

Vorbereitete Werkzeuge:

```bash
python3 kids/tools/test-academy-download-gate-v1.py
python3 kids/tools/download-academy-elevenlabs-originals-v1.py --status --source-dir /tmp/dar-kids-sidq-originals
# Zuerst alle signierten Original-URLs privat als JSON bereitstellen.
python3 kids/tools/download-academy-elevenlabs-originals-v1.py \
  --download --signed-urls /tmp/elevenlabs-sidq-signed-urls-private.json \
  --source-dir /tmp/dar-kids-sidq-originals
python3 kids/tools/import-publish-academy-sidq-v4-v1.py --dry-run
python3 kids/tools/import-publish-academy-sidq-v4-v1.py \
  --import --source-dir /tmp/dar-kids-sidq-originals
```

**Pflicht vor Live-Commit:** Die tatsächlichen 76 Audiodateien samt SHA-256-Provenienzregister, MP3-Codecs/Laufzeiten, alle 58 kanonischen eindeutigen Unterrichts-Textschlüssel, 9 echte DE/AR-Kompositionen und drei Originalpiloten überprüfen. Sicherstellen, dass der public `kids/owner-voice.js` die neue exakt ausgewiesene V4-Aufnahme tatsächlich lädt, statt an `voiceSettingsProfile`-Metadaten zu scheitern. Die Creative-Schnittstelle hat **nur stability 0.62 und similarity 0.88** unterstützt; **speed 0.91, style 0.16 und die private Aussprache-PLS wurden nicht angewandt**. Deswegen nicht wahrheitswidrig behaupten, die alte exakte `kids_story`-Konfiguration sei vollständig wiederhergestellt. Keine falschen `sameAsApprovedKidsStoryProfile`-Kennzeichen. Bei rechtmäßigem Profiladapter alle Schutztests ergänzen.

Qurʾān-Verse **niemals synthetisch rezitieren**: vorhandenen authentischen Rezitator verwenden. Koranstelle und Ḥadīṯ-Nummer in der UI sichtbar lassen, aber keine Referenznummern in die religiöse Aussage hineinerzählen. Arabische Formeln `ﷺ`, Qurʾān, Ṣidq, Ṣiddīq, Sūrat at-Tawbah und vollständigen Salām sauber als natürliche **arabische** Phonetik segmentieren. Die freigegebene eigene Fuṣḥā-Audiobibliothek über den vorhandenen DĀR-Voice-Studio-Backendpfad nutzen, sobald er verfügbar ist; die Creative-Schnittstelle **kann das private Wörterbuch nicht setzen**. Bereits generierte arabische Segmente niemals ohne sachlichen Grund doppelt berechnen.

Nach vollständiger Prüfung **einen** sauberen PR/Merge nach `main`, die vorhandene Cloudflare-Pipeline abwarten, die live manifestierte Version und die tatsächliche Erreichbarkeit **aller 58** neuen Aufnahmen prüfen, Jungen-/Mädchenprofile, 3 Alter, Fragebuttons, Hören/Mitlesen auf iPhone/iPad testen. **Erst nach tatsächlichem Live-Erfolg** `release-state-v1.json` mit `liveConfirmed:true`, Live-Commit und Prüfzeit aktualisieren. Kein geheimer Zugangswert in Repository oder Antwort.

### 3. Alle übrigen heutigen 65 Unterrichtsthemen

Nach Ṣidq: **Ṣabr → Amānah → weitere Lektionen** in der Reihenfolge von `academy-full-release-sequence-v1.json`.

Für jedes Thema ausschließlich die **eigenen** Sprachtexte aus den vorhandenen Sprachplänen herausnehmen; dieselben exakten Sprechsätze nur einmal produzieren und auf korrekte Kontexte mappen. Jedes Thema umfasst **alle** Altersfassungen und Aufgaben einschließlich Antworten und pädagogischer Hinweise. Wort-/Namen-/Fuṣḥā-Aussprache anhand vorhandener bibliothekseigener Varianten prüfen; bei fehlenden Begriffen die vokalisierte arabische Schreibweise anhand Qurʾān, Sunnah, früher Quellen suchen, sicher normieren und getrennt von deutschsprachigen Sätzen verarbeiten. Die alte PLS nicht ungeprüft auf Deutsch anwenden (z. B. deutsches „Nur“ ist nicht automatisch arabisches `an-Nūr`).

Sobald alle Dateien einer ganzen Lektion echt vorliegen, die Quellen-/Hash-Prüfung besteht und der Player korrekt zugeordnet ist, **diese ganze Lektion direkt live** ausliefern; nicht auf ein weiteres Thema warten. Profile, Fortschritte, bereits existierende Audio-/Quiz-/Duʿāʾ-Bereiche, `AGENTS.md` und `STABILITY.md` respektieren. Keine neuen Nutzerfreigaben einholen; die bestehende Nutzerfreigabe ist erteilt.

### 4. Die 142 noch nicht implementierten Einheiten (Slots 67–208)

Die aktuellen Einträge in `kids/data/academy-expansion-roadmap-v23.json` sind **redaktionelle Entwürfe**, keine fertig geprüften Lernlektionen. Aus jedem Eintrag eine **eigene** authentifizierte Lektion erstellen, mit eindeutigen IDs, verifizierten passenden Qurʾān-Versen, belastbaren authentischen Sunnah-Quellen, deutlich als Erklärung erkennbaren deutschen Paraphrasen, vollständig eigenständigen kinderfreundlichen Fassungen für 4–5, 6–8, 9–10 sowie Auswahlfragen/Antwortbuttons. Keine Schreib- oder Sprechzwangsbuttons. Keine historischen Aussagen oder Ḥadīṯ-Quellen erfinden. Für Fiqh sachliche Prüfung nach im Projekt festgelegten Regeln; wenn eine Stelle nicht eindeutig belegt ist, nicht erfinden und diese konkrete Veröffentlichung blockieren.

Danach für die neue Lektion die exakten Sprachtexte in den V4-Sprachkatalog exportieren, Fuṣḥā-Probleme deterministisch aufteilen, vorhandene Serhat-Masterbibliothek nutzen, nur fehlende **wirkliche** TTS-Medien abrechnen, echte Dateien sichern, SHA-256 und Zuordnung prüfen und vollständig **live veröffentlichen**. Erst danach die nächste. Die redaktionellen 142 werden **nicht automatisch** als freigegebene Kinder-Lektionen behandelt, nur weil eine Unterrichtsüberschrift existiert.

### 5. Erfolgskriterien und ehrlicher Status

**Nicht** als fertig melden: nur PR erstellt, Textkatalog vorhanden, ElevenLabs-Flow „completed“, CI grün, Dateien nur in Staging, GitHub ohne Cloudflare-Push, App-Platzhalter-Audio, geänderte interne Statuszahlen.

**Fertig** ist eine einzelne Lektion erst, wenn echte Master-Sprachdateien im aktiven Repository liegen und über den produktiven Player auf beiden Profilen und allen drei Altersstufen verfügbar sind; authentische Quellen und Quizfunktionen stimmen.

**Gesamte Lernakademie fertig** erst bei **208/208 echten Lektionen**, 0 audiofreien Pflichttexten, gesicherten Fuṣḥā-Begriffen, quellensicheren Inhalten, 0 Fortschrittsverlusten und im produktiven Cloudflare-Stand verifizierten Veröffentlichungen.

**Bei technischen Blockern:** Die existierenden Generationen erhalten, keinen erneuten Kauf erzwingen, keine erfundenen Dateien erzeugen. Genaue blockierende Aktion und bereits geprüfte Repo-/Audio-Identifikatoren dokumentieren; an der nächstmöglichen unabhängigen Aufgabe weiterarbeiten.

**Stand bei Erstellung (18.11.2026):** 76 Ṣidq-Aufnahmen bei ElevenLabs abgeschlossen/dokumentiert; **0 neue Original-Audios als Binärdatei in GitHub**, **0 neue Ṣidq-Aufnahmen im Live-Player**. 66 Lektionen mit Voice-Textplänen, 142 Unterrichtsentwürfe. Dieser Auftrag ist eine konkrete ausführbare Work-Checkliste und **selbst kein gestarteter Hintergrundauftrag**.
