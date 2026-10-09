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

`validate-glb.test.cjs` enthält zusätzliche synthetische Negativ-/Positivtests. Zusätzlich zur isoliert geprüften 13/13-Schutzlogik wurde nun **die tatsächliche aktualisierte GitHub-JavaScript-Datei** zusammen mit der zugehörigen Testsuite in einer abgeschotteten V8-Testumgebung mit nachgebildeten Node-Basisfunktionen ausgeführt: **29/29 PASS**. Das ersetzt weder eine GitHub-Actions-/Node-Dateisystemprüfung noch einen Validatorlauf mit dem echten V7.7-GLB; beide bleiben offen. Es wurde kein Animationclip verändert. Die Sperre ist vorsorglich aktiv, nicht eine Freigabe für Gebetsanimationen.

## 4. Nächste Modellierung nach Ermittlung der Winkel-Sensitivität

1. Kamera-/Orientierungsunsicherheit von der tatsächlich falschen Geometrie trennen. Keine Kontur allein für eine günstigere 3/4-Ansicht verbiegen.
2. Originalgesicht, Kufi, Haare, Augen, Gewandsäume und Stoffübergänge **direkt am 3D-Mesh** bearbeiten und fünf Richtungen mit unveränderlichen Quellen kontrollieren.
3. Jeden Kandidaten gegenüber V7.7 mit demselben Messverfahren und festen Perspektiven auf Kopf- und Körperregressionen testen. Alle Blickrichtungen müssen die Grenze getrennt bestehen; menschliche Originaltreue-Prüfung bleibt zusätzlich zwingend.
4. Danach erst Rukūʿ (waagerechter Rücken, korrekte Proportionen) und Suǧūd (Stirn und leicht Nase, nie Mund/Lippen/Kinn) als animierte Posen bearbeiten. Für das Mädchenprofil ein **separates** geprüftes riggtes Modell mit vollständig bedecktem Haar/Hals schaffen.
5. Reale iPad- und iPhone-WebGL-/Touch-Prüfung und ausdrückliche Nutzerfreigabe vor jeder Veröffentlichung.

**Freigabe: NEIN. Merge, Live-Deploy, kostenpflichtige KI-Generierung: NEIN.**

## 5. Zusätzlicher Schutz des nächsten Sculpt-Kandidaten und vollständiger Release-Audit (09.10.)

- `verify-animation-rig-freeze.cjs`: Vergleicht die **exakte, SHA-256-gepinnte V7.7-Basis** mit einem späteren tatsächlich vorhandenen GLB. Erfasst Knochen-/Bindpose-Struktur, Rohdaten der Qiyām-/Takbīr-Animationssampler und Skinning-JOINTS-/WEIGHTS-Zuordnungen getrennt. **POSITION-only**-Geometrieänderungen sind bewusst zulässig, Änderungen an Skelett, Skin oder Clips werden als Regression gemeldet.
- `test-animation-rig-freeze.cjs`: 12 synthetische Abwehr- und Zulassungstests in isolierter V8-Umgebung bestanden; dort wurden Buffer/SHA-Funktionen nachgebildet, daher **noch kein Node.js-Dateisystem- oder echter SHA-256-/V7.7-Test**.
- `audit-project-completion.cjs`: Der reine JSON-Audit liefert niemals `ready=true`. Erst `--require-ready` mit **beiden** tatsächlichen, unabhängig geprüften Jungen- und Mädchen-GLBs erlaubt überhaupt eine technische Bereit-Prüfung; jeweils exakte SHA-256-Dateibytes und Größe gegen das menschlich bestätigte Manifest werden geprüft. Die erforderliche menschliche Sicht- und fachliche Freigabe bleibt separat bestehen.
- `test-audit-project-completion.cjs`: 18 negativ/positiv ausgerichtete Status-/CLI-Tests bestanden in isolierter V8-Umgebung mit simuliertem Dateizugriff. Kein echter GLB der beiden Profile wurde überprüft.

**Befehle, sobald die echten Dateien in einer lokalen Node.js-Umgebung vorliegen:**

```bash
node kids/mein-gebet/rigging/validate-glb.test.cjs
node kids/mein-gebet/rigging/test-audit-project-completion.cjs
node kids/mein-gebet/rigging/test-animation-rig-freeze.cjs
node kids/mein-gebet/rigging/verify-animation-rig-freeze.cjs /PFAD/V77.glb /PFAD/KANDIDAT.glb
node kids/mein-gebet/rigging/audit-project-completion.cjs --require-ready --boy-glb=/PFAD/BOY.glb --girl-glb=/PFAD/GIRL.glb
```

**Erwartetes aktuelles Ergebnis:** Die synthetischen Unit-Tests können erfolgreich sein; die echten Modell-, Kamera- und Freigabeprüfungen müssen **BLOCKED / nicht bestanden** melden, bis die exakt gehashten Originaldaten und die Einzelprüfungen existieren. Kein automatischer Merge/Deploy, keine falsche 90%-Behauptung.

Zusätzlicher adversarialer Test: Selbst ein hypothetisch auf vollständig grün gefälschter Metadatensatz kann im reinen Audit niemals `ready=true` erzeugen. **Nur** die strenge CLI mit tatsächlichen, unabhängigen und hashgebundenen GLB-Dateien kann die finale technische Bereitprüfung überhaupt auslösen. Test mit manipuliertem JSON: bestanden. Kein echter Modell- oder iPad-Test ersetzt.
