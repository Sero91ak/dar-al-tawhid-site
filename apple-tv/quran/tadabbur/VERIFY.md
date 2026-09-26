# Qurʾān Tadabbur – Verify-Regel

Status: verbindliche Prüfanweisung  
Bereich: `apple-tv/quran/tadabbur/`  
Aktueller Stand: `entriesCount = 5102`, letzter Batch `entries-batch-05z-116.json`, letzter Vers im aktuellen Durchgang `114:6`

## Zweck

Dieser Bereich darf nur geprüfte Tadabbur-/Salaf-Einträge aus GitHub ausliefern.

Es gibt keine automatisch erzeugten Ersatztexte, keine KI-Ergänzungen und keine erfundenen Zuschreibungen.

Wenn für einen Vers kein geprüfter Eintrag vorhanden ist, zeigt die App ausschließlich den festen Fallback:

```text
Für diesen Vers liegt derzeit keine geprüfte Salaf-Überlieferung vor.
```

## Pflicht vor jedem Push neuer Tadabbur-Dateien

Nach jeder Änderung an einem dieser Bereiche muss der Prüfer laufen:

- `catalog.json`
- `entries-index.json`
- `entries.json`
- `entries-batch-*.json`

Ausführen vom Repository-Root:

```bash
python3 apple-tv/quran/tadabbur/tools/verify_tadabbur_catalog.py
```

## Was geprüft wird

Der Prüfer kontrolliert:

- `catalog.entriesCount` ist vorhanden und positiv.
- `catalog.entriesCount` entspricht `entries-index.totalVerifiedEntries`.
- Jeder Pfad aus `catalog.entriesPaths` steht auch in `entries-index.json`.
- Jeder Pfad aus `entries-index.json` steht auch im Katalog.
- Jede registrierte Datei existiert.
- Jede Datei hat eine gültige `entries`-Liste.
- Die Anzahl der Einträge pro Datei stimmt mit dem Index überein.
- Jede Referenz hat das Format `Sūrah:Āyah`, z. B. `99:5` oder `114:6`.
- Keine Referenz ist doppelt.
- Pflichtfelder sind vorhanden und nicht leer:
  - `reference`
  - `text`
  - `narrator`
  - `generation`
  - `source`
  - `grading`
- Die Gesamtsumme entspricht exakt `entriesCount`.

## Erwartetes Ergebnis

Bei korrektem Stand erscheint:

```text
TADABBUR VERIFY OK
entries: 5102
files: ...
last_reference: 114:6
```

Die genaue Dateianzahl kann steigen, wenn später weitere Batch-Dateien ergänzt werden. Entscheidend ist, dass Katalog, Index und tatsächliche Dateien übereinstimmen.

## Xcode-Regel

Xcode darf keine feste Grenze wie `5102` oder `entries-batch-05z-116.json` kennen.

Die App lädt:

```text
apple-tv/catalog.json
quran/tadabbur/catalog.json
quran/tadabbur/entries-index.json
alle registrierten Batch-Dateien
```

Die sichtbare Karte wird durch diese Datei bereitgestellt:

```text
apple-tv/xcode/TVQuranTadabburSupport.swift
```

Die Karte ist im Qurʾān-Tab unter dem Vers bzw. unter der deutschen Übersetzung eingebunden.

## Strenge Regel

Ein neuer Tadabbur-Batch darf erst registriert werden, wenn:

1. die Quellen/Zuordnungen geprüft sind,
2. `catalog.json` aktualisiert ist,
3. `entries-index.json` aktualisiert ist,
4. der Prüfer erfolgreich läuft,
5. die App weiterhin bei fehlendem Eintrag den festen Fallback zeigt.
