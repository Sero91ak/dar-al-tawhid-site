# TAWḤĪD KIDS · Lernplan und Unterrichtsinhalte – Inhaltsauftrag ohne Layout-/Architekturänderungen

**Stand: 31.10.2026 · Verbindliche Nutzerkorrektur · Draft-PR #1588 · NICHT LIVE**

## 1. Nicht verhandelbarer Schutz der bestehenden Kinder-App

**Es darf sich an der Kinder-App äußerlich und technisch nichts ändern.** Dieser Auftrag erweitert ausschließlich den vorhandenen **Lernplan** und die **künftig hinzugefügten Unterrichtsinhalte**.

Unverändert bleiben:
- `kids/akademie/index.html`, bestehende fünf Unterrichtsschritte, Titel-/Navigationsleiste, alle Profile, Farben, 3D-Icons, Scrollen und Safe-Areas.
- Sämtliche Layouts, CSS, Laufzeitmodule, Routen, Datenstrukturen, APIs, Widgets und Service-Worker.
- Fragen- und Lernstands-IDs, lokale Speicherung, Lektionenreihenfolge, Freischaltlogik, bestehende Quiz- und Sprachbedienung.
- Qurʾān-Rezitator, bisherige Audios, Aussprachebibliothek und alle anderen Bereiche von TAWḤĪD KIDS.
- Alles in der Erwachsenen-App DĀR AL TAWḤĪD, in DĀR Admin, tvOS oder weiteren App-Spuren.

**Kein HTML-, CSS-, Navigations-, Komponenten-, Laufzeit-, Speicher-, API- oder Architekturumbau.** Auch eine neue Karte, ein zusätzlicher Button oder eine andere Bildschirmstruktur ist außerhalb des Auftrags. Inhalt darf ausschließlich in die **bereits existierenden Felder und Darstellungsschritte** gelangen, sobald Quellen und Sprache freigegeben sind.

### Nachträgliche Korrektur am PR

Die zu Beginn von #1588 vorbereiteten zusätzlichen UI-, CSS- und JavaScript-Laufzeitmodule sowie ihre UI-Tests wurden wieder entfernt. `kids/akademie/index.html` und die ursprünglich geänderte GitHub-Workflow-Datei wurden **bytegenau auf den unveränderten `main`-Stand** zurückgesetzt. Die PR enthält nur redaktionelle Piloten, Lernplanung und eigenständige Inhaltsprüfung.

## 2. Pädagogisches Ziel

Jede fertige Unterrichtseinheit führt im **unveränderten** fünfstufigen System zu: Wissen → Verstehen → Qurʾān/Sunnah-Beleg erkennen → eine sichere Alltagssituation selbst beurteilen → mit eigenen Worten erklären und einer vertrauten Person eine Frage stellen. Die Verbesserung geschieht durch **bessere bestehende Inhalte und Fragen**, nicht durch neue UI.

## 3. Altersangemessene Redaktion

- **4–5 Jahre:** kurze klare Sätze, eine Alltagshandlung, zwei sinnvolle Antwortmöglichkeiten, keine Schreibpflicht und keine Angstszenarien.
- **6–8 Jahre:** ein greifbarer Sachverhalt, Begründung und Transfer, bis zu drei geeignete Optionen.
- **9–10 Jahre:** eine belegbare Aussage prüfen, einen plausiblen Irrtum unterscheiden, Quelle von kindgerechter Erklärung trennen und eine eigene Frage zum Thema formulieren.
- **Alle:** keine beleidigenden oder unsinnigen Distraktoren, keine Spekulation über das Verborgene, keine schamfördernde Pädagogik, keine Erwachsenen-Takfīr- oder Streitfälle im Kinderunterricht.

## 4. Islamische und akustische Genauigkeit

- Arabischer Qurʾān-Originaltext unverändert; bei Auszügen eindeutige Kennzeichnung; vollständige authentische Rezitation nur vom bestehenden Rezitator.
- Überlieferungen mit korrekter Quelle und Status; deutsche Paraphrase niemals als wörtlicher Hadith ausgegeben. Qurʾān und Sunnah von eigenen pädagogischen Beispielen trennen.
- Fiqh- und ʿAqīdah-Aussagen vor Veröffentlichung fachkundig prüfen. Offene Quelle oder zweifelhaftes Zitat bleibt **nicht freigegeben**.
- Fuṣḥā-Terminologie kontrollieren; deutsche Sprache bleibt deutsch; deutsche Wörter wie „nur“ niemals als arabisches „Nūr“ rendern.
- Bestehende ElevenLabs-V4-Masteraudios nicht ändern. Neue kostenpflichtige Sprachaufnahmen erst nach redaktionellem Text-Freeze und expliziter Audio-/Kostenfreigabe. Keine synthetische Qurʾān-Rezitation.

## 5. Konkreter Arbeitsbestand

**Ausgangsbestand:** 66 Lektionen, 520 Fragen. Die 11 Grundlagenlektionen aus `curriculum-v1.js` sind in Quellenreview #1587 dokumentiert, aber nicht endgültig islamwissenschaftlich freigegeben (Issue #1535).

**Aktueller Content-Pilot:** `kids/akademie/editorial-pilots/sidq-deep-learning-v2.json`. Diese Datei enthält drei Altersfassungen der Musterlektion Ṣidq mit je fünf pädagogischen Phasen sowie Prüfantworten und Quellenhinweisen. Es ist ein **redaktioneller Entwurf**, noch kein Ersatz der live geladenen Lektion und kein neues Layout.

**Fortsetzung nur mit Inhaltsdateien:** Fragenqualität der 11 Grundlagen verbessern, fachlich fehlerfreie drei Altersvarianten formulieren, vorhandene Curriculum-Felder nutzen, unveränderte Fragezahl/Schlüssel gewährleisten; danach schrittweise die übrigen Lektionen. Bis zur formalen Abnahme in **eigenen redaktionellen Pilotdateien**, nicht unkontrolliert in produktive Lehrdaten schreiben.

## 6. Veröffentlichungs-Gates

1. [ ] Individuelle fachliche Überprüfung aller betroffenen Qurʾān-, Ḥadīṯ-, ʿAqīdah- und Fiqh-Aussagen.
2. [ ] Redaktionelle Frageprüfung: eindeutig, altersgerecht, unterrichtsbezogen, plausible Fehlantworten.
3. [ ] Kompatibilität mit den **bestehenden** Datenfeldern, IDs und der Fortschrittsverwaltung geprüft.
4. [ ] Nur die ausdrücklich genehmigten Lerninhalte werden in DAR TEST geprüft; UI/Architektur-Diff **muss null sein**.
5. [ ] Für neue gesprochene Inhalte: geprüfte Aussprachebibliothek, manuelle Fuṣḥā-Hörfreigabe und gesonderte Audiofreigabe.
6. [ ] Freigabe vor Besucher-Veröffentlichung; keine stillschweigende Übernahme in `main`.

**Fazit: Die App bleibt identisch. Ausschließlich das Wissen im bereits vorhandenen Unterricht wird professioneller.**
