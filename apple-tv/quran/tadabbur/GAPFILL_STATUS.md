# Qurʾān Tadabbur – Gap-Fill Status

Status: verbindliche Fortsetzung nach Abschluss des fortlaufenden Verslaufs  
Branch: `apple-tv-hadith-staging`  
Letzter Voll-Audit: 24.09.2026

## Aktueller auditfester Stand

Der historische Stand `5102` war die Zahl registrierter Zeilen, nicht die Zahl eindeutiger Qurʾān-Referenzen.

Der erste vollständige Audit ergab:

```text
geladene Einträge: 5102
eindeutige Referenzen: 4190
Duplikate: 912
ungültige Referenzen: 0
Count-Mismatches: 2
```

Die 912 späteren Dubletten wurden verlustfrei aus dem registrierten Datensatz entfernt und in

```text
duplicate-review-archive.json
```

archiviert. Die jeweils erste registrierte Referenz bleibt kanonisch.

Nach Dedupe-Reparatur und den Gap-Fill-Batches `06-001` bis `06-048` gilt jetzt:

```text
Qurʾān-Gesamtverse: 6236
entriesCount: 4354
totalVerifiedEntries: 4354
loadedEntries: 4354
uniqueVerifiedReferences: 4354
missingCount: 1882
duplicateCount: 0
invalidCount: 0
countMismatchCount: 0
firstMissingReference: 2:4
lastMissingReference: 19:98
letzter fortlaufender Batch: entries-batch-05z-116.json
letzter fortlaufender Vers: 114:6
letzter Gap-Fill-Batch: entries-gap-06-048.json
nächster Gap-Fill-Batch: entries-gap-06-049.json
```

Seit der Dedupe-Basis `4190` wurden damit `164` neue eindeutige, geprüfte Referenzen registriert.

## Warum kein `entries-batch-05z-117.json`?

`entries-batch-05z-116.json` erreicht Qurʾān `114:6`.

Danach gibt es keinen weiteren Qurʾān-Vers. Alle weiteren Arbeiten sind ausschließlich interne Gap-Fills.

## Abgeschlossene Gap-Fill-Batches

```text
06-001  7      06-017  2      06-033  5
06-002  8      06-018  2      06-034  2
06-003  3      06-019  3      06-035  3
06-004  5      06-020  6      06-036  2
06-005  1      06-021  4      06-037  3
06-006  4      06-022  3      06-038  2
06-007  8      06-023  6      06-039  2
06-008  1      06-024  5      06-040  1
06-009  3      06-025  4      06-041  3
06-010  7      06-026  3      06-042  2
06-011  8      06-027  5      06-043  3
06-012  6      06-028  3      06-044  3
06-013  2      06-029  2      06-045  1
06-014  3      06-030  3      06-046  2
06-015  3      06-031  3      06-047  2
06-016  2      06-032  1      06-048  2
```

Die Zahl hinter jedem Batch ist die aktuell registrierte Eintragszahl der Datei.

## Audit-Korrektur bei 06-025

Der erste Audit von `entries-gap-06-025.json` stoppte korrekt, weil Qurʾān `2:229` bereits in

```text
entries-batch-04n.json
```

registriert war.

Der doppelte Eintrag wurde ausschließlich aus `06-025` entfernt. Der kanonische, bereits vorhandene Eintrag blieb unverändert bestehen.

Aktuell:

```text
entries-gap-06-025.json: 4 Einträge
duplicateCount: 0
invalidCount: 0
countMismatchCount: 0
```

Qurʾān `2:229` darf nicht erneut als Gap-Fill registriert werden.

## Zuletzt ergänzte Bereiche

```text
06-041: 3:3, 3:4, 3:8
06-042: 3:27, 3:28
06-043: 3:45, 3:46, 3:48
06-044: 3:55, 3:59, 3:60
06-045: 3:72
06-046: 3:100, 3:112
06-047: 3:111, 3:113
06-048: 3:117, 3:118
```

## Nächste echte Audit-Lücken

Der erste weiterhin fehlende Vers ist:

```text
2:4
```

Der aktuelle nächste 25er-Auditbereich beginnt mit:

```text
2:4
2:5
2:6
2:7
2:21
2:36
2:38
2:42
2:43
2:44
2:46
2:47
2:48
2:49
2:50
2:51
2:52
2:53
2:64
2:67
2:70
2:72
2:82
2:83
2:87
```

Diese Referenzen sind Arbeitsziele, keine Aufforderung zum künstlichen Füllen. Ein Vers bleibt offen, bis ein konkreter früher Bericht mit belastbarer Zuordnung und ausreichend geprüfter Überlieferungskette vorliegt.

## Gap-Fill-Regel

Ab jetzt verbindlich:

```text
1. fehlende Referenzen nur aus dem aktuellen Audit übernehmen
2. ausschließlich geprüfte Einträge ergänzen
3. keine doppelten reference-Werte registrieren
4. keine ungültigen Qurʾān-Referenzen erzeugen
5. maximal 25 Einträge pro Gap-Fill-Datei
6. vor Registrierung gegen den aktuellen Branchkopf prüfen
7. nach jedem Batch catalog.json und entries-index.json aktualisieren
8. nach jedem Batch Audit erneut ausführen
9. Audit muss duplicateCount=0, invalidCount=0 und countMismatchCount=0 behalten
10. kein Eintrag wird nur erzeugt, um eine Zahl zu erhöhen
11. mursal/unsichere oder nicht vollständig geprüfte Überlieferungen werden nicht als ṣaḥīḥ ausgegeben
12. bereits registrierte Referenzen werden vor jedem neuen Batch gegen den Audit geprüft
```

## Audit-Tool

```text
apple-tv/quran/tadabbur/tools/find-missing-references.mjs
```

Ausführen:

```bash
cd apple-tv/quran/tadabbur
node tools/find-missing-references.mjs
```

Der Report enthält insbesondere:

- `totalVerses`
- `catalogEntriesCount`
- `indexTotalVerifiedEntries`
- `loadedEntries`
- `uniqueVerifiedReferences`
- `missingCount`
- `duplicateCount`
- `invalidCount`
- `countMismatchCount`
- `firstMissingReference`
- `lastMissingReference`
- `suggestedNextBatch`
- `suggestedNextPlus200`
- vollständige `missing`-Liste

## Dedupe-Reparatur

Werkzeug:

```text
apple-tv/quran/tadabbur/tools/dedupe-registered-entries.mjs
```

Review-Archiv:

```text
apple-tv/quran/tadabbur/duplicate-review-archive.json
```

Die entfernten Mehrfacheinträge bleiben dort mit `canonicalPath` und `removedFromPath` nachvollziehbar.

## Strenge Inhaltsregel

Fehlende Verse dürfen nicht durch frei erzeugten religiösen Text gefüllt werden.

Wenn für eine Referenz kein geprüfter Eintrag vorliegt, bleibt der feste Fallback aktiv:

```text
Für diesen Vers liegt derzeit keine geprüfte Salaf-Überlieferung vor.
```

## App-Verhalten

- geprüfter Eintrag vorhanden → Tadabbur-Karte anzeigen
- kein geprüfter Eintrag vorhanden → festen Fallback anzeigen

Das ist vollständige technische Abdeckung ohne erfundene inhaltliche Abdeckung.
