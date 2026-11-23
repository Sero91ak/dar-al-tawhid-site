# DĀR AL TAWḤĪD – Quellen Q1–Q50: verbindliche Neunsprachen-Migration

## Kanonische Regel
Ein Quellenbeleg = **eine Q-ID**, eine kanonische URL `/q/N/`, neun Sprachfassungen `de, ar, en, tr, ku, ckb, bs, fr, es`, App-Speicher `darAdultPreferredLocaleV1`, optional `?lang=`. Kein zusätzlicher Link, keine neue Q-ID, keine Übersetzung arabischer Primärzitate, keine Manipulation an Isnād, Quellen-URLs, Originalnummern oder Quiz-Lösungsschlüsseln. Arabisch und Sorani: RTL. Webseite, Android-PWA und native WKWebView lesen denselben Ursprung.

Das **Sprachmenü** ist nicht gleichbedeutend mit einer **fertigen Übersetzung**. Nicht vorhandene Manuskripte bleiben sichtbar als deutsches Original mit lokalisiertem Hinweis. Ein Übersetzungsentwurf ist nicht unabhängig fachlich/sprachlich freigegeben. Die automatische KI-Publikation solcher Entwürfe ist ausdrücklich nicht erlaubt.

## Technischer Stand dieses Branches (nicht mit Live-Deployment verwechseln)
- `assets/q-legacy-nine-language-v1.js`: gemeinsamer Q1–Q48-Adapter ohne Eingriff in die ursprünglichen Quellentexte.
- `cloudflare/site-router.js`: einmalige Einbindung des Adapters in Q1–Q48, ohne die Q49–Q51-Adapter zu ersetzen.
- `assets/q-legacy-locales-v1.json`: Q1–Q5, jeweils neun Fassungen von Titel, Aussage, Sprecher, Thema, Einordnung, Linktext und Quellenhinweisen. Acht Fremdsprachen als **draft-review-required**.
- Q49 und Q50: vorhandene eigene neunsprachige Datenpakete und Lernadapter, redaktionelle Prüfstatus aus deren Paketen weiter gültig.
- `scripts/check-q1-q50-nine-language.cjs`: gültige Q-IDs, identische Q-URLs, Quellstand anhand des Git-Blob-Hashes, vollständige Sprachschlüssel und Erhalt externer Nachweise.
- Ein simulierter DOM-Sprachtest für Q1–Q5 hat 45 Sprachwechsel ohne Änderung externer URLs bestanden. Das ersetzt keine Geräteprüfung.

## Arbeitsblöcke

| Block | Quellenlinks | Inhaltsstatus | Lernbereich |
| --- | --- | --- | --- |
| 1 | Q1–Q5 | Neun Sprachentwürfe erstellt; unabhängige Prüfung offen | Für diese fünf Quellen keine zugeordneten eigenständigen Lernseiten im untersuchten Bestand |
| 2 | Q6–Q10 | Quellen-Sprachmenü vorbereitet; Übersetzungen fehlen | Q6: `/lernen/ikhlas/`, inhaltliche Sprachfassung offen |
| 3 | Q11–Q15 | Übersetzungen fehlen | Nach Bestand prüfen |
| 4 | Q16–Q20 | Übersetzungen fehlen | Nach Bestand prüfen |
| 5 | Q21–Q25 | Übersetzungen fehlen | Nach Bestand prüfen |
| 6 | Q26–Q30 | Übersetzungen fehlen | Nach Bestand prüfen |
| 7 | Q31–Q35 | Übersetzungen fehlen | Nach Bestand prüfen |
| 8 | Q36–Q40 | Übersetzungen fehlen | Nach Bestand prüfen |
| 9 | Q41–Q45 | Übersetzungen fehlen | Nach Bestand prüfen |
| 10 | Q46–Q50 | Q46–Q48 fehlen; Q49–Q50 haben neunsprachige Pakete | Q46: `/lernen/wissen-adab/`, Q47: `/lernen/tawhid-iman-akhlaq/`, Q48: `/lernen/selbstpruefung/` noch ohne vollständige Übersetzung; Q49/Q50 eigene Sprachadapter |

## Pflichtabnahme je Quelle vor Live-Freigabe

1. Deutschen Originaltext und unveränderliche Quellen-/Isnād-/Aussagenidentität gegen den kanonischen Stand prüfen. **Keine** ursprüngliche arabische Formulierung aufgrund eines Sprachentwurfs ersetzen.
2. Titel, gesamte Aussage, Erklärungen, Statushinweise, Beschriftungen, bibliographische Kontextwörter und sämtliche sichtbaren relevanten Abschnitte in allen acht Fremdsprachen erstellen. Namen von Werken/Überlieferern und Originalzitate bleiben zitiergetreu.
3. Wenn ein Lernbereich existiert: Übersetzung **jeder Frage**, aller Antwortmöglichkeiten, Richtig/Falsch-Erklärungen, Fortschritt, Ergebnis und Navigation; identischer korrekter Antwortindex.
4. Sprachumschaltung im gleichen Q-Link vor/nach Initialladen, mit/ohne `?lang=`, im Browser, auf Smartphone/iPad und Android-Fold; RTL und Hell-/Dunkel-Themes prüfen. Wechsel in den Lernbereich erhält dieselbe Sprache.
5. Freigabe nur nach eigenständiger sprachlicher und religiöser Prüfung; bei Abweichung oder Textrevision `stale` beziehungsweise deutscher Fallback. Kein OneSignal-Geräte-Push aufgrund dieser Korrekturen.

## Sicherheits-/Veröffentlichungstrennung
Diese Migration ist **kein Push-Auftrag**. Geschützte CI-, Admin-, Standort-/Gebets- und Kids-Dateien dürfen nicht verändert werden. Ein GitHub-Merge ist nicht automatisch eine geprüfte Cloudflare-Live-Auslieferung; beide Zustände sind getrennt nachzuweisen.
