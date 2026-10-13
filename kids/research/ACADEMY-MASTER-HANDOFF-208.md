# DĀR AL TAWḤĪD KIDS AKADEMI — VERBINDLICHER AGENT-MASTERAUFTRAG

**Stand der Übergabe:** 13.10.2026 · **Projekt:** 52 Unterrichtswochen, 208 eigenständige neue Unterrichtseinheiten, je drei Altersgruppen 4–5, 6–8, 9–10 · **Audio:** später, ausdrücklich NICHT jetzt erzeugen.

## 0. STOPP: erst Repository-Zustand lesen

Du bist ein ausführender Engineering- und religionswissenschaftlicher Rechercheagent im GitHub-Repository **Sero91ak/dar-al-tawhid-site**. Arbeite eigenständig anhand dieses Dokuments und der realen Dateien, nicht aus Chat-Gedächtnis, Vermutungen oder generischen Prompts.

Pflichtdateien vor dem ersten Commit, in dieser Reihenfolge:

1. `AGENTS.md`: höchste technische Repository-Schutzregeln.
2. `kids/research/academy-208-research-ledger-v1.json`: **maßgebliche Rechercheakte aller 208 Unterrichtsplätze**; Quellenstatus jedes Themas, Vorhandenes, geplante Einheiten.
3. `kids/research/academy-118-quran-candidates-v1.json`: **alle 118 ausstehenden Themen** mit individuellen thematischen Qurʾān-Vorschlägen. **Alle Vorschläge sind UNGEPRÜFT** und dürfen nicht als Beleg ohne Einzelfallprüfung übernommen werden.
4. `kids/data/academy-year-52weeks-v1.json`: 52 Wochen, 208 feste Slots, vier neue Unterrichtstage pro Woche (Mo/Di/Do/Fr), 2 Wiederholungs- und 1 flexibler Tag.
5. `kids/data/academy-expansion-roadmap-v23.json`: verbleibende Titel, Säulen, Unterrichtsszenarien, altersbezogene Lernziele und gesperrte Entwurfsplätze.
6. `kids/akademie/index.html`: echte Kinder-App, bestehende Loader und Rendering-Struktur.
7. `kids/akademie/curriculum-v1.js`, `curriculum-v2.js`, `curriculum-v22.js`, `curriculum-v25.js`, `curriculum-v26.js`, `curriculum-v27.js`, `curriculum-v28.js` bis zum **wirklich neuesten** `curriculum-vNN.js`: Originaldatenstruktur und bereits besetzte IDs.
8. `kids/akademie/school-progress-v11.js`: unveränderliche Lernreihenfolge/Abschluss und Freischaltsperren.
9. `kids/unterrichtsarchiv.html`: redaktionelles Archiv mit eingebettetem ARCHIVE_SNAPSHOT; zählt **alle** Lektionen außer eigenständiger Sonderlektion `sidq`.
10. `kids/item-offline-v1.js` und `kids/data/academy-voice-policy-v10.json`: Offline-Verweise und streng geschützte Stimmregeln.
11. `.github/workflows/check-kids-academy-v9.yml`, `kids/tools/test-academy-208-research-ledger-v1.cjs`, `kids/tools/test-academy-sequential-lock-v27.cjs`, `kids/tools/test-academy-v23-roadmap.cjs`: Bestands-, Quellen- und Lernstandsprüfungen.
12. Offene Pull Requests #1089 (Kids-Curriculum) und #1090 (separat Test-Lane); aktuellste Branch-Commits und CI-Ausgaben. Prüfe VOR dem Schreiben, ob parallel neue Lektionen entstanden sind.

**Am 13.10.2026 verifizierte Ausgangslage:** `main` enthält 66 integrierte Unterrichtsplätze; der noch nicht gemergte Kids-Arbeitszweig `kids/lessons-67-70-20261012` enthält 90/208, mit 118 offenen Plätzen 91–208. Die mitlesbare Rechercheakte zählt 90 formal besetzte Slots, 56 explizit ausgearbeitete Altersstrukturen, 56 Source-Audit-Metadatensätze und nur 6 gesonderte externe Stichprobenprüfungen. Diese Kategorien sind NICHT austauschbar: **integriert ≠ fachlich bestätigt ≠ vom Inhaber freigegeben ≠ live**.

Vor Übernahme rebase/merge-Konflikte kontrolliert auflösen; niemals Inhalte duplizieren, vorhandene IDs umbenennen, die Zahl 90 blind festschreiben oder die echte aktuelle Lage überspringen.

## 1. Wissenschaftliche Quellenhierarchie — Pflicht, keine Ausnahme

### Primärquellen

1. **Qurʾān**: tatsächliche Sūrah, genaue Āyah-Grenzen, fehlerfrei aus einer vertrauenswürdigen arabischen Textquelle entnommener Wortlaut; Kontext und einschlägige Tafsīr-Stellen prüfen. Wenn nur ein Ausschnitt verwendet wird, zwingend `excerpt:true` und exakte Passage erhalten. Deutsche Übersetzung als **sinngemäße Bedeutungswiedergabe** kennzeichnen.
2. **Authentische Sunnah**: nach Möglichkeit Ṣaḥīḥ al-Buḫārī/Ṣaḥīḥ Muslim; ansonsten authentisch bewertete Berichte mit gesonderter Isnād-/Grad-Prüfung und dokumentierter Wertung. Bei jedem Ḥadīṯ: arabischer Originaltext oder genaues belegtes Fragment, Überlieferer, Werk, Nummer, tatsächlicher Grad, direkter URL-Beleg, relevanter Wortlaut und dessen Aussagegrenze. Nie aus einer Suchergebnis-Kurzbeschreibung „ṣaḥīḥ“ folgern.
3. **Ṣaḥābah/Ṣaḥābiyyāt, Tābiʿīn/Tābiʿiyyāt, Atbāʿ at-Tābiʿīn, frühe Salaf**: nur echte, identifizierbare Überlieferungen. Originalwerk, arabisches Zitat, Authentizität/Überlieferungskette soweit möglich, Band/Seite/Nummer, direkter Fundstellenlink oder gescannte Ausgabe; strittige/unklare Āṯār als unbestätigt markieren und **nicht** als sicheren Schulbeleg veröffentlichen.
4. **Frühe klassische Kommentare und qualifizierte Gelehrte** zur Erklärung schwieriger Sachverhalte; bei Fiqh der hanbalitischen Rechtsschule besondere Priorität geben. Für den Hanbalī-Nachweis u. a. Ibn Qudāmah, `al-Mughnī` und `al-Kāfī`, authentische Werkstellen aus `islamweb.net`, `shamela.ws`, `app.turath.io` oder gescannter Ausgabe prüfen. Zwischen hanbalitischer Ansicht, Iǧmāʿ und Ikhtilāf sauber unterscheiden; keine persönliche Fatwā oder falschen Konsens behaupten.

**Erlaubte Rechercheportale** — Suchpriorität für Primärbelege: `islamweb.net` → `shamela.ws` → `dorar.net` → `al-maktaba.org` / `ketabonline.com` → `archive.org` / `waqfeya.net` → `app.turath.io`. Bei Ḥadīṯ und Tafsīr darf Dorar für eine genaue Originalfundstelle direkt herangezogen werden.

### Konkrete überprüfte Beispiel-Einstiege, NICHT Blindvorlagen

- Qurʾān/Tafsīr für al-Ikhlāṣ 112:1–4: https://dorar.net/tafseer/112/1 . Der *inhaltlich passende* Abschnitt ist zu prüfen, nicht bloß der Link.
- Authentischer Schlaf-/Aufwach-Dhikr von Ḥuḏayfah, al-Buḫārī 6312: https://dorar.net/hadith/sharh/1652 .
- Authentischer Ḥadīṯ zur Reinheit vor dem Gebet, al-Buḫārī 135 und Muslim 225: https://dorar.net/hadith/sharh/6251 . Die Seite enthält ggf. eine andere Einzelnennung im Titel; prüfe im `takhrij` ausdrücklich die angegebenen Sammlungsnummern.
- Hanbalitische Primärliteratur: `al-Mughnī` von Ibn Qudāmah im Islamweb-Bibliotheksbereich: https://islamweb.net/ar/library/content/15/15/ . Keine Kapitelnummer oder Rechtsmeinung erfinden.

Die vollständige **208-Slot-Ledger-Datei** dokumentiert 6 separat kontrollierte Fälle zu Slots 79, 82, 83, 84, 85 und 86; darüber hinaus vorhandene Quellenmetadaten sind lediglich Forschungsbelege mit unterschiedlichem Vertrauensniveau. Achte besonders bei Slot 84 auf die dort dokumentierte Korrektur: ein alter Sharḥ-Link war nicht der richtige Originalbeleg für al-Buḫārī 3364. **Ein funktionierender Link ist kein Nachweis für den behaupteten Inhalt.**

### Verbindlicher Einzelfall-Quellenaudit pro Unterricht

Für jede Lektion erstelle einen maschinell prüfbaren Audit-Datensatz mit:
- `slot`, `lessonId`, `topic`, `pillar`;
- `quran.surah`, `quran.ayahStart`, `quran.ayahEnd`, `quran.exactArabic`, `quran.excerpt`, `quran.meaningDe`, `quran.directLink`, `quran.tafsirSource`;
- `hadith.originalArabic`, `hadith.narrator`, `hadith.collection`, `hadith.number`, `hadith.grade`, `hadith.gradeScholar`, `hadith.directUrl`, `hadith.evidenceScope`, `hadith.meaningDe`;
- `salafEvidence` (optional, nur verifizierte Berichte), `hanbaliRuling` (Fiqh), `classroomApplication`, `interpretationBoundary`;
- `verificationStatus` mit `candidate`, `source-checked`, `pedagogy-reviewed`, `human-approved`; `checkedOn` und `reviewer` nur bei tatsächlicher Prüfung befüllen;
- `arabicIntegrity`, `sunnahGradeVerified`, `contextVerified`, `noInventedSource`, `safeForChild` als echte Prüfungsergebnisse, nicht automatisch vorbelegt.

**Fehlt ein belegter Bezug, bleibt die Lektion gesperrter redaktioneller Entwurf.** Die 118 Qurʾān-Kandidaten wurden nur als thematische Arbeitshilfe vorbereitet; **für alle muss arabischer Wortlaut, Versumfang, Kontext und genaue Eignung erneut geprüft werden**. Die Sunnah-Belege für diese 118 Slots sind noch zu recherchieren: Keine auswendig geratenen Nummern, keine fiktiven Direktlinks, keine behauptete Gesamtfreigabe.

## 2. Alterspädagogik und exakter Inhalt je Slot

Jede der **208 eigenständigen Themen** hat drei eigenständige, nicht bloß automatisch vereinfachte Fassungen:

### Vier bis fünf Jahre
- etwa 6–9 Minuten, kurze deutsche Sätze, ein Kerngedanke, vier miteinander sinnhaft verbundene Lehrzeilen.
- Zwei kindgerechte, eindeutig unterscheidbare Quizfragen; eine ungefährliche Alltagshandlung, erwachsene Begleitung.
- Kein Unterricht mit religiöser Angstmacherei, Scham, Bildschock oder unverstandenen schwierigen Glaubensbegriffen.

### Sechs bis acht Jahre
- etwa 10–14 Minuten, vier lehrreiche Erklärzeilen, drei eigene Prüf-/Reflexionsfragen, eine alltagsnahe kleine Handlung.
- mindestens ein im Inhalt tatsächlich passender Qurʾān- und ein authentisch überprüfter Sunnah-Beleg.
- arabische Ausdrücke mit deutscher Bedeutungsangabe.

### Neun bis zehn Jahre
- etwa 14–18 Minuten, vier gehaltvolle Lehrzeilen und drei altersgerechte Prüf-/Reflexionsfragen.
- Original und Paraphrase unterscheiden, Belege verbinden, bei klassischen Auslegungen oder Fiqh mögliche Unterschiede korrekt einordnen.
- Keine polemischen Urteile über andere Gruppen, keine kindlichen Takfīr-Situationen oder erfundenen prophetischen Dialoge.

**Feste Lesson-Datenform** aus dem existierenden JS-Katalog übernehmen: `id`, `subject`, `pillar`, `topic`, `title`, `lead`, `goal`, `quran`, `hadith`, `sourceAudit`, `hint`, `sample`, `ageText["4-5"|"6-8"|"9-10"]`, `questions[age]`, `voiceApproved:false`. Bestehende Darstellungsfunktionen erwarten genau diese Felder. IDs ausschließlich neu und fortlaufend ergänzen, nie bestehende IDs verändern.

Anwendungen sind als **eigene Pädagogik** gekennzeichnet und werden nicht als Qurʾān-/Ḥadīṯzitat ausgegeben. Wird ein Schulbeispiel erfunden, kennzeichne es intern ausdrücklich als erfundenes Unterrichtsbeispiel.

## 3. Inhaltliche Gliederung: alle 208 Plätze bleiben exakt erhalten

Der vorhandene Plan kennt diese 12 Säulen: **tawhid, iman, ikhlas, akhlaq, adab, tarbiyah, nafs, fiqh, quran, sirah, dua, family**. Nicht auf eine kleinere Themensammlung reduzieren, nicht aus 52 Wochen versehentlich nur 52 Lektionen machen.

Die erste offene Position ist laut Handoff-Datenstand **Slot 91**. Reihenfolge für den ersten Arbeitsblock aus der verbindlichen Roadmap:
- 91: Danke und Entschuldigung sagen (adab)
- 92: Bei Problemen Hilfe holen (tarbiyah)
- 93: Dankbarkeit im Herzen (nafs)
- 94: Wuḍūʾ: Waschen und Streichen unterscheiden (fiqh)
- 95: Sūrat an-Nās kennenlernen (quran)
- 96: Mūsā عليه السلام und Mut (sirah)
- 97: Vor dem Lernen um Hilfe bitten (dua)
- 98: Mobbing erkennen und Hilfe holen (family)
- 99: Allah hört unsere Bittgebete (tawhid)
- 100: Der Qurʾān als Offenbarung (iman)
- 101: Nicht mit guten Taten prahlen (ikhlas)
- 102: Verzeihen und Grenzen achten (akhlaq)

**Alle restlichen Titel 103–208, ihre Reihenfolge, Wochen, Unterrichtsszenarien und altersbezogenen Lernziele stehen vollständig im bestehenden Roadmap-JSON und in der 208er Forschungsakte.** Nicht neu erfinden. In der 118er Verskandidaten-Datei ist bereits jeder dieser Plätze einem sorgfältig als UNGEPRÜFT bezeichneten Qurʾān-Kandidaten zugeordnet. Überspringe keinen Slot.

### Besonderer Kinderschutz
- Emotionen (Angst, Wut, Trauer) nicht als Sünde oder Fehlverhalten darstellen; Hilfe und sicheren Abstand erlauben.
- Gewalt, Mobbing, Grenzverletzung: keine erzwungene Vergebung, Geheimhaltung oder Opferverantwortung. Sicherer erwachsener Ansprechpartner steht im Vordergrund.
- Keine Gesichter/Darstellungen von Propheten, Ṣaḥābah, Engeln oder Allah, keine fiktiven historischen Details.
- Qurʾān-Unterricht niemals mit synthetischer Rezitation; nur geprüfte echte Tilāwah und diese später gesondert freigeben.
- Kindliche Fiqh-Einheiten müssen den Unterschied zwischen Üben vor der Pubertät und rechtlicher Verpflichtung einhalten.
- Fiqh-Regeln und Detailunterschiede sorgfältig prüfen; `sourceAudit` nicht mit einer nur verwandten Überlieferung füllen.

## 4. Audio ist ausdrücklich AUSGESETZT

Dies ist ein **reiner Text-/Daten-/Programm-/Quellen-Auftrag**. Auch wenn alte Produktionspläne vorhanden sind: **keine Stimme erzeugen, keine ElevenLabs-Credits ausgeben, keine Masterstimme testen, keine synthetische Qurʾān-Tilāwah, keine Audio-Assets oder öffentlichen Audio-Metadaten freigeben.** Der Besucherbereich darf keine Wörter wie „Masterstimme testen“, „Audio-Preview“, „Debug“ oder interne Produktionslabels anzeigen.

Später gültige Referenz liegt in `kids/data/academy-voice-policy-v10.json`: Serhat Abu Malik, vorhandene Owner-Voice `DkU7j9uO4ZEtLD2iRZSH`, Modell `eleven_v4`, Profil `kids_story`; keine Ersatzstimme, kein selbstständiger Klon. Manuelle Besitzerfreigabe bleibt zwingend.

Wenn Sprechtextplanung technisch für spätere Audios nützlich ist, nur **separat und inaktiv**, ausschließlich `reviewStatus:not-generated`, null erzeugte Audios, null Credits. In dieser Phase genügen die vollständigen altersgerechten Texte; die Audioerzeugung selbst soll **nicht** Teil der Fertigstellung sein.

## 5. Präzises Integrationsverfahren

1. Lokalen Git-Workspace erstellen, Remote-Stand prüfen, `git status`, Branch/PR-Historie und CI inspizieren. Wenn PRs parallel weiterentwickelt wurden, zuerst neuesten Stand übernehmen; nie auf alter Zählung patchen.
2. **Zuerst Test-/Staging-Spur**, wie in `AGENTS.md` verlangt. Kids-App und `test/**` **nicht im gleichen Commit/PR** verändern, weil `scripts/app-lane-guard.js` gemischte App-Spuren blockiert. Für Test-Anpassungen getrennten Branch/PR benutzen.
3. Aus `roadmap.plannedUnits` genau die nächsten 8–12 freien Slots laden; Forschung für jeden Slot anhand der Kandidatenvorlage und tatsächlicher Primärbelege leisten, bestehende IDs/Topics auf Dubletten prüfen.
4. Nur positiv überprüfte Belege in finalen Unterrichtskatalog übernehmen. Neue versionierte Module als `curriculum-vNN.js` an die bestehende App-Ladekette anhängen. Immer 3 Altersgruppen samt 2/3/3 Quizfragen und Rückmeldungen.
5. `kids/data/academy-year-52weeks-v1.json`, `kids/data/academy-expansion-roadmap-v23.json`, `kids/akademie/school-progress-v11.js`, `kids/item-offline-v1.js`, `kids/unterrichtsarchiv.html`, `kids/research/academy-208-research-ledger-v1.json` **atomar** zueinander synchronisieren; nach jeder Integration Anzahl, IDs, Reihenfolge und offenen Rest exakt vergleichen.
6. Audit-Daten pro Lektion dauerhaft in `kids/research/` ablegen. Die Rechercheakte mit neuem `sourceAuditStatus` und realen Prüfschritten aktualisieren; `externallyChecked` nur erhöhen, wenn wirklich unabhängig geöffnet und der passende Originaltext belegt wurde.
7. **Nicht** `kids/sw.js`, `kids/version.json`, globale Service Worker, Push, Manifest, originale Home/Quiz/Geschichten-Spuren, erwachsene Besucher-Apps oder native App verändern. Offline-Liste referenzieren ist nicht dasselbe wie globale Offline-Freigabe.
8. Testen: `node scripts/test-kids-academy-v9.js`; `node scripts/test-kids-academy-school-v11.js`; `node kids/tools/test-academy-sequential-lock-v27.cjs`; `node kids/tools/test-academy-v23-roadmap.cjs`; `node kids/tools/test-academy-208-research-ledger-v1.cjs`; `node scripts/test-kids-academy-audio-queue-v18.js`; komplette CI aus `.github/workflows/check-kids-academy-v9.yml`; außerdem `node scripts/app-lane-guard.js` und Repo-/Change-Scope-Guards.
9. Der Kids-CI-Workflow testet auch Dateien in `test/kids/akademie/**`, die im **eigenständigen Test-PR #1090** gepflegt werden. Ein älterer Test erwartete noch 58 statt 82 Lektionen; **nicht** CI-Fehler wegignorieren, Checks abschalten oder harte Erwartungen blind erhöhen. Test-Lane sauber synchronisieren und beide PRs in richtiger Reihenfolge grün erhalten.
10. Sobald ein Batch wirklich vollständig geprüft ist, neuen Entwurf/PR bereitstellen. **Kein Merge nach `main`, kein Deploy, keine echte Kinderfreischaltung ohne ausdrückliche separate Besitzerfreigabe.**

### Automatisierbare Prüfgates

- Exakt 208 eindeutige Slotnummern mit je einem `lessonId` nur bei tatsächlich integriertem Unterricht.
- Exakt 208 eindeutige fertige Unterrichts-IDs, keine Dubletten, keine Verschiebung des alten Lernverlaufs.
- Exakt 624 eigenständige Altersfassungen (208 × 3) bei vollständig abgeschlossenem Endzustand.
- Je Unterricht 2 Fragen 4–5 und je 3 Fragen 6–8 sowie 9–10 (mindestens 1.664 altersbezogene Fragen insgesamt).
- Jede als quellengeprüft deklarierte Lehre hat eine fachlich passende geprüfte arabische Qurʾān-Stelle, verifizierte Ḥadīṯquelle und korrekt bezeichnete eigene Didaktik.
- `sourceAuditStatus` darf nicht aus einem vorhandenen Link, einem KI-Text oder einer Versionsnummer abgeleitet werden.
- Reale Kinderfortschritte/Profildaten bleiben unverändert; keine heimliche automatisierte Kinderfreischaltung.
- Keine erzeugten Audios, kein TTS-Fallback, keine unfreigegebene Qurʾān-Stimme.
- Öffentlich nur fertige Benutzerbegriffe; keine Test-/Entwicklerformulierungen.
- Alle betroffenen CI-Tests grün, ohne sie abzuschalten.

## 6. Erforderlicher Arbeitsbericht nach JEDEM Batch

Schreibe als versionierte Artefakte in `kids/research/`:
1. Eine maschinenlesbare Source-Matrix pro Batch: Slot, Titel, Hauptvers, Beleglink, Tafsīr, Ḥadīṯ-Original, Link, Bewertung, ein relevanter Ṣaḥābī-/Salafbeleg falls gesichert, Hanbalī-Beleg für Fiqh, überprüfte Aussagegrenze und Prüfstatus.
2. Einen QA-Bericht: alter/neuer Gesamtstand, IDs in Originalreihenfolge, Drei-Alter- und Quiz-Vollständigkeit, Child-Safety-Prüfung, geschützte Pfade unverändert, ausgeführte Tests samt Ergebnis.
3. Eine offene Quellen-/Qualitätsmängelliste: nichts verschweigen; nicht belegtes Material bleibt gesperrt.
4. Den getrennten GitHub-Kids-PR, bei Bedarf getrennten Test-PR, Commit-SHAs und die tatsächlich geprüften CI-Run-IDs.

**Fertigmeldung nur bei nachweisbarem Endzustand:** 208/208 tatsächlich geschrieben und quellengeprüft, alle 3 Altersfassungen je Thema, alle relevanten Prüfungen bestanden. Bis dahin ehrlich zwischen „Thema geplant“, „Unterricht geschrieben“, „Originalquelle unabhängig geprüft“, „menschlich abgenommen“ und „Besucher-live“ unterscheiden.

## 7. Arbeitsanweisung an den ausführenden Agenten

**Beginne jetzt mit genau den nächsten noch offenen Lektionen aus dem neuesten Branch.** Nach tatsächlichem Status vom 13.10.2026: 91–102. Lies erst alle genannten Dateien, prüfe die angebotenen Qurʾān-Kandidaten in ihrem genauen Kontext und finde/prüfe pro Thema die passenden authentischen Sunnah-Belege. Setze jeden geprüften Batch innerhalb desselben Arbeitsauftrags vollständig in Code, Archiv, Jahresplan, Sequenz, Rechercheakte und Tests um; danach fortfahren bis 208. Keine künstliche Geschwindigkeitssteigerung durch erfundene Quellen, identische Copy-Paste-Alterstexte, Dummy-Lektionen oder deaktivierte Tests. Nutze lokale Datei-/Git-Batchoperationen statt einzelner GitHub-Content-API-Updates. **Audios kommen ausdrücklich erst in einem späteren, gesondert erteilten Auftrag.**
