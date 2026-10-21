# DĀR AL TAWḤĪD · Multilingual Adult Core (V1, unveröffentlicht)

## Status 21.10.2026
Technische Entwicklungsvorschau – **nicht** als mehrsprachig übersetzter Gesamtbestand freigeben.
Öffentliche Website, Besucher-App, Kids-App, Apple TV, Push-Systeme, Gebetszeiten, Service Worker, Widgets und bestehende Smartphone-Navigation sind unverändert.

### Technisch fertig auf diesem Branch
- Ein gemeinsames UI-Sprachschema mit **Deutsch, Arabisch (Fuṣḥā), Englisch, Türkisch, Kurmancî, Soranî und Bosnisch**: jeweils 39 UI-Textschlüssel. Arabisch und Soranî nutzen RTL; Kurmancî LTR.
- Eine isolierte **Sprachumschaltung**: nur im expliziten Container, keine globale Mutation von `html[dir]` und keine Änderung des geschützten Fünf-Tasten-Navigationssystems.
- 33 kanonische islamische Suchbegriffe mit arabischer Schreibweise und insgesamt 298 expliziten Alias-Einträgen (256 unterschiedliche normalisierte Formen). Das sind Suchvarianten, **keine theologischen Definitionen**.
- Suchlauf über ausschließlich bestehende, gleichoriginige Fundstellen; kein LLM, kein Google Translate, keine automatischen religiösen Antworten.
- `source-examples.json`: 12 bestätigte Beispiele aus dem vorhandenen Q-Archiv, Quellen-/Bibliotheksbereich und Startpunkten. Die Preview ist **nicht** der vollständige Suchbestand.
- `build-search-index.cjs`: Generator, der lokale kanonische Dateien aus Beiträgen, Bibliothek, vorhandener Ḥadīṯ-Suchliste, Duʿāʾs, Qurʾān-Suchindex (soweit dessen Datenschema passt), Quiz und Q-Quellenregister zu einem gemeinsamen Index zusammenführt. Der Generator schreibt **nur** `generated-source-index.json` in diesen Ordner. **Noch nicht im kompletten Repo ausgeführt oder gegen die Produktion abgenommen.**
- `localized-content-contract.json`: gemeinsames Inhalts-ID- und Freigabemodell für Beiträge, Q-Quellen, Qurʾān/Tafsīr, Ḥadīṯ, Duʿāʾ, Lern-/Quizseiten. PDFs werden nicht übersetzt.

### Noch nicht fertig / nicht als fertig ausgeben
- Die 480+ deutschen Beiträge, Q-Nachweise, Ḥadīṯ-Texte, Lehrmaterialien und Quiz sind **nicht** automatisch in sechs zusätzliche Sprachen übersetzt.
- Für Arabisch-Fuṣḥā sowie islamische Fachtermini braucht jeder veröffentlichte Inhalt Originalquellen-, Fach- und Sprachprüfung. Kurmancî/Soranî müssen zusätzlich auf Dialekt und orthografische Stimmigkeit geprüft werden.
- Tiefenlinks von Suchtreffern zu einzelnen Beiträgen und Ḥadīṯen sind in diesem V1-Generator noch nicht verbindlich abgenommen; momentan wird für manche Treffer der gesicherte Hauptbereich geöffnet.
- Die Generator-Abdeckung, Vollständigkeit des Qurʾān-Index, Sūrah/Āyah-Auflösung und jeder Ḥadīṯ-Grad müssen anhand der tatsächlichen Datenstrukturen getestet und nachgebessert werden.
- Gemeinsame Konto-Sprachsynchronisierung, produktive Suche und Native-App-Integration stehen aus. Ein iOS/Android-Build kann für neue native UI-Sprachen erforderlich sein.
- **Keine Produktion**, kein Merge auf `main`, kein OneSignal und kein automatischer Deploy in diesem Branch.

## Datenfreigabe
Kanonische `id`, Quellennachweise, arabische Originaltexte, Ḥadīṯ-Grad, Versreferenzen und Herkunftslinks sind **unveränderlich**. Eine veröffentlichte Übersetzung erhält denselben `id` und wird nur geladen, wenn `status="approved"`, fachliche und sprachliche Freigabe, Quell-ID und Revision übereinstimmen. Fehlt das, wird der **deutsche Originaltext mit sichtbarem Übersetzungshinweis** angezeigt – kein stiller Ersatz.

## Suchlogik
1. Unicode- und arabische Normalisierung (Diakritika, unterschiedliche Alif-Formen), lateinische Umschrift-Varianten und Mehrwortbegriffe.
2. Kanonische Begriffe zuerst, Suchergebnisse nach Text-/Titeltreffern mit leichter Tippfehlertoleranz.
3. Nur Quellenlinks derselben Website und verfügbare Originalauszüge.
4. Wenn keine ausreichende Quelle vorhanden ist, **klar „keine passende Fundstelle gefunden“**. Keine Fatwā oder Behauptung durch Suchalgorithmen.
5. Suchanfragen werden in V1 **nicht** an externe Sprachmodelle, Übersetzungsdienste oder gemeinsame Lernspeicher gesendet.

## Prüfen
```bash
node desktop-preview/i18n-core-v1/validate-core.cjs
node desktop-preview/i18n-core-v1/build-search-index.cjs
```
Im Browser den **eigenständigen** `desktop-preview/i18n-core-v1/index.html` öffnen; ohne Netzwerk läuft die Beispielsuche. Sie umfasst 7 UI-Sprachen, 9 anklickbare Fachbegriffe, 12 Fundstellen und responsive/RTL-Ansicht.

## Reihenfolge der sicheren Integration
1. **Dar Test zuerst**: isoliertes Modul und eine Übersetzungs-ID am vorhandenen Beitrag/Quellenlink prüfen, ohne Gebets-/Push-/Navigation-Code zu ändern.
2. Einen geprüften vollständigen vertikalen Schnitt `Beitrag → Q-Quelle → Lernbereich → Quiz → Suche` zunächst in Arabisch/Englisch veröffentlichungsbereit machen; nie einen unvollständigen Text als übersetzt markieren.
3. Vollständige Index-Generierung inkl. Deep Links, Deduplizierung und Quellen-/Grading-Regeln prüfen; Browser/RTL/Fold/iPhone Tests und Performance.
4. Danach Besucher-Website/Desktop, Web-Apps und iOS/Android **separat** integrieren und testen. Dabei denselben kanonischen Inhalt von einem gemeinsamen Endpunkt nutzen, nicht separate Übersetzungsstände in jede App kopieren.
5. Release je Spur nur nach Projektregeln/Scopes und ausdrücklicher Live-Freigabe. Kinder-App ausgeschlossen, solange nicht ausdrücklich beauftragt.

## Wo kein Toolautomatismus helfen darf
Ein Begriffseintrag oder eine häufige Nutzerfrage beweist keine religiöse Aussage. Sprach- und Sachprüfung sind redaktionelle Freigaben. Die Mehrsprachigkeit ist eine **publizierte Sprachfassung pro kanonischem Inhalt**, nicht die Behauptung, ein Wörterbuch könne ein vollständiges religionswissenschaftliches Werk korrekt übersetzen.
