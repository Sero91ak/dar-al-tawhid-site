# DĀR AL TAWḤĪD KIDS AKADEMI — VERBINDLICHER MASTER-AUFTRAG (208/52)

> **Projektinterner, versionierter Übergabeauftrag für Cursor, Claude Code, Codex und andere Coding-Agenten.**
> Gültiger Referenzstand: **13. Oktober 2026**. Immer zuerst den **aktuellen GitHub-Stand** prüfen, da andere Arbeitszweige weiterlaufen können.
> Auftrag: **den Qurʾān-/Sunnah-/Salaf-basierten Kinderunterricht vollständig mit echten Belegen vorbereiten und technisch einbinden; Audios ausdrücklich erst später.**
> Kein Produktiv-Merge, keine Besucher-Freigabe, keine kostenpflichtigen Dienste, kein ungeprüfter Unterricht, kein ungeprüftes Audio.

## 0. SO BEGINNST DU — EXAKTE AUSFÜHRUNGSREIHENFOLGE

1. Öffne `Sero91ak/dar-al-tawhid-site`. Lies **`AGENTS.md` vollständig** und respektiere die App-Spuren. Kein Eingriff außerhalb des Kids-Unterrichts.
2. Prüfe `main`, offene PR **#1089** (Kids-Katalog) und **#1090** (getrennte Test-App-Prüfungen) sowie den tatsächlichen Jahresstand. Am 13.10.2026: `main` **66/208**; Arbeitszweig `kids/lessons-67-70-20261012` **90/208**; **118 geplante Plätze** ohne vollständige Lektion. Zahlen **nie fest annehmen**; immer dynamisch neu berechnen.
3. Lies zuerst diese vier Referenzen:
   - **`kids/data/academy-source-register-208-v1.json`** — kompletter Index aller 208 Themen, ursprüngliche belegte Quellenfelder, Recherche-/Freigabestatus. **Es ist die verbindliche Aufgabenliste.**
   - **`kids/data/academy-expansion-roadmap-v23.json`** — alle geplanten Titel, Rubriken, konkreten Lernsituationen und Altersziele.
   - **`kids/data/academy-year-52weeks-v1.json`** — Kalender, Unterrichtsplätze 1–208, vorhandene Lesson-IDs, Lernrhythmus.
   - **`kids/data/academy-voice-policy-v10.json`** — **nur zum Absichern, nicht zur Erzeugung von Audio**.
4. Lese vorhandene Datenmodelle und Fachtexte direkt aus `kids/akademie/curriculum-v1.js`, `v2.js`, `v22.js`, `v25.js` bis `v35.js` (nur tatsächlich existierende Dateien), `kids/akademie/index.html`, `kids/akademie/school-progress-v11.js` und `kids/unterrichtsarchiv.html`. `sidq` ist die separat geführte erste Stunde; **niemals verlieren**.
5. Überprüfe zuerst die **90 vorhandenen Entwurfslektionen**: Vollständigkeit, echte drei Altersstufen, Qurʾān-Arabisch, Ḥadīṯ-Fundstellen, Genre der Quellen, korrekte Aussagen, Wiederholungen, Sequenz, Quiz-Qualität und Absicherung. *Die bloße Existenz von `sourceAudit.verifiedDate` oder eines Dorar-Links genügt NICHT als Nachweis einer überprüften Quelle.* Im anfänglichen Register haben 56 von 90 Lektionen eine direkte Hadith-URL, die übrigen müssen für Rückverfolgbarkeit verbessert werden.
6. Vervollständige anschließend **alle noch fehlenden 118 Themen** gemäß unveränderter Slot-Reihenfolge. Setze auf **Pakete von höchstens 12–24 Lektionen**, pro Paket: Quellen recherchieren → fachlich und pädagogisch kontrollieren → 3 Alterstexte schreiben → Quiz erzeugen → Daten/Archiv/Offline-Liste zusammenführen → alle Tests → saubere PR. **Nicht blind 118 Inhalte mit Textgenerator-Schablonen füllen.**
7. Erstelle am Ende einen vollständigen Maschinenbericht mit den tatsächlichen Zahlen: 208 Slots, Anzahl fachlich geprüfter Lektionen, nur technisch fertiggestellter Entwürfe, offene Prüfungen, alte Quellenlücken, fehlende Audios, aktive Sperren, Tests, offene PRs und jede offene Blockade. Setze keine ungeprüften Werte künstlich auf 208/208.

## 1. QUELLENHIERARCHIE — VERBINDLICH

**Religiöse Grundlage und Beweisreihenfolge**

1. **Qurʾān:** korrekter vollständiger arabischer Wortlaut mit Sūrah + Āyah-Bereich, oder **explizit** als Auszug gekennzeichnet. Eine deutsche Bedeutungswiedergabe ist **keine** wörtliche Qurʾān-Übersetzung und muss als solche markiert sein. Arabisch, Deutsch und kindgerechte Didaktik bleiben getrennt.
2. **Authentische Sunnah:** bevorzugt `Ṣaḥīḥ al-Buḫārī` und `Ṣaḥīḥ Muslim`, danach andere Sammlungen nur mit nachprüfbarer Einstufung. Dokumentiere **Originalarabisch, Erzähler, Sammlung, Buch/Kapitel, genaue Nummer, Echtheitsurteil, Direktfundstelle und den Unterschied zwischen Wortlaut und eigener Paraphrase**. Varianten und Nummerierung prüfen; nie eine Quelle nur aufgrund ähnlich klingender Stichwörter nehmen.
3. **Ṣaḥābah / Ṣaḥābiyyāt, Tābiʿīn / Tābiʿiyyāt, Atbāʿ at-Tābiʿīn und frühe Salaf:** nur mit nachvollziehbarer Edition und geprüftem Überlieferungsstatus; Athar nicht als marfūʿ-Ḥadīṯ ausgeben. Zuschreibungen, Isnāde und historische Details nicht erfinden.
4. **Klassische Gelehrte** nur als transparente Erklärung bzw. rechtsschulische Einordnung; in Fiqh **hanbalitische Schule priorisieren**. Bei konkreten Fiqh-Fragen klassisch z. B. Ibn Qudāmah, `al-Mughnī` und `al-Kāfī`; je nach Materie al-Mardāwī, `al-Inṣāf`, und `ar-Rawḍ al-Murbiʿ` einsehen. **Werk, Edition, Band, Seite, Kapitel, genaue Passage** prüfen. Ein Name allein gilt nicht als Fiqh-Beleg.
5. Theologische Erläuterungen gemäß überlieferter Ahl-as-Sunnah-/Salaf-Perspektive des Projekts; Aussagen fremder Schulen **nicht stillschweigend übernehmen**. Zugleich **keine konfessionelle Polemik, kein Takfīr-Unterricht und keine Feindbilder für Kinder**.

**Ausschließlich diese Nachweisportale verwenden (bevorzugte Reihenfolge):**
`https://www.islamweb.net/`, `https://shamela.ws/`, `https://dorar.net/`, `https://al-maktaba.org/`, `https://ketabonline.com/`, `https://waqfeya.net/`, `https://archive.org/`, `https://app.turath.io/`.

- Werk oder Ḥadīṯ im arabischen Original lesen, genaue Fundstelle kontrollieren, dann **direkte navigierbare URL** speichern. Für Textseiten wo möglich einen **Textfragment-Link `#:~:text=...`**, für echte PDF-Dokumente **`#page=N`**. Nichts dazu erfinden.
- Die Portale sind Nachweisorte, nicht automatisch Garantie für einen authentischen Text. Korrekte Zuschreibung und Einstufung sind Pflicht.
- Google-Snippets, Facebook, TikTok, Foren, unbekannte Portale oder KI-Antworten sind **keine Quellenbelege**. Sekundärtexte dürfen nur zur Suche helfen.
- Ein fehlender oder unzugänglicher Text bleibt `research-required` oder `manual-source-review`; **niemals durch halluziniertes Arabisch, Nummer oder Seitenangabe ersetzen**.
- Keine automatischen source-verified-Felder aus einem Datum, Dateinamen, HTTP-200 oder vorhandener Alt-Metadatenmarkierung ableiten.

**Zwei tatsächlich extern gegengeprüfte Ausgangsbeispiele**, keine pauschale Bestätigung anderer Quellen:
- `Ṣaḥīḥ al-Buḫārī 1` – Handlungen nach Absichten, ʿUmar: https://dorar.net/hadith/sharh/3429.
- `Ṣaḥīḥ al-Buḫārī 135` – Reinigung nach Ḥadaṯ, Abū Hurayrah: https://dorar.net/hadith/sharh/6252.
Diese Beispiele sind **als konkrete Quellen** verwendbar, aber jede Übertragung auf ein anderes Unterrichtsthema muss inhaltlich geprüft werden.

**Vorhandene 208 Quellendatensätze:** `kids/data/academy-source-register-208-v1.json` enthält pro Slot Titel, vorhandene Qurʾān-/Ḥadīṯ-Fundstelle, vorhandene Direkt-URL, fehlende Evidenz und Prüfstatus. Alle 118 offenen Themen besitzen bereits Titel/Lernsituation aus der Roadmap; ihnen werden **erst nach echter Recherche** exakte Verse und Authentizitätsangaben zugeordnet. Die 90 vorhandenen Lektionen dürfen ebenso wenig ungeprüft veröffentlicht werden.

## 2. ZIEL UND KANONISCHER UNTERRICHTSPLAN

- **52 Wochen** × **4 neue Lektionen** = **208 eigenständige Themen**.
- **Montag, Dienstag, Donnerstag, Freitag:** eine neue Lektion, **Mittwoch, Samstag:** Wiederholung, **Sonntag:** freiwilliges Lernen/Pause. Die App darf den Rhythmus nicht zu beliebigen täglichen Mehrfachfreischaltungen aufweichen.
- Strikte Sequenz: **genau eine nächste unvollständige Lektion**, neue Lektion erst bei erfüllten Voraussetzungen und am zulässigen Unterrichtstag; Inhalte künftiger Plätze höchstens als gesperrte Vorschau.
- Der bestehende Lernfortschritt und die Reihenfolge aller historischen 90 Plätze bleiben unverändert. Neue Kurse **nur am Ende** in bestehender Ordnung anhängen; **keinen Themen-Reshuffle** aus Fachgruppen erzeugen.
- Profil- und altersbezogene lokale Zustände erhalten; keine fiktive Cloud-Synchronisierung. Direkte URLs dürfen die Sperre nicht umgehen.
- **Alle 208 Titel und Wochentage** sind im maschinenlesbaren Quellenregister enthalten; nicht eigenmächtig neue Titel erfinden, doppeln, umnummerieren oder über ältere Lektionen schreiben.
- Zwölf Stränge: **Tawḥīd, Īmān, Ikhlāṣ, Akhlāq, Adab, Tarbiyah, Nafs/Tazkiyah, Fiqh/ʿIbādāt, Qurʾān/Sunnah, Sīrah/Propheten, Duʿāʾ/Adhkār, Familie/Gemeinschaft/Schutz**. Die Roadmap gibt pro Thema den `pillar` an; vorhandene App-Subjects bleiben kompatibel (`aqidah`, `akhlaq`, `adab`, `fiqh`).

## 3. DREI UNABHÄNGIGE ALTERSFASSUNGEN JE LEKTION

**Für 4–5 Jahre:**
- Zielzeit etwa **6–9 Minuten**, ein Kerngedanke, eine konkrete lebensnahe Handlung; kurze positive deutsche Sätze, Erklärung arabischer Begriffe.
- Ein kurzer Einstieg, **mindestens vier altersgerechte Lernsätze**, freundliche Übung, **mindestens zwei eigenständige klare Fragen** (zwei plausibel unterscheidbare Antworten).
- Keine Angstbilder, Höllenbilder, Sanktionen, blinder Gehorsam, Erwachsenenprobleme oder moralische Beschämung. Schutz-, Hilfe- und Nein-sagen-Recht des Kindes erhalten.

**Für 6–8 Jahre:**
- Zielzeit etwa **10–14 Minuten**, eigene kurze Erklärung / Geschichte, **mindestens vier Lehrsätze**, Quelle und Beispiel unterscheidbar, drei geeignete Fragen inkl. Anwendung.
- Wiederholen und Zusammenhänge erklären; keine kopierten Vorschulfassungen mit nur etwas mehr Text.

**Für 9–10 Jahre:**
- Zielzeit etwa **14–18 Minuten**, **mindestens vier anspruchsvollere eigenständige Lehrsätze**, genaue Fundstellen, klare Trennung von Original/Übersetzung/Paraphrase/Didaktik, drei unterschiedliche Verständnis- und Reflexionsaufgaben.
- Bei Fiqh nur geklärte Regeln und erkennbare Grenzen; keine eigenmächtigen Einzelfall-Fatāwā oder takfīrbezogene Urteile.

**Wichtig für alle drei:** Ḥadīṯ-Erklärungen, erfundene Beispielgeschichten und pädagogische Schlüsse stets **wörtlich unterscheidbar** vom Offenbarungstext halten. Bei Propheten und Ṣaḥābah weder Dialoge, intime Details noch Geschichten ohne Beleg erfinden. Keine bildliche Darstellung von Propheten. Keine Gesichter auf Wunsch des Projekts, falls später Illustrationen dazukommen; Bilder für den Unterricht sind **keine** Voraussetzung der Content-Produktion.

## 4. EXAKTES CONTENT-DATENMODELL

Verwende die bereits vorhandenen Objektstrukturen, keine zweite konkurrierende App-Architektur:

```js
{
 id: "eindeutige-stabile-kebab-id",
 subject: "aqidah|akhlaq|adab|fiqh",
 pillar: "einer-der-12-roadmap-straenge",
 topic: "genauer-Titel-aus-dem-208-register",
 title: "kindgerechter-kurztitel",
 lead: "lernfreundlicher-Einstieg",
 goal: "konkret-messbares-Lernziel",
 quran: {surah: 0, ayah: 0, label:"Sūrah · x:y–z",arabic:"...",meaning:"(Sinngemäß)",excerpt:false},
 hadith: {source:"Sammlung + Nummer + Überlieferer",text:"(Sinngetreue Paraphrase)"},
 sourceAudit: {hadithUrl:"https://dorar.net/hadith/sharh/...",
              hadithNumber:"...",narrator:"...",authenticity:"nachgeprüft",
              quranReference:"x:y",quranTextType:"complete|excerpt",
              hadithMeaningIsParaphrase:true,note:"Beleg und didaktische Grenze"},
 hint: "sicherheitsgerechter Hinweis",sample:"Alltagsbeispiel",
 ageText: {
  "4-5":{intro:"...",lines:["...","...","...","..."],evidence:"..."},
  "6-8":{intro:"...",lines:["...","...","...","..."],evidence:"..."},
  "9-10":{intro:"...",lines:["...","...","...","..."],evidence:"..."}
 },
 questions:{
  "4-5":[{type:"choice",prompt:"...",options:["...","..."],correct:0,hint:"...",explain:"..."}],
  "6-8":[{type:"choice",prompt:"...",options:["...","..."],correct:0,hint:"...",explain:"..."}],
  "9-10":[{type:"text",prompt:"...",sample:"...",hint:"..."}]
 },
 voiceApproved:false
}
```

Das Beispiel zeigt die **Form**, keine fertige Ḥadīṯ-Quelle; Platzhalter gelten niemals als verifiziert. Zusätzliche strukturierte Evidenzfelder im **separaten Quellenregister** ergänzen:
`arabicOriginal`, `narrator`, `muhaddith`, `collection`, `number`, `grade`, `bookChapter`, `editionVolumePage`, `primaryUrl`, `fragmentOrPdfPage`, `claimText`, `quotedOrParaphrased`, `childDidactics`, `verifiedBy`, `verifiedOn`, `reviewStatus`. Die bestehenden App-Objekte kompatibel lassen. Nicht die Identität aller Lektionen umschreiben.

## 5. KONKRETE TECHNISCHE ZIELDATEIEN

- `kids/akademie/curriculum-vNN.js` — neue **additive** Pakete mit klaren IDs. Vorhandene IDs unverändert.
- `kids/data/academy-year-52weeks-v1.json` — exakt 208 Slots, neue Zuordnung, korrekte Summen.
- `kids/data/academy-expansion-roadmap-v23.json` — bearbeitete Plätze aus `plannedUnits` in `existingLessonSlots` überführen; Status- und Bereichszahlen konsistent.
- `kids/data/academy-source-register-208-v1.json` — **jede** Quelle/Prüfstufe nachtragen, Recherchelücken nicht verstecken; ein Eintrag je Slot.
- `kids/akademie/index.html` — neue Module **nach** den alten in richtiger Reihenfolge laden, möglichst keine weiteren Layoutänderungen.
- `kids/akademie/school-progress-v11.js` — **nur** IDs des angehängten Pakets ergänzen; Zugangskontrolle, localStorage-Schlüssel, bestehende Freischaltungen, Alter und Profile unangetastet lassen.
- `kids/unterrichtsarchiv.html` — falls es `ARCHIVE_SNAPSHOT` verwendet, **exakt alle** aktiven Unterrichtseinheiten, Jahresplan und Roadmap **zusammen** synchronisieren; keine veraltete zweite Datenquelle.
- `kids/item-offline-v1.js` — neue Unterrichts-Assets ggf. in manifestierter Offline-Liste ergänzen; **Service Worker, Manifest, native iOS-App und Push** ohne ausdrückliche Freigabe nicht verändern. Eine Listeneintragung beweist **nicht**, dass Offline-PWA-Caching schon komplett funktioniert.
- CI-Regeln in `kids/tools/` und `scripts/test-kids-academy-*.js` prüfen; veraltete Zahlen durch aus Quellendaten abgeleitete Zahlen ersetzen, nicht durch Aufweichen der Echtheits- oder Sequenzprüfungen.
- **Test-App** `test/kids/**` ausschließlich in **einem eigenen Test-PR** bearbeiten, nie zusammen mit `kids/**`, weil `scripts/app-lane-guard.js` Mischspuren blockiert. Separate PR #1090 prüfen und zu den aktuell übernommenen Lektionen dynamisch halten.

## 6. AUDIOS SPÄTER — STRENGE SPERRE

- **Keine ElevenLabs-Anfrage**, keine TTS-Generierung, **null Credits**, kein Staging-Audio öffentlich, kein automatischer Masterstimmen-Fallback.
- Vorhandene Policy konservieren: Modell `eleven_v4`, Stimme/Profil laut `kids/data/academy-voice-policy-v10.json`, `kids_story`; **nicht ohne ausdrücklichen Auftrag auslösen**.
- Keine künstliche Rezitation von Qurʾān. Originale Qurʾān-Rezitation gesondert menschlich auswählen und freigeben.
- Bestehende `kids/data/academy-voice-plan-v*.json` nur lesen, **keine weiteren Sprechtextlisten als notwendige Voraussetzung** für diesen Auftrag erzeugen. Fokus ausschließlich: Themen, Primärquellen, drei Altersfassungen, Prüfaufgaben, technische Integration.
- `voiceApproved:false`, keine unfreigegebenen Hör-Buttons/Hörproben, keine Platzhalter wie „Masterstimme testen“ in Besucheroberflächen.

## 7. BATCH-PIPELINE — NICHT EINZELN PER GITHUB-API HÄNGEN BLEIBEN

Arbeite mit einem **lokalen Git-Checkout in Cursor/Claude Code/Codex**, niemals 118 Einzel-Lektionen über GitHub-Contents-API. Erstelle wiederverwendbare, deterministische lokale Generatoren:
1. **Reader:** JSON-/JS-Katalog sicher lesen; 208 Slots, 90 vorhandene Inhalte und 118 offene Outlines identifizieren, Überlappungen/Drift erkennen.
2. **Source audit:** Arabisch mit Musḥaf, Ḥadīṯ-Kette/Sammlung/Nummer/Einstufung und direkte Belegstelle je Unterrichtsaussage prüfen; `unverified` nicht automatisch „grün“ färben. Unsicherheiten als Aufgaben erfassen.
3. **Content composer:** für genehmigte Quellen ausschließlich drei **eigenständig formulierte** Fassungen plus altersgerechte Quiz/Reflexion und Sicherheitsgrenzen erzeugen. Arabische Begriffe erklären, historisch nicht fabulieren.
4. **Integrator:** additiven Modul-Code erzeugen und alle fünf synchronisierten Indexdateien aktualisieren. **Idempotent:** derselbe Batch darf nach Neustart weder IDs doppeln noch bereits fertige Lektionen überschreiben.
5. **Validator:** alle 208 Slots, aktuell aktiven Lesson-IDs, eindeutige IDs, Quellennachweise, Alterstexte, Fragen, Archiv-Snapshot, Quellenregister und Freischaltung testen. Bestehende Fortschritte durch simulierte Kinderprofile schützen. Kein „früher freischalten“.
6. **CI & PR:** Node-Tests ausführen; alle roten Guards erklären und **im jeweiligen App-Bereich** reparieren, keine Testbedingung nur entfernen, um CI grün zu bekommen. Pro Batch Git-Commit + Bericht + PR; bei Konflikt zuerst sauber rebasen, keine Gewalt-Fixes.
7. **Fortsetzung:** nächsten noch offenen Slot anhand Roadmap wählen. Bereits geprüfte Arbeit wiederverwenden; kein Stop nach jedem 4er-Paket, sofern echte Quelle und Sicherheit geklärt sind.

### Testmatrix mindestens

`node --check` für jedes neue Curriculum;
`node kids/tools/test-academy-v23-roadmap.cjs`;
`node kids/tools/test-academy-sequential-lock-v27.cjs`;
`node scripts/test-kids-academy-v9.js`;
`node scripts/test-kids-academy-school-v11.js`;
`node scripts/test-kids-academy-audio-queue-v18.js` **nur lesen/auditieren – keine Produktion**;
die betroffenen Tests in `.github/workflows/check-kids-academy-v9.yml`;
`node scripts/app-lane-guard.js` und weitere CI-Hauptprüfungen. Falls Testdateien anders heißen, realen Workflow lesen.

**Bekannter CI-Fall:** Die getrennte Test-App hat ältere statische Werte (z. B. 58); sie widersprechen dem wachsenden Kids-Zähler. Test-PR #1090 muss dynamisch kompatibel werden. Dies **nicht** durch Abschalten des Prüfschritts kaschieren. Entscheidend ist die reale 208-Slot-Jahresdatei als Single Source of Truth.

## 8. FREIGABEGRENZEN UND KINDERSCHUTZ

- **Entwurf ≠ religiös geprüft ≠ pädagogisch geprüft ≠ technisch integriert ≠ von Eigentümer freigegeben ≠ veröffentlicht.** Diese Zustände nie zusammenwerfen.
- Ein Unterrichtsplatz ohne verifizierte Quelle bleibt gesperrt; es ist ausdrücklich zulässig, dass noch nicht 208 Themen freigeschaltet sind.
- Keine Gewaltdarstellungen, strafende Quiz-Texte, konfessioneller Streit, Takfīr-Lektionen, gefährliche Rituale, Pflichtdruck für kleine Kinder, angsterzeugende Nacht-/Höllenerzählungen, diskriminierender Schulstoff.
- Islamische Normen nicht als Ausrede benutzen, um Kinder vom Hilfeholen bei Gewalt, Grenzverletzung, Krankheit oder Angst abzuhalten. Kinder dürfen Nein sagen und sichere Erwachsene suchen.
- Keine erfundenen Prophetenbilder oder Prophetenworte. Arabische Wörter in Fuṣḥā genau und verständlich erklären.
- Öffentliche UI zeigt **nur endgültig freigegebene Inhalte**, niemals „Debug“, „Masterstimme testen“, „QA“, „Preview“ oder unfertige Audiomodule.
- Bestehende Farben/Themes für Jungen/Mädchen, responsive iOS/Android-Bedienung, Wischsperren, Tabs, Scroll-Limits und vorhandenen Player **bewahren**; diese Content-Produktion soll keine konkurrierenden Design-Redesigns starten.
- Reale Kinderprofile, Lernstände, Domain, Cloudflare, Service Worker, Apple/Android-Bundles, Push und Erwachsenen-App nicht anfassen.

## 9. ABSCHLUSSERGEBNIS – WIE EIN ERFOLGREICHER AGENT BERICHTET

Im Repo vorhanden:
1. Ein **vollständig geführtes Register über genau 208 Slots** mit Titel, Pillar, Woche, Zeitrhythmus, Source-Audit-Status und verlinktem konkreten Nachweis, soweit wirklich geprüft.
2. Für **jede tatsächlich geprüfte** Lektion: originales Arabisch, authentische Ḥadīṯ-Quelle, getrennte Paraphrase, 3 altersgerechte Unterrichtsfassungen, Fragen, Kindersicherheits-Notiz, eindeutige ID.
3. Konsistenter 52-Wochen-Plan, synchroner App-Katalog, Editor-Archiv und stabile Freischaltsperren.
4. Alle Tests bestanden oder eine **exakt erklärte offene Blockade**. Keine Falschmeldung „208 fertig“, solange fachliche Freigaben fehlen.
5. Ein zusammengefasster Bericht `kids/docs/ACADEMY-208-PRODUKTIONSSTATUS.md` mit **Quellen einzeln**, erledigten IDs, Nachprüfung, CI/PR-Link und nächstem unvollständigen Slot. Bei jedem Durchlauf aktualisieren, nicht neue Parallel-Anweisungsdateien erfinden.

**Die Audios gehören zu einem späteren eigenständigen Auftrag. Stoppe nicht wegen fehlender Stimme. Produziere und prüfe zuerst den vollständigen schriftlichen Unterricht – ohne Prüfung und Freigabe zu fälschen.**

**Beginne jetzt beim realen Ist-Stand des Repositories. Arbeite nach diesen Regeln den gesamten 208-Platz-Lehrplan durch und lasse laufende Eltern-/Kindersitzungen sowie Besucher-App unangetastet.**
