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

Nach Dedupe-Reparatur und den Gap-Fill-Batches `06-001` bis `06-013` gilt jetzt:

```text
Qurʾān-Gesamtverse: 6236
entriesCount: 4253
totalVerifiedEntries: 4253
loadedEntries: 4253
uniqueVerifiedReferences: 4253
missingCount: 1983
duplicateCount: 0
invalidCount: 0
countMismatchCount: 0
firstMissingReference: 2:4
lastMissingReference: 19:98
letzter fortlaufender Batch: entries-batch-05z-116.json
letzter fortlaufender Vers: 114:6
letzter Gap-Fill-Batch: entries-gap-06-013.json
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
```

Seit der Dedupe-Basis `4190` wurden damit `63` neue eindeutige, geprüfte Referenzen registriert.

## Aktuell bewusst offen

Der erste weiterhin fehlende Vers ist:

```text
2:4
```

Frühe offene Referenzen wie `2:4–2:7`, `2:21`, `2:36`, `2:38`, `2:42–2:53`, `2:64`, `2:67`, `2:70` und `2:72` werden nicht künstlich gefüllt. Sie bleiben offen, bis ein konkreter früher Bericht mit belastbarer Zuordnung und ausreichend geprüfter Überlieferungskette vorliegt.

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
