# Apple TV – Bildschirmschoner ohne Neustart der Rotation

## Befund (2026-10-18)

Die Remote-Konfiguration in `rotation.json` verlangt bereits `shuffleBag`,
`persistProgress: true`, die 5/5/5-Mischung, genau einen optionalen Echo-Eintrag
je Durchgang und eine dauerhafte Speicherung im Application Support.
**Eine JSON-Regel allein speichert aber keinen tvOS-Prozesszustand.**
In diesem Repository war keine tvOS-Swift-Implementierung des Rotationsspeichers
vorhanden. Das reproduzierbare Nutzerverhalten (bei jedem Öffnen wieder vom Anfang)
spricht für einen Reset der nativen Auswahl beim Neuaufbau der View/Provider-
Instanz; die genaue Ursache im lokalen Xcode-Target ist ohne dessen Quellcode
noch nicht endgültig belegt.

## Bereitgestellte native Komponente

`ScreensaverRotationStore.swift` ist als compilierbare, eigenständige Swift-
Implementierung angelegt. Sie verwaltet nur **stabile Karten-IDs** und deren Typ.
Sie ändert keine Texte, keine vorhandenen Z1–Z5-Karten, keine Layouts, keine
Qurʾān/Tadabbur-Startseitenlogik und keine Haltedauer.

1. Die Datei dem **Apple-TV/tvOS-App-Target** in Xcode hinzufügen.
2. Eine langlebige Instanz im Screensaver-Controller/ViewModel halten
   (`let rotationStore = ScreensaverRotationStore()`), nicht bei jedem Render
   einen neuen Zufallsbeutel generieren.
3. **Nur einen vollständig validierten** Remote-Katalog oder einen vollständigen,
   zuletzt funktionierenden Offline-Katalog in
   `useVerifiedCatalog([ScreensaverRotationStore.Card])` einspeisen. Vorher
   HAD-, Āṯār- und `quranTad`-IDs sammeln und stabile IDs beibehalten.
   Bei Netzfehler, Teilkatalog oder leerer Antwort nicht synchronisieren
   und den letzten vollständigen Cache behalten.
4. `currentOrNext()` liefert den aktuellen oder nächsten Eintrag. Den Text
   anhand der ID mit dem **bestehenden** Provider darstellen. Karten nicht bei
   jedem `onAppear`, `onDisappear` oder Network-Refresh verbrauchen.
5. Erst **nach** Ablauf der vollständigen Haltezeit in Sekunden
   `markCurrentAsDisplayed()` rufen; danach `currentOrNext()` erneut abrufen.
   Bei Pausieren, tvOS-Sleep, Verlassen des Screensavers, View-Rebuild, App-Kill
   oder Force-Quit nichts konsumieren. Beim Öffnen denselben unvollendeten
   Eintrag fortsetzen.
6. Hintergrund-/Foreground-/Wake-Sync darf lediglich neue IDs in den
   Restbeutel aufnehmen. Es darf weder den Zustand noch den Beutel löschen.
   Die Datei `dar-screensaver-rotation-v1.json` liegt unter **Application Support**
   im App-Container und wird nach jeder Kartenentscheidung atomar geschrieben.
7. Das Resultat auf einem **echten Apple TV** testen, einschließlich
   Kill/Restart, Sleep/Wake, Offline-Betrieb, Update der Inhalte und vollständig
   durchlaufener Rotation. tvOS-Neuinstallation kann die Containerdaten löschen.

## Beispiel-Anschluss (als Muster, Typnamen der Xcode-App anpassen)

```swift
// Einmalig im langlebigen Provider/ViewModel:
private let rotationStore = ScreensaverRotationStore()

func completeContentSync(_ allCards: [ScreensaverRotationStore.Card]) {
    rotationStore.useVerifiedCatalog(allCards) // nur vollständiger Katalog
}

func showNextScreensaverCard() {
    guard let next = rotationStore.currentOrNext() else { return }
    // next.id -> bestehende Karten-Darstellung des Providers; die Haltezeit
    // bleibt 16 + 0,35 * Wortanzahl, min. 18 / max. 40 Sekunden.
    // Erst am Ende des echten, sichtbaren Intervalls:
    // rotationStore.markCurrentAsDisplayed()
    // showNextScreensaverCard()
}
```

## Prüfkriterien

- Nach 1, 5 und 50 gezeigten Karten: App schließen/öffnen; der gespeicherte
  Fortschritt darf nicht zurückspringen.
- Wird die aktuelle Karte vor dem Ablauf verlassen, bleibt sie offen.
- Alle gültigen IDs erscheinen einmal pro Pass; die einzelne erlaubte
  Erinnerungswiederholung ersetzt keine ungesehene Karte.
- 5/5/5 H/Ā/Q innerhalb eines 15er-Blocks, wenn alle drei Kategorien
  ausreichend Karten besitzen.
- Neue HAD-/Āṯār-/QuranTad-IDs werden zum Rest hinzugefügt, bereits gesehene
  IDs bleiben abgehakt; entfernte IDs verschwinden.
- Kein vollständiger Reset bei Remote-Sync, tvOS-Wake, Cache-Fallback oder
  fehlender Internetverbindung.
- Keine Veränderung der Startseiten-Slots Qurʾān/Tadabbur/Gebetszeiten.

**Wichtig:** Das Commit im GitHub-Repository ist eine tvOS-Integrationsvorlage,
kein bereits ausgeliefertes Apple-TV-Binary. Erst das Einbinden im echten
Apple-TV-Xcode-Target samt Build, Gerätetest und App-Store-Freigabe behebt die
native Besucher-App. Bestehende Live-Konfiguration bleibt unverändert.
