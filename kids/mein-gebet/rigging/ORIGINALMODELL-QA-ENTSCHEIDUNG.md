# Original-Jungenfigur — Qualitätsprüfung nach V4 (08.10.2026)

**Entscheidung:** Die von der App verlangte originalgetreue 3D-Figur ist **noch nicht fertig**. Die technisch animierbaren Prototypen V2–V4 waren optisch nicht akzeptabel. Es wird **kein** weiterer Modellierungsversuch allein wegen eines gültigen GLB oder 19 Gelenken freigegeben.

## Was unabhängig überprüft wurde

Als interne Arbeitsschritte (keine neuen KI-Bilder und kein Live-Release) wurden die Körperkonturen in einem getrennten 3D-Sculpt-Experiment überarbeitet. Dabei wurden Kopf und Kufi gemeinsam skaliert, die hervorstehenden Augen abgeflacht, die Ärmel verschlankt, der Gewandübergang zusammenhängend modelliert und die Kufi-Punkte durch echte geometrierte Ornamentlinien ersetzt. **Es wurde keine mehrseitige Bildprojektion wie beim fehlerhaften V3-Modell verwendet.**

Für den frontal bestätigten Originaljungen wurden **näherungsweise** anhand der Quellabbildung folgende Proportionen als internes Qualitätsziel ermittelt: Kopfhöhe/Gesamthöhe ≈0,395 ±0,035; Kopfbreite/Gesamthöhe ≈0,375 ±0,040. Diese zwei Zahlen sind ein **einfacher Grobfilter**, keine Garantie für Charakterähnlichkeit.

| Interner Kandidat | Kopfhöhe/Total | Kopfbreite/Total | Gemessene Proportionen | Originaltreue |
|---|---:|---:|---|---|
| V4 | 0,3032 | 0,3460 | **Nicht bestanden** | **Abgelehnt** |
| V5.1 (nur intern) | 0,3514 | 0,3882 | **Nicht bestanden** | **Abgelehnt** |
| V5.2 (nur intern) | 0,3886 | 0,3661 | Zwei grobe Messwerte **bestanden** | **Abgelehnt – Gesicht, Haare, Stoff nicht originalgetreu** |

Die interne V5.2 enthält weiterhin ein GLB-2.0-Skelett mit 19 Gelenken, die technischen Clips Qiyām/Takbīr und keine animierten Skalenveränderungen. **Sie wurde absichtlich nicht als neues „fertiges V5“ in die App oder auf ein Live-Testsystem hochgeladen, weil die Sichtprüfung gescheitert ist.** Die isolierten Versuchsdaten liegen nur in der Arbeitssitzung.

## Projektänderungen – robustes Freigabeverfahren

- `rigging/qa-original-proportions.py`: Grobabgleich des GLB gegen die zwei ursprünglichen Kopf-/Körperrelationen. Meldet ausdrücklich immer `production_approved=false`, selbst bei bestandenem Zahlenvergleich.
- `rigging/original-boy-identity-lock-v1.json`: verlangt zusätzlich einen **zuvor vom Benutzer visuell abgenommenen, eindeutig per SHA-256 markierten GLB**, vollständige Prüfansichten und ein eigenes Freigabeprotokoll.
- `rigging/forbid-placeholder-release.cjs`: prüft **tatsächliche unveränderliche Datei-Bytes**, fünf Ansichten, Datum, Prüf-ID, originale Modellidentität und bestehende 3D-Skelettregeln. Nicht einfach durch Setzen von `productionReady=true` zu umgehen.
- Acht **hypothetische Freigabefälle** getestet: nicht freigegebener Entwurf, gefälschte Checkboxen, geänderter Hash, abweichende Dateilänge, fehlende Seitenansicht, kaputtes Rig und Draft-Generatoren wurden erfolgreich blockiert; nur hypothetisch vollständig korrektes Test-Review besteht.

## Warum die tatsächliche Fertigstellung derzeit aussteht

Die verfügbare Session hat weder Blender/3D-Sculpting-Desktop noch lokale 3D-Rekonstruktions-GPU oder einen mit ChatGPT verbundenen Provider, der aus den Originalen ein überprüfbares, originalgetreues **skinnbares GLB** erzeugt. Adobe-/Runway-Bild-/Videogenerierung ersetzt keine professionelle echte 3D-Skulptur. Weitere parametrische Ersatzfiguren oder Visual-Hull-Bildprojektionen sind kein verantwortlicher Ersatz: Sie wurden ausprobiert und blieben optisch sichtbar falsch.

**Benötigter konkreter Produktionsschritt:** Die originale Figur aus den fünf bestätigten Ansichten mit einem echten Sculpting-/Rigging-Verfahren modellieren und texturieren; Vorder-, beide Seiten, Rückseite und 45°-Ansicht individuell gegen das Original prüfen. **Erst nach diesem erfolgreichen visuellen Vergleich** Hände/Schulterbeugung, Rukūʿ und Suǧūd als riggte Clips entwickeln. Bis dahin bleiben `productionReady=false` und `approvedToAnimate=false`.

## Sicherheit und Reichweite

- Keine Änderung an `main`/Live-Kids-App, keine neue Kapsel oder Tab, keine fremden Module.
- Keine weiteren KI-Bildgenerierungen, kein neuer bezahlter 3D-Service.
- Kein neues nicht freigegebenes GLB als angeblich fertige Originalfigur geliefert.
- Die fünf ursprünglichen Referenzen und die zuvor bestätigten Gebetsstellungen bleiben gültig.
