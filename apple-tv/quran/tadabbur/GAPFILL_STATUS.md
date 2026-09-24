# Qurʾān Tadabbur – Gap-Fill Status

Status: verbindliche Fortsetzung nach Abschluss des fortlaufenden Verslaufs  
Branch: `apple-tv-hadith-staging`

## Aktueller auditfester Stand

Der frühere Stand `5102` war die Zahl registrierter Zeilen, nicht die Zahl eindeutiger Qurʾān-Referenzen.

Der vollständige Audit am 24.09.2026 ergab vor der Bereinigung:

```text
geladene Einträge: 5102
eindeutige Referenzen: 4190
Duplikate: 912
ungültige Referenzen: 0
Count-Mismatches: 2
```

Die 912 späteren Dubletten wurden verlustfrei aus dem registrierten Datensatz entfernt und nach

```text
duplicate-review-archive.json
```

verschoben. Die jeweils erste registrierte Referenz bleibt kanonisch. Dadurch geht kein alternativer Datensatz verloren; er bleibt für spätere Einzelprüfung erhalten.

Nach der Reparatur:

```text
entriesCount: 4190
totalVerifiedEntries: 4190
loadedEntries: 4190
uniqueVerifiedReferences: 4190
duplicateCount: 0
invalidCount: 0
countMismatchCount: 0
fehlende eindeutige Referenzen: 2046
erster fehlender Vers: 1:1
letzter fehlender Vers: 19:98
letzter fortlaufender Batch: entries-batch-05z-116.json
letzter fortlaufender Vers: 114:6
```

## Warum kein `entries-batch-05z-117.json`?

`entries-batch-05z-116.json` erreicht Qurʾān `114:6`.

Danach gibt es keinen weiteren Qurʾān-Vers. Deshalb darf kein weiterer fortlaufender `05z`-Batch nach `114:6` erzeugt werden.

## Was jetzt wirklich fehlt

Die verbleibenden `2046` Referenzen sind interne Lücken innerhalb des Qurʾān, keine Verse nach `114:6`.

Rechnung:

```text
Qurʾān-Gesamtverse: 6236
eindeutige geprüfte Einträge: 4190
fehlende eindeutige Einträge: 2046
```

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
```

Benennung:

```text
entries-gap-06-001.json
entries-gap-06-002.json
entries-gap-06-003.json
...
```

## Nächster Audit-Batch

Der nächste echte 25er-Bereich ist:

```text
1:1
1:2
1:3
1:4
1:5
1:6
1:7
2:1
2:2
2:3
2:4
2:5
2:6
2:7
2:8
2:9
2:10
2:11
2:12
2:13
2:14
2:15
2:16
2:17
2:18
```

Diese Referenzen sind nur Arbeitsziele. Sie dürfen erst registriert werden, wenn für die jeweilige Referenz ein geprüfter Datensatz vorliegt.

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
