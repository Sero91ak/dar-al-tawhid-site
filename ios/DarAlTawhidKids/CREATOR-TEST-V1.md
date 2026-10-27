# TAWHID KIDS TEST · native iOS Creator Flavor V1

## Zweck
Eine **zweite installierbare iOS-App** für den Ersteller, getrennt von der
App-Store-Besucher-App. **Noch keine vollständige Creator-Freischaltung.**

| | Kinder-Besucher-App | KIDS TEST (Creator) |
|---|---|---|
| Xcode Scheme | DarAlTawhidKids | DarAlTawhidKidsCreator |
| Build | Debug/Release | CreatorDebug/CreatorRelease |
| Bundle-ID | de.daraltawhid.kids | de.daraltawhid.kids.creator |
| Appname | TAWḤĪD KIDS | KIDS TEST |
| Launch-Origin | https://dar-al-tawhid.de/kids/start | https://dar-al-tawhid-kids-creator.sero91ak.workers.dev/kids/start.html |
| URL-Scheme | daraltawhidkids:// | daraltawhidkidstest:// |
| Browser-Appdaten | Eigener WKWebView-Container | Anderer WKWebView-Container |
| Echte Kinderprofile | Nur hier | Nicht übernommen |

**Wichtig:** Die unterschiedliche native Bundle-ID isoliert standardmäßig
WKWebView-Speicher, App-Einstellungen und Installationszustand.
Die Test-App remappt ausschließlich KIDS-Deep-Links auf die Test-Origin.
Die Besucher-App nutzt weiterhin `/kids/start` auf der Live-Domain.

## So wird die zweite App in Xcode geöffnet

1. `ios/DarAlTawhidKids/DarAlTawhidKids.xcodeproj` öffnen.
2. Das geteilte Scheme `DarAlTawhidKidsCreator` auswählen (nicht das Visitor-Scheme).
3. iPhone oder Simulator auswählen; Signing für Bundle-ID `de.daraltawhid.kids.creator`
   mit dem Apple-Entwicklungsteam prüfen.
4. In Xcode **Run** starten. Das Homescreen-Symbol ist **KIDS TEST**;
   `TAWḤĪD KIDS` bleibt gleichzeitig installiert.
5. Vor einer TestFlight-/App-Store-Verteilung separat Testdaten- und Build-Routing prüfen.

## Stand der Funktion und Grenzen

- Die Test-App nutzt bereits einen eigenen dedizierten KIDS-only Worker (noch nicht live verifiziert), der nur /kids-Dateien aus dem manuellen `kids-creator-staging`-Deploy ausliefert. Keine Abhängigkeit vom Dar-Test-Worker für Erwachsene.
- Die **vollständige eigenständige Redaktions-Pipeline** (zuerst im Test ändern,
  kontrollieren, dann explizit freigeben) muss als Folgephase eingerichtet
  werden. Solange dort keine andere Kids-Build-Version ausgeliefert wird,
  kann der visuelle Inhalt identisch zur Besucher-App sein.
- Besondere Sperren von Akademie/Elternbereich werden bewusst **nicht**
  durch einen manipulierbaren Query-Parameter oder ein bloßes User-Agent-
  Kennzeichen ausgeschaltet.
- Keine automatischen Builds auf App Store Connect; kein kostenpflichtiger
  API-Aufruf. Es wurde kein Apple-iOS-Build auf macOS ausgeführt.
- Der separate Worker-Host liefert KIDS-Inhalte derzeit aufgrund des älteren
  User-Agent-Gates an native KIDS-Clients aus. Dieser bestehende Mechanismus
  ist **keine belastbare Besitzeridentifikation**; nur die isolierte
  Anwendungshülle ist fertig vorbereitet.
- Falls die Test-Origin den Kids-Inhalt ablehnt oder eine Anmeldung verlangt,
  ist das ein noch zu lösendes Server-/Authentifizierungsproblem. Keine
  Besucher-URL als stiller Fallback verwenden.

## Nächste Schritte

1. Vollständig eigenständigen KIDS-Web-Build auf Test-Worker mit eigener
   Test-Branch und kontrolliertem Deployment einrichten; keine
   automatischen Besucher-Deploys.
2. Serverseitigen Testerzugang für geschützte Creator-Funktionen und
   Medien ohne fehlerhaften zusätzlichen Passwortdialog bereitstellen.
3. Alters-/Wochen-Sperren nur im authentifizierten Creator-Mode umgehen,
   niemals im Besucher-Build.
4. Alle Module testen: Home/Profile, Qurʾān, Hörbücher, Duʿāʾ, Akademie,
   Eltern, Audio/Downloads, iPhone, iPad.
5. Expliziten Freigabeprozess Test → Besucher einbauen und QA auf dem
   echten iPhone durchführen.

## V2: Native Testnavigation
Die getrennte Xcode-Bauvariante hat einen kleinen goldenen **TEST**-Button.
Er öffnet die Module Start, Qurʾān, Hörbücher, Duʿāʾ, Eltern und Akademie.
Diese Shortcuts ändern weder Besucher-Konfiguration noch öffentlich sichtbare
Unterrichtssperren. Für KIDS-Test-Änderungen gilt ausschließlich der neue
Staging-Branch, niemals ein direkter Live-Push.


## 27.10.2026 · V4-Fuṣḥā-Hörvorschau in der nativen KIDS TEST App

Die Test-App enthält nach einem **neuen Xcode Creator-Build** unter dem goldenen **TEST**-Menü den Eintrag
**„Quiz · echte V4-Fuṣḥā-Hörvorschau“**. Der Eintrag lädt innerhalb
der bestehenden Test-WKWebView die isolierte Dar-Test-Quizseite
`https://dar-al-tawhid-test.sero91ak.workers.dev/kids/start`.
Der Quizbereich wird nach erfolgreicher WebKit-Navigation geöffnet;
Frage, Lob, Ermutigung und Erklärung sind über gesonderte
Touch-Schaltflächen prüfbar (450 Fragen; 1.800 Zuordnungen).

Die anderen Creator-Menüpunkte bleiben auf dem bisherigen Creator-Worker
`dar-al-tawhid-kids-creator.sero91ak.workers.dev`; die separate iOS-Bundle-ID,
die Besucher-Web-App, alle produktiven Push-/Widget-/App-Store-Ziele und die
Kinderdaten bleiben unverändert. Der bisherige Creator-Staging-Branch wird
nicht mit unfreigegebenen Audioressourcen überschrieben.

**Hörprüfung und Veröffentlichung sind getrennt:** Die DAR-Test-Version darf
die echten ElevenLabs-`eleven_v4`-Clips der Masterstimme mit
`humanListeningApproved=false` ausdrücklich als Test abspielen.
Die Besucher-App benötigt weiterhin die echte dokumentierte Fuṣḥā-Hörabnahme.
Weder das Öffnen dieses Testbereichs noch technische HTTP-/MP3-Checks
setzen Freigabeflags auf `true`.

**Native Build-Grenze:** Eine Änderung in GitHub aktualisiert eine bereits
installierte Xcode-App nicht automatisch. Für den neuen TEST-Menüpunkt
muss der Xcode-Scheme `DarAlTawhidKidsCreator` neu gebaut und auf dem
iPhone/iPad/Simulator installiert werden. Ein macOS-`xcodebuild` und ein
echter iPad-Hörtest sind damit noch nicht nachgewiesen.
