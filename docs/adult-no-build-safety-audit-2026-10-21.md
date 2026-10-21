# DĀR AL TAWḤĪD — sicherer No-Build-Arbeitsstand (21.10.2026)

## Verbindlicher Umfang

- **CarPlay bleibt ausgeschlossen.**
- Keine native iOS-Änderung, kein Xcode-Build, keine Buildnummer, kein TestFlight und kein App-Store-Update.
- Keine Änderung an WidgetKit, Swift, App Groups, Live Activities, Entitlements oder WidgetBundle-Registrierungen.
- Keine Änderung an den geschützten Push-Spuren, Worker-Cron-Jobs, Secrets und Produktionsrouten.
- Test-/Staging-Prüfung vor Besucher-Veröffentlichung; **kein automatisches Live-Deployment**.
- Keine Wiederherstellung alter Recovery-Snapshots und kein Überschreiben unbekannter lokaler Änderungen.

## Nachweisbare Bestandsbeobachtungen aus GitHub

| Bereich | Quellcode-Beleg | Erkenntnis | Vorgehen |
|---|---|---|---|
| Native Web-Hülle | `ios/DarAlTawhid/DarAlTawhid/DarAppShell.swift` | `usesStagingWeb = false`; native App öffnet `https://dar-al-tawhid.de/#home`. | Web-Inhalte können grundsätzlich ohne neuen iOS-Build aktualisiert werden, sofern Routing, Cache und Deploy stimmen. |
| Native Widget-Daten | `ios/DarAlTawhid/Shared/DarWidgetStore.swift` | Speichert einen gemeinsamen Snapshot in der App-Group. | Speicherformat, Keys und Native Bridge **nicht** anfassen. |
| Native Gebetsberechnung | `ios/DarAlTawhid/Shared/DarPrayerEngine.swift` | Verwendet im sichtbaren Code feste Winkel für Fajr (-18°), ʿIshāʾ (-17°) und einen festen ʿAṣr-Schattenfaktor 1. | Potenzielle Abweichung zu wählbarer Methode/Madhhab separat untersuchen; **Native-Build erforderlich, daher jetzt keine Änderung**. |
| Native tägliche Aktualisierung | `ios/DarAlTawhid/Shared/DarDailyContent.swift` | Aktualisiert Gebetszeiten und Qibla lokal; holt optional Inhalte aus `/content/updates/daily.json`. | Tagesinhalte sind eher web-/datengetrieben, native Berechnung unverändert lassen. |
| Einstellungsfelder | `ios/DarAlTawhid/Shared/DarWidgetSnapshot.swift` | Snapshot kennt `fajrAngle` und `asrFactor`. `DarDailyContent.refresh` übergibt sie im geprüften Code nicht an die Berechnung. | Hoher Klärungsbedarf vor einem späteren nativen Fix; nicht durch vermeintlichen Web-Patch maskieren. |
| Standardstandort | `DarWidgetSnapshot.swift`, `DarDailyContent.swift` | Bei leerem Snapshot sind Berlin-Koordinaten hinterlegt; UI kennzeichnet den Ort später als „Berlin (Standard)“. | Prüfen, ob dem Nutzer die Herkunft klar gezeigt wird. Native Logik nicht verändern. |
| Bestehende Test-Korrektur | Commits `ef29dbe` und `5c94ff4` vom 21.10.2026 | Kapsel-Footer und Cache-Invalidierung wurden zuletzt geändert. | Keine konkurrierende Parallelkorrektur ohne erneute Sichtprüfung. |
| Änderungsschutz | `AGENTS.md`, `STABILITY.md`, `content/admin/change-scope-lock.json` | Trennung von Test/Besucher/Push und globale Scope-Sperre vorhanden. | Bestehende Schutzmechanismen respektieren. |

**Wichtig:** Dies sind statische Quellcode-Befunde. Keine Aussage hier bestätigt echtes GPS-, Widget-, Watch-, Offline- oder Live-Activity-Verhalten auf einem Gerät.

## Umgesetzte sichere Maßnahme auf diesem Branch

`quality/no-build-widget-boundary.mjs` ist ein eigenständiger, rein lesender Diff-Prüfer. Er blockiert als „No-Build“ deklarierte Änderungen, wenn sie native iOS-/Android-Dateien, Apple-TV-Dateien, Widget-Bereiche, Worker, zentrale Push-/Release-Dateien, Manifest, Service Worker, Versionen oder zentrale Widget-Bridges anfassen.

Manuelle Verwendung in einer bereits ausgecheckten Repository-Arbeitsumgebung:

```sh
git fetch origin main
node quality/no-build-widget-boundary.mjs origin/main
```

Ergebnis: `PASS`, `BLOCKED` oder `ERROR` (bei nicht verfügbarem oder unprüfbarem Basis-Ref). Der Prüfer führt **keinen Build und kein Deployment** aus. Noch nicht in CI integriert, um keine automatischen Jobs zu starten. Ein `PASS` ist keine Laufzeit-, Design- oder Sicherheitsfreigabe.

## Nächste erlaubte Änderungspakete (separat, Test zuerst)

1. Web-Datenstatus: Zeitstempel und Herkunft von Standort/Gebetszeiten/Wetter in der Test-App **nach Prüfung bestehender APIs** korrekt und ohne erfundene „Live“-Angaben darstellen.
2. Web-Layout-Audit: bereits korrigierte Footer-/Safe-Area-Probleme gegen tatsächlich ausgelieferte Test-App prüfen; nur neue, nachweisbare Regressionen isoliert beheben.
3. Qurʾān-/Duʿāʾ-Metadaten und Deep Links: nur bestehende Web-/JSON-Einträge auf fehlende Referenzen und Dubletten prüfen; keine neue kostenpflichtige Audioerzeugung.
4. Theme-Parität: Salbei Elfenbein und andere bestehende Präferenzen bewahren; ausschließlich testseitige Unterschiede gezielt beheben.

## Ausdrücklich vertagt

- Einheitliche native Gebetszeitenengine / WidgetKit-Reparaturen / App-Group-Datenmodell.
- Native iOS-GPS-Hintergrundlogik, Widget-Layouts, Watch-App und Live-Activity-Swift.
- CarPlay dauerhaft nicht Teil dieses Auftrags.

## Freigabegrenze

Dieser Branch ist eine **isolierte vorbereitende Verbesserung**, kein Live-Rollout. Nicht nach `main` mergen und keine produktive Veröffentlichung ohne gesonderte Prüfung. Lokale, nicht auf GitHub hochgeladene Xcode-Änderungen sind von dieser GitHub-Prüfung nicht erfasst.
