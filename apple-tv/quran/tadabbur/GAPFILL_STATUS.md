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

Nach Dedupe-Reparatur und den Gap-Fill-Batches `06-001` bis `06-032` gilt jetzt:

```text
Qurʾān-Gesamtverse: 6236
entriesCount: 4316
totalVerifiedEntries: 4316
loadedEntries: 4316
uniqueVerifiedReferences: 4316
missingCount: 1920
duplicateCount: 0
invalidCount: 0
countMismatchCount: 0
firstMissingReference: 2:4
lastMissingReference: 19:98
letzter fortlaufender Batch: entries-batch-05z-116.json
letzter fortlaufender Vers: 114:6
letzter Gap-Fill-Batch: entries-gap-06-032.json
nächster Gap-Fill-Batch: entries-gap-06-033.json
```

## Warum kein `entries-batch-05z-117.json`?

`entries-batch-05z-116.json` erreicht Qurʾān `114:6`.

Danach gibt es keinen weiteren Qurʾān-Vers. Alle weiteren Arbeiten sind ausschließlich interne Gap-Fills.

## Abgeschlossene Gap-Fill-Batches

```text
entries-gap-06-001.json   7 Einträge
entries-gap-06-002.json   8 Einträge
entries-gap-06-003.json   3 Einträge
entries-gap-06-004.json   5 Einträge
entries-gap-06-005.json   1 Eintrag
entries-gap-06-006.json   4 Einträge
entries-gap-06-007.json   8 Einträge
entries-gap-06-008.json   1 Eintrag
entries-gap-06-009.json   3 Einträge
entries-gap-06-010.json   7 Einträge
entries-gap-06-011.json   8 Einträge
entries-gap-06-012.json   6 Einträge
entries-gap-06-013.json   2 Einträge
entries-gap-06-014.json   3 Einträge
entries-gap-06-015.json   3 Einträge
entries-gap-06-016.json   2 Einträge
entries-gap-06-017.json   2 Einträge
entries-gap-06-018.json   2 Einträge
entries-gap-06-019.json   3 Einträge
entries-gap-06-020.json   6 Einträge
entries-gap-06-021.json   4 Einträge
entries-gap-06-022.json   3 Einträge
entries-gap-06-023.json   6 Einträge
entries-gap-06-024.json   5 Einträge
entries-gap-06-025.json   4 Einträge
entries-gap-06-026.json   3 Einträge
entries-gap-06-027.json   5 Einträge
entries-gap-06-028.json   3 Einträge
entries-gap-06-029.json   2 Einträge
entries-gap-06-030.json   3 Einträge
entries-gap-06-031.json   3 Einträge
entries-gap-06-032.json   1 Eintrag
```

Seit der Dedupe-Basis `4190` wurden damit `126` neue eindeutige, geprüfte Referenzen registriert.

## Audit-Korrektur bei 06-025

Der erste Audit von `entries-gap-06-025.json` stoppte korrekt, weil Qurʾān `2:229` bereits in

```text
entries-batch-04n.json
```

registriert war.

Der doppelte Eintrag wurde ausschließlich aus `06-025` entfernt. Danach:

```text
entries-gap-06-025.json: 4 Einträge
duplicateCount: 0
invalidCount: 0
countMismatchCount: 0
```

Diese Korrektur ist verbindlich; Qurʾān `2:229` darf nicht erneut als Gap-Fill registriert werden.

## Zuletzt ergänzte Bereiche

```text
06-020: 2:124, 2:127, 2:129, 2:130, 2:132, 2:138
06-021: 2:154, 2:166, 2:167, 2:171
06-022: 2:173, 2:174, 2:182
06-023: 2:185, 2:188, 2:193, 2:194, 2:195, 2:200
06-024: 2:204, 2:207, 2:208, 2:217, 2:218
06-025: 2:220, 2:224, 2:231, 2:233
06-026: 2:235, 2:236, 2:237
06-027: 2:254, 2:265, 2:269, 2:270, 2:271
06-028: 2:278, 2:279, 2:282
06-029: 3:6, 3:13
06-030: 3:17, 3:23, 3:30
06-031: 3:35, 3:36, 3:39
06-032: 3:50
```

## Aktuell bewusst offen

Der erste weiterhin fehlende Vers ist:

```text
2:4
```

Frühe offene Referenzen wie `2:4–2:7`, `2:21`, `2:36`, `2:38`, `2:42–2:53`, `2:64`, `2:67`, `2:70` und `2:72` werden nicht künstlich gefüllt. Sie bleiben offen, bis ein konkreter früher Bericht mit belastbarer Zuordnung und ausreichend geprüfter Überlieferungskette vorliegt.

Ebenso gilt für spätere Lücken: Ein vorhandener später Kommentar allein genügt nicht, wenn der zugehörige frühe Bericht oder seine Überlieferungskette für den Eintrag nicht ausreichend abgesichert ist.

## Gap-Fill-Regel

Ab jetzt verbindlich:

```text
1. fehlende Referenzen nur aus dem Audit übernehmen
2. ausschließlich geprüfte Einträge ergänzen
3. keine doppelten reference-Werte registrieren
4. keine ungültigen Qurʾān-Referenzen erzeugen
5. maximal 25 Einträge pro Gap-Fill-Datei
6. nach jedem Batch catalog.json und entries-index.json aktualisieren
7. nach jedem Batch Audit erneut ausführen
8. Audit muss duplicateCount=0, invalidCount=0 und countMismatchCount=0 behalten
9. kein Eintrag wird nur erzeugt, um eine Zahl zu erhöhen
10. mursal/unsichere oder nicht vollständig geprüfte Überlieferungen werden nicht als ṣaḥīḥ ausgegeben
11. bereits registrierte Referenzen werden vor jedem neuen Batch gegen den Audit geprüft
```

Benennung:

```text
entries-gap-06-001.json
entries-gap-06-002.json
entries-gap-06-003.json
...
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
