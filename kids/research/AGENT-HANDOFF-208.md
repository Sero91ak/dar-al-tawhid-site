# DĀR AL TAWḤĪD KIDS AKADEMI — VERBINDLICHE QUELLEN- UND ARBEITSÜBERGABE
**Stand: 13. Oktober 2026 · Gilt für Claude Code, Codex, Cursor und alle nachfolgenden Bearbeiter.**

> **Dies ist eine interne Arbeitsanweisung, keine Besucheroberfläche.** Grundlage ist die unmittelbar zuvor erstellte maschinenlesbare Gesamtakte `kids/research/academy-208-research-ledger-v1.json`, nicht ein vom Modell neu erfundener Themenplan. Lies **vor jeder Codeänderung** `AGENTS.md`. Es gibt **keine Genehmigung**, den Kinderbereich auf `main` oder in die Besucher-App zu veröffentlichen.

## 0. ZUERST VERBINDLICH LESEN

| Originaldatei | Was dort maßgeblich festgelegt ist |
| --- | --- |
| `AGENTS.md` | Verbot fremder App-Spuren, Schutz von Service Worker, Push, Manifest, Nutzer-/Kinderfortschritt; nicht live ohne Freigabe |
| `kids/research/academy-208-research-ledger-v1.json` | **Alle 208 konkreten Unterrichtsslots**, 52 Wochen, jeder bestehende Lesson-ID und alle noch offenen Originaltitel, Unterrichtssituationen und Altersziele, Quellenhinweise und offengelegte Forschungsstände |
| `kids/data/academy-year-52weeks-v1.json` | Pädagogischer Jahrestakt: vier neue, zwei Wiederholungs- und ein flexibler Tag/Woche; genau 208 neue Einheiten |
| `kids/data/academy-expansion-roadmap-v23.json` | Die 118 offenen Einheiten **91–208** mit unveränderbarer Slot-Reihenfolge, Pillar, Szenario, Lernziel und gesperrtem Release-Gate |
| `kids/unterrichtsarchiv.html` | Archiv-Snapshot der bestehenden Texte und Quellen; zuerst Versionsgleichheit mit Live-Curriculum prüfen |
| `kids/akademie/curriculum-v1.js`, `curriculum-v2.js`, `curriculum-v22.js`, `curriculum-v25.js` bis `curriculum-v35.js` | Bestehende Inhalte, Datenformen, ältere und neue Altersstrukturen |
| `kids/akademie/index.html` | UI-Lader, Kategorien, Auswahl und Aufgaben. **Nur** erforderliche neue Curriculum-Script-Referenzen ergänzen. |
| `kids/akademie/school-progress-v11.js` | Historisch fixierte 1→208-Reihenfolge, Profil- und Altersisolation, tägliche Freigabe, Speicherung. **Nicht** neu indizieren. |
| `kids/item-offline-v1.js` | Offline-Liste für Items. Eine Listenergänzung **beweist noch keine vollständige PWA-Offlinenutzung**; keinen geschützten SW ohne Auftrag ändern. |
| `kids/data/academy-voice-policy-v10.json` | Besitzerstimme, ElevenLabs V4, manuelle Freigabe; **in dieser Phase keine Audioerzeugung und keine Credits**. |
| `kids/tools/test-academy-sequential-lock-v27.cjs`, `scripts/test-kids-academy-v9.js` und `.github/workflows/check-kids-academy-v9.yml` | Prüfungen für Duplikate, Altersbereiche, Freischaltregeln, Quellen und Dateiintegration |

## 1. IST-ZUSTAND UND UNGESCHÖNTE BESTANDSAUFNAHME

- **208** feste Unterrichtsslots; **90** sind im unveröffentlichten Feature-Branch `kids/lessons-67-70-20261012` eingetragen; **118** bleiben als `editorial-outline-only` **91–208** gesperrt. Aktueller `main`-Stand und offener PR-Status müssen vor Arbeit neu ermittelt werden; nicht automatisch 90 als live bezeichnen.
- Das Archiv enthält **89 reguläre Lehrmodule plus Unterricht `sidq` als gesonderten Sonderfall**. In der angelegten Quellenakte haben **56** Module bereits eine explizite, vierzeilige `ageText`-Fassung für **alle drei** Altersbereiche; andere ältere Module benutzen teils `lines`/andere Muster und benötigen individuelle Prüfung und ggf. Migration. **Keine fälschliche Behauptung**, alle 90 seien bereits als drei eigenständige Alterslektionen fertig.
- **56** Module haben ein `sourceAudit`-Metadatenobjekt; ein vorhandenes Metadatenfeld oder `religiousSourcesVerified:true` ersetzt **keine unabhängige Originalquellenprüfung**. Der maschinenlesbare Ledger bezeichnet nur **sechs** Ziel-Ḥadīṯe (79, 82–86) als in dieser Recherche extern abgeglichen; alle anderen Quellen bleiben bei ihrem expliziten Nachprüfungsstatus.
- Offene, getrennte Pull Requests: **#1089 Kids-Inhalte**, **#1090 Test-App-Prüfregeln**. CI kann bei unterschiedlichen, hartkodierten Zählwerten scheitern; Test- und Kids-Spur **nicht** in einem Misch-Commit zusammenfassen. Vor Freigabe dürfen **keine CI-Fehler ignoriert** werden.
- Audio: Bestehende Sprechtext-Queue-Dateien sind **keine Freigabe**. **Jetzt keine Audio-Aufnahmen, ElevenLabs-Aufrufe, Voice-Clones, Credits, Freigaben, Platzhalter-Stimmen oder automatische TTS-Fallbacks** erzeugen. Audio kommt **erst nach abgeschlossener Quellen-/Unterrichtsprüfung**.

## 2. QUELLENHIERARCHIE — NICHT ABWEICHEN

1. **Qurʾān**: Vers mit korrekter Sūrah/Āyah; der gesamte übernommene arabische Originaltext **zeichengetreu** gegen eine verlässliche Muṣḥaf-Ausgabe prüfen, bei Auszügen `excerpt:true` und Versspanne korrekt markieren. Deutsche Bedeutungsübersetzungen *ausdrücklich sinngemäß* kennzeichnen. Keine erfundene arabische Form.
2. **Authentische Sunnah**: Vorzugsweise al-Buḫārī/Muslim; sonst verifizierte authentische Überlieferungen. Für **jede** verwendete Aussage Matn/Ṭarīq-Kontext, arabische Textstelle, Sammler, Nummer, Rāwī, Grad und direkt zum Text führende Quelle prüfen. Keine erfundene Nummer oder unpassende URL, auch wenn die Domain echt ist. Keine schwachen Geschichten als authentisch.
3. **Ṣaḥābah/Ṣaḥābiyyāt; Tābiʿīn/Tābiʿiyyāt; Atbāʿ at-Tābiʿīn; Salaf aṣ-Ṣāliḥ**: Nur nachvollziehbar überlieferte Athār; vollständige Quelle, Werk, Band/Seite/Nummer/Edition, Arabisch, Überlieferungsqualität soweit feststellbar; Zitat/Paraphrase klar unterscheiden.
4. **Frühe und klassische Imāme/Gelehrte**: Nur bei fachlichem Bedarf und mit überprüfbarer Zuschreibung. **Fiqh primär hanbalitisch**; die anerkannte Gegenposition bei echtem Ikhtilāf sachlich nennen, niemals den Kinderunterricht durch Polemik ersetzen. Keine ungekennzeichnete Theologie fremder Lehrschulen übernehmen.
5. **Didaktik**: Erfundene Unterrichtsbeispiele, Bilder, Dialoge, Szenen und Lernhilfen ausdrücklich als **eigene Beispiele** markieren. Sie sind **keine** Sunnah, nicht einmal dann, wenn sie aus einem echten allgemeinen Grundsatz folgen.

**Die für die Recherche zugelassenen Portale in dieser Reihenfolge:** `islamweb.net` → `shamela.ws` → `dorar.net` → `al-maktaba.org` / `ketabonline.com` → `archive.org` / `waqfeya.net` → `app.turath.io`. Benutze eine **konkrete Fundstellen-URL**, möglichst Textfragment `#:~:text=` oder Scan-`#page=`. Ein allgemeiner Suchtreffer/Hauptseitenlink gilt nicht als Quellenbeleg. Gesonderter Originalvergleich ist zulässig; publizierte Quellenlinks gemäß dieser Portalregel.

### Bereits unabhängig abgeglichene **Einzelbelege** (Auswahl, keine Pauschalfreigabe ganzer Lektionen)

| Slot | Inhalt | Prüffundstelle | Ergebnis |
| --- | --- | --- | --- |
| 79 | Sanftmut / höflich bitten | Ṣaḥīḥ Muslim **2593**, `https://dorar.net/hadith/sharh/26226` | Die Dorar-Seite zeigt den Muslim-2593-Text im Kontext; die Seitenüberschrift ist eine andere Riwayah. Pädagogische \"Bitte\"-Regel ist Anwendung. |
| 82 | Wuḍūʾ nach Ḥadaṯ | Ṣaḥīḥ al-Buḫārī **135**, `https://dorar.net/hadith/sharh/6252` | Text und Nummer stimmen; die Gebetszeit selbst ist **kein** Nullifikator. |
| 83 | al-Falaq beim Schlafengehen | Ṣaḥīḥ al-Buḫārī **5017**, `https://dorar.net/hadith/sharh/151175` | Überlieferte Rezitation zusammen mit al-Ikhlāṣ und an-Nās; keine synthetische Qurʾān-Rezitation. |
| 84 | Ibrāhīm und Ismāʿīl beim Kaʿbah-Bau | Ṣaḥīḥ al-Buḫārī **3364**, **Originaltext** `https://dorar.net/h/RIbF20cQ?osoul=1` unter `أصول الحديث` | In früheren Fassungen waren `sharh/138076` und `sharh/1884` unpassende Haupteinträge. **Nur diesen Originalbeleg** zur Baugeschichte führen, dann Archiv und Ledger synchronisieren. |
| 85 | Worte beim Aufwachen | Ṣaḥīḥ al-Buḫārī **6312**, `https://dorar.net/hadith/sharh/1652` | Originaltext nennt *sowohl* vor dem Schlafen als auch beim Aufwachen unterschiedliche Worte. |
| 86 | Sich im Zorn beherrschen | Ṣaḥīḥ al-Buḫārī **6114** / Muslim **2609**, `https://dorar.net/hadith/sharh/10213` | Keine Pflicht zu erzwungener Versöhnung bei Gewalt. |

Die genannten sechs Prüfungen bestätigen den **jeweiligen Ḥadīṯ-Bezug**, nicht automatisch alle arabischen Versstrings, Übersetzungen, Fiqh-Interpretationen, Kindertexte oder Quizfragen dieser Lektionen.

**Beispiel für streng zu behandelnden Fehler:** Eine Dorar-URL kann existieren und zugleich einen **anderen** Ḥadīṯ über dieselbe Person zeigen. Deshalb müssen **Textidentität, Überlieferer und Nummer** miteinander abgeglichen werden. Kein `startsWith('https://dorar.net/')`-Check allein kann dies bestätigen.

## 3. EXAKTER UNVERÄNDERLICHER THEMENPLAN

**Vorrang haben einzig die 208 Einträge in `kids/research/academy-208-research-ledger-v1.json`.** Ihre `slot`-Nummern 1–208 sind die verbindliche Reihenfolge. Bei `status: editorial-outline-locked` sind **Titel, Themenbereich, Szenario und Altersziele bereits vorgegeben**, die religiösen Primärbelege aber **noch nicht nachgewiesen**. Die erste neue Einheit ist aktuell **91: „Danke und Entschuldigung sagen“**, gefolgt von **92: „Bei Problemen Hilfe holen“**, **93: „Dankbarkeit im Herzen“**, **94: „Wuḍūʾ: Waschen und Streichen unterscheiden“**. Nicht bei 1 anfangen, keine neue freie 208er-Liste erfinden, keine vorhandenen Lektionen überschreiben.

Die nächsten Themen nur aus dem bestehenden `plannedUnits`-Array konsumieren; niemals pauschale Mustertexte ausfüllen. **Jede Lektion eigenständig**, keine Wort-für-Wort-Austauschschablonen.

## 4. VOLLSTÄNDIGKEIT JE LEKTION (VERSCHIEDENE ALTERSSKRIPTE)

Für **jede** Lektion muss nach der Forschung das bestehende Curriculum-Datenmodell vollständig vorliegen:

- `id` (eindeutig, stabil), `subject` (`aqidah`, `adab`, `akhlaq`, `fiqh` gemäß Bestand), `pillar`, `topic`, `title`, `lead`, `goal`.
- `quran: {surah, ayah, label, arabic, meaning, excerpt}`; Versspanne und Arabisch exakt geprüft.
- `hadith: {source,text}` nur dann als authentisch, wenn Matn und Grad kontrolliert sind. Wo sachlich kein eigener Ḥadīṯ nötig oder vorhanden ist: **keinen erfinden, sondern Datenmodell nach ausdrücklicher Validierung für `noHadithRequired` erweitern**; die Pflicht, für jeden Platz einen Ḥadīṯ zu erfinden, existiert nicht.
- `sourceAudit`: direkter Originalnachweis, Werk/Nummer/Überlieferer/Grad, Qurʾān-Stelle, Art der Übersetzung, eigener kritischer Kommentar, **per-claim Prüfstatus und Datum**. Externe Belegprüfung getrennt von Metadatenvorhandensein und Freigabe.
- **4–5 Jahre**: ca. 6–9 Minuten, sichere einfache Erzählweise, eigenständiger Einstieg, vier kurze Lehrsätze, zwei verständliche, unterscheidbare Lernfragen.
- **6–8 Jahre**: ca. 10–14 Minuten, Beispiele und Quelle erklären, vier altersgerechte Lehrsätze, mindestens drei sinnvolle Fragen.
- **9–10 Jahre**: ca. 14–18 Minuten, Qurʾān/Sunnah-Beleg unterscheiden, Bedeutung und Anwendung kritisch verstehen, vier eigene Lehrsätze, mindestens drei Fragen.
- `ageText[age]: {intro,lines:[4],evidence}`, `questions[age]` mit funktionierenden `choice`- oder `text`-Antworten, `hint`, `explain`/`sample`, `correct` bei Auswahlfragen. Keine offenliegenden Testwörter.
- Kinderwohl: Keine anmaßenden Angst-/Strafnarrative, kein Druck, keine beschämenden Quizantworten, kein Zwang zur Geheimhaltung vor sicheren Erwachsenen, kein gefährlicher Gehorsam. Auch nichtmuslimische Kinder nicht abwerten. Sīrah- und Qurʾāngeschichten **keine erfundenen Szenen, Dialoge, Gesichter oder Propheten-Abbildungen**.
- `voiceApproved:false`; **kein** öffentliches `audioUrl`, keine V4-Gutschrift, kein Auto-TTS, keine generierte Tilāwah.

**Alte Lektionen 1–34:** Einträge ohne ausdrückliches Dreialters-`ageText` individuell prüfen, das alte Format dokumentieren, ohne vorhandene Leser-/Quiz-/Fortschrittsfunktionen blind zu löschen. Migration nur mit Regressionstest; vormalige `sidq`-Sonderbehandlung erhalten.

## 5. CODE-/APP-ARBEIT UND MENGENPRODUKTION

1. **Git status/main/branch/PR/CI neu lesen.** Branch kann parallel aktualisiert werden. Nie `push --force` oder blindes Überschreiben; bei Änderungen neu lesen und konfliktfrei übernehmen.
2. **Quellen-QA zuerst**: jede bestehende Primärbehauptung mit Original abgleichen, besonders Altmodule und isolierte Sonderfälle. Fehler im `sourceAudit` + fachlich zutreffenden Text beheben; Archiv- und Ledger-Snapshot immer konsistent halten.
3. **Massenproduktion in thematisch sinnvollen Blöcken von höchstens 12–20 Slots** (jeweils 3 Altersstufen). Textgenerierung darf automatisiert sein, Quellenidentität und Glaubens-/Fiqh-Aussage **nicht unkontrolliert**.
4. Neue Module `kids/akademie/curriculum-vNN.js` an vorhandenes Objekt anhängen, Schema unverändert, `DARKidsAcademyCurriculumVNN.ids` in Slot-Reihenfolge. In `index.html` nur neuen Script-Eintrag ergänzen.
5. JSON für Jahresplan und Roadmap, freigeschaltete ID-Sequenz in `school-progress-v11.js`, Archiv-Snapshot, notwendige Offline-Referenzen und Tests **atomar oder in einem nachprüfbaren Commit** angleichen. Bei GitHub-409-Fehler Commit erneut anhand frischer SHA versuchen; niemals `main` korrumpieren.
6. `sidq` bleibt Slot 1, sämtliche vorhandenen Lesson-IDs bleiben **positionsgleich**; andere Alters- oder Geschlechtsprofile, gespeicherte Ergebnisse, Streaks, Quiz und Lock-Daten nicht überschreiben. Vier Lerntage, zwei Wiederholungstage und ein flexibler Tag pro Woche bleiben unverändert.
7. **Keine Änderungen** an `kids/sw.js`, Push, Manifest, nativer App, `index.html` der Erwachsenen-App, Android/iOS, Themes, Navigation oder Test-App im selben Kids-Commit ohne separaten expliziten Auftrag. In der Kids-App vorhandene Mädchen-/Jungen-Designs nicht neutralisieren.
8. Produktionspläne für Stimmen dürfen vorhandene Daten referenzieren; **keine neuen Medien generieren**. Audio folgt als eigenes späteres Projekt nach fachlicher Textabnahme.

## 6. PFLICHTPRÜFUNGEN UND FREIGABESTUFEN

- Zählung **exakt**: 52 Wochen, 208 neue Slots; jede Slot-Nummer genau einmal; `uniqueLessonIds === implementedCount`; `implementedCount + remainingCount === 208`; keine Lücken vor dem ersten offenen Slot.
- `node --check` für jedes neu erzeugte JS, JSON.parse aller Daten, JS VM-Laden der kompletten Curriculum-Kette, jedes `ageText` / `questions` nach Schema prüfen.
- `node kids/tools/test-academy-sequential-lock-v27.cjs`
- `node kids/tools/test-academy-v23-roadmap.cjs`
- `node scripts/test-kids-academy-v9.js`
- Weitere im CI-Workflow `.github/workflows/check-kids-academy-v9.yml` tatsächlich aufgerufene Kids-, Voice- und Offline-Guards ausführen. **Nie** rote CI durch Löschen des Tests, Streichen der Assertion oder pauschales Ignorieren als \"grün\" ausgeben.
- **Spur-Trennung:** `test/kids/**`-Guard-Fixes nur in einem eigenen Test-App-PR, Kids nur im Kids-PR. Derzeit existiert Test-PR **#1090**. Für Test-Code nicht Kids und Test gemeinsam committen.
- Freigabestatus vierfach separat dokumentieren: `codeIntegrated`, `religiousSourcesIndependentlyVerified`, `pedagogyReviewed`, `ownerApprovedForLive`. Alle **nicht gleichsetzen**.
- Ein guter automatischer Test überprüft **Konsistenz**, er ist keine islamwissenschaftliche Begutachtung. Kein Upload von als ungeprüft gekennzeichnetem Unterricht auf öffentliche Besucher-URLs.

## 7. AUSGABEN, DIE DER NÄCHSTE AGENT ABGEBEN MUSS

In jeder Teilabnahme:
1. Slotbereich, IDs, genaue Unterrichtstitel, drei Altersfassungen, Anzahl und Qualität der Aufgaben.
2. **Einzelquellen je Lektion**: Originalarabisch, Sūrah/Āyah oder Ḥadīṯsammlung/Nummer/Rāwī/Grad, funktionierender konkreter Direktlink, geprüfte Textstelle, abweichende Lesarten oder Unsicherheiten. Nicht verifizierte Quelle ausdrücklich als Sperre vermerken.
3. Geänderte Dateien, keine Fremd- oder Systemdateien, Git-Commit/PR, tatsächliche Tests samt rotem/grünem Status.
4. Neuer Stand `X / 208`, `208 - X` offen, genaue Zahl **quellengeprüft**, **altersvollständig**, **audiolose Unterrichtsskripte**.
5. Ein `blocked-review`-Protokoll aller widersprüchlichen Fiqh-, Qurʾān- oder Ḥadīṯ-Referenzen und aller fehlenden Texte. Nichts stillschweigend fälschen oder ersetzen.

## 8. STOPP-/SCHUTZREGELN

**In dieser Phase nicht:** Audios produzieren; Geld/Credits verwenden; Besucher-App deployen; Testwortlaut veröffentlichen; ungeprüfte Āthār/Aqīdah-Zitate übernehmen; Propheten abbilden; eine bestehende Lektion duplizieren oder Kinderprofile zurücksetzen.

**Autonom arbeiten:** fehlende 118 Originalslots in gültiger Reihenfolge erstellen, älteres Material kontrollieren und ggf. migrieren, Quellen nachweisen, Kinderschutz und Dreialters-Qualität prüfen, CI reparieren **innerhalb der jeweiligen App-Spur**, alles auf einem Review-Branch dokumentieren. **Vor dem Merge auf `main` explizite Freigabe des Nutzers einholen.**

---
**Forschungsstand kann wachsen, aber nie künstlich als geprüft gelten.** `kids/research/academy-208-research-ledger-v1.json` bei jeder Kursintegration mit den tatsächlich verifizierten Direktbelegen fortschreiben und den Original-Jahresplan als Quelle bewahren.
