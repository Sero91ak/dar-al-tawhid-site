# AUFTRAG – Xcode RemoteContentSyncService für alle Inhalte

Status: verbindlicher Implementierungsauftrag  
Projekt: DĀR AL TAWḤĪD Apple TV / iOS / iPadOS  
Branch: `apple-tv-hadith-staging`  
Ziel: GitHub-Kataloge und App-Synchronisierung müssen vollständig zusammenarbeiten.

## Ziel

Die App darf Inhalte nicht mehr fest im Xcode-Code besitzen.

Die App ist die stabile Hülle.  
GitHub bzw. die Live-Auslieferungsquelle liefert die Inhalte über `catalog.json`, Indexdateien und Batch-Dateien.

Sobald die App online ist, muss sie automatisch den neuesten Stand synchronisieren.

Kein Bolt-Neubuild, kein Xcode-Neubuild und kein App-Store-Update darf nötig sein, nur weil neue Inhalte, Korrekturen, Ḥadīṯe, Šarḥ-Erklärungen, Bildschirmschoner-Inhalte, Duʿāʾ oder Serien ergänzt wurden.

## Zentrale Regel

Xcode kennt keine Inhaltsgrenzen.

Verboten sind feste Grenzen wie:

- `5008`
- `5102`
- `05z-112`
- `05z-116`
- feste JSON-Dateilisten
- fest eingebaute Ḥadīṯ-Listen
- fest eingebaute Šarḥ-Listen
- fest eingebaute Bildschirmschoner-Inhalte

Xcode kennt nur:

- die Remote-Basis-URL
- `apple-tv/catalog.json`
- die dort genannten Bereichs-Kataloge

## Aktuelle GitHub-Struktur

Root-Katalog:

```text
apple-tv/catalog.json
```

Bereichs-Kataloge:

```text
apple-tv/quran/tadabbur/catalog.json
apple-tv/hadith/catalog.json
apple-tv/hadith/sharh/catalog.json
apple-tv/screensaver/catalog.json
apple-tv/dua/catalog.json
apple-tv/series/catalog.json
```

Wichtiger aktueller Qurʾān-Tadabbur-Stand:

```text
entriesCount: 5102
letzter Batch: entries-batch-05z-116.json
letzter Vers: 114:6
```

Die App muss diesen Stand automatisch erkennen und darf nicht bei älteren Grenzen stehen bleiben.

## Bestehende Xcode-Dateien prüfen

Vorhandene Dateien unter `apple-tv/xcode/` müssen angepasst bzw. verbunden werden:

```text
AppleTVContentRegistry.swift
QuranContentService.swift
ScreensaverRotationService.swift
AppleTVBackgroundService.swift
QuranPlaybackStore.swift
QuranTabView.swift
```

Diese Dateien dürfen keine eigene harte Inhaltslogik behalten, wenn sie durch den neuen Remote-Sync ersetzt werden kann.

## Neuer zentraler Service

Es muss ein gemeinsamer Service eingeführt werden:

```text
RemoteContentSyncService.swift
```

Dieser Service muss für tvOS, iOS und iPadOS verwendet werden.

Keine getrennte Apple-TV-Sonderlogik für Content-Synchronisierung.

## Aufgaben des RemoteContentSyncService

Der Service muss:

1. `apple-tv/catalog.json` remote laden.
2. `remoteContentSync` auslesen.
3. Alle aktiven und geplanten Module erkennen.
4. Für jeden Bereich den jeweiligen `catalogPath` laden.
5. `entriesIndexPath` laden.
6. Alle Dateien aus `entriesPaths` prüfen und bei Bedarf laden.
7. Neue Dateien erkennen.
8. Geänderte Dateien erkennen.
9. Korrigierte Dateien lokal ersetzen.
10. JSON validieren.
11. Daten atomar in den lokalen Cache übernehmen.
12. Bei Fehlern den letzten funktionierenden Cache behalten.
13. UI nach erfolgreichem Sync aktualisieren.
14. Offline weiterarbeiten, wenn kein Internet vorhanden ist.

## Sync-Auslöser

Synchronisierung muss laufen bei:

- erstem App-Start
- jedem App-Start mit Internet
- Rückkehr aus dem Hintergrund
- Öffnen des Qurʾān-Bereichs
- Öffnen des Ḥadīṯ-Bereichs
- Öffnen eines Ḥadīṯes, wenn Šarḥ möglich ist
- Apple-TV-Wake aus Standby
- Start des Bildschirmschoners
- spätestens nach `minimumRefreshIntervalHours` aus `apple-tv/catalog.json`

## Root-Katalog auswerten

`apple-tv/catalog.json` enthält:

```json
"remoteContentSync": {
  "enabled": true,
  "checkOnAppStart": true,
  "checkOnForeground": true,
  "checkOnAppleTVWake": true,
  "minimumRefreshIntervalHours": 6,
  "offlineCache": true,
  "atomicCacheActivation": true,
  "keepLastGoodCacheOnError": true
}
```

Xcode muss diese Regeln respektieren.

## Bereichs-Kataloge

Jeder Bereichs-Katalog muss gleich behandelt werden:

- `contentType`
- `contentVersion`
- `entriesCount`
- `entriesIndexPath`
- `entriesPaths`
- `remoteLoad`
- `offlineCache`
- `fallback`
- `syncPolicy`

Auch geplante Bereiche mit `entriesCount: 0` müssen gültig geladen werden, ohne 404 oder Crash.

## Qurʾān-Tadabbur

Pfad:

```text
apple-tv/quran/tadabbur/catalog.json
```

Pflicht:

- `entriesCount = 5102` erkennen.
- `entries-batch-05z-116.json` laden.
- Vers `114:6` muss verfügbar sein.
- Keine feste Begrenzung im Code.
- Neue künftige Batch-Dateien automatisch erkennen, sobald sie im Katalog stehen.

## Ḥadīṯ

Pfad:

```text
apple-tv/hadith/catalog.json
```

Pflicht:

- Katalog remote laden.
- Manifest/Index respektieren.
- Bücher, Kapitel, Kategorien dynamisch aus Daten aufbauen.
- Keine feste Ḥadīṯ-Grenze im Code.
- Neue Ḥadīṯ-Batches automatisch übernehmen.
- Korrekturen automatisch übernehmen.

## Ḥadīṯ-Šarḥ

Pfad:

```text
apple-tv/hadith/sharh/catalog.json
```

Pflicht:

- Šarḥ-Katalog remote laden.
- Šarḥ über `hadithId`, `reference`, `bookId`, `chapterId` oder `sharhId` mit Ḥadīṯ verbinden.
- Button „Erklärung“ nur anzeigen, wenn Šarḥ vorhanden ist.
- Keinen leeren Button anzeigen.
- Šarḥ offline speichern, sobald geladen.
- Neue Šarḥ-Dateien automatisch übernehmen.

## Bildschirmschoner

Pfad:

```text
apple-tv/screensaver/catalog.json
```

Pflicht:

- Bildschirmschoner-Katalog remote laden.
- `rotation.json` laden.
- `HadithScreensaverProvider` darf Inhalte dynamisch aus `../hadith/catalog.json` beziehen.
- Nach 60 Sekunden Inaktivität muss der Bildschirmschoner starten.
- Der Bildschirmschoner darf nie leer bleiben.
- Wenn online neue Inhalte vorhanden sind, muss er sie automatisch nach Cache-Aktualisierung verwenden.
- Bei Offline-Zustand letzten Cache verwenden.

## Duʿāʾ

Pfad:

```text
apple-tv/dua/catalog.json
```

Pflicht:

- Geplanter Bereich darf gültig leer sein.
- Kein Crash bei `entriesCount: 0`.
- Sobald Duʿāʾ-Dateien im Katalog stehen, automatisch laden.

## Serien / 30-Tage-Bereiche

Pfad:

```text
apple-tv/series/catalog.json
```

Pflicht:

- Geplanter Bereich darf gültig leer sein.
- Später 30-Tage-Serien über Katalog laden.
- Keine feste Serienlogik im Code.
- Ablauf, Fortschritt und Abschluss lokal speichern.

## Cache-Regel

Der Cache muss atomar funktionieren.

Falsch:

1. Alten Cache löschen.
2. Neue Dateien laden.
3. Bei Fehler leerer Bildschirm.

Richtig:

1. Neuen Stand in temporären Cache laden.
2. Alle Pflichtdateien validieren.
3. Erst dann aktiven Cache ersetzen.
4. Bei Fehler altes funktionierendes Cache behalten.

## Offline-Regel

Wenn kein Internet vorhanden ist:

- keine Daten löschen
- keine leere Ansicht
- kein Crash
- letzten vollständigen Cache nutzen
- Fehler nur intern loggen

## Validierung

Vor Aktivierung eines neuen Standes muss geprüft werden:

- gültiges JSON
- `schemaVersion` vorhanden
- `contentType` vorhanden
- `entriesCount` plausibel
- `entriesPaths` erreichbar oder bereits gecacht
- `entriesIndexPath` erreichbar oder bereits gecacht
- keine defekten Pflichtfelder
- keine ungültigen Referenzen

## Production und Staging

Xcode muss zwei Umgebungen unterstützen:

```text
Staging: GitHub/Test-URL
Production: Website/Cloudflare/Live-URL
```

App-Store-/Live-Build darf nicht versehentlich auf einen alten Staging-Branch zeigen.

Empfohlen:

- GitHub = Arbeitsquelle
- Cloudflare/Website = stabile Live-Auslieferung
- App = lädt Production-Katalog

## Abnahmetest

1. App frisch installieren.
2. Internet aktivieren.
3. App starten.
4. `apple-tv/catalog.json` laden.
5. `remoteContentSync.enabled = true` erkennen.
6. Qurʾān-Tadabbur-Katalog laden.
7. `entriesCount = 5102` erkennen.
8. `entries-batch-05z-116.json` laden.
9. Vers `114:6` öffnen.
10. Inhalt muss erscheinen.
11. Ḥadīṯ-Bereich öffnen.
12. Ḥadīṯ-Katalog muss remote geladen werden.
13. Ḥadīṯ öffnen.
14. Wenn Šarḥ vorhanden ist, Button „Erklärung“ anzeigen.
15. Wenn kein Šarḥ vorhanden ist, Button ausblenden.
16. Apple TV 60 Sekunden nicht bedienen.
17. Bildschirmschoner muss starten.
18. Bildschirmschoner muss Inhalte aus Cache/Remote anzeigen.
19. Internet ausschalten.
20. App neu starten.
21. Alle bereits geladenen Inhalte müssen offline weiter funktionieren.
22. Remote JSON korrigieren.
23. App online neu starten.
24. Korrektur muss ohne App-Update übernommen werden.

## Schlussregel

Wenn neue Inhalte ins Repository gepusht und im jeweiligen `catalog.json` registriert werden, darf kein Xcode-Code angepasst werden müssen.

Die App synchronisiert Inhalte.  
GitHub bzw. die Live-Quelle entscheidet über den Inhalt.
