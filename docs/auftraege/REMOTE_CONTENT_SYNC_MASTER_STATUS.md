# MASTER-STATUS – Remote Content Sync / GitHub + Xcode

Status: verbindliche Gesamtübersicht  
Projekt: DĀR AL TAWḤĪD – Apple TV / iOS / iPadOS  
Branch: `apple-tv-hadith-staging`

## Grundsatz

Alles muss zusammenarbeiten:

- GitHub liefert Inhalt, Versionen, Kataloge, Indexdateien und Batch-Dateien.
- Xcode/App lädt Root-Katalog und Bereichs-Kataloge.
- Die App kennt keine festen Inhaltsgrenzen.
- Neue Inhalte, neue Aussagen, neue Ḥadīṯe, Šarḥ-Dateien, Bildschirmschoner-Inhalte, Duʿāʾ, Serien, Āṯār und Korrekturen müssen ohne Bolt-, Xcode- oder App-Store-Update synchronisiert werden.
- Sobald die App Internet hat, prüft sie den neuesten Stand.
- Offline bleibt der letzte vollständige Cache aktiv.

## Root

```text
apple-tv/catalog.json
```

Pflicht:

- zentraler Einstieg für Apple TV / iOS / iPadOS
- enthält `remoteContentSync`
- verweist auf Qurʾān, Ḥadīṯ, Šarḥ, Screensaver, Duʿāʾ, Serien, Āṯār und Hintergründe
- keine harten Inhaltsgrenzen in Xcode

## Qurʾān-Tadabbur

Datenstruktur:

```text
apple-tv/quran/tadabbur/catalog.json
apple-tv/quran/tadabbur/entries-index.json
apple-tv/quran/tadabbur/coverage.json
apple-tv/quran/tadabbur/entries.json
apple-tv/quran/tadabbur/entries-batch-*.json
```

Aktueller registrierter Stand:

```text
entriesCount: 5102
totalVerifiedEntries: 5102
letzter Batch: entries-batch-05z-116.json
letzter Vers: 114:6
Coverage: 114 Sūren / 6236 Verse
```

Aktive Xcode-Datei:

```text
apple-tv/xcode/TVQuranTadabburSupport.swift
```

Aktive Qurʾān-Ansicht:

```text
apple-tv/xcode/QuranTabView.swift
```

Pflicht/Stand:

- `TVQuranTadabburSupport.swift` ist am zentralen `RemoteContentSyncService` angebunden.
- Der Store triggert `syncCatalog(relativeCatalogPath: "quran/tadabbur/catalog.json")`.
- Daten werden bevorzugt aus dem zentralen Sync-Cache geladen.
- Bei Bedarf fällt der Store auf Remote zurück.
- Danach bleibt der letzte gültige lokale Tadabbur-Cache erhalten.
- `QuranTabView.swift` lädt `TVQuranTadabburStore.shared` in `prepare()`.
- Pro Vers wird die Referenz `Sūrah:Āyah` gebildet.
- `TVQuranTadabburCard` erscheint direkt unter der deutschen Übersetzung.
- Bei fehlendem geprüften Eintrag erscheint nur der feste Fallback.
- Keine Logos in der Tadabbur-Karte.
- Keine erfundenen oder KI-generierten Tadabbur-Texte.

Prüfung:

```text
apple-tv/quran/tadabbur/tools/verify_tadabbur_catalog.py
apple-tv/quran/tadabbur/VERIFY.md
```

Der Prüfer kontrolliert jetzt zusätzlich:

- `coverage.verseCounts` enthält exakt 114 Sūren.
- Summe der Verse ist exakt 6236.
- Jede Referenz liegt innerhalb der echten Sūrah-/Āyah-Grenzen.
- Referenzen wie `115:1` oder `2:999` werden blockiert.

## Ḥadīṯ / Āṯār Legacy-Katalog

```text
apple-tv/hadith/catalog.json
apple-tv/hadith/manifest.json
apple-tv/hadith/sync-policy.json
apple-tv/hadith/series/*/index.json
```

Aktueller Stand laut Katalog:

```text
totalCount: 2545
latestId: HAD-2545
nextId: HAD-2546
currentSeries: 2451-2550
```

Pflicht/Stand:

- bestehende Legacy-Struktur mit `series[].indexPath` bleibt gültig.
- `RemoteContentSyncService` synchronisiert `series[].indexPath`.
- Serien-Indizes werden ausgelesen.
- einzelne `HAD-xxxx.json` werden daraus geladen und gecacht.

## Ḥadīṯ-Šarḥ

```text
apple-tv/hadith/sharh/catalog.json
apple-tv/hadith/sharh/entries-index.json
```

Status:

```text
planned
entriesCount: 0
```

Pflicht:

- gültig leer ladbar
- kein 404
- kein Crash
- spätere Šarḥ-Dateien automatisch über Katalog laden
- Verbindung zu Ḥadīṯ über `hadithId`, `reference`, `bookId`, `chapterId` oder `sharhId`

## Bildschirmschoner

```text
apple-tv/screensaver/catalog.json
apple-tv/screensaver/entries-index.json
apple-tv/screensaver/rotation.json
```

Status:

```text
active
```

Pflicht/Stand:

- eigener Screensaver-Katalog
- `rotation.json` bleibt aktiv
- Inhalte können aus Ḥadīṯ, Āṯār, Duʿāʾ, Qurʾān-Tadabbur und Tagesinhalten kommen
- Start nach 60 Sekunden Inaktivität
- kein leerer Bildschirmschoner
- offline letzter Cache

## Qurʾān-Audio

```text
apple-tv/quran/audio/catalog.json
```

Pflicht:

- bestehender Spezialkatalog bleibt gültig
- darf auch ohne `entriesPaths` nicht fehlschlagen
- Audio-/Edition-Daten bleiben über bestehenden Provider abrufbar

## Hintergründe

```text
apple-tv/backgrounds/catalog.json
```

Pflicht:

- Hintergrund-Katalog bleibt gültig
- Bundle-Hintergrund bleibt gültig
- Remote-Sync darf ihn nicht zerstören

## Duʿāʾ

```text
apple-tv/dua/catalog.json
apple-tv/dua/entries-index.json
```

Status:

```text
planned
entriesCount: 0
```

Pflicht:

- gültig leer ladbar
- kein 404
- spätere Duʿāʾ-Dateien automatisch synchronisieren

## Serien / 30-Tage-Bereiche

```text
apple-tv/series/catalog.json
apple-tv/series/entries-index.json
```

Status:

```text
planned
entriesCount: 0
```

Pflicht:

- gültig leer ladbar
- spätere 30-Tage-Serien über Katalog laden
- Fortschritt lokal speichern
- Abschluss/Beglückwünschung über App-Logik, Inhalte per Remote-Katalog

## Āṯār & Aussagen der Salaf

```text
apple-tv/athar/catalog.json
apple-tv/athar/entries-index.json
```

Status:

```text
planned
entriesCount: 0
```

Pflicht:

- gültige Basis für spätere Āṯār-Dateien
- kein 404
- automatische Synchronisierung nach Registrierung im Katalog

## Bereits angelegte Xcode-Struktur

```text
apple-tv/xcode/AppleTVContentRegistry.swift
apple-tv/xcode/RemoteContentSyncService.swift
apple-tv/xcode/RemoteContentSyncCoordinator.swift
apple-tv/xcode/QuranContentService.swift
apple-tv/xcode/QuranTabView.swift
apple-tv/xcode/TVQuranTadabburSupport.swift
apple-tv/xcode/ScreensaverRotationService.swift
apple-tv/hadith/xcode/HadithRemoteService.swift
apple-tv/hadith/xcode/HadithScreensaverProvider.swift
apple-tv/xcode/AUFTRAG_REMOTE_CONTENT_SYNC_IMPLEMENTATION.md
```

### AppleTVContentRegistry.swift

Pflicht/Stand:

- Root-Katalog laden
- `remoteContentSync` decodieren
- `quran.tadabbur` decodieren
- `screensaver.catalogPath` decodieren
- geplante Module decodieren
- optionale `schemaPath` unterstützen
- URLs aus relativen Katalogpfaden bilden

### RemoteContentSyncService.swift

Pflicht/Stand:

- Root-Katalog laden
- Qurʾān-Audio synchronisieren
- Qurʾān-Tadabbur synchronisieren
- Screensaver synchronisieren
- alle Module aus Root-Katalog synchronisieren
- Hintergründe synchronisieren
- Standard-Kataloge mit `entriesPaths` unterstützen
- Legacy-Kataloge mit `series[].indexPath` unterstützen
- Serien-Indexdateien auslesen
- einzelne HAD-Dateien aus Serien-Indizes laden
- zuerst Staging-Cache schreiben
- validieren
- erst danach aktiven Cache ersetzen
- alten Cache bei Fehler behalten

### RemoteContentSyncCoordinator.swift

Pflicht/Stand:

- `appDidStart()` für App-Start
- `appDidEnterForeground()` für Rückkehr aus Hintergrund
- `appleTVDidWake()` für Apple-TV-Wake
- `contentAreaDidOpen()` für Qurʾān, Ḥadīṯ, Šarḥ, Screensaver, Duʿāʾ, Serien
- `hadithDidOpen()` für Ḥadīṯ + Šarḥ-Prüfung
- `manualRefresh()` für Debug/Admin
- respektiert `minimumRefreshIntervalHours` aus Root-Katalog

### QuranContentService.swift

Pflicht/Stand:

- triggert `RemoteContentSyncService.shared.syncAll(trigger: .contentOpen)` beim Laden der Sūrenliste
- triggert denselben Sync beim Laden einer synchronisierten Sūrah
- dadurch werden Qurʾān-Tadabbur und Qurʾān-Audio-Kataloge beim Öffnen aktuell gehalten
- lokaler Qurʾān-Cache bleibt erhalten

### HadithRemoteService.swift

Pflicht/Stand:

- triggert `RemoteContentSyncService` beim Laden aller Ḥadīṯe
- lädt zuerst aus zentral synchronisiertem Cache
- fällt bei Bedarf auf Remote zurück
- fällt danach auf alten lokalen Ḥadīṯ-Cache zurück
- unterstützt Legacy-Struktur mit `series/*/index.json` und einzelnen `HAD-xxxx.json`

### ScreensaverRotationService.swift

Pflicht/Stand:

- triggert `RemoteContentSyncService` beim Screensaver-Start
- lädt `rotation.json` bevorzugt aus zentralem Sync-Cache
- fällt bei Bedarf auf Remote zurück
- fällt danach auf eigenen Config-Cache zurück
- Rotation bleibt shuffle-bag-basiert ohne Wiederholung vor vollständigem Zyklus

### HadithScreensaverProvider.swift

Pflicht/Stand:

- nutzt `HadithRemoteService.shared.loadAllHadith()`
- profitiert vom zentral synchronisierten Ḥadīṯ-/Āṯār-Cache
- liefert Inhalte an `ScreensaverRotationService`

## Strenge Xcode-Regeln

Verboten:

```text
let maxEntries = 5102
let lastBatch = "entries-batch-05z-116.json"
let latestHadith = "HAD-2545"
```

Xcode darf solche Grenzen nicht fest kennen.

Erlaubt:

```text
Remote-Basis-URL
apple-tv/catalog.json
Bereichs-Kataloge aus Root-Katalog
```

## Produktionsregel

```text
Staging: GitHub-Branch / Test-URL
Production: Cloudflare / Website / stabile Live-URL
```

Live-App darf nicht dauerhaft auf Staging zeigen.

## Abnahmetest vollständig

1. App frisch installieren.
2. Internet aktivieren.
3. App starten.
4. Root-Katalog laden.
5. `remoteContentSync.enabled = true` erkennen.
6. Qurʾān-Tadabbur laden.
7. `entriesCount = 5102` erkennen.
8. `entries-batch-05z-116.json` laden.
9. Vers `114:6` öffnen.
10. Tadabbur-Karte unter der deutschen Übersetzung prüfen.
11. Prüfer ausführen: `python3 apple-tv/quran/tadabbur/tools/verify_tadabbur_catalog.py`.
12. Ergebnis muss `TADABBUR VERIFY OK` sein.
13. Ḥadīṯ-Katalog laden.
14. `totalCount = 2545` erkennen.
15. `series/2451-2550/index.json` laden.
16. einzelne `HAD-xxxx.json` Dateien laden.
17. Screensaver-Katalog laden.
18. `rotation.json` laden.
19. Apple TV 60 Sekunden nicht bedienen.
20. Bildschirmschoner startet.
21. Šarḥ-, Duʿāʾ-, Serien- und Āṯār-Kataloge laden ohne Crash, auch wenn leer.
22. Internet ausschalten.
23. App neu starten.
24. letzter vollständiger Cache bleibt aktiv.
25. Remote-Datei korrigieren.
26. App online starten.
27. Korrektur wird ohne App-Update übernommen.

## Schlussregel

Alles Neue muss künftig nur in GitHub/Production registriert werden.

Xcode muss dann automatisch ziehen.

Kein Bolt-Neubuild.  
Kein Xcode-Neubuild.  
Kein App-Store-Update nur wegen Inhalt.
