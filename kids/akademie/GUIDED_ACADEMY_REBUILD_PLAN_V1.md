# TAWḤĪD KIDS · Lernakademie – Unterrichtsumbau ohne Verlust bestehender Funktionen

**Stand:** 31.10.2026 · **Status:** Draft PR #1588, nicht veröffentlicht · **Geltung:** ausschließlich `kids/akademie/**` und passende Kids-Tests.

## Bildungsziel

Nach dem Unterricht kann ein Kind: (1) das Thema nennen, (2) es verstehen, (3) einen belegten Gedanken aus Qurʾān oder Sunnah zuordnen, (4) in einer eigenen Alltagssituation nachdenken, (5) den richtigen Unterschied erklären und (6) einer vertrauten Person eine eigene Frage stellen.

**Keine beliebig generierten religiösen Antworten** und keine Selbstbewertung offener Kinderantworten als religiös richtig. Ein Kind darf nachfragen und eine Antwort noch nicht wissen. Eine falsche Wahl darf nicht beschämen.

## Technische Umsetzung auf dem Reviewzweig

| Bereich | Umsetzung | Reifestatus |
|---|---|---|
| 1. Willkommen | Neue Lernzielkarte mit optionaler Einstiegsfrage | Implementiert, Geräte-QA offen |
| 2. Verstehen | Altersgerechter Denkanstoß mit optionaler Gedankenhilfe; sichtbar nach vier bestehenden Inhaltssätzen | Implementiert, Text-QA offen |
| 3. Qurʾān und Sunnah | Quellenkarte mit tatsächlich geladenen Fundstellen und Textauszug-Markierung, sichtbar auf Erklärungsseite | Implementiert, Quellenreview offen |
| 4. Mitdenken | Bestehendes Quiz, Auswahl/Schreiben/Sprechen, Antworten prüfen und Wiederholung nicht überschrieben | Bestehendes Verhalten; individuelle Fragen weiterhin redaktionell zu verbessern |
| 5. Festigen | Drei Datenerklärungs-Karten, quellenbezogene Weitergabefrage, separate Abschlussreflexion | Implementiert; Geräte-QA offen |
| Musterlektion Ṣidq | 3 altersgenaue Fassungen × 5 Lernschritte, mit Szenarien, guten/falschen Optionen, Begründung, geprüften Quellenfundstellen und Lehr-einem-Freund-Fragen | **Nur JSON-Redaktionspilot**, bewusst nicht auf bestehende Fragen/Audios geschaltet |
| Andere 11 ursprünglichen Grundlagen | Themengebundene Gesprächsanlässe je Alter, bestehende Quellenmetadaten | Entwurf: Review #1535/#1587 offen |
| Übrige modulare Akademielektionen | Altersabhängige sichere Unterrichtsstruktur, Quellenkarte aus kanonischen Metadaten, neutrale Weitergabefrage | Architektur vorhanden; individualisierte Texte, Quellenreview, Voice und Geräte-QA noch offen |

## Qualitätskontrollen

- **4–5 Jahre:** kurze alltagsbezogene Sätze, zwei eindeutige Entscheidungsoptionen, große Trefferflächen, keine Schreibpflicht; Audio-Pflicht vor endgültiger selbstständiger Kinderfreigabe.
- **6–8 Jahre:** Begründung in einem Satz, freundliche Rückmeldung, Wiederholung nach Bedarf, keine suggestiven Unsinnsantworten.
- **9–10 Jahre:** belegte Aussage von pädagogischem Beispiel unterscheiden; keine willkürliche Quellenzahl abfragen; einen Irrtum argumentativ prüfen.
- **Islamische Genauigkeit:** Qurʾān-Original und vorhandenen Rezitator nicht ändern; arabischer Vollvers bei Auszügen; deutsche Bedeutung als Bedeutung kennzeichnen; Hadith als authentische Quelle oder **sinngemäße Wiedergabe** markieren; keinerlei erfundene Sunnah.
- **Sprachen und Stimme:** Serhat-Master ElevenLabs V4 nur nach manueller Fuṣḥā-/Deutsch-Trennungs-Hörprüfung; niemals deutsches „nur“ arabisch als „Nūr“ aussprechen; neue Karten bleiben ohne eigene Audios. Der Bedarf an echten freigegebenen Aufnahmen ist ausdrücklich **offen**.
- **Kinderschutz:** keine Datenübertragung, keine identifizierbaren Links, keine Kinderantworten öffentlich, Einladungen nur optional zu vertrauten Personen/Eltern.
- **UX:** fünf vorhandene Hauptschritte beibehalten; die fünf Abschlussfokus-Karten navigierbar; iOS/Android Safe Areas, Keyboard, Voice Playback und Bottom-Dock-Scroll müssen auf Geräten geprüft werden.
- **Persistenz:** `academy-v4`-Schlüssel, Lektion-IDs, Fragezahl, Quellen-Arabisch und vorhandene Audio-Dateien nicht überschreiben.
- **Rollout:** zuerst separater DAR TEST-Build / QA, danach formale Freigaben; **kein automatischer Merge nach main** oder Besucher-Push durch dieses Dokument.

## Abnahme vor produktiver Freigabe

- [ ] Fachkundiges Quellen- und ʿAqīdah-/Fiqh-Review der tatsächlich verwendeten Lerntexte und Antwortalternativen
- [ ] Alle altersabhängigen Unterrichtsskripte einschließlich der weiteren Modul-Lektionen individuell redigiert
- [ ] Vier alte zu generische Fragemuster und alle verbleibenden fachlich unbrauchbaren Distraktoren entfernt (Frageanzahl und Fortschrittsvertrag bewahren)
- [ ] Audio-Textabgleich mit SHA, isolierte deutsche und arabische Sprachsegmente, V4-Fuṣḥā-Hörabnahme durch Person
- [ ] iPhone mit/ohne Portal, iPad, Mädchen-/Jungenprofil, Zoom, VoiceOver, Offline, Fold/Android-PWA soweit dieselbe Weboberfläche verwendet wird, und Tastatur-/Tab-Bar-Scroll getestet
- [ ] Realer DAR TEST-Deploy und Bedienung dokumentiert, keine HTTP-200-Aussage als UI-Test ausgegeben
- [ ] Positive Release-Entscheidung separat bestätigt

## Nachweise und Zuordnung

- `kids/akademie/guided-lesson-v1.js`: allgemeine Quellen- und Denkführung.
- `kids/akademie/teachback-v1.js`: 12 Pilot-Themen und neutrale Fallbacks.
- `kids/akademie/editorial-pilots/sidq-deep-learning-v2.json`: ausgearbeitete Musterstunde, noch kein produktives Audio.
- `kids/tools/test-academy-guided-lesson-v1.cjs` und `kids/tools/test-academy-sidq-deep-learning-v2.cjs`: maschinell ausführbare Tests.
- GitHub Issues: #1535 individuelle pädagogische Reviews; PR #1587 11 Grundlagen-Quellennachweise; PR #1588 aktueller Umbau-Draft.
