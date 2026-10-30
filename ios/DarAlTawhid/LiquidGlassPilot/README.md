# DĀR AL TAWḤĪD · Liquid Glass + Original-3D-Tab-Leiste (Pilot)

**Status 2026-10-30:** Stufe 1 als ISOLIERTER Quellcode im Experiment-Zweig angelegt. Weder in ein produktives iOS-Target eingebunden noch in Simulator/TestFlight installiert. **Keine Veröffentlichung.** Der Quellcode ist ein Adapter-Prototyp, **keine Abnahme** der Schnellaktionen.

## Tatsächlicher Repository-Befund
- `ios/DarAlTawhid/DarAlTawhid/DarAlTawhidApp.swift` setzt derzeit **eine einzige** `WebAppView` als Startoberfläche ein.
- `ios/DarAlTawhid/DarAlTawhid/DarAppShell.swift` setzt `usesStagingWeb = false`, d. h. native iOS lädt **Live**, während DAR Test (`/test/`) getrennt im Browser läuft.
- `DarNativeTabBar.swift` ist eine eigenständige ältere UIKit-`UIView` und gehört nicht zur aktiven Xcode-Build-Phase.
- Die Website enthält die ursprüngliche `#bottomNav` mit 3D-Icons, bestehendem Routing und Schnellzugriffen.
- Das Besucher-Smart-Profil nutzt `window.DAR_VISITOR_SMART_PROFILE_V1.get().gender` (woman/man/neutral).
- `dar-visitor-daily-hub-v1.js` verändert schon heute das zweite Tab: woman → `frauen`; sonst → `topics`. Das Quiz bleibt in Start/Mehr.

## Implementierter isolierter Pilot
Datei: `LiquidGlassPilot/DARLiquidGlassTabPilot.swift`.

- Native `UITabBarController`, für iPhone unten und iPad tab/sidebar via `.tabSidebar`.
- Genau fünf sichtbare Bereiche: Start, Frauen/Entdecken, Beiträge, Qurʾān, Mehr.
- Originale 3D-PNG-Namen `home, frauen/topics, posts, quran, more`, `alwaysOriginal`; bei fehlenden lokalen Assets im **Pilot** Abruf exakt derselben Bilddateien vom bestehenden Webserver.
- Eine **gemeinsame**, von außen übergebene `UIHostingController`-Instanz für die **bestehende** `WebAppView`. Das Projekt darf **keine fünf WKWebViews** erstellen, weil Rezitation, Audio, Speicher und Bridge-Nachrichten erhalten bleiben müssen.
- Native Tap-Auswahl leitet vorhandene Browser-Buttons (`data-bottom-nav`) oder vorhandenes Routing weiter, inklusive Re-Tap.
- Keine Veränderung bestehender App-Dateien oder produktiver Targets.

## Unbedingt vor Aktivierung
1. Isoliertes DEBUG-Test-Target mit **eigener Bundle-ID**, eigenem App-Icon und eindeutigem Staging-Startpfad `/test/` einrichten. Existierende App und Daten nicht überschreiben.
2. Pilot in Debug-Build einbinden und `UIHostingController(rootView: WebAppView(...))` einmalig als `existingWebAppHost` übergeben. Der produktive `@main`-Entry bleibt unangetastet.
3. Alle fünf freigegebenen Original-PNGs direkt in `Assets.xcassets` übernehmen. Test vor Freigabe: kein fehlendes Bild, keine Tönung, keine falsche Skalierung, auch Dark/Light.
4. Browser-`#bottomNav` **nur im Testbuild und erst nach erfolgreicher nativer Initialisierung** ausblenden, Safe-Area-/Mini-Player-Abstände prüfen. Der Pilot schaltet dies ausdrücklich noch **nicht** ab, damit die bestehende Navigation nicht verschwindet.
5. Native ↔ JavaScript-Profilsynchronisierung sofort bei `dar:visitor-profile-changed` vervollständigen; der Pilot besitzt erst eine explizite Abfrage.
6. Re-Tap, Schnellaktionen und insbesondere **Long-Press** auf Qurʾān/Mehr einzeln gegen aktuelles Verhalten testen. `.click()` allein garantiert Long-Press NICHT.
7. App-Start/Cold Launch, Offline/Onlineschalter, Deep Links, Back, Push, Notifications, Player-Weiterlauf, Haptik, Accessibility, Schriftgrößen, Portrait/Querformat auf iPhone und iPad kontrollieren.
8. Mit Xcode iOS-26-SDK Build + Simulator laufen lassen; echte Apple-Hardware visuell prüfen. Keine automatische Produktiv-Freigabe.
9. Wenn irgendein Punkt abweicht: nativen Pilot abschalten; bestehende Webnavigation beibehalten.

## Abnahmebedingung
Erst wenn **originale 3D-Icons vollständig** bleiben, die **bisherigen Schnellaktionen** identisch funktionieren, **genau eine WKWebView** bestehen bleibt, **frauenabhängiges Tab** sofort aktualisiert und Layout mit **Liquid Glass** im Simulator und auf iOS-Hardware geprüft ist, den isolierten Code in ein Test-Target übernehmen. Produktion bleibt gesperrt.
