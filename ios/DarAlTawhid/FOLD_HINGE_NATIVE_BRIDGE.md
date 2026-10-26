# iPhone Duo / Fold-Phone – native Division-Region → WKWebView

Status: **Web-Fold-Aufteilung implementiert; native Brücke noch NICHT angeschlossen**. Diese Notiz ist kein Xcode-Build- oder Hardwaretest-Nachweis.

## Quelle der echten Falzgeometrie

Apple stellt unter iOS 27.1 `UIView.reservedRegions(kind: .division)` bereit. Die `frame`-Koordinaten sind view-lokal und enthalten die systemseitig nötigen Ränder bereits. Eine Division ist nur beim partiellen Falten aktiv; auf dem vollständig flach geöffneten Display kann die Zweispaltenansicht erhalten bleiben, ohne eine Hardware-Abdeckung vorzutäuschen. Siehe https://developer.apple.com/documentation/uikit/uiview/reservedregion.

## Erwartetes WebView-Ereignis

Nach Berechnung der `division`-Region in der iOS-Hülle und **Transformation ihrer View-Koordinaten in die CSS-Pixelkoordinaten des WKWebView-Viewports** muss die native Hülle nach Pose- oder Größenänderungen ein Ereignis veröffentlichen:

```js
window.dispatchEvent(new CustomEvent("dar:native-fold-region", {
  detail: {
    active: true,
    axis: "vertical",
    frame: {x: 490, y: 0, width: 44, height: 1366},
    viewportWidth: 1024,
    viewportHeight: 1366
  }
}));
```

Die Zahlen sind ein **reines Testfixture**, keine Geräteabmessungen. `active:false` deaktiviert die native Hardware-Reservierung:

```js
window.dispatchEvent(new CustomEvent("dar:native-fold-region", {
  detail: { active: false }
}));
```

Die Hülle kann den aktuellen Stand alternativ vor DOMContentLoaded als `window.__DAR_NATIVE_FOLD_REGION` bereitstellen. Bei aktiver vertikaler Region berechnet `assets/fold-hinge-layout.js` die exakte verfügbare Breite links und rechts des Falzrechtecks relativ zu jedem `.dar-fold`-Container. Bei horizontaler Region ordnet das Stylesheet die Bereiche oben/unten an. Unbekannte oder veraltete Koordinaten werden nicht als physische Messung verwendet.

**Sicherheit:** JSON aus geprüften numerischen Daten serialisieren und sauber an `evaluateJavaScript` übergeben, niemals rohe Zeichenketten interpolieren. Bei vollständig geschlossenem Fenster kein aktives Regionen-Signal und kompakte Einzelspalte. Bestehende Route, Scrollposition, Audio und Navigationsstapel erhalten.

## Noch blockiert

`ios/DarAlTawhid/DarAlTawhid/WebAppView.swift` überschreibt aktuell bei seinem eigenen `ensureStyle()` `data-layout=medium|expanded` zurück auf `compact`. Dieser Pfad gehört zur separaten, passwortgeschützten nativen iOS-/Push-Spur und darf nicht durch eine allgemeine Layoutfreigabe umgangen werden. Die native Korrektur und die Bridge brauchen die dafür vorgesehene Projektfreigabe. Bis dahin keine Behauptung, dass die reale Mittelfalz im App-Store-Build erkannt wird.

## Prüfbedingungen

- iPhone Duo vollständig geschlossen: kompakter Außenbildschirm, nur eine Leseransicht.
- Vollständig geöffnet Hochformat und Querformat: zwei gut lesbare Seitenhälften, ohne Textzeilen, Buttons oder Bilder jenseits der sichtbaren Fläche.
- Teilweise aufgeklappt, Buchhaltung: linke und rechte Hälfte bis an den tatsächlichen `division.frame`-Rand; Mitte leer.
- Teilweise aufgeklappt, Laptop-Haltung: obere und untere Region statt linker/rechter.
- Zustandswechsel während Qurʾān-/Ḥadīṯ-/Duʿāʾ-Lesen, Beiträgen, Bibliothek und laufender Audio-Wiedergabe ohne Verlust von aktuellem Inhalt oder Scrollposition.
- iPad Multiwindow und alle iPhone-Größen dürfen keine vorgetäuschte native Falz erhalten.
- CI `hinge-geometry-acceptance` in Chromium und WebKit sowie native Xcode-/DeviceHub-Tests vor Gesamtfreigabe.
