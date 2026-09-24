# Qurʾān Tadabbur – Gap-Fill Status

Status: verbindliche Fortsetzung nach Abschluss des fortlaufenden Verslaufs  
Branch: `apple-tv-hadith-staging`

## Aktueller echter Stand

Der ältere Arbeitsstand mit `entriesCount: 5008` und Fortsetzungspunkt `entries-batch-05z-113.json` ist überholt.

Aktuell registriert:

```text
entriesCount: 5102
totalVerifiedEntries: 5102
letzter Batch: entries-batch-05z-116.json
letzter fortlaufender Vers: 114:6
```

## Warum kein `entries-batch-05z-117.json`?

`entries-batch-05z-116.json` endet bei Qurʾān `114:6`.

Danach gibt es keinen weiteren Qurʾān-Vers. Deshalb darf kein weiterer fortlaufender Batch nach `114:6` erfunden werden.

## Was jetzt wirklich fehlt

Die verbleibenden fehlenden Einträge bis zur Vollzahl `6236` sind keine Verse nach `114:6`, sondern Lücken innerhalb des bereits durchlaufenen Qurʾān-Bereichs.

Rechnung:

```text
Qurʾān-Gesamtverse: 6236
registrierte geprüfte Einträge: 5102
fehlende geprüfte Einträge: 1134
```

Diese `1134` müssen als Gap-Fill-Batches ergänzt werden, nicht als fortlaufende `05z`-Weiterführung.

## Neue Arbeitsregel

Ab jetzt:

```text
1. fehlende Referenzen auditieren
2. nur echte fehlende Referenzen aufnehmen
3. keine Duplikate erzeugen
4. keine Referenz nach 114:6 erzeugen
5. neue Batches als Gap-Fill kennzeichnen
```

Empfohlene Benennung:

```text
entries-gap-06-001.json
entries-gap-06-002.json
entries-gap-06-003.json
...
```

Jeder Gap-Fill-Batch enthält maximal 25 geprüfte Einträge.

## Audit-Tool

Neu angelegt:

```text
apple-tv/quran/tadabbur/tools/find-missing-references.mjs
```

Ausführen aus dem Tadabbur-Ordner:

```bash
cd apple-tv/quran/tadabbur
node tools/find-missing-references.mjs
```

Das Tool erzeugt:

```text
apple-tv/quran/tadabbur/missing-references.report.json
```

Der Report enthält:

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

## Nächster sauberer Schritt

1. Audit-Tool ausführen.
2. `suggestedNextBatch` oder `suggestedNextPlus200` prüfen.
3. Für diese Referenzen nur geprüfte Salaf-/Tafsīr-Einträge ergänzen.
4. Neue Datei erstellen, z. B. `entries-gap-06-001.json`.
5. `catalog.json` aktualisieren.
6. `entries-index.json` aktualisieren.
7. erneut Audit laufen lassen.
8. keine Duplikate, keine ungültigen Referenzen, keine Count-Mismatches zulassen.

## Auditlauf 24.09.2026

Der Gap-Fill-Lauf wurde zur vollständigen Prüfung des aktuellen Branchstands erneut angestoßen. Maßgeblich ist ausschließlich der erzeugte `missing-references.report.json`; vor dessen Auswertung werden keine Gap-Fill-Referenzen geraten oder manuell fortgeschrieben.

## Strenge Regel

Fehlende Verse dürfen nicht durch frei erzeugten religiösen Text gefüllt werden.

Wenn für eine Referenz kein geprüfter Eintrag vorliegt, bleibt in der App der feste Fallback aktiv:

```text
Für diesen Vers liegt derzeit keine geprüfte Salaf-Überlieferung vor.
```

## App-Verhalten

Die App zeigt:

- geprüfter Eintrag vorhanden → Tadabbur-Karte anzeigen
- kein geprüfter Eintrag vorhanden → festen Fallback anzeigen

Das ist vollständige technische Abdeckung, aber keine erfundene inhaltliche Abdeckung.
