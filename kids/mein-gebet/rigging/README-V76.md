# DĀR AL TAWḤĪD KIDS — Jungenfigur V7.6 (NUR INTERN, NICHT FREIGEGEBEN)

Datum: 08.10.2026. **Keine neuen Bilder erzeugt, keine KI-Credits verwendet und kein Live-Push.**

## Fortschritt

V7.6 ist ein neues, echt geriggtes GLB, abgeleitet aus dem unveränderten Modell V7.4. Die Geometrie wurde ausschließlich an einer begrenzten Schulter-/Ärmelkontur sowie minimal am Kopfansatz korrigiert. Kein neues Gesicht erfunden, keine Projektions-Texturen, keine veränderten Knochen oder Animationen. V7.5 enthält eine unerwünschte Regression und wird nicht als neue Ausgangsbasis übernommen.

## Erster nachweisbarer Fortschritt ohne gemessene Kontur-Regression

Diese Werte gelten für die deterministisch gesäte OpenCV-Freistellung der ORIGINALEN fünf Ansichten, mit fest gepinnter Bilddatei und vollständig neu berechneten GLB-Silhouetten. **Sie zeigen nur Kontur-Übereinstimmung, nicht Gesichtsidentität.**

| Richtung | V7.4 | V7.6 | Delta |
|---|---:|---:|---:|
| Vorne | 88,236 % | **88,969 %** | +0,733 %-Punkte |
| 3/4 (Kamera nicht kalibriert) | 82,962 % | **82,996 %** | +0,034 %-Punkte |
| Rechts | 87,254 % | **87,254 %** | ±0 |
| Hinten | 87,901 % | **88,296 %** | +0,395 %-Punkte |
| Links | 86,489 % | **86,489 %** | ±0 |

**0/5 Ansichten erreichen 90 %.** Die für die illustrierte Dreiviertelansicht verwendete Kamera ist **nicht kalibriert**; auch ein numerischer Score >90 % wäre keine finale geometrische Freigabe. Das Gesicht/Haar/Kufi ist optisch weiterhin **NICHT freigegeben**.

## Reproduzierbar ausführen

Voraussetzung: Python 3.11+, numpy, scipy, trimesh, opencv-python.

```sh
python build_v76_candidate.py
python validate_v76.py
python test_v76_structure.py
python test_compare_original_fiveview_v3.py
python compare_original_fiveview_v3.py mein_gebet_junge_v74_sculpt_internal.glb mein_gebet_junge_v76_geometry_qa_only.glb 3d_charakterturnaround_eines_jungen_im_thawb.png --json V76_STRICT_COMPARE.json
```

Alle Werkzeuge arbeiten lokal; keine Netzwerkanfragen, keine neuen Bilder. Die Modelldatei ist eigenständig, der Regres­sions­vergleich benötigt die mitgelieferte **bestehende** Originaltafel. Die Repo-Sicherheitsprüfungen erfordern zusätzlich eine spätere ausdrückliche individuelle Originalitätsabnahme aller fünf Ansichten plus GLB-SHA-256.

## Arbeitsgrenzen

- **Kein fertiger Gebetstrainer**: nur `Qiyam` und `Takbir` als technisch vorhandene Clips.
- **Kein Rukūʿ/Suǧūd**, weder 3D-fertig animiert noch nach allen 3D-Kontaktpunkten geprüft.
- **Kein fertiges Jungen- oder Mädchen-Produktionsmodell**.
- **Kein verifizierter iPad-/Safari-Viewer oder Staging-/Live-Deploy**.
- Gesicht, Kufi-Muster, Haarsträhnen, Stoffform: noch nicht visuell abgenommen.
- Die bestätigten hanbalitischen/quellenbezogenen Soll-Regeln bleiben unverändert und gelten auch für spätere Animationen.

V7.6-GLB SHA-256: `14d803f8c0dfc7a57a566bcd50f12b895ee4bea3008fb660f0d97dc2e62e2e2a`.
## Zusätzliche direkte Gegenprüfung V7.5 → V7.6 (19:21 Uhr)

Die erneute Laufzeitberechnung hat V7.6 nicht nur gegen V7.4, sondern ausdrücklich gegen **V7.5** geprüft (identische Originaldatei, gleiches OpenCV-v3-Verfahren, exakt dieselben fünf GLB-Projektionen). Die GLB-Binärdateien beider Kandidaten wurden tatsächlich eingelesen.

| Blickwinkel | Delta V7.6 gegenüber V7.5 |
|---|---:|
| Vorne | +0,00095 |
| Dreiviertel, unkalibriert | +0,00119 |
| Rechts | 0,00000 |
| Hinten | +0,00120 |
| Links | 0,00000 |

**Keine Kontur- oder Kopfverschlechterung**, aber auch **kein Einzelgewinn ≥0,002**. Darum meldet der strenge `compare_original_fiveview_v3.py` bei genau diesem Paar **`geometry_progress_accepted=false`**, obwohl alle Werte nichtnegativ sind. Die offizielle Qualitätsbeurteilung bleibt: **V7.6 gegenüber V7.4 messbar besser, gegenüber V7.5 kein materieller Einzelgewinn**. Keine einzige Ansicht erfüllt 90 %, und die Dreiviertel-Referenzkamera ist nicht physisch kalibriert. Diese Klarstellung verhindert, dass kleine Verbesserungen als großer Durchbruch ausgegeben werden.

Auch ein einwandfreier GLB-Strukturtest bestätigt nicht die optische Originaltreue oder Korrektheit der Gebetsabläufe. V7.6 ist **nicht** für Produktion, die Kids-App oder die Weitergabe als fertige Originalfigur freigegeben.
