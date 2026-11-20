# TAWḤĪD KIDS NEXT · isolierter iOS-Simulator-Unterbau

**Status 26.10.2026: Entwicklungs-Scaffold. Kein vollständig nativ migriertes KIDS-Produkt und keine geprüfte 100-%-Parität.** Die vorhandene WKWebView-/Audio-Bridge und das bestehende Creator-Testmenü werden direkt, ohne Veränderungen, aus dem getrennten iOS-Kids-Bestand verwendet. Erst der Xcode-Masterauftrag migriert die einzelnen Module in eigene SwiftUI-Komponenten.

## Ein Befehl auf dem Mac
Im lokal ausgecheckten Repository vom Root-Verzeichnis aus:

    bash ios/DarAlTawhidKids/Next/TAWHID-KIDS-NEXT.command

Dieser Befehl erzeugt mit XcodeGen das separate TawhidKidsNext.xcodeproj, testet auf verfügbaren iPhone-/iPad-/Duo-Simulatoren und startet KIDS NEXT im Simulator. Wenn XcodeGen fehlt, wird es über vorhandenes Homebrew installiert (sonst klarer Abbruch). Wenn ein Simulator fehlt, erfolgt ein nichtgrüner QA-Status statt Scheinerfolg. Build-/Testlogs und erster Screenshot werden unter Next/.qa/ gespeichert.

Voraussetzungen: macOS mit ausgewähltem vollständigem Xcode, für iPhone Duo Xcode 27.1 samt iOS-27.1-Simulator, Python 3, Homebrew oder installiertes XcodeGen, Netzwerkzugang zum **eigenen** KIDS-Creator-Test-Worker. Das Shell-Skript überträgt keine Änderungen auf Server.

## Xcode
- XcodeGen: project.yml
- Generiertes Xcodeprojekt: TawhidKidsNext.xcodeproj
- Scheme: TawhidKidsNext
- App-Anzeigename: KIDS NEXT
- Test-Bundle: de.daraltawhid.kids.next.dev
- Origin: dar-al-tawhid-kids-creator.sero91ak.workers.dev/kids/start.html
- Shared read-only native files: ../DarAlTawhidKids/{KidsNativeIntro,KidsAppShell,KidsWebAppView}.swift
- Separater SwiftUI-Entry: Sources/TawhidKidsNextApp.swift

## Grenzen
Der heute angelegte Unterbau beweist noch NICHT, dass alle Quizfragen laden, Audios vollständig vorhanden sind, die Staging-Origin erreichbar/autorisiert ist oder iPad/iPhone Duo visuell korrekt sind. Automatisierte Unit-Tests prüfen nur Herkunft, Bundle-Isolation und Routing. Fachliche Parität braucht Vollinventar, SwiftUI-Module, echte Audiotests, Accessibility/Audio-/Offline- und Geräte-Sichtprüfung. Apple-Simulatoren ersetzen keine echten Geräte. Keine Migration auf das öffentliche Bundle ohne explizite gesonderte Freigabe.

Die bindenden Regeln stehen in kids/TAWHID-KIDS-NEXT-RULES.md; der Gesamtauftrag für den Xcode-Coding-Agenten in kids/TAWHID-KIDS-NEXT-XCODE-AUFTRAG.md.
