> **KORRIGENDUM (08.10.2026): Dieser ältere V7.5-Bericht enthält eine inzwischen widerlegte Aussage zur Nicht-Regression.** Die ursprünglichen gleich breiten Referenzausschnitte haben insbesondere den Dreiviertel-Umriss abgeschnitten. Der korrigierte, unabhängig stabilisierte QA-v2-Test ergibt **V7.4 = 0,82724** und **V7.5 = 0,82635** für 3/4; V7.5 verschlechtert diese Perspektive also leicht (**−0,00089**). Die übrigen korrigierten Werte und der neue fail-closed Test stehen in [V7-5-QA-V2-KORRIGIERTER-REFERENZVERGLEICH.md](V7-5-QA-V2-KORRIGIERTER-REFERENZVERGLEICH.md). **Dieser ältere Bericht darf nicht als 5/5- oder No-Regression-Freigabenachweis verwendet werden.**

# Modell V7.5 – echte Schulter-/Ärmel-Geometriekorrektur und Fünf-Blickwinkel-Regression (08.10.2026)

**Entscheidung:** V7.5 ist ein **technischer, ungeprüfter Charakter-Kandidat**; **keine App-Freigabe**. Diese Fassung wurde aus dem tatsächlichen V7.4-GLB als 3D-Vertex-Korrektur abgeleitet, **nicht** aus neuer KI-Bildgenerierung oder visueller Projektion. Die unveränderten, vom Nutzer bestätigten Originalansichten sind der Prüfmaßstab.

## Durchgeführte Änderungen
- Nur gezielte, glatte geometrische Verschmälerung des oberen Schulter-/Ärmelkonturbereichs (maximale Korrektur der außenliegenden Ärmel, keine globale Körper-Skalierung), sowie ein sehr kleiner Kopfansatz-Offset von `-0.003` Modelleinh. Das ursprüngliche Gesicht wurde **nicht** als originalgetreu abgenommen. Die 3D-Vertexnormalen wurden für die geänderten Dreiecke neu berechnet.
- **19 originalgetreue Rig-Knotennamen und exakt gleiche Hierarchie/Bindpose**, keine geänderten Skin-Weights, zwei unveränderte Clips `Qiyam` und `Takbir`, keine `scale`-Animkanäle; Ober-/Unterarmlänge bleibt erhalten.
- Tatsächliche GLB-Datei im aktuellen Chat-Arbeitspaket (nicht als Repo-/Live-Asset): `mein_gebet_junge_v75_geometry_qa_only.glb`. SHA-256: `70a7199a1e0299d44026c92176e895ddbaf2e1bdfe34e35fea0626c7202eb540`. Ausgangs-GLB V7.4 SHA-256: `7b4db7e684144ec23c63f8ad63e5a055e66fc871adf2757be62adf2699c41490`.

## Vergleich unter UNVERÄNDERTEM Fünf-Ansichten-Filter

Originalreferenz: `3d_charakterturnaround_eines_jungen_im_thawb.png`; fünf **unabhängige** räumliche Winkel 0°, nominal 45°, 90°, 180°, 270°, jeweils drei feste Hintergrundschwellen 7/9/12, strengster IoU pro Perspektive. Kopfbereich separat als Non-Regression. Diese Werte sind **reine Silhouetten-IoU**, keine Aussage über religiöse Gebetsrichtigkeit oder die Ähnlichkeit der Augen/Gesichter.

| Perspektive | V7.4 | V7.5 | Delta | Aktueller Status |
|---|---:|---:|---:|---|
| Frontal | 0,8445 | **0,8519** | **+0,0074** | Konturfilter PASS |
| 3/4 nominal 45° | 0,7387 | **0,7395** | +0,0008 | **FAIL** |
| Rechts 90° | 0,7572 | 0,7572 | 0,0000 | **FAIL; instabile Weiß-auf-Weiß-Maskierung** |
| Rücken 180° | 0,8493 | **0,8513** | +0,0020 | Konturfilter PASS |
| Links 270° | 0,8242 | 0,8242 | 0,0000 | **FAIL; instabile Weiß-auf-Weiß-Maskierung** |

**Strenges Urteil: 2/5 bestanden, KEINE Produktions-/Gestaltungsfreigabe.** Kopfregion-IoU wurde an allen fünf Referenzen **nicht verschlechtert**. 3/4 ist durch unkalibrierte stilisierte Originalkamera geometrisch nicht genau 45°; darf **nicht** auf einen günstig gewählten Winkel umgestellt und als bestanden ausgegeben werden. Die Seitenmasken sind farbbedingt instabil; dies darf **nicht** durch beliebige Toleranzänderungen verdeckt werden.

## Technische Tests
- **21/21 automatisierte V7.5-Nicht-Regressionschecks** bestanden, einschließlich der unveränderten Quellhashes, Winkel, Segmentierungsschwellen, fünf Ganzkörper- und fünf Kopf-Konturen sowie der hart gesperrten Publikationsflags.
- **16/16 Fünf-Winkel-QA-Regressionstests** bestanden (das **Prüfverfahren**, ausdrücklich **nicht** die Kinderfigur).
- GLB-/Rig-/Animationsstrukturprüfung PASS: 19 Knochen, 60.996 Vertices, 118.800 Dreiecke, 19 Materialgruppen, `Qiyam`, `Takbir`, normalisierte Skin-Gewichte, keine verlängerten Armsegmente, GLB-/trimesh-Import.
- Code, Ursprung-GLB, korrigierte GLB, Originalreferenz, reproduzierbares Prüfskript und die beiden JSON-Audits sind im separaten **Chat-Entwicklungspaket** verfügbar. Es gibt **keine neue 2D-Bildgenerierung**.

## Nicht bestanden / harter Blocker
Gesicht, Augen, individuelle Haarbüschel und feines Kufi-Ornament sind **nicht** als Original geprüft; die Dreiviertelkontur ist klar zu schwach. Die Seitenansichten müssen mit zuverlässigerer Referenzfreistellung und echter 3D-Sichtprüfung gesondert beurteilt werden. Rukūʿ und Suǧūd als Clips, Mädchenmodell, 360°-iPad-/iPhone-Laufzeittest und Produktionsintegration fehlen. **Ein GLB-Struktur-PASS ist keine Charakter- oder Fiqh-Freigabe.**

Aktive Sperren: `original-boy-identity-lock-v1.json`, SHA-256-/Fünf-Ansichten-Release-Gate, alle echten Genehmigungsflags `false`. **Kein Merge, kein Live-Push, keine neuen Bildgenerationen/Credits und keine Änderungen außerhalb KIDS / Mein Gebet.**
