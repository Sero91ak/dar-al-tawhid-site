# Xcode-Auftrag: Scroll-Edge-Glas in Test- und Besucher-App entfernen

**Referenz:** normale iOS-App (scharf, kein Blur oben).  
**Ziel:** Test-App und Besucher-App beim Hochscrollen identisch: Inhalt bleibt sichtbar und scharf unter der Statusleiste.

## Nicht ändern

Header, Hintergrundfarbe, Safe Area, Abstände, Scrollposition, Gebets-Kapsel, Navigation.

## Entfernen

- Blur / Glas / Material am oberen Scrollrand
- Verlauf/Fade hinter der Statusleiste
- halbtransparentes Overlay
- `.scrollEdgeEffectStyle(.soft, for: .top)`
- `.scrollEdgeEffectStyle(.automatic, for: .top)`
- kein neues `.blur()`, `.material`, `UIVisualEffectView`

## Setzen (SwiftUI, falls der ScrollView SwiftUI ist)

```swift
.scrollEdgeEffectHidden(true, for: .top)
```

Bei mehreren Kanten oder nested ScrollViews:

```swift
.scrollEdgeEffectHidden(true, for: .all)
```

## WKWebView (bestehende iOS-App)

Der Hauptinhalt scrollt in `webView.scrollView`. Dort UIKit-Äquivalent:

```swift
if #available(iOS 26.0, *) {
    scrollView.topEdgeEffect.isHidden = true
    scrollView.bottomEdgeEffect.isHidden = true
}
```

Zuerst die funktionierende iOS-App vergleichen und nur deren Scroll-Verhalten übernehmen. Layout nicht umbauen.
