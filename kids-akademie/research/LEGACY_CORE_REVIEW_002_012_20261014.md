# DĀR AL TAWḤĪD KIDS AKADEMI · Legacy-Redaktion und Quellenstatus, Slots 2–12

**14. Oktober 2026 · geschützter Entwurf, keine wissenschaftliche Freigabe.**

## Aufgedeckte Lücke und durchgeführte Reparatur

Das Basis-Modul `kids/akademie/curriculum-v1.js` enthielt **elf Unterrichtsthemen mit `lines`, aber ohne eigene `ageText`-Felder** für 4–5, 6–8 und 9–10 Jahre. Die Webseite fiel in solchen Fällen mit `ageTeaching?.lines || lesson.lines` auf dieselben Basiszeilen für alle Altersgruppen zurück. Die im `LESSON_STATUS.json` stehende Anzeige dreier vorhandener Altersversionen war für diese Lehrtexte deshalb zu optimistisch, selbst wenn die Quizfragen nach Alter unterschieden wurden.

Die drei neuen separat geladenen Module reparieren das, ohne die ersten Quellen-, Quiz- oder Fortschrittsfelder zu überschreiben:

- `kids/akademie/curriculum-editorial-core-002-005-v1.js`: Slots 2–5, zwölf eigene Altersfassungen.
- `kids/akademie/curriculum-editorial-core-006-009-v1.js`: Slots 6–9, zwölf eigene Altersfassungen.
- `kids/akademie/curriculum-editorial-core-010-012-v1.js`: Slots 10–12, neun eigene Altersfassungen.

Damit **elf ursprüngliche Lektions-IDs, 33 unterschiedliche Altersfassungen, 209 rein textuelle (nicht generierte) Sprachkontexte**. Sie werden im geschützten Akademie-Index **nach V47, vor den späteren Editorial-Overlays** geladen. Der Sonderunterricht `sidq` (Slot 1) besitzt schon eine eigene altersabhängige Darstellung, wird nicht durch diese V1-Reparatur überschrieben.

**Ausgeführter isolierter V8-Kontrolllauf:** Alle 3 Zusatzmodule mit ursprünglichem V1-Objekt ausgeführt; 33/33 Altersfassungen, 209/209 Textkontexte, keine Konflikte, sämtliche Original-Referenzen `quran`, `hadith`, `questions` unverändert. Fachliche Freigabesicherungen im internen `sourceAudit`: `scientificApproval=false`; bei allen drei frühen Fiqh-Lektionen 3, 7, 11 zusätzlich `fiqhHumanReviewNeeded=true`. Der permanente Node-Regressionstest liegt unter `kids/tools/test-academy-editorial-core-002-012-v1.cjs`, sein tatsächlicher Node-/Browser-/CI-Lauf steht aus.

## Quellennachweise und noch offene Primärkontrolle

| Slot | Inhalt | Bereits vorhandener Basisbeleg | unabhängige Nachprüfung am 14.10.2026 |
|---|---|---|---|
| 2 | Salām | Qurʾān 4:86; Muslim 54a | **Bestätigt**: [Dorar 37272](https://dorar.net/hadith/sharh/37272) führt Abū Hurayrah, Ṣaḥīḥ Muslim Nr. 54 und `أفشوا السلام بينكم` |
| 3 | Reinheit | Qurʾān 74:4; Muslim 223 | **Bestätigt**: [Dorar 127871](https://dorar.net/hadith/sharh/127871) führt Muslim 223 und `الطهور شطر الإيمان`; die Webseite enthält zusätzlich einen getrennten schwächer bewerteten Einzelbericht, **nicht** mit dem ṣaḥīḥ-Muslim-Hadith verwechseln |
| 4 | Tawḥīd | Qurʾān 112:1; al-Buḫārī 2856 | **Bestätigt**: [Dorar 11568](https://dorar.net/hadith/sharh/11568) nennt Muʿāḏ und Buḫārī 2856, Recht Allahs auf ausschließliche Anbetung |
| 5 | Geduld | Qurʾān 2:153; al-Buḫārī 1469 | Originalvorgabe erhalten; **direkter Hadith-Nachweis noch nicht unabhängig erneut geöffnet** |
| 6 | Freundliche Worte | Qurʾān 17:53; al-Buḫārī 6018 | Noch nicht neu geöffnet |
| 7 | Wuḍūʾ | Qurʾān 5:6 (als **Auszug** gekennzeichnet); al-Buḫārī 135 | Noch nicht neu geöffnet; zusätzliche klassische hanbalitische Ausführungs-/Ausnahmekontrolle nötig |
| 8 | Īmān | Qurʾān 2:3; Muslim 8a (Ḥadīṯ Ǧibrīl) | Noch nicht neu geöffnet; Sechserliste steht im Hadith, **nicht** vollständig in 2:3 |
| 9 | Amānah | Qurʾān 23:8; al-Buḫārī 33 | Noch nicht neu geöffnet; Kinder wegen Vergessens nicht individuell als Heuchler bezeichnen |
| 10 | Eltern achten | Qurʾān 17:23; al-Buḫārī 5971 | **Bestätigt**: [Dorar 62297](https://dorar.net/hadith/sharh/62297) nennt Abū Hurayrah, Buḫārī 5971 und Muslim 2548, Hervorhebung der Mutter und danach des Vaters |
| 11 | Ṣalāh | Qurʾān 20:14; al-Buḫārī 631 | Noch nicht neu geöffnet; Gebetsausführung und Rechte Minderjähriger bedürfen gesonderter Fiqh-Prüfung |
| 12 | Ikhlāṣ | Qurʾān 39:11; al-Buḫārī 1 | Im alten Quellenbankeintrag geführt; **keine neue unabhängige Direktsichtung**; keine Wertung verborgener Kinderabsichten |

**Quellengrundsatz:** Deutsche Aussagen sind sinngemäße Erläuterungen; Kindergeschichten werden als moderne Unterrichtsbeispiele formuliert. Qurʾāntext, Ḥadīṯ-Wortlaut, klassischer Tafsīr und eigene Didaktik bleiben getrennt. Keine erfundenen Ritualzahlen, keine erzwungene Preisgabe privater Gedanken, kein Schweigen bei Übergriffen, keine schmerzhaften rituellen Übungen.

## Verbleibende Lücken

- **Slots 13–34** stammen im Basiskatalog überwiegend aus `curriculum-v2.js`. Bei diesen neuen Themen enthält V2 ebenfalls keine `ageText`-Felder; der Lernbereich verwendet möglicherweise die gemeinsamen Basiszeilen. **Deren individuelle Altersredaktion gesondert konkret überprüfen und bei bestätigter Lücke bearbeiten**. Keine automatische wissenschaftliche Freigabe aufgrund vorhandener altersbezogener Quizfragen.
- Die umfangreiche übrige wissenschaftliche/fiqhbezogene Quellenprüfung und Browser-/Node-/iOS-/Android-Tests der 208 Themen bleiben notwendig.
- Das Projekt meldet 208 belegte Themenplätze und 624 zugeordnete Alterspositionen. Dies ist **nicht gleichbedeutend mit 624 unabhängig geprüften und freigegebenen Texten**. **0/624 Endfreigaben**.
- Kein Merge nach `main`, kein Live-Deploy, keine Audioerzeugung, keine neuen ElevenLabs-Credits.
