# Native Apple-Tab-Bar für DĀR AL TAWḤĪD KIDS

## Verifizierte originale Kinder-Icons

Die unveränderten PNGs aus `kids/assets/kids-icons` wurden mit exakt
denselben Git-Blobs in Xcode-Imagesets übernommen. Fünf Haupttabs:

| Button | Bestehendes Kids-Ziel | Native Ressource | Original-PNG |
| --- | --- | --- | --- |
| Heute | `today` | `KidsNative3DToday` | `sun-real-v12.png` |
| Hören | `stories` | `KidsNative3DListening` | `headphones-real-v12.png` |
| Lernen | `data-academy-open="1"` | `KidsNative3DLearning` | `learning-book-3d-v1422.png` |
| Duʿāʾ | `dua` | `KidsNative3DDua` | `dua-real-v12.png` |
| Eltern | `parents` | `KidsNative3DParents` | `parents-real-v12.png` |

Das Bildrendering ist `alwaysOriginal`; native Apple-Tabs sollen die
3D-Transparenz, Farben und eigene Label beibehalten.

## WICHTIG: noch kein sichtbarer Umbau

Der GitHub-Stand der Kinder-App verwendet in `KidsRootView` die
`KidsWebAppView`, die die HTML-`.bottom-nav` aus der Kinder-Web-App
darstellt. Diese Leiste sieht iOS-typisch aus, ist aber **keine**
native `UITabBar`. Hier ist eine echte `UITabBar` lediglich als
isolierte, in das Xcode-Target registrierte Komponente vorbereitet.

Vor einem Aktivieren der nativen Leiste im bestehenden Kids-Root:
1. Prüfen, ob der lokale Mac-Workspace neuere native Kinder-Navigation
   bereits enthält. Diese niemals überschreiben.
2. Die genau eine bestehende `KidsWebAppView` behalten und einen
   kinderspezifischen Host mit Apple-Tab-Leiste einziehen.
3. Die fünf nativen Aktionen auf die vorhandene Kinder-SPA verbinden:
   Heute → `[data-target="today"]`, Hören → `[data-target="stories"]`,
   Lernen → `[data-academy-open="1"]`, Duʿāʾ → `[data-target="dua"]`,
   Eltern → `[data-target="parents"]`. SPA-seitiges `.click()`
   ausschließlich auf verifizierte vorhandene DOM-Buttons anwenden.
4. Für Kind-/Mädchen-Profile nur bereits vorhandene Farbschemata lesen;
   Browsernavigation und Kids-Website nicht ändern.
5. Web-Bottom-Nav **erst dann** ausschließlich im neuen nativen Build
   ausblenden, wenn alle fünf Apple-Tabs laufen. Alte App-Versionen müssen
   funktionsfähig bleiben; kein pauschales globales `.kids-ios-app`-CSS.
6. Native und Web-Routenauswahl in beide Richtungen spiegeln; nach
   Neustart, Wechsel per Web, Back, Quiz-Lauf, Lernakademie-Wechsel,
   Profilwechsel, VoiceOver und Deep Link prüfen.
7. Safe-Area, iPhone, iPad, Mini-Display, Landscape, Dynamic Type,
   Reduce Motion, Audio-Playback und Screen-Lock testen; kein
   doppelter Bottom-Dock und keine verlorenen Kinder-Profile.
8. Vollständiger Xcode-Clean-Build + Simulator-Abnahme, erst danach
   kontrollierte Kinder-TestFlight-Freigabe.

**Keine Änderungen an veröffentlichtem Kids-Web-HTML/CSS, Inhalten,
Profilen, Quizfragen, Audio- oder ElevenLabs-Dateien, Push und Berechtigungen.**

Die Erwachsenen-App und DARNext verwenden weiterhin *eigene* fünf Labels
Start, Quiz, Beiträge, Koran, Mehr und deren separate 3D-Grafiken. Gemeinsame
native Technik, keine Vermischung der App-Typen.
