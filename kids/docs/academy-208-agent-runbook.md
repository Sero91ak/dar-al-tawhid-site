# DĀR AL TAWḤĪD KIDS AKADEMIE · GEMEINSAMER CLAUDE-CODE-ARBEITSAUFTRAG
Stand 2026-10-13 · nur Kids-Projekt · Entwurfszweig, keine Besucherfreigabe.

## Arbeitsauftrag – sofort ausführen
Arbeite selbstständig im Repo `Sero91ak/dar-al-tawhid-site`. Ziel: genau **208 verschiedene Unterrichtseinheiten für 52 Wochen**; jede Einheit erhält unabhängig geschriebene Fassungen und Aufgaben für **4–5, 6–8 und 9–10 Jahre**. Sichere die bestehenden Unterrichtseinheiten und fülle nur die noch offenen `editorialSlot`-Einträge des kanonischen Fahrplans. Keine leeren Scheinlektionen, erfundenen historischen Ereignisse, Quellen oder gebastelten Narrationen. Keine Audioerzeugung: die Audios kommen später.

**Gemeinsame Wissensbasis für Claude Code und ChatGPT:**
- `AGENTS.md` = verpflichtende Regeln für geschützte Bereiche, Test-vor-Live, CI, Service Worker und Deploy.
- `kids/data/academy-year-52weeks-v1.json` = kanonische belegte/noch offene Slotzuordnung.
- `kids/data/academy-expansion-roadmap-v23.json` = **verbindliche Vorgaben ALLER offenen Themen** mit `title`, `pillar`, `classroomScenario`, `ageOutcomes`.
- `kids/data/academy-research-handoff-208-20261013.json` = vorbereitete Gesamtrecherche-Matrix **aller 208 Unterrichtsplätze** samt tatsächlichem Stand, bisherigen Quellenbehauptungen, neun extern gegengeprüften Beispiel-Links und ehrlichen offenen Prüf-Gates. Dieses Manifest ist ein redaktioneller Index, nicht die Ersatz-Quelle der Primärtexte.
- `kids/akademie/curriculum-v*.js` = bestehendes Unterrichtsschema und Texte, alte IDs niemals ungesehen verschieben.
- `kids/akademie/index.html` = realer Academy-Renderer; `kids/akademie/school-progress-v11.js` = bindende Freischaltreihenfolge.
- `kids/unterrichtsarchiv.html` = geschütztes Lesearchiv/Snapshot.
- `kids/data/academy-voice-policy-v10.json` und `kids/data/academy-voice-plan-v*.json` = spätere Sprechvorbereitung, ausschließlich Text, null Credits.
- `.github/workflows/check-kids-academy-v9.yml`, `kids/tools/test-academy-sequential-lock-v27.cjs` und `scripts/app-lane-guard.js` = Tests und Spurtrennung.

**Stand beim Erstellen:** im Feature-Branch 90/208, offen 118; `main` zuvor 66/208; PR #1089 Kids, PR #1090 Test-App. Bevor du Änderungen vornimmst, `git fetch`, `git status`, `git branch -a`, `git log`, `git diff` und die Zähler selbst überprüfen: Paralleländerungen sind möglich. Nicht behaupten, der Feature-Branch sei live. Kein eigener neuer 208-Themenplan, wenn die Roadmap bereits die Inhalte enthält.

## Religiöse Forschung – zwingend vor jedem Unterrichtstext
**Quellenhierarchie:** exakter Qurʾān-Originaltext (Sūrah, Vers, Versbereich, klar markierter Auszug), dann authentische Sunnah (arabischer Wortlaut/Matn, Ṣaḥābī-Überlieferer, Werk, Nummer, konkrete Einstufung, direktes Original), danach nachweisbare frühe Athār/Sahabah/Tābiʿīn, frühe Tafsīr-Tradition und qualifizierte klassische Kommentare. Bei Fiqh **hanbalitische Rechtsschule vorrangig** (Imām Aḥmad, al-Ḫiraqī, Ibn Qudāmah – Werke erst nach Nachweis der konkreten Fundstelle zitieren). Für Tafsīr nach Bedarf u.a. aṭ-Ṭabarī, Ibn Abī Ḥātim, al-Baġawī und Ibn Kaṯīr nach konkreter Fundstellenkontrolle.

**Erlaubte Recherche-Domains:** `islamweb.net`, `shamela.ws`, `dorar.net`, `al-maktaba.org`, `ketabonline.com`, `waqfeya.net`, `archive.org`, `app.turath.io`. Priorität Islamweb, Shamela, Dorar, verlässliche Scans und ergänzende Buchkorpora; für Qurʾān immer den arabischen Originalvers selbst überprüfen. Pro recherchierter Behauptung belastbarer direkter Quellenlink, bei unterstützten Textseiten `#:~:text=...`, bei Scans `#page=` mit tatsächlich geprüfter Seite. Keine pauschal erfundene Bibliografie, keine Google-Snippets als alleinige Quellen. Bei Ḥadīṯen Bukhārī/Muslim bevorzugen; sonst genaue anerkannte Überlieferungsbewertung kontrollieren. Bei Athār Isnad und Zuschreibung nicht ungeprüft als ṣaḥīḥ ausgeben; nie erfundenen Iǧmāʿ behaupten.

**Getrennt dokumentieren:** (A) Qurʾān-Original, (B) eigene deutsche Bedeutungswiedergabe, (C) Ḥadīṯ-Wortlaut/zulässiger Teilauszug, (D) sinngemäße Ḥadīṯ-Zusammenfassung, (E) belegte Erklärung von Salaf/Gelehrten, (F) unsere pädagogische Übung. Beispiele wie Stifte teilen, Nein sagen, Ruhe suchen oder Schulhofsituationen sind ausdrücklich **eigene Übungen**, niemals vermeintliche historische Prophetenworte.

**Nachgeprüfte Seed-Beispiele, nicht pauschal alle Quellen:**
- Bukhārī 5013, Vorzug von Sūrat al-Ikhlāṣ: https://dorar.net/hadith/sharh/72699
- Bukhārī 5017, drei Sūren vor dem Schlafen: https://dorar.net/hadith/sharh/151175
- Bukhārī 6312, Schlaf- und Aufwach-Dhikr: https://dorar.net/hadith/sharh/1652
- Bukhārī 6114 / Muslim 2609, Zorn und Selbstbeherrschung: https://dorar.net/hadith/sharh/10213
- Bukhārī 135 / Muslim 225, Wuḍūʾ bei Ḥadaṯ: https://dorar.net/hadith/sharh/6252
- Muslim 2593, Sanftmut: https://dorar.net/hadith/sharh/152138
- Muslim 2664, sich um das Nützliche bemühen: https://dorar.net/hadith/sharh/21375
- Muslim 2586, Mitgefühl: https://dorar.net/hadith/sharh/4341
- Bukhārī 3364, Ibrāhīm und Ismāʿīl in der authentischen Geschichte: https://dorar.net/hadith/sharh/138076

Das sind **neun einzelne Muster-Fundstellen**. Für jede andere Lektion und insbesondere die 118 noch offenen Slots muss die richtige Quelle separat am Original recherchiert, gelesen und sinnvoll zugeordnet werden. Die bisherige `sourceAudit.hadithUrl` allein beweist keine Verifizierung. Unbelegte Fälle als `blocked-awaiting-scholar-review` ausweisen, nicht freigeben. Kein unmarkiertes Einbringen von Ashʿarī-, Māturīdī-, Schīʿa- oder anderen vom Auftraggeber ausgeschlossenen Lehrpositionen. Im Kinderunterricht keine sektiererische Polemik.

## Pädagogik und Formate
**Alter 4–5:** ca. 6–9 Minuten, kurze freundliche Sätze, eine sichere Beispielszene, ein Hauptgedanke, 2 einfache altersgerechte Aufgaben, gut hör-/lesbare Gestaltung. **Alter 6–8:** ca. 10–14 Minuten, eigenständige differenzierte Geschichte/Erklärung, klare Begriffsübersetzungen, mindestens 3 abwechslungsreiche Aufgaben, Feedback. **Alter 9–10:** ca. 14–18 Minuten, tieferes fachlich korrektes Verständnis, Qurʾān- und Sunnahquellen sichtbar unterscheiden, sinnvolle Denk-/Anwendungsfragen, mindestens 3 Aufgaben, differenzierter Fiqh bei entsprechendem Fachreview. Jede Altersfassung neu schreiben statt nur zu kürzen.

**Kinderschutz:** keine angstmachenden Straf-/Höllen-/Gewaltbilder, kein Takfīr-Unterricht für kleine Kinder, keine entwürdigenden Fragen, keine Darstellung von Propheten oder ungesicherten Geschichtsbildern; jederzeit um menschliche Hilfe bitten, sichere Grenzen, ohne Zwang. Keine erzwungene Umarmung/Versöhnung, keine Geheimhaltung bei Gefahr und keine Überforderung kleiner Kinder durch unzutreffende Pflichtbehauptungen. Qurʾān und Duʿāʾ sind kein Ersatz für Nahrung, Schutz, Eltern, Ärzt:innen oder Notfallhilfe.

**Strukturell:** Originalfelder aus den neuesten `curriculum-v*.js` übernehmen: `id`, `subject`, `pillar`, `topic`, `title`, `lead`, `goal`, `quran`, `hadith`, `sourceAudit`, `ageText`, `questions`, `voiceApproved:false`. Ursprüngliche `id`-Folge strikt bewahren. Neue Module in verträglichen Viererpaketen erstellen, 20–24 Lektionen nur als zusammengehörige geprüfte Meilensteine bündeln.

## Forschungsakte, Wahrheit über den Status und Generatoren
Lege eine dauerhafte `kids/data/academy-source-ledger-208.json` an und aktualisiere sie pro Slot aus Originalfundstellen: Sūrah/Vers, arabischer Originalwortlaut, Wortlaut/Überlieferer/Werk/Nummer/Einstufung eines tatsächlich passenden Ḥadīṯ, echte URLs, ggf. Tafsīr-/Athār-/Hanbalī-Fundstellen mit Band/Seite, interpretative Risiken, eigene Unterrichtsanwendung. Der vorhandene Handoff-Index bleibt **Bestandsübersicht**; die neue Ledger-Datei ist die nach und nach **wirklich belegte Forschungsakte**, deren fehlende Einträge offengelegt werden. Status getrennt halten: `sourceVerified`, `ageContentReviewed`, `fiqhReviewed`, `ownerApproved`, `audioApproved`, `visitorReleased`. Keinen künstlichen grünen Gesamtstatus ableiten. Fachlich ungeprüfte Lektionen sind redaktionelle Entwürfe, keine fertigen Besucherlektionen.

Synchronisiere per idempotentem Generator mit einem klaren kanonischen Slotzustand Jahresplan, Roadmap, strenge fortlaufende Freischaltung, Archiv-Snapshot, Script-Einbindungen, Offline-Referenzliste und Tests. Ein zweiter Generatorlauf muss keinen Diff erzeugen. Ohne entsprechende ausdrückliche Freigabe weder `kids/sw.js`, `kids/version.json` noch Manifest, Push, Cloudflare, native App oder Erwachsenen-App anrühren. **Offline-Pfad eingetragen** ist nicht identisch mit tatsächlich getesteter Offline-Nutzung.

**Audio:** Nur spätere Sprechtext-Queues. Die Policy `kids/data/academy-voice-policy-v10.json` ist die einzige identitäts- und einstellungsführende Quelle (Serhat Abu Malik, bestehende Masterstimme, `eleven_v4`, Profil `kids_story`). Keine ElevenLabs-Anfrage, keine Credits, keine automatischen Downloads, keine erfundenen Dateien, keine Hörproben-/Masterstimmen-Testelemente für Kinder. Qurʾān-Rezitation nur echte fachlich geprüfte Tilāwah, nie generierte Masterstimme.

## Technischer Ablauf mit festen Freigabesperren
1. Reale Repo-Baseline nachprüfen und Source-Inventar 208/208 durchgehen; die vorhandenen Arbeitsstände 67–90 gegen Katalog und Archiv abgleichen. Keine alten Kinderdaten ändern.
2. **PR #1089 (Kids)** und **PR #1090 (Test)** getrennt prüfen; veraltete CI-Tests (historisch teils harte Erwartung `58` bei wachsendem Entwurfsbestand) quellengetreu dynamisieren, ohne Assertions zu deaktivieren. `test/**` niemals in denselben Kids-App-Commit mischen. CI muss tatsächlich grün werden; Konflikte nicht verschweigen.
3. Die **118 offenen Redaktions-Slots ab dem tatsächlich ersten `plannedUnit`** in unveränderter Reihenfolge systematisch recherchieren. Von der Roadmap nur überprüfte Quellen übernehmen; jede neue Behauptung separat begründen.
4. Drei Altersvarianten + Fragen + Quelle pro Thema erstellen, fachspezifisches Review. Neue Module an Kursende anhängen, keine neue Sortierung alter Einheiten, kein Shortcut bei Tiefenlinks/Drafts.
5. Jahrplan, Roadmap, Archiv, School-Progress, Offline-Liste, Audio-Textqueue, Docs und Node-/CI-Tests atomar bzw. konsistent synchronisieren. Regres­sions­tests auf iOS/Android, Jungen/Mädchen und altersgerechte Bedienung ohne ungefragten Designumbau.
6. Nach jedem Paket in `kids/docs/academy-worklog-208.md` commit, wirklich neue Slots, verifizierte Quellen, unklare Fälle, CI, nächste Aufgabe und PR dokumentieren. Nur Kids-Branch/PR und separater Test-Branch/PR. **Kein unaufgeforderter Merge auf `main`, kein Besucher-Deploy, kein Push, keine Audiokosten.**
7. Bis 208/208 weiterarbeiten, sofern jedes Thema fachlich hinreichend belegbar ist; bei blockierten Themen ehrlichen Redaktions-Blocker statt fiktiver Fertigstellung ausweisen. Endbericht mit 208-Slot-Matrix, vollständiger Quellenakte, Alterstexten, Tests, Audio-Späterliste und Freigabestatus.

**Jetzt anfangen.** Arbeite nicht isoliert von bestehenden Recherchen; lies die oben genannten tatsächlichen Repo-Artefakte und schreibe neue Erkenntnisse konsequent in dieselben Git-Dateien, damit ChatGPT, Claude Code und spätere Redakteure dieselbe Wissensbasis haben.