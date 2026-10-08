# DĀR AL TAWḤĪD KIDS — unabhängige Original-Fünf-Ansichten-QA v2

Status: intern, nicht freigegeben. Keine neuen Bilder erzeugt. Keine Änderung an Live-Kids.

## Problem und Korrektur
1. Fünf Originalfiguren stehen im Turnaround nicht exakt innerhalb gleich breiter Fünftel. Der alte Test beschnitt besonders das Dreiviertel-Gewand. Auf der geprüften Originaldatei fest eingefrorene Trennspalten: x=318,611,874,1173.
2. Weiße Kleidung auf weißem Hintergrund war abhängig von einer einzigen Helligkeitsschwelle. Der neue Test arbeitet mit OpenCV GrabCut und drei vorab festgelegten Startschwellen (10/12/15). Alle fünf referenzierten Formen erreichen mindestens 96 % Übereinstimmung zwischen drei resultierenden Segmentierungen. Bei Instabilität kein PASS.
3. Die Original-Dreiviertelansicht ist nicht physisch auf eine 45-Grad-Kamera kalibriert. Der Test nutzt 45 Grad zunächst ausdrücklich nur als Diagnose, nicht als endgültig abnahmefähige Referenz.
4. GLB kommt stets aus eigener 3D-Geometrie, Referenz ausschließlich aus vorhandenen Nutzerbildern; keine 2D-Poster-zu-3D-Scheinrekonstruktion.

## Messergebnisse
Mit festem Input-Vergleich GLB V7.4 vs V7.5, schlechteste Umriss-IoU der drei Startschwellen:

| Perspektive | V7.4 | V7.5 | Delta |
|---|---:|---:|---:|
| Vorne | 0.88130 | 0.88704 | +0.00574 |
| Dreiviertel, Winkel UNKALIBRIERT | 0.82724 | 0.82635 | -0.00089 |
| Rechts | 0.87148 | 0.87148 | 0 |
| Hinten | 0.87897 | 0.88171 | +0.00274 |
| Links | 0.86462 | 0.86462 | 0 |

**0/5 erreichen 90 %. V7.5 verschlechtert die Dreiviertelkontur geringfügig. Nicht als vollständig regressionsfreie Fassung bezeichnen.**

## Ausführen

Python 3.11+, `numpy`, `opencv-python`:

```
python qa_original_fiveview_v2.py /pfad/zu/v75.glb /pfad/zu/3d_charakterturnaround_eines_jungen_im_thawb.png --json /tmp/qa-v75.json
python test_original_fiveview_v2.py
```

Hinweis: Der QA-Checker gibt bewusst Exitcode 1, wenn die 90-%-Hürde nicht bestanden ist. `test_original_fiveview_v2.py` soll dagegen Exitcode 0 liefern, wenn alle Sicherheitsprüfungen bestehen.

* Prozentwerte betreffen nur **Silhouettenüberlappung**, nicht Charakterähnlichkeit, die Augen, den Bart (keiner), Haarstruktur, 3D-Animation, religiöse Belege oder iPad-Viewer.
* Es ist kein Modell mit 90 % bestätigt und keine fertige originale 3D-Figur erstellt.
* Die Bildvorlagen sind KI-illustriert und nicht zwingend physisch konsistente Aufnahmen eines echten einzigen 3D-Modells.