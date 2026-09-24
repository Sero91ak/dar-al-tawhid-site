# MASTER-STATUS – Remote Content Sync / GitHub + Xcode

Status: verbindliche Gesamtübersicht  
Projekt: DĀR AL TAWḤĪD – Apple TV / iOS / iPadOS  
Branch: `apple-tv-hadith-staging`

## Grundsatz

Alles, was bisher vorbereitet wurde, muss zusammenarbeiten:

- GitHub liefert Inhalt, Versionen, Kataloge, Indexdateien und Batch-Dateien.
- Xcode/App lädt nur Root-Katalog und Bereichs-Kataloge.
- Die App kennt keine festen Inhaltsgrenzen.
- Neue Inhalte, neue Aussagen, neue Ḥadīṯe, neue Šarḥ-Dateien, Bildschirmschoner-Inhalte, Duʿāʾ, Serien und Korrekturen müssen ohne Bolt-, Xcode- oder App-Store-Update online synchronisiert werden.
- Sobald die App Internet hat, prüft sie den neuesten Stand.
- Offline bleibt der letzte vollständige Cache aktiv.

## Bereits angelegte GitHub-Struktur

### Root

```text
apple-tv/catalog.json
```

Aufgabe:

- zentraler Einstieg für Apple TV / iOS / iPadOS
- enthält `remoteContentSync`
- verweist auf Qurʾān, Ḥadīṯ, Šarḥ, Screensaver, Duʿāʾ, Serien, Āṯār und Hintergründe
- darf keine harten Inhaltsgrenzen in Xcode benötigen

### Qurʾān-Tadabbur

```text
apple-tv/quran/tadabbur/catalog.json
apple-tv/quran/tadabbur/entries-index.json
apple-tv/quran/tadabbur/xcode/TVQuranTadabburSupport.swift
apple-tv/quran/tadabbur/entries-batch-05z-113.json
apple-tv/quran/tadabbur/entries-batch-05z-114.json
apple-tv/quran/tadabbur/entries-batch-05z-115.json
apple-tv/quran/tadabbur/entries-batch-05z-116.json
```

Aktueller registrierter Stand:

```text
entriesCount: 5102
totalVerifiedEntries: 5102
letzter Batch: entries-batch-05z-116.json
letzter Vers: 114:6
```

Pflicht/Stand:

- Apple TV, iOS und iPadOS müssen diesen Stand automatisch erkennen.
- Keine feste Grenze im Code.
- Neue Batch-Dateien müssen künftig automatisch über den Katalog erkannt werden.
- `TVQuranTadabburSupport.swift` ist am zentralen `RemoteContentSyncService` angebunden.
- Tadabbur wird in `QuranTabView.swift` sichtbar direkt unter der Qurʾān-Übersetzung gerendert.
- Lookup erfolgt über exakte Referenz `Sūrah:Āyah`.
- Wenn kein geprüfter Eintrag existiert, erscheint nur der feste Fallback.

### Ḥadīṯ / Āṯār Legacy-Katalog

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

Besonderheit:

- Dieser Bereich nutzt bereits eine ältere, funktionierende Struktur mit `series[].indexPath`.
- Der neue `RemoteContentSyncService` synchronisiert deshalb nicht nur `entriesPaths`, sondern auch `series[].indexPath`.
- Zusätzlich liest der Service die Serien-Indexdateien und lädt daraus die einzelnen `HAD-xxxx.json`-Datensätze in den zentralen Sync-Cache.

### Ḥadīṯ-Šarḥ

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

- Katalog muss gültig leer ladbar sein.
- Kein 404.
- Kein Crash.
- Wenn Šarḥ-Dateien später ergänzt werden, erkennt Xcode sie automatisch.
- Šarḥ wird über `hadithId`, `reference`, `bookId`, `chapterId` oder `sharhId` mit Ḥadīṯen verbunden.

### Bildschirmschoner

```text
apple-tv/screensaver/catalog.json
apple-tv/screensaver/entries-index.json
apple-tv/screensaver/rotation.json
```

Status:

```text
active
```

Pflicht:

- Bildschirmschoner lädt eigenen Katalog.
- `rotation.json` bleibt aktiv.
- Inhalte können aus `hadith/catalog.json`, Āṯār, Duʿāʾ, Qurʾān-Tadabbur und Tagesinhalten kommen.
- Nach 60 Sekunden Inaktivität muss der Bildschirmschoner starten.
- Kein leerer Bildschirmschoner.
- Offline letzter Cache.

### Qurʾān-Audio

```text
apple-tv/quran/audio/catalog.json
```

Pflicht:

- Der Sync-Service muss diesen bestehenden Spezialkatalog ebenfalls erkennen.
- Auch wenn keine `entriesPaths` vorhanden sind, darf der Katalog nicht fehlschlagen.
- Audio-/Edition-Daten bleiben über den bestehenden Provider abrufbar.

### Hintergründe

```text
apple-tv/backgrounds/catalog.json
```

Pflicht:

- Hintergrund-Katalog muss weiterhin funktionieren.
- Bundle-Hintergrund bleibt gültig.
- Remote-Sync darf diesen Katalog nicht zerstören.

### Duʿāʾ

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

- Gültig leer ladbar.
- Kein 404.
- Sobald Duʿāʾ-Dateien registriert werden, automatisch synchronisieren.

### Serien / 30-Tage-Bereiche

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

- Gültig leer ladbar.
- Spätere 30-Tage-Serien über Katalog laden.
- Fortschritt lokal speichern.
- Abschluss/Beglückwünschung über App-Logik, Inhalte aber per Remote-Katalog.

### Āṯār & Aussagen der Salaf

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

- Root-Katalog verweist auf Āṯār.
- Deshalb muss auch dieser Bereich gültig existieren.
- Kein 404.
- Spätere Āṯār-Dateien automatisch laden.

## Bereits angelegte Xcode-Struktur

```text
apple-tv/xcode/AppleTVContentRegistry.swift
apple-tv/xcode/RemoteContentSyncService.swift
apple-tv/xcode/RemoteContentSyncCoordinator.swift
apple-tv/xcode/QuranContentService.swift
apple-tv/xcode/QuranTabView.swift
apple-tv/xcode/ScreensaverRotationService.swift
apple-tv/quran/tadabbur/xcode/TVQuranTadabburSupport.swift
apple-tv/hadith/xcode/HadithRemoteService.swift
apple-tv/hadith/xcode/HadithScreensaverProvider.swift
apple-tv/xcode/AUFTRAG_REMOTE_CONTENT_SYNC_IMPLEMENTATION.md
```

### AppleTVContentRegistry.swift

Pflicht:

- Root-Katalog laden.
- `remoteContentSync` decodieren.
- `quran.tadabbur` decodieren.
- `screensaver.catalogPath` decodieren.
- geplante Module decodieren.
- optionale `schemaPath` unterstützen.
- URLs aus relativen Katalogpfaden bilden.

### RemoteContentSyncService.swift

Ist umgesetzt als zentrale Sync-Schicht.

Pflicht/Stand:

- Root-Katalog laden.
- Qurʾān-Audio synchronisieren.
- Qurʾān-Tadabbur synchronisieren.
- Screensaver synchronisieren.
- alle Module aus Root-Katalog synchronisieren.
- Hintergründe synchronisieren.
- Standard-Kataloge mit `entriesPaths` unterstützen.
- Legacy-Kataloge mit `series[].indexPath` unterstützen.
- Serien-Indexdateien auslesen.
- einzelne HAD-Dateien aus Serien-Indizes laden.
- zuerst Staging-Cache schreiben.
- validieren.
- erst danach aktiven Cache ersetzen.
- alten Cache bei Fehler behalten.

### RemoteContentSyncCoordinator.swift

Ist umgesetzt als App-Lifecycle-Brücke.

Pflicht/Stand:

- `appDidStart()` für App-Start.
- `appDidEnterForeground()` für Rückkehr aus Hintergrund.
- `appleTVDidWake()` für Apple-TV-Wake.
- `contentAreaDidOpen()` für Qurʾān, Ḥadīṯ, Šarḥ, Screensaver, Duʿāʾ, Serien.
- `hadithDidOpen()` für Ḥadīṯ + Šarḥ-Prüfung.
- `manualRefresh()` für Debug/Admin.
- respektiert `minimumRefreshIntervalHours` aus Root-Katalog.

### QuranContentService.swift

Ist angebunden.

Pflicht/Stand:

- triggert `RemoteContentSyncService.shared.syncAll(trigger: .contentOpen)` beim Laden der Sūrenliste.
- triggert denselben Sync beim Laden einer synchronisierten Sūrah.
- dadurch werden Qurʾān-Tadabbur und Qurʾān-Audio-Kataloge beim Öffnen aktuell gehalten.
- lokaler Qurʾān-Cache bleibt erhalten.

### TVQuranTadabburSupport.swift

Ist angebunden.

Pflicht/Stand:

- triggert `RemoteContentSyncService.shared.syncCatalog(relativeCatalogPath: "quran/tadabbur/catalog.json")`.
- lädt Tadabbur-Daten bevorzugt aus dem zentralen Sync-Cache.
- fällt bei Bedarf auf Remote zurück.
- fällt danach auf den letzten gültigen lokalen Tadabbur-Cache zurück.
- validiert Referenzen, Pflichtfelder, doppelte IDs und Gesamtanzahl.
- rendert `TVQuranTadabburCard` ohne Logo, mit Dar-al-Layl-Karte, cremefarbener Schrift und Goldakzent.

### QuranTabView.swift

Ist sichtbar angebunden.

Pflicht/Stand:

- hält `TVQuranTadabburStore.shared` als `@StateObject`.
- lädt Tadabbur im `prepare()`.
- bildet pro Vers die Referenz `Sūrah:Āyah`.
- rendert `TVQuranTadabburCard` direkt unter der deutschen Übersetzung.
- zeigt bei fehlendem Eintrag nur den festen Fallback.
- keine Logos in der Tadabbur-Karte.

### HadithRemoteService.swift

Ist angebunden.

Pflicht/Stand:

- triggert `RemoteContentSyncService` beim Laden aller Ḥadīṯe.
- lädt zuerst aus zentral synchronisiertem Cache.
- fällt bei Bedarf auf Remote zurück.
- fällt danach auf alten lokalen Ḥadīṯ-Cache zurück.
- unterstützt bestehende Legacy-Struktur mit `series/*/index.json` und einzelnen `HAD-xxxx.json` Dateien.

### ScreensaverRotationService.swift

Ist angebunden.

Pflicht/Stand:

- triggert `RemoteContentSyncService` beim Screensaver-Start.
- lädt `rotation.json` bevorzugt aus zentralem Sync-Cache.
- fällt bei Bedarf auf Remote zurück.
- fällt danach auf eigenen Config-Cache zurück.
- Rotation bleibt shuffle-bag-basiert ohne Wiederholung vor vollständigem Zyklus.

### HadithScreensaverProvider.swift

Ist indirekt angebunden.

Pflicht/Stand:

- nutzt `HadithRemoteService.shared.loadAllHadith()`.
- profitiert dadurch automatisch vom zentral synchronisierten Ḥadīṯ-/Āṯār-Cache.
- liefert Inhalte an `ScreensaverRotationService`.

## Strenge Regeln für Xcode

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

Staging:

```text
GitHub-Branch / Test-URL
```

Production:

```text
Cloudflare / Website / stabile Live-URL
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
11. Ḥadīṯ-Katalog laden.
12. `totalCount = 2545` erkennen.
13. `series/2451-2550/index.json` laden.
14. einzelne `HAD-xxxx.json` Dateien aus dem Serien-Index laden.
15. Screensaver-Katalog laden.
16. `rotation.json` laden.
17. Apple TV 60 Sekunden nicht bedienen.
18. Bildschirmschoner startet.
19. Šarḥ-Katalog lädt ohne Crash, auch wenn leer.
20. Duʿāʾ-Katalog lädt ohne Crash, auch wenn leer.
21. Serien-Katalog lädt ohne Crash, auch wenn leer.
22. Āṯār-Katalog lädt ohne Crash, auch wenn leer.
23. Internet ausschalten.
24. App neu starten.
25. Letzter vollständiger Cache bleibt aktiv.
26. Remote-Datei korrigieren.
27. App online starten.
28. Korrektur wird ohne App-Update übernommen.

## Schlussregel

Alles Neue muss künftig nur in GitHub/Production registriert werden.

Xcode muss dann automatisch ziehen.

Kein Bolt-Neubuild.  
Kein Xcode-Neubuild.  
Kein App-Store-Update nur wegen Inhalt.
