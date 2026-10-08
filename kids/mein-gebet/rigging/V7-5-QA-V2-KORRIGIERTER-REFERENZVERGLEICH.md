# Fünf-Ansichten-QA v2 – KORRIGIERTER PRÜFSTAND (08.10.2026)

**Status: Modell NICHT freigegeben. Die früheren Freigabeinterpretationen in V7.4/V7.5 sind überholt. Keine Änderung an Live oder main.**

## Kritisch behobene Fehler

1. Die Originaltafel mit fünf Jungen wurde bisher in fünf **gleich breite Streifen** geteilt, obwohl die Figuren verschiedene Breiten haben. Insbesondere das Dreiviertelgewand war rechts abgeschnitten. Stattdessen beruhen die fünf unveränderlichen Ausschnitte auf den realen Trennspalten der bestätigten Originaldatei: **x=0,318,611,874,1173,1448**.
2. Eine einzige Weiß-auf-Weiß-Hintergrundschwelle versagte bei den hellen Gewändern. Der neue Test nutzt unveränderte OpenCV-GrabCut-Segmentierung mit **drei vorab festgelegten Startwerten (10/12/15)**. Die Übereinstimmung der daraus resultierenden Referenzmasken beträgt je Ansicht **mindestens 96,9 %** (strengster Referenzpaarvergleich). Unsichere Masken erhalten niemals automatisch eine Freigabe.
3. Die illustrierte Dreiviertelansicht ist **nicht physisch als 45°-Aufnahme kalibriert**; ein 45°-Vergleich ist deshalb diagnostisch und kein fachgerechter 3D-Kameraabnahmetest. Eine unverbindliche Winkelprüfung ergab bei etwa 15–20° höhere Übereinstimmungen als bei 45°. Diese Werte wurden **nicht** zur Modellfreigabe oder zum künstlichen Erreichen von 90 % verwendet.

Originaldatei durch SHA-256 gesperrt: `062b8555e861c680b1049ab6a3bee0212caa51cda5168a6b33a76be01aa987b9`.

## Erneuter unabhängiger Vergleich – gleiche korrigierte Messgrundlage

Fünf echte räumliche GLB-Kamerawinkel (0°, 45° nominal, 90°, 180°, 270°), alle fünf Original-Silhouetten getrennt. Verwendet **Minimum** der drei festen GrabCut-Startwerte.

| Perspektive | V7.4 Umriss-IoU | V7.5 Umriss-IoU | Delta |
|---|---:|---:|---:|
| Front | **0,88130** | **0,88704** | +0,00574 |
| 3/4, **45° unkalibriert** | **0,82724** | **0,82635** | **−0,00089 (Regression)** |
| Rechts | **0,87148** | **0,87148** | 0 |
| Rücken, echte 180°-Geometrie | **0,87897** | **0,88171** | +0,00274 |
| Links, eigene 270°-Geometrie | **0,86462** | **0,86462** | 0 |

**Alle fünf Perspektiven liegen unter 0,90. Keine genügt dem Ziel. Das frühere „V7.5 hat nirgends verschlechtert“ war aufgrund des alten Referenzfehlers falsch.**

Das Ergebnis misst ausschließlich den silhouettebasierenden Formvergleich, **nicht** identische Charaktergesichter oder eine real kalibrierte Kamera. Sichtkontrolle von Augen/Kufi/Haar/Gewand weiterhin NICHT bestanden. Animationsclips Rukūʿ und Suǧūd, iPad-WebGL-Test und religiöse Prüfung weiterhin offen.

## Dauerhafte Regressionstests, offline reproduzierbar

Als **Chat-Anhang** steht das Paket `Mein_Gebet_QA_V2_5Ansichten_Streng_Nicht_Freigegeben.zip` bereit, mit:
- `qa_original_fiveview_v2.py`: eigenständiger GLB- und 5-Originalansichten-Checker, ausschließlich bestehende Dateien, keine Bildgenerierung, keine externen KI-Dienste;
- `test_original_fiveview_v2.py`: **23/23 bestanden** (feste Trennspalten, unveränderte Ausgangsdatei/SHA-256, drei Segmentierungen pro Ansicht, getrennte GLB-Ansichten inkl. echtem Rücken, Fälschungs-/Defekt-Fail-Close und explizit gesperrte Freigabeflags);
- `v74_report.json` und `v75_report.json`: maschinenlesbare Bestandsaufnahmen; README.
- ZIP-Inhalt durch Archiv-CRC/Entpacktest bestätigt.

**Die Tests des Prüfverfahrens bestehen – das Modell nicht.** Die GLB-Skelettfunktion von V7.5 bleibt separat technisch gültig (19 Knochen, Qiyām/Takbīr, keine SCALE-Animation), ist aber kein religiös/visuell/iPad-geprüftes Produktionsmodell.

## Nächster verantwortlicher Schritt

Vor einer weiteren 3D-Geometriekorrektur die **Original-Kameraperspektiven modellieren oder verbindliche Referenz-Kamera- und Poseparameter bestimmen**; andernfalls würde die unkalibrierte 3/4-Tafel die Modellform in die falsche Richtung verzerren. Dann Schulter/Gewand/Profil in einem einzigen 3D-Mesh **unter realen 5-Ansichten-Nicht-Regressionsprüfungen** anpassen. Die bestehenden SHA-256- und visuellen Freigabesperren bleiben unverändert.

**Keine neuen Bilder, kein Modell als 90-%-Erfolg ausgegeben, kein Cloudflare-/Live-Push, keine KI-Credits.**