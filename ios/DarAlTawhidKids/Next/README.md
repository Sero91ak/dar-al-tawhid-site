# TAWḤĪD KIDS NEXT

**Stand 29.10.2026: isolierte Simulator-App mit nativer Start-/Quiz-/Duʿāʾ-Fläche und ausdrücklich erreichbarem KIDS-Webadapter. Keine vollständige native Seitenmigration und keine Produktivfreigabe.**

## Ein gemeinsamer Xcode-Einstieg

Öffne `ios/DarAlTawhidKids/DarAlTawhidKids.xcworkspace`. Dieser Workspace enthält das bestehende Projekt `DarAlTawhidKids.xcodeproj` und das separat gehaltene NEXT-Projekt `Next/TawhidKidsNext.xcodeproj`. Die vorhandenen Schemes `DarAlTawhidKids`, `DarAlTawhidKidsCreator` und `TawhidKidsNext` bleiben eigenständig und erscheinen im selben Xcode-Fenster. Die Projekte und Bundle-IDs werden nicht vermischt.

NEXT verwendet ausschließlich das Debug-Simulator-Bundle `de.daraltawhid.kids.next.dev`, ohne Apple Signing. Das bestehende App-Store-Bundle `de.daraltawhid.kids` und Creator-Scheme werden nicht geändert.

## Ein-Klick-Aufbau und Start

Im Checkout des privaten Kids-NEXT-Branches:

```sh
bash ios/DarAlTawhidKids/Next/TAWHID-KIDS-NEXT.command
```

Der Launcher führt zuerst den lesenden Recovery-Preflight aus, sichert das bisher generierte NEXT-Projekt in `.qa`, generiert das isolierte NEXT-Projekt mit XcodeGen, prüft das gemeinsame Workspace/Scheme, baut und testet auf einem verfügbaren iPhone-Simulator und installiert/startet NEXT. Er bootet Geräte bei Bedarf, führt keinen Simulator-Reset aus und ändert kein Signing. Protokolle und DerivedData bleiben unter `Next/.qa/integrated-run/`.

Voraussetzungen: macOS mit Xcode, XcodeGen (`xcodegen`), Python 3 und eine verfügbare iPhone-Simulator-Runtime. Ein fehlgeschlagener Build, Test oder Simulatorstart stoppt den Ablauf mit dem jeweiligen Logpfad.

## Verifizierte Funktionsgrenzen

- Native Oberfläche: Heute, Quiz mit freigegebenem lokalen Datensatz, Duʿāʾ-Liste mit den deklarierten Originalaudiofeldern und fünf Original-KIDS-Tabs/-Icons.
- Native Quizquelle: 900 freigegebene, eindeutige Fragen; 300 pro Quiz-Altersband 4–6, 7–8 und 9–10. Das Quiz-V4-Manifest enthält 1.884 eindeutige Audioeinträge; für 613 Fragen ist der exakte Prompt-Schlüssel ableitbar. Das ist Manifest-/Dateiabdeckung, keine menschliche Hörabnahme.
- Duʿāʾ: 120 verifizierte eindeutige Einträge; drei Audio-URL-Felder je Eintrag. Vorhandensein im Manifest bedeutet nicht, dass jede Aufnahme gehört oder fachlich abgenommen wurde.
- Nicht migrierte Story-, Akademie-, Qurʾān-, Gebetszeit-/Qibla- und Elternfunktionen bleiben über einen einzelnen KIDS-WebKit-Adapter erreichbar. Der Simulator-Build belegt keine vollständige Funktions-, Inhalts-, Audio-, Offline-, Datenschutz- oder Barrierefreiheitsparität.
- Auf iPhone Duo geschlossen (iOS 27.1) wurde NEXT installiert und gestartet; der Device-Hub-AX-Baum zeigte Heute und fünf Tabs, das originale Hero-Bild war sichtbar. Andere Geräte, Duo-Posen, Profile, Altersdarstellungen und Ausrichtungen sind nicht vollständig geprüft.

Siehe `IMPLEMENTATION-STATUS.md` für aktuelle Testresultate und Blocker sowie `PARITY-MATRIX.md` für den Quell-zu-Ziel-Status. Kein Merge, Live-Push, Store-/TestFlight-Upload oder physische Gerätefreigabe ist erfolgt.
