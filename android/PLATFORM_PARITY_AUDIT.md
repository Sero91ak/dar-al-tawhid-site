# DAR AL TAWḤĪD · Android-Smartphone und Android TV – ehrliche Funktionsprüfung
Stand: 08.10.2026 · **Staging**, nicht Besucher-Live.

## Architektur

| Bereich | Android-Smartphone | Android TV / Google TV |
|---|---|---|
| Basis | Native Android-Hülle mit WebView auf `https://dar-al-tawhid.de` | Eigenständige Android-Leanback-/D-Pad-Oberfläche mit JSON-Inhalten |
| Plattform-Erkennung | Android-Flag bereits am Dokumentanfang nötig | Keine iOS-WebView. Android TV ist eine **andere** App mit eigenem Paket |
| Standort | Android-Laufzeitberechtigung **und** HTTPS-WebView-Geolocation | Viele Fernseher haben kein GPS; manuelle Stadtwahl + Speicherung |
| Icons | Android Launcher-Aliase; Website-Auswahl sendet iOS-kompatible Icon-Namen an Android-Bridge | Eigenes TV-Icon + eigenes TV-Banner; kein Smartphone-Icon-Wechsel |
| Push | Native OneSignal-Android-Registrierung, separate Statusprüfung erforderlich | Kein 1:1-Klon des Smartphone-Pushsystems; TV-Kanal separat planen |
| Widgets | Android **AppWidgetProvider** erforderlich, bisher NICHT implementiert | Kein iOS/Android-Handy-Widget 1:1; Leanback Startbildschirm unterstützt andere Flächen |
| QR/Leseansicht | Gemeinsame Webinhalte | Separate TV-UX und Fernbedienung, Funktionsumfang derzeit begrenzt |

## Phase A – umgesetzt in Staging-Code, Android-Rebuild erforderlich

- [x] Beim Android-WebView-Dokumentstart eindeutige `DAR_PLATFORM=android`, `DAR_ANDROID_NATIVE_APP=true` und `DAR_IOS_NATIVE_APP=false` setzen.
- [x] Android Icon-Picker-Bridge schon **vor** Website-Skripten bereitstellen, damit Auswahl nicht vom späten `onPageFinished` abhängt. Native Launcher-Aliase für vorhandene Varianten bestehen.
- [x] Geolocation nur von eigenen HTTPS-Hosts zulassen und echte Android Runtime-Permission abfragen; pauschales `grant(...,true,...)` entfernt.
- [x] Bild-Sicherheitsabstand des Android-Standardicons auf 26dp erhöht; Logo-Schrift im Launcher muss auf echtem Gerät überprüft werden.
- [x] TV: Stadtwahl wird gespeichert; Wechsel baut Startseite neu auf statt mehrfach Inhalte anzuhängen; zehn Städte als Ausgangspunkte.
- [x] Android vs. iOS Texte in der Besucher-Weboberfläche separat im Website-Draft-PR #846 korrigiert (noch NICHT live).

## Phase B – ausdrücklich **noch offen**, nichts als fertig bezeichnen

- [ ] Android-Smartphone: reale Installation und Upgrade **mit gleichem Release-Zertifikat**; Android 13/14/15/16 sowie Launcher-Masken testen.
- [ ] Standort: Android-Erlaubnis anfragen, akzeptieren, verweigern, „ungefähr“, „genau“, ausgeschaltete Ortungsdienste, App-Neustart und Qibla prüfen.
- [ ] Icon-Auswahl: alle 18 Varianten testen und zurück auf Standard; Launcher-Cache und Rückkehr zur App beobachten.
- [ ] Push: OneSignal-Token, Android-Permission, Status-Anzeige und **tatsächliche** Testnachricht prüfen. Kein automatischer globaler Besucher-Push.
- [ ] Android-Widget: verbindliche Gebetszeiten aus dem bestehenden `widgets/shared/prayer-math.js`/validierten Tagespaket beziehen; native `AppWidgetProvider`, Offline-Cache und Updateplanung gesondert umsetzen; keine Fantasiezeiten.
- [ ] TV: echte Fernbedienung/Focus/Back, Layout auf 720p/1080p/4K, Nachtmodus, Standortwahl und Inhalte gegen vorhandene Apple-TV-Funktionen systematisch testen.
- [ ] TV: Vollständige Qurʾān-Reader-Funktionen, Adhān und Apple-TV-spezifische Funktionen separat portieren; derzeit **keine** Funktionsgleichheit behaupten.
- [ ] Android WebView-Requests für Kamera/Mikrofon sicher auf Origin/Android-Runtime-Permissions einschränken; bestehende pauschale Medien-Permission-Zusage ist ein eigener Sicherheitsprüfpunkt.
- [ ] Website-Draft #846 mit den neuen Android-Plattformflags integrieren und auf einer Staging-URL prüfen; Hauptwebsite nicht ohne Besucher-Live-Freigabe ändern.
- [ ] Erst **nach** signiertem Build + Gerätetests die neuen Smartphone-/TV-APKs als öffentliche Releases anbieten und die Website-Downloads freischalten. Kids bleibt privat.

## Abnahmekriterien

1. Beide getrennten Android-Pakete bauen und sind mit den bestehenden Original-Release-Schlüsseln signiert; `apksigner verify` grün.
2. Smartphone-App zeigt **Android-App** an, WebView fragt Standort **wirklich** bei Android ab; keine stillen Freigaben.
3. Standard-Icon vollständig innerhalb Launcher-Safe-Area sichtbar, 18 Icon-Varianten wechselbar ohne App-Datenverlust.
4. Gebetszeiten/Kompass stimmen für freigegebenen Nutzerstandort; Berechtigungsverweigerung führt nicht zu falschen Daten.
5. TV lädt geprüfte Daten, Fernbedienung navigiert, Stadtwahl bleibt gespeichert, keine verdoppelten Startseiten-Elemente.
6. „Website live“ und „APK neu verteilen“ werden getrennt und nur nach tatsächlichen Bestätigungen ausgewiesen.

Referenzen: Native PR #844; Website-Plattform-PR #846; Website-Download-PR #845.
