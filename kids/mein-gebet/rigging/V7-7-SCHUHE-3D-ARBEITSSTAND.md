# DĀR AL TAWḤĪD KIDS · 3D-Modell V7.7 — interne Prüffassung

**Nicht freigegeben, nicht in der Kids-App, kein Live-Push.** Die enthaltenen Originalansichten stammen aus dem bisherigen, vom Nutzer bestätigten Vorlagenbestand; es wurden keine neuen Bilder erzeugt.

## Was gegenüber V7.6 neu ist

Nur die **3D-Schuhgeometrie** wurde leicht breiter und tiefer modelliert, um die bereits gemessene zu kleine Schuhkontur zu korrigieren. Die drei Schichten Rig/Skin/Animation sind inhaltlich unverändert; Knie- und Beinlängen bleiben unverändert. Der Kopf, das Gesicht, die Kufi und das Gewand wurden NICHT nachmodelliert und sind noch nicht originalgetreu abgenommen.

Vergleich am echten GLB gegen die bestehende Original-Fünf-Ansichten-Tafel mit genau dem gleichen v3-Verfahren (feste Referenz und GrabCut-Startwerte):

| Blickrichtung | V7.6 | V7.7 | Änderung |
|---|---:|---:|---:|
| Frontal | 88,969 % | **89,663 %** | +0,694 %-Pkt. |
| 3/4 nominal 45°, real unkalibriert | 82,996 % | **83,245 %** | +0,249 %-Pkt. |
| Rechts 90° | 87,254 % | **87,264 %** | +0,010 %-Pkt. |
| Hinten 180° | 88,296 % | **88,963 %** | +0,667 %-Pkt. |
| Links 270° | 86,489 % | **86,511 %** | +0,022 %-Pkt. |

Dies sind **Silhouetten-Überlappungen (IoU)**, keine Prozentangaben für identisches Gesicht, Animationen oder islamrechtliche Korrektheit. Ein Körpervergleich kann nicht die exakte Originalität eines Gesichts/Kufi/Haare belegen. **0/5** Perspektiven erreichen die geforderten 90 %, insbesondere die unkalibrierte Dreiviertelansicht ist weiterhin schwach. Deshalb keine Nutzerfreigabe.

## Tatsächliche, reproduzierbare Tests

Mit Python 3.11+, NumPy, SciPy, trimesh und OpenCV in diesem Ordner:

```bash
python build_v77_shoe_geometry.py
python validate_v77.py
python test_v77_isolation.py
python test_compare_original_fiveview_v3.py
python compare_original_fiveview_v3.py mein_gebet_junge_v76_geometry_qa_only.glb mein_gebet_junge_v77_schuhe_geometry_nicht_freigegeben.glb 3d_charakterturnaround_eines_jungen_im_thawb.png --json V77_VS_V76_AUDIT.json
```

- Originalmodell V7.6 SHA-256: `14d803f8c0dfc7a57a566bcd50f12b895ee4bea3008fb660f0d97dc2e62e2e2a`
- Neues V7.7-GLB SHA-256: `353b028862f91922d6288cf6ede09d5c8150815657c66c9c116b7775311c07fa`
- Originalbild SHA-256: `062b8555e861c680b1049ab6a3bee0212caa51cda5168a6b33a76be01aa987b9`

Prüfen: 19 Skin-Joints, 19 Materialgruppen, 60.996 Eckpunkte, 118.800 Dreiecke, Clips Qiyām/Takbīr, keine `scale`-Animation; **einzig** die 2.568 Schuh-Vertices und ihre Vertexnormalen verändern sich, alle anderen Modellteile/Gelenke und alle anderen Animationsbytes bleiben unverändert. Die Höhe der Schuh-Vertices wurde nicht verändert.

**Offen:** Echte 3D-Abnahme aller fünf originalen Perspektiven, Gesicht, Haare, Kufi, weiche Stoffmodellierung, Rukūʿ-/Suǧūd-Gebetsbewegung samt Stirn-/Nasenkontakt und ohne Lippenkontakt, Mädchenprofil, native iPad/WebGL-Vorschau. Kein Release ohne menschliche Freigabe und vorhandene GitHub-Release-Sperre.