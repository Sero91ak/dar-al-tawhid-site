# DĀR AL TAWḤĪD · Muṣḥaf V4: Buchphysik und mehrsprachiger Seitensatz

Stand: 22.11.2026. Status: technische Recherche und verbindlicher Entwurf für DĀR TEST. Noch keine produktionsreife Engine, kein echter Fold-Leistungstest.

## Referenz und Fehleranalyse

Das vom Nutzer gelieferte Video zeigt einen aufgeklappten Fold mit zwei nahezu randlosen Qurʾān-Seiten, dichtem arabischem Satz, schmalem Mittelfalz und einer kontinuierlich gekrümmten Buchseite beim Ziehen.

Aktuell werden die Inhalte in test/assets/dar-mushaf-immersive-v3.js mit einer flachen rotateY-Transformation animiert. Es fehlt ein räumlich deformiertes Papiermesh mit echten Ecken, variierendem Licht, Schatten und Trägheit. Die Studie pageVerses + studyPageMarkup legt alle Verse einer Ursprungsseite auf *ein* Lernblatt. Dadurch können Übersetzungen und Schriftgrößen die Blattmenge nicht korrekt erweitern. Individuelle Fontgrößen je Textebene fehlen.

## Engine-Auswahl für zwei kontrollierte Testprototypen

### Prototyp A: Grabfold mit WebGL curl

Quelle: https://github.com/javocsoft/grabfold
MIT, Vanilla JS, RTL-Bindung "right", Physik für beliebige Greifpunkte, Buchdeckel, Blattdicke, Fingerflicks. Der optionale WebGL-Renderer verformt ein Blatt als texturiertes Mesh um den Greiffalz. Für jede Seite kann ein Canvas, eine Bitmap oder ein Bild geliefert werden. DOM-Fallback. Risiken: junges Projekt; Verhalten unter iOS WKWebView und Android Fold erst im Labor beweisen.

### Prototyp B: LeafThrough mit Three.js

Quelle: https://github.com/dmtrbrl/leafthrough
MIT, verformbares Papier, Licht, Schatten, S-Krümmung und Greifbewegung, moderne Frameworkadapter. Die korrekte RTL-Bindung für arabische Bücher ist im Praxistest nachzuweisen. Derselbe Verssatz/dieselben Bildtexturen müssen für den Vergleich verwendet werden.

### Kommerzieller Vergleich: Real3D FlipBook JS

Quelle: https://real3dflipbook.com/js/
WebGL, RTL, Licht, Papier, Schatten. Laut Hersteller reguläre JS-Lizenz 99 USD. Vor Erwerb sind Lizenz/Aktivierung und mobiles WebGL zu prüfen. Nicht ohne ausdrückliche Freigabe kaufen.

CSS rotateY, einfache PageFlip-Animationen und Video-/Designwerkzeuge sind keine vollwertigen Physikengines.

## Ein verbindliches Versmodell – zwei Buchsatzarten

### A. Arabischer Original-Muṣḥaf

- 604 Seiten und 15-Zeilen-Satz nach geprüfter Medina-Edition (QCF V2, mushaf=1). Seitengrenzen, Wörter und Zeilen gemäß Quran Foundation Page Layout API.
- QCF V4 (mushaf=19) als optionale farbige Tajwīd-Edition mit zugehörigen per-page Fonts.
- Die Originalansicht behält IMMER 604 Seiten. Vergrößerung bedeutet Zoom/Pan derselben Satzseite, nicht freien Umbruch.
- Arabisch, Ḥarakāt, Madd und Äyah-Zeichen bleiben unmodifiziert. Schrift- und Bildrechte vor Bundling prüfen.
- Für physikalische Blattanimation auf GPU: pro Originalseite eine korrekt verifizierte Rastertextur, DOM-/Textlayer als zugängliche Ansicht.

Quellen:
https://api-docs.quran.com/docs/tutorials/fonts/page-layout/
https://api-docs.quran.com/docs/tutorials/fonts/font-rendering/
https://api-docs.quran.foundation/legal/developer-terms/

### B. Erweiterter Lern-Muṣḥaf – variable Blattzahl

- Ununterbrochene Reihenfolge aller Verse; jeder Vers trägt als Schlüssel z. B. 2:255 plus die originale Muṣḥaf-Seite.
- Wählbare Textebenen: Arabisch, Lautschrift, Bedeutungsübersetzung (je aktivierte und geprüfte Sprache/Edition). Beliebige Kombination einschließlich alleiniger Übersetzung oder Lautschrift.
- Sprach- und Editionsquellen nicht vertauschen; arabischer Originaltext und Übersetzung klar trennen. Ohne verfügbare Übersetzung KEINE automatisch ersetzte deutsche Übersetzung.
- Jede originale Muṣḥaf-Seite ist ein semantischer Anker und darf in 1..n Lernblätter fließen. Die physische Blattzahl wächst bei zusätzlicher Übersetzung und größerer Schrift.
- Kopf/Seitenfuß: z. B. Muṣḥaf S. 42 · Lernblatt 2/4. Primäre gespeicherte Leseposition ist Vers-/Wortanker, nicht physische Blattnummer.
- Jede Āyah ist elegant mit durchgehender Seitentypografie gesetzt: Arabisch Naskh, hauchdünne Goldlinie, lautsprachliche lateinische Umschrift, weitere Linie, Übersetzung in Leseschrift. Keine einzelnen Karten und keine dunklen Kästen hinter dem Qurʾān.
- Eigenständige Schriftskalen Arabisch, Lautschrift, Übersetzung (je 1..10), Schriftart und Zeilenabstand; nach Änderung vollständiges Re-Paginieren ohne Verlust des Versankers.
- Bidi-Isolation: AR lang=ar/dir=rtl; Umschrift dir=ltr; Übersetzung dir nach Sprache (Sorani rtl, Deutsche/Türkische/etc. ltr). Das Buch selbst ist RTL unabhängig von der UI-Sprache.

## Paginierungsalgorithmus

Der Seitensatz ist ein eigener Controller, unabhängig von 3D-Engine und existierendem Audio-Player.

1. Die aktiven Verssegmente und geprüften Übersetzungen je Edition holen.
2. Schriften vollständig laden (document.fonts.ready), Zielblattbreite/Höhe und Safe Areas sowie Fold-Segment bestimmen.
3. Den echten DOM-Satz messen (Range.getClientRects, BoundingClientRect, Zeilen-/Blockhöhen), statt eine geschätzte Zahl von Zeichen pro Seite zu benutzen.
4. Alle verfügbaren Textlagen auf natürliche Trennstellen setzen. Zuerst zwischen Āyāt oder ihren Lagen umbrechen. Sehr lange Verse dürfen an sicheren Wortgrenzen über mehrere Blätter fließen; dieselbe Äyah-Referenz muss deutlich weitergeführt werden. Niemals Ḥarakāt/Grapheme abtrennen.
5. Nach Paginierung gewährleisten: keine leeren Blätter, kein abgeschnittener Text, keine falsche Nummerierung, kein fehlender Vers und kein doppelter Wortabschnitt.
6. Die fertig gemessene DOM-Seite für die GPU-Animation als Bitmap vorbereiten. Während des Ziehens keine teure Browser-Neuberechnung.
7. Nach Abschluss der Animation DOM-Text für Kopieren, Barrierefreiheit und Suche verfügbar halten; Textur und DOM müssen inhaltlich übereinstimmen.
8. Nur sichtbare und benachbarte Seiten als Bitmap vorhalten (LRU); GPU-Fallback für schwächere Geräte.

Paged.js ist nur ein Vergleich und darf wegen gemeldeter RTL-Probleme nicht ungeprüft übernommen werden. Vivliostyle-Core ist AGPLv3 und braucht gesonderte Lizenzprüfung:
https://pagedjs.org/en/documentation/4-how-paged.js-works/
https://github.com/pagedjs/pagedjs/issues
https://vivliostyle.org/faq/
https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Fragmentation

## Anpassung an iOS/Android/Fold

- Native WebView erhält eine vollformatige Buchsurface ohne App-Header, mit temporär einblendbaren Bedienknöpfen.
- Doppelseite im geöffneten Fold / Tablet, Einzelseite auf schmaler Displayhälfte. Reale Position eines Scharniers über Viewport Segments API nur feature-detected; Breiten-/Orientierungsfallback für alle übrigen Geräte.
- Weder Schrift noch Mitte des Verses durch Falz, Safe Area oder Unterkante abschneiden.
- Fingerposition bestimmt räumlichen Greiffalz, schnelle Flicks haben korrektes Trägheitsverhalten, Loslassen animiert zum Ziel oder zurück. Abbrechen, Drehung und Fold-Umschaltung dürfen keine leeren Blätter oder Verweise auslösen.
- Mindestens zwei Engines auf der Zielhardware prüfen; Rendering-Ziel 60 fps auf leistungsfähigen Geräten ist ein messbares Abnahmeziel, keine aktuelle Zusage.
- Bei niedriger Grafikleistung auf stabilen Seitensatz ohne Curl und anschließend auf den unveränderten normalen Reader ausweichen.

Fold-Referenzen: https://developer.chrome.com/blog/viewport-segments-api-shipped und https://www.w3.org/TR/device-posture/

## Vorhandene Werkzeuge

GitHub = Code, PR/CI, Testberichte. Cloudflare/Assets = versionsgebundene, rechtekonform gehostete Seiten, Fonts und Texturen. Android WebView / iOS WKWebView = interaktive GPU-Buchoberfläche. Adobe/Picsart/Canva = Einband/Papierdesign; Runway = Videovergleich. Letztere sind KEINE physikalischen Echtzeit-Buchmotoren. Der bestehende Qurʾān-Audioplayer bleibt der EINZIGE Player.

## Zwingende Tests und Abnahmekriterien

- Original 604 Seiten: jede Seite vorhanden und stichprobenartig gegen QCF geprüft, Position 1, 2, 42, 604, ursprünglicher 15-Zeilen-Satz, richtige RTL-Seitenfolge.
- Lernblätter: vollständig und wortgetreu, kein Leerblatt, kein Textabschneiden; Deutsch-only, Arabisch-only, Lautschrift-only, Arabisch+Deutsch, Arabisch+Lautschrift, Deutsch+Lautschrift, alle drei; sämtliche verfügbaren Sprachen.
- Textgröße Arabisch, Umschrift, Übersetzung jeweils unabhängig von 1 bis 10. Langer Vers 2:282 als Ausreißer, Seitenübergänge und Quellwechsel.
- Gerätematrix: iPhone/iOS WKWebView, Android normal, Fold geöffnet/geschlossen, Portrait/Landscape, iPad/Tablet, Reduced Motion, VoiceOver/TalkBack.
- Physik: Screenshots bei Curl 0/25/50/75/100 Prozent, variable Greifhöhe, korrektes Verformen (nicht nur rotieren), Vorder-/Rückseitenlicht, Stapel, Schlagschatten und Schattenverschiebung entlang des Fingers.
- Einzelner Qurʾān-Player und keine Änderung an Besucher-/Kids-App.
- Erst im isolierten Test-Labor nachweisbare Ergebnisse und Browser-/Geräte-QA; dann kontrollierter Ersatz des bisherigen V3-Animationsmotors. Keine ungeprüfte Test-/Live-Push-Behauptung.
