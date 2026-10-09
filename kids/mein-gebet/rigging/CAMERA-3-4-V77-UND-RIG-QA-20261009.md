# KIDS · Mein Gebet — Dreiviertel- und Rig-Prüfstand (09.10.2026)

**Nur Draft-PR #825. Keine Freigabe, keine Änderung an der Live-Kinder-App, kein neues Bild und kein neues GLB.**

## 1. Eingefrorener geometrischer Basisstand

- Kandidat: Jungenfigur **V7.7**, Modell-SHA-256 `353b028862f91922d6288cf6ede09d5c8150815657c66c9c116b7775311c07fa`.
- Referenzbild: Original-Turnaround-SHA-256 `062b8555e861c680b1049ab6a3bee0212caa51cda5168a6b33a76be01aa987b9`.
- Aktuelle feste Fünf-Blick-IoU: vorne 89,663 %, 3/4 nominal 45° **83,245 %**, rechts 87,264 %, hinten 88,963 %, links 86,511 %. **0/5 über 90 %.**
- Nur Umrissmessung, keine Identitäts-, Gesichts- oder Gebetskorrektheitsbestätigung.

## 2. Winkelprüfung statt erfundener Kalibrierung

`three_quarter_camera_diagnostic.py` prüft am **unveränderten** GLB V7.7 mit der **unveränderten** Originaltafel die Projektion bei 5° bis 85° in 5°-Schritten. Für jeden Winkel werden getrennt (a) Körperkontur und (b) Kopfregion jeweils gegen das **schlechteste** der drei stabilen Referenzmaskenergebnisse gemessen. Bestwinkel für Körper und Kopf werden **getrennt** dokumentiert.

Ein höherer IoU-Wert bei einem anderen Winkel **beweist NICHT** die echte physikalische Kamerapose einer Illustration. Das diagnostische Maximum ersetzt **niemals** die eingefrorene 45°-V7.7-Basis oder die Freigabemetrik und darf die Zielschwelle von 90 % nicht künstlich erfüllen. Physikalische Kamerakalibrierung und Gesichtsvergleich bleiben offen.

Reproduktion, wenn die im Chat/Library dokumentierten, derzeit nicht als Repository-Binärdateien verfügbaren Original-Dateien lokal vorhanden sind:

```bash
cd kids/mein-gebet/rigging
python test_three_quarter_camera_diagnostic.py
python three_quarter_camera_diagnostic.py \
  /PFAD/mein_gebet_junge_v77_schuhe_geometry_nicht_freigegeben.glb \
  /PFAD/3d_charakterturnaround_eines_jungen_im_thawb.png \
  --json /PFAD/V77_CAMERA_ANGLE_DIAGNOSTIC.json
```

Die zwei SHA-256-Werte werden vor der Bildmessung erzwungen; kein Vergleich mit falschen GLB-/Originaldateien. Der Sweep wurde hier **nicht mit den echten Modellbytes ausgeführt**, da die Archivdatei bei der Dateimaterialisierung keinen autorisierten Rohdateipfad bereitstellte. Die sieben isolierten Python-Unit-Tests für Winkelwahl/ungültige Daten wurden lokal erfolgreich ausgeführt; diese Tests sind **keine** GLB-Messung.

## 3. Geschlossene Rig-Validator-Lücke

`validate-glb.cjs` blockiert jetzt Translationen aller Nicht-Wurzel-Skin-Joints (über sämtliche Skins) sowie Animationen innerer Nicht-Joint-Zwischenknoten, wenn sie zwischen zwei Skin-Joints liegen. Nur die echte eindeutige `Hips`-Wurzel darf als Skin-Joint übersetzt werden; gewöhnliche, nicht zum Skin gehörige Objekte sowie ein äußerer Elternknoten des vollständigen Rigs dürfen sich verschieben. Skalierung bleibt verboten.

`validate-glb.test.cjs` enthält zusätzliche synthetische Negativ-/Positivtests. Die separat isolierte Nachbildung dieser Schutzlogik wurde lokal mit 13/13 Fällen geprüft; **eine erneute Ausführung der vollständigen, auf GitHub aktualisierten JavaScript-Suite sowie ein Validatorlauf am echten V7.7-GLB wurden noch nicht bestätigt**. Es wurde kein Animationclip verändert. Die Sperre ist vorsorglich aktiv, nicht eine Freigabe für Gebetsanimationen.

## 4. Nächste Modellierung nach Ermittlung der Winkel-Sensitivität

1. Kamera-/Orientierungsunsicherheit von der tatsächlich falschen Geometrie trennen. Keine Kontur allein für eine günstigere 3/4-Ansicht verbiegen.
2. Originalgesicht, Kufi, Haare, Augen, Gewandsäume und Stoffübergänge **direkt am 3D-Mesh** bearbeiten und fünf Richtungen mit unveränderlichen Quellen kontrollieren.
3. Jeden Kandidaten gegenüber V7.7 mit demselben Messverfahren und festen Perspektiven auf Kopf- und Körperregressionen testen. Alle Blickrichtungen müssen die Grenze getrennt bestehen; menschliche Originaltreue-Prüfung bleibt zusätzlich zwingend.
4. Danach erst Rukūʿ (waagerechter Rücken, korrekte Proportionen) und Suǧūd (Stirn und leicht Nase, nie Mund/Lippen/Kinn) als animierte Posen bearbeiten. Für das Mädchenprofil ein **separates** geprüftes riggtes Modell mit vollständig bedecktem Haar/Hals schaffen.
5. Reale iPad- und iPhone-WebGL-/Touch-Prüfung und ausdrückliche Nutzerfreigabe vor jeder Veröffentlichung.

**Freigabe: NEIN. Merge, Live-Deploy, kostenpflichtige KI-Generierung: NEIN.**
