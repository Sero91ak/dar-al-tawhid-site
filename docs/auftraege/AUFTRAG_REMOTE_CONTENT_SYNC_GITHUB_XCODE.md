# AUFTRAG – GitHub + Xcode Remote-Content-Synchronisierung

Status: verbindlicher Architektur-Auftrag  
Projekt: DĀR AL TAWḤĪD App / Apple TV / iOS / iPadOS / Qurʾān / Ḥadīṯ / Šarḥ / Bildschirmschoner  
Branch: `apple-tv-hadith-staging`

## Ziel

Die App darf Inhalte nicht mehr fest im Xcode-Code oder im alten Bundle-Stand besitzen.  
Die App ist nur die stabile Hülle.  
Die Inhalte kommen dynamisch aus GitHub bzw. aus der Live-Auslieferungsquelle.

Sobald ein Nutzer online ist, muss die App automatisch prüfen, ob neue Inhalte, neue Aussagen, neue Ḥadīṯe, neue Šarḥ-Erklärungen, neue Bildschirmschoner-Inhalte oder Korrekturen vorhanden sind.

Neue Inhalte dürfen kein neues Bolt-/Xcode-/App-Store-Update erfordern.

## Grundsatz

**GitHub liefert die Wahrheit über Inhalt und Version. Xcode synchronisiert diese Wahrheit automatisch.**

Xcode darf keine Inhaltsgrenzen kennen.

Verboten:

- feste Grenzen wie `5008`, `5102`, `05z-112` oder `05z-116` im Code
- fest eingebaute JSON-Dateilisten
- fest eingebaute Ḥadīṯ-Listen
- fest eingebaute Šarḥ-Listen
- fest eingebaute Bildschirmschoner-Inhalte
- App-Update nur wegen neuen Inhalten
- leerer Bildschirm, wenn Remote gerade nicht erreichbar ist

Erlaubt und erforderlich:

- Xcode kennt nur die Remote-Basis-URL und den jeweiligen `catalog.json`
- `catalog.json` entscheidet, welche Dateien geladen werden
- `entries-index.json` bestätigt den vollständigen Stand
- alle Daten werden offline gecacht
- Korrekturen werden automatisch übernommen

## Aktueller Qurʾān-Tadabbur-Stand

Pfad:

```text
apple-tv/quran/tadabbur/catalog.json
```

Aktueller registrierter Stand:

```text
entriesCount: 5102
letzter Batch: entries-batch-05z-116.json
letzter Vers: 114:6
```

Dieser Stand muss von Apple TV, iOS, iPadOS und dem Qurʾān-Bereich automatisch erkannt werden.

## Verantwortung GitHub / Content-Seite

GitHub muss für jeden Inhaltsbereich einen eigenen Katalog bereitstellen.

Pflichtbereiche:

```text
apple-tv/quran/tadabbur/catalog.json
apple-tv/hadith/catalog.json
apple-tv/hadith/sharh/catalog.json
apple-tv/screensaver/catalog.json
apple-tv/dua/catalog.json
apple-tv/series/catalog.json
```

Wenn bestehende Pfade anders heißen, müssen die vorhandenen Projektpfade verwendet werden. Die Regel bleibt gleich: Jeder Bereich braucht einen eigenen Katalog.

Jeder Katalog muss mindestens enthalten:

```json
{
  "schemaVersion": "1.0",
  "contentType": "quran-tadabbur",
  "contentVersion": 5102,
  "entriesCount": 5102,
  "lastUpdated": "2026-09-23T00:00:00Z",
  "remoteLoad": true,
  "offlineCache": true,
  "entriesIndexPath": "entries-index.json",
  "entriesPaths": [
    "entries.json",
    "entries-batch-05z-113.json",
    "entries-batch-05z-114.json",
    "entries-batch-05z-115.json",
    "entries-batch-05z-116.json"
  ],
  "fallback": {
    "enabled": true,
    "text": "Für diesen Vers liegt derzeit keine geprüfte Salaf-Überlieferung vor."
  }
}
```

Optional, aber empfohlen:

```json
{
  "files": [
    {
      "path": "entries-batch-05z-116.json",
      "count": 19,
      "sha256": "...",
      "lastUpdated": "2026-09-23T00:00:00Z"
    }
  ]
}
```

Damit kann Xcode erkennen, ob eine Datei korrigiert wurde, auch wenn der Dateiname gleich bleibt.

## Verantwortung Xcode / App-Seite

Xcode muss einen zentralen `RemoteContentSyncService` besitzen.

Dieser Service muss für alle Bereiche gleich genutzt werden:

- Qurʾān-Tadabbur
- Ḥadīṯ
- Šarḥ
- Bildschirmschoner
- Duʿāʾ
- Tagesinhalte
- Serien
- zukünftige JSON-Inhalte

Keine doppelte Speziallogik für Apple TV.  
Keine getrennte alte iOS-Logik.  
Keine festen lokalen Dateigrenzen.

## Synchronisierungsablauf

Beim App-Start:

1. Internet prüfen.
2. Remote-`catalog.json` laden.
3. Lokalen Katalog vergleichen.
4. Wenn Remote neuer ist:
   - neue Dateien aus `entriesPaths` laden,
   - fehlende Dateien laden,
   - geänderte Dateien anhand Version/Hash ersetzen,
   - JSON validieren,
   - temporären Cache schreiben,
   - nach erfolgreicher Prüfung aktiven Cache ersetzen,
   - UI aktualisieren.
5. Wenn Remote nicht neuer ist:
   - lokalen Cache verwenden.
6. Wenn kein Internet vorhanden ist:
   - letzten vollständigen Cache verwenden.
7. Wenn Remote fehlerhaft ist:
   - alten funktionierenden Cache behalten.

## Wann synchronisiert werden muss

Die App muss prüfen bei:

- erstem App-Start
- jedem App-Start mit Internet
- Rückkehr aus dem Hintergrund
- Öffnen eines Inhaltsbereichs
- Apple-TV-App-Start
- Apple-TV-Rückkehr aus Standby
- spätestens nach 6–12 Stunden
- optional manuellem Debug-/Admin-Refresh

## Atomare Cache-Regel

Ein neuer Inhaltsstand darf erst aktiv werden, wenn alle Pflichtdateien erfolgreich geladen und geprüft wurden.

Falsch:

```text
alten Cache löschen → neue Datei fehlt → App zeigt leere Ansicht
```

Richtig:

```text
neuen Stand in temporären Cache laden → prüfen → dann aktiven Cache ersetzen
```

## Offline-Regel

Wenn kein Internet vorhanden ist:

- keinen leeren Bildschirm zeigen
- keinen Crash verursachen
- keine Daten löschen
- letzten vollständigen Cache verwenden
- Fehler nur intern loggen

## Korrektur-Regel

Wenn online eine Aussage korrigiert wird, muss die App die Korrektur automatisch übernehmen.

Dafür muss die App vergleichen über mindestens eines dieser Felder:

- `contentVersion`
- `lastUpdated`
- `sha256`
- `etag`
- Datei-Hash

Wenn Dateiinhalt geändert wurde, muss die lokale alte Datei ersetzt werden.

## Ḥadīṯ-Regel

Der Ḥadīṯ-Bereich muss remote arbeiten.

Pflicht:

- `hadith/catalog.json` laden
- alle Ḥadīṯ-Batches aus Katalog laden
- neue Ḥadīṯe automatisch erkennen
- korrigierte Ḥadīṯe automatisch ersetzen
- Bücher, Kapitel und Kategorien dynamisch aus JSON aufbauen
- offline cachen

## Šarḥ-Regel

Šarḥ muss separat, aber verknüpft geladen werden.

Jeder Šarḥ-Eintrag muss mit einem Ḥadīṯ verknüpft sein, z. B. über:

```text
hadithId
reference
bookId
chapterId
sharhId
```

Beim Öffnen eines Ḥadīṯ:

- lokalen Šarḥ-Cache prüfen
- wenn vorhanden: Button „Erklärung“ anzeigen
- wenn nicht vorhanden: keinen leeren Button anzeigen
- wenn online neuer Šarḥ vorhanden ist: automatisch nachladen

## Bildschirmschoner-Regel

Der Apple-TV-Bildschirmschoner muss ebenfalls remote synchronisiert werden.

Pflicht:

- `screensaver/catalog.json` laden
- Inhalte aus Katalog laden
- lokal cachen
- nach 60 Sekunden Inaktivität starten
- keine leere Ansicht
- bei Offline-Zustand alten Cache verwenden
- neue Bildschirmschoner-Inhalte automatisch übernehmen

Bildschirmschoner darf Inhalte anzeigen aus:

- Qurʾān-Hinweisen
- Ḥadīṯen
- Šarḥ-Auszügen
- Duʿāʾ
- Tagesinhalten
- speziell kuratierten Screensaver-Dateien

## Production / Staging

GitHub ist die Arbeitsquelle.

Empfohlen:

```text
Staging: GitHub-Branch / Test-URL
Production: Cloudflare / Website / stabile Live-URL
```

Die Live-App darf nicht versehentlich auf einen alten Staging-Branch zeigen.

Die App muss konfigurierbare Umgebungen haben:

```text
RemoteEnvironment.staging
RemoteEnvironment.production
```

Production-App-Store-Builds nutzen nur Production-URL.

## Validierung

Jede geladene Datei muss geprüft werden:

- gültiges JSON
- richtige `schemaVersion`
- Pflichtfelder vorhanden
- keine defekten Referenzen
- keine unerlaubten Duplikate
- `entriesCount` stimmt mit Index überein
- alle Dateien aus `entriesPaths` sind erreichbar oder im Cache vorhanden

## Abnahmetest

1. App frisch installieren.
2. Internet aktivieren.
3. App starten.
4. App lädt remote `catalog.json`.
5. App erkennt Qurʾān-Tadabbur `entriesCount = 5102`.
6. Vers `114:6` ist verfügbar.
7. Ḥadīṯ-Bereich lädt remote.
8. Šarḥ-Bereich lädt remote.
9. Apple TV 60 Sekunden stehen lassen.
10. Bildschirmschoner startet.
11. Bildschirmschoner zeigt aktuelle Remote-/Cache-Inhalte.
12. Internet ausschalten.
13. App neu starten.
14. Alle bereits geladenen Inhalte funktionieren offline weiter.
15. Online eine JSON-Datei korrigieren.
16. App erneut starten.
17. Korrektur wird automatisch übernommen, ohne App-Update.

## Schlussregel

Wenn neue Inhalte in GitHub/Production registriert werden, darf Xcode nicht geändert werden müssen.

```text
GitHub/Katalog entscheidet, was existiert.
Xcode/App synchronisiert nur.
```

Die App darf Inhalte nicht besitzen.  
Die App muss Inhalte synchronisieren.
