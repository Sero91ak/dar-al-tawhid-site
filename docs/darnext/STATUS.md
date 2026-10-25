# DARNext — Fortschrittsprotokoll

## Ergänzter Umfang ab 25.10.2026 — 1:1-Inhaltsparität

**Diese Dokumentationsänderung ist keine neue Xcode-Implementierung.** Neu verbindlich: [PARITAET_MASTER_V2.md](PARITAET_MASTER_V2.md) und [PARITAETS_MATRIX.md](PARITAETS_MATRIX.md). Der bereits dokumentierte P0–P10-Teilstand bleibt gültig, aber **vollständige Erwachsenen-App-Inhalts-/Funktionsparität ist ausdrücklich NICHT abgenommen**. Der nächste Agentenlauf muss den echten lokalen Xcode-Stand sichern, das vollständige dynamische Quellinventar ermitteln, die Matrix erweitern und nach jeder fehlenden DARNext-Implementierung Tests und konkrete Nachweise eintragen. Insbesondere bleiben Frauen-/Ḥadīṯ-, Tafsīr-/Tadabbur- und vollständige Payload-Sync-/Neunsprachen-/Push-/iPad-Punkte offen. Keine Änderung an produktiven Apps/Push-Spuren aus diesem Dokumentationsauftrag.



Masterauftrag: [DARNEXT_MASTER_AUFTRAG.md](DARNEXT_MASTER_AUFTRAG.md)

**Gesamtstand:** P0 bis P4 lokal implementiert/auditiert und getestet; P5 teilweise umgesetzt/auditiert; P6 auditiert; P7 Manifest-Synchronisierung lokal implementiert und getestet; P8 Deep-Link-Teil lokal implementiert/getestet, Push-Teil aus Sicherheitsgründen nur auditiert; P9 QA-Audit dokumentiert, offene Nachweise bleiben; P10 Übergabe vorbereitet, aber wegen offener Integrations- und Synchronisationspunkte nicht abgenommen.

| Phase | Status | Nachweis |
| --- | --- | --- |
| P0 Audit/Sicherung | getestet | DARNext-Target/Scheme/Testplan nachgewiesen; Build-for-Testing erfolgreich; 7/7 Tests bestanden; Arbeitsbranch dokumentiert |
| P1 Medieninventar | getestet | [MEDIA_INVENTORY.md](MEDIA_INVENTORY.md); Asset-/Dimensionsaudit; Build und 7/7 Tests bestanden |
| P2 Native Architektur/Designsystem | getestet (lokaler Xcode-Stand) | Adaptive DARNext-Shell implementiert; Build erfolgreich; 7/7 Tests bestanden |
| P3 Startseite | getestet (lokaler Xcode-Stand) | GitHub-3D-Medien/Hero an DARNext-Startseite angebunden; Build erfolgreich; 7/7 Tests bestanden; Simulator-UI-Prüfung läuft |
| P4 Beiträge/Duʿāʾ/Bibliothek | getestet (lokaler Xcode-Stand) | Bestehende reale Repository-Daten; native Post-/Duʿāʾ-ShareLink ergänzt; Build erfolgreich; 7/7 Tests bestanden |
| P5 Qurʾān/Audio/Tafsīr/Tadabbur | teilweise getestet | 114 Sūren, Versreader, echte Audioquelle/Rezitation/Player geprüft; Tafsīr/Tadabbur-native Datenpfad fehlt; Build erfolgreich; 7/7 Tests bestanden |
| P6 Weitere Bereiche/Frauen/Ḥadīṯ | auditiert/teilweise offen | Zentrale Manifestdatei listet Frauen-/Wissensdaten; DARNext-Bundle enthält sie noch nicht als native Module; keine Inhalte erfunden |
| P7 Inhalts-Synchronisierung | teilweise getestet | DARNext-only Manifest-Service mit ETag-/Disk-Cache und Offline-Fallback; zentraler Inhaltsimport noch offen; Build erfolgreich; 7/7 Tests bestanden |
| P8 Push und Deep Links | teilweise getestet | DARNext-only URL-Router für native Tab-Ziele; bestehende OneSignal/Push-Dateien nur gelesen; keine Registrierung/Testsendung |
| P9 Qualität/Sprachen/Geräte | dokumentiert, teilweise offen | SwiftUI Dynamic-Type-/RTL-/Accessibility-Stellen geprüft; iPhone-Simulator visuell geprüft; iPad, neun Sprachreader, Offline-Payload-Import und physische Push-/Sensorprüfung offen |
| P10 Übergabe | vorbereitet, nicht abgenommen | Offene P5/P6/P7/P8/P9-Punkte und lokaler Xcode-/Git-Sync müssen vor technischer Übergabe geschlossen werden |

## P1 — Medieninventar

- Inventardatei: [MEDIA_INVENTORY.md](MEDIA_INVENTORY.md).
- 37 DAR-3D-Icons aus `assets/dar-3d-icons/` erfasst; geprüfte Haupticons 256 × 256 px.
- 10 sekundäre UI-Icons, 3 Home-Heros, 3 Beitrags-Heros, 7 Frauenbilder in zwei Varianten, 42 Cover-Quellen und 13 Feed-Hintergrundkategorien katalogisiert.
- Geprüfte Pixelmaße: Mobile-Hero 1072 × 1920, Wide-Hero 2016 × 1152, Study 1376 × 768, Beitrags-Heros 1920 × 1080 bzw. 1376 × 768, Frauen v1223 1376 × 768, Frauen v1224 900 × 506.
- Xcode-Abgleich: DARNext enthält aktuell keine eingebundene Kopie dieser Webmedien; gezielter DARNext-only Import ist für P2/P3 offen.

## P9 — Qualität, Sprachen und Geräte

- Durchgeführte UI-Verifikation: DARNext installiert/startet auf iPhone-Duo-Simulator; Hero, Schnellzugriffe und Navigation sichtbar/funktional; kein Absturz. Die untere Schnellzugriffsreihe ist im ScrollView erreichbar.
- Statische SwiftUI-Prüfung: Arabische Haupttexte nutzen RTL-Kontext; vorhandene `Text`-Styles und flexible Layouts skalieren grundsätzlich, aber eine vollständige Dynamic-Type-Matrix wurde noch nicht gefahren.
- Nicht abgeschlossen: neun aktivierte Sprachreader (`de,en,tr,ar,ku,ckb,bs,fr,es`) im DARNext-UI, echte RTL-/VoiceOver-/Dynamic-Type-Matrix, iPad-Split-View-Gerätelauf, Offline-Payload-Import, Speicher-/Performanceprofiling, physische Sensor-/Audio-/Pushprüfung.
- Diese Lücken bleiben explizit offen; keine „vollständig barrierefrei“-, „neun Sprachen live“- oder „Push funktioniert“ Behauptung.

## P10 — Übergabevorbereitung

- Der DARNext-Arbeitsstand ist als separate native Spur abgegrenzt; produktive Apps, Push-Dateien, Worker, Publishing und Live-Systeme wurden nicht verändert.
- Übergabeblockaden: vollständiger Tafsīr-/Tadabbur-Datensatz, native Hadith-/Frauenmodule, vollständiger Offline-Payload-Import, separate Push-/APNs-Zuordnung, neun Sprachreader sowie iPad-/VoiceOver-/Dynamic-Type-/physische Geräteprüfungen.
- Der Xcode-Arbeitsordner ist kein Git-Checkout. Deshalb sind lokale Swift-Änderungen nicht als fiktive GitHub-Quellcode-Commits ausgegeben; der GitHub-Arbeitsbranch enthält die Phasendokumentation und das Medieninventar.
- P10 bleibt bis zur autorisierten Repository-Synchronisierung und den genannten Nachweisen offen.

## P8 — Push und Deep Links

- Lokale Xcode-Dateien geändert: `DarAlTawhid/DARNext/App/DARNextDeepLinkDestination.swift`, `DarAlTawhid/DARNext/Shell/RootShell.swift`.
- DARNext verarbeitet eingehende HTTPS-/Fragment-/Host-Ziele lokal für Start, Qurʾān und Mehr; die produktiven gemeinsamen Deep-Link-Dateien wurden nicht geändert.
- `DarPushNotifications.swift` wurde ausschließlich gelesen/auditiert: bestehende OneSignal-App-ID, Produktions-Worker, Supabase-Registrierung und Push-Lanes gehören zur produktiven Spur und werden nicht für DARNext kopiert oder verändert.
- Eine separate DARNext-Push-/APNs-/OneSignal-Zuordnung bleibt offen und erfordert die im Masterauftrag geforderte gesonderte Freigabe; es wurde keine Testnachricht versendet.
- Xcode `BuildProject(buildForTesting: true)`: erfolgreich, 0 Fehler; Build-Log: `BuildProject-Log-20261024-195645.txt`.
- Xcode `RunAllTests`, Scheme `DARNext`, Testplan `DARNext`: 7 bestanden, 0 fehlgeschlagen; `.xcresult`: `Test-DARNext-2026.10.24_19-56-46-+0200.xcresult`.

## P7 — Zentrale Content-Synchronisierung

- Lokale Xcode-Dateien geändert: `DarAlTawhid/DARNext/Data/DARNextContentSyncService.swift`, `App/AppEnvironment.swift`, `Shell/DARNextRootView.swift`.
- `DARNextContentSyncService` liest ausschließlich das kanonische Manifest `https://dar-al-tawhid.de/data/offline-content-manifest.json`, validiert HTTP/JSON, sendet ETag-Revalidierung, speichert einen DARNext-eigenen Cache und fällt bei Netzfehlern auf den letzten gültigen Manifeststand zurück.
- Der Refresh läuft beim DARNext-Start und ist von Push/Worker/OneSignal getrennt. Es werden keine Gerätebenachrichtigungen versendet.
- Abgrenzung: Das Manifest wird synchronisiert; die vollständige sichere Aktualisierung aller Inhaltsdateien ohne neuen Swift-Build ist noch nicht abgeschlossen und braucht einen kanonischen Native-Content-Payload-/Importvertrag. Keine fiktive P7-Abnahme.
- Xcode `BuildProject(buildForTesting: true)`: erfolgreich, 0 Fehler; Build-Log: `BuildProject-Log-20261024-195515.txt`.
- Xcode `RunAllTests`, Scheme `DARNext`, Testplan `DARNext`: 7 bestanden, 0 fehlgeschlagen; `.xcresult`: `Test-DARNext-2026.10.24_19-55-17-+0200.xcresult`.

## P6 — Ḥadīṯ, Frauenbereich und weitere Wissensmodule

- Xcode-Inventar: DARNext besitzt aktuell keinen eigenständigen `HadithView`-/Frauenbereich-Reader und keine eingebundenen Frauenmedien.
- Die GitHub-Quelle `data/offline-content-manifest.json` listet jedoch kanonische Frauen-Datenpakete, Frauenbilder v1224, Fiqh-/Sahabiyyat-/Familien-/Adab-/Quellenregister sowie bestehende 3D-Icons. Diese müssen über P7/P9 kontrolliert in DARNext synchronisiert bzw. als native Module registriert werden.
- Vorhandene Hadith-/Frauenbezüge in DARNext sind derzeit überwiegend Teil geprüfter Beiträge/Bibliotheksdaten; keine neue religiöse Aussage wurde erstellt.
- Status: Audit abgeschlossen, native Parität bewusst offen.

## P5 — Qurʾān, Audio, Tafsīr und Tadabbur

- Native Bestand geprüft: `QuranView`, `QuranSurahView`, `QuranAudioEngine`, `QuranAudioPlayerView`, `QuranAudioSourceAdapter`.
- Reale Abdeckung: 114 Sūren, Uthmānī-Arabisch/Übersetzung aus DARNext-Ressourcen, Versnavigation, Deep-Focus-Ayah, Rezitatorenregister, Ayah-Playlist, Tempo, Wiederholung, Hintergrund-/Remote-Player-Integration.
- Audioquellen validieren HTTP-Responses und verweigern ungültige Quellen; keine erfundenen Audio-Assets.
- Tafsīr/Tadabbur wurden im DARNext-Baum nur als Referenzen in vorhandenen Daten gefunden, nicht als eigenständiger geprüfter Reader-Datensatz. Diese Teilphase bleibt offen, bis ein kanonischer Datensatz/Endpunkt vorhanden ist.
- Xcode `BuildProject(buildForTesting: true)`: erfolgreich, 0 Fehler; Build-Log: `BuildProject-Log-20261024-195335.txt`.
- Xcode `RunAllTests`, Scheme `DARNext`, Testplan `DARNext`: 7 bestanden, 0 fehlgeschlagen; `.xcresult`: `Test-DARNext-2026.10.24_19-53-36-+0200.xcresult`.

## P4 — Beiträge, Duʿāʾ, Bibliothek und Teilen

- Lokale Xcode-Dateien geändert: `DarAlTawhid/DARNext/Features/Posts/PostsView.swift`, `DarAlTawhid/DARNext/Features/Dua/DuaView.swift`.
- Bestehende `LocalContentRepository`-Daten und kanonische IDs bleiben maßgeblich; keine neue Redaktion und kein neuer Quellenbestand angelegt.
- Post- und Duʿāʾ-Detailansichten besitzen native `ShareLink`-Aktionen mit Inhalt, Quelle bzw. bestehendem Q-Pfad.
- Bibliothekslisten, Suche, Buch-/Publikationsmetadaten und PDF-Sicherheitsstatus wurden auditiert; nicht vorhandene lokale PDFs werden weiterhin transparent als nicht hinterlegt angezeigt.
- Xcode `BuildProject(buildForTesting: true)`: erfolgreich, 0 Fehler; Build-Log: `BuildProject-Log-20261024-195153.txt`.
- Xcode `RunAllTests`, Scheme `DARNext`, Testplan `DARNext`: 7 bestanden, 0 fehlgeschlagen; `.xcresult`: `Test-DARNext-2026.10.24_19-51-55-+0200.xcresult`.
- Keine produktiven Targets, Publishing-/Push-Dateien oder Live-Inhalte verändert.

## P3 — Native Startseite

- Lokale Xcode-Dateien geändert: `DarAlTawhid/DARNext/DesignSystem/Components/DARNextMedia.swift`, `DARQuickAction.swift`, `DarAlTawhid/DARNext/Features/Dashboard/DashboardView.swift`.
- DARNext nutzt vorhandene GitHub-Quellen: 3D-Icons für Beiträge, Duʿāʾ, Qurʾān, Qibla, Gebet und Kalender; vorhandenes Hero-Motiv `hero-mobile-adobe.jpg`.
- Medien werden als native SwiftUI-`Image` über `AsyncImage` geladen, mit Symbol-Fallback bei fehlendem Netz; keine Dummy-Buttons und keine Inhalts-/Push-Änderung.
- Xcode `BuildProject(buildForTesting: true)`: erfolgreich, 0 Fehler; Build-Log: `BuildProject-Log-20261024-194840.txt`.
- Xcode `RunAllTests`, Scheme `DARNext`, Testplan `DARNext`: 7 bestanden, 0 fehlgeschlagen; `.xcresult`: `Test-DARNext-2026.10.24_19-48-41-+0200.xcresult`.
- Noch offen: lokale Medien-Cache-/Offline-Strategie und iPad-/VoiceOver-Sichtprüfung; diese werden in P7/P9 nachgezogen.
- Remote-Sync-Grenze bleibt wie in P2 dokumentiert; kein fiktiver Quellcode-Commit behauptet.

## P2 — Native Architektur und Designsystem

- Lokale Xcode-Datei geändert: `DarAlTawhid/DARNext/Shell/RootShell.swift`.
- iPhone/iPad-Aufteilung: `TabView` für kompakte Größen, `NavigationSplitView` mit fünf DARNext-Navigationsbereichen für Regular-Size-Class.
- Gemeinsamer `DARNextMiniPlayer` bleibt in beiden Layouts über Safe-Area-Inset erhalten.
- Keine Änderung an produktiven Targets, Web-/Worker-/Push-Dateien, Bundle-ID, Entitlements, Signing oder Store-/TestFlight-Konfiguration.
- Xcode `BuildProject(buildForTesting: true)`: erfolgreich, 0 Fehler; Build-Log: `BuildProject-Log-20261024-194659.txt`.
- Xcode `RunAllTests`, Scheme `DARNext`, Testplan `DARNext`: 7 bestanden, 0 fehlgeschlagen; `.xcresult`: `Test-DARNext-2026.10.24_19-47-01-+0200.xcresult`.
- Remote-Sync-Grenze: Die GitHub-Branch enthält aktuell keine entsprechende `ios/.../DARNext`-Quelldatei; der Xcode-Stand liegt im isolierten, nicht-Git-Checkout. Deshalb wird kein fiktiver Quellcode-Commit behauptet. Vor P3/P10 ist der lokale Quellstand über den vorgesehenen Repository-Workflow zu synchronisieren.

## Tests und Builds — P1

- Xcode `BuildProject(buildForTesting: true)`: erfolgreich, 0 Fehler; Build-Log: `BuildProject-Log-20261024-194504.txt`.
- Xcode `RunAllTests`, Scheme `DARNext`, Testplan `DARNext`: 7 bestanden, 0 fehlgeschlagen.
- GitHub-Commit des Inventars: `d88f266618b4b1e006c474bb99d57b252e7acde3`.

## P0 — Audit und Sicherung

- Zeitstempel: 2026-10-24, Europe/Berlin.
- Branch: `codex/darnext-native-masterauftrag-20261024`.
- Ausgangs-Branch-Commit vor diesem Statusnachweis: `bebf47c5851e5e15b16f4e7df168dcd745cfa9b4`.
- Lokaler Xcode-Arbeitsordner: isolierter DARNext-Arbeitsstand; der bereitgestellte Ordner ist kein eigenständiger Git-Checkout, daher wurde kein lokaler Checkout/Reset/Checkout-Wechsel ausgeführt.
- Xcode-Projekt: `DarAlTawhid.xcodeproj`.
- Eigenständiges Target: `DARNext` (Application); zugehörig `DARNextTests` und `DARNextUITests`.
- Eigenständiges Scheme: `DARNext`; aktiver Testplan: `DARNext`.
- Aktive Build-Destination: `iPhone Duo` Simulator (iOS 27.1); verfügbare iPhone-, iPad- und physische iPhone-Destinationen wurden von Xcode aufgelistet.
- Bestehende DARNext-Struktur: native SwiftUI-Shell, Dashboard/Hub, Gebet, Qibla, Qurʾān, Duʿāʾ, Beiträge, Bibliothek, Suche, Audio, Quiz, lokale Repository-/Validierungsschicht und Tests.
- Scope-Gate: keine produktiven Targets, Web-/Worker-/Push-Dateien, Kids-/TV-Oberflächen, Bundle-ID, Entitlements, Signing oder Store-/TestFlight-Aktionen verändert.
- Lokale Git-Sicherung: nicht möglich, da der Xcode-isolierte Arbeitsordner kein Git-Repository enthält; kein fremder lokaler Arbeitsstand wurde überschrieben. Die Phasendokumentation wird auf diesem isolierten GitHub-Arbeitsbranch fortgeführt.

## Tests und Builds

- Xcode `BuildProject(buildForTesting: true)`: erfolgreich, 0 Fehler.
- Xcode `RunAllTests`, Scheme `DARNext`, Testplan `DARNext`: 7 bestanden, 0 fehlgeschlagen, 0 übersprungen.
- Bestanden: 2 UI-Tests sowie 5 DARNext-Daten-/Repository-Tests.
- Nachweisdateien liegen in den Xcode-Action-Artefakten; ein Build-Log und ein `.xcresult`-Bundle wurden erzeugt.

## Offene Punkte

- Der lokale Xcode-Arbeitsstand und der GitHub-Dokumentationsbranch müssen vor dem ersten Quellcode-Commit noch über den vorhandenen Xcode-/Repository-Workflow zusammengeführt werden; kein unbelegter Gleichstand mit GitHub wird behauptet.
- P9 muss die offenen Sprach-/Accessibility-/Offline-/Geräteprüfungen schließen; erst danach P10 technische Übergabe.

## Nächste Aktion

P10: Nach autorisierter Quellcode-Synchronisierung offene P5–P9-Nachweise schließen und technische Übergabe erneut prüfen.
