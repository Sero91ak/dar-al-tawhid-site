# V7.4 – Fünf echte Perspektiven, strenge Korrektur des bisherigen Qualitätsberichts

**Stand:** 08.10.2026 · **Urteil: NICHT BESTANDEN · NICHT LIVE · Keine optische Freigabe**

## Gefundener Prüfungsfehler

Der bisherige V7.4-Bericht beanspruchte `front/side/back` mit etwa 87–88 % Umrissüberlappung als „alle Ansichten bestanden“. Das war kein vollständiger Fünf-Perspektiven-Test:

- Die damalige Rückansicht wurde aus einer **gespiegelten Front-Projektionsmaske** abgeleitet; nicht aus dem echten 180°-Blick des GLB.
- Die linke und die rechte Originalseite wurden **nicht unabhängig** gegen zwei reale Seitenprojektionen des GLB getestet.
- Die 3/4-Originalansicht wurde **nicht getestet**.
- Das cremeweiße Gewand vor fast weißem Hintergrund wird je nach Maskenschwelle unterschiedlich vom Hintergrund getrennt. Eine einzige günstige Schwelle darf kein Bestehen rechtfertigen.

Die neuen Zahlen ergänzen und **ersetzen die bisherige qualitative Freigabeinterpretation**. Frühere Prozentzahlen dürfen nicht als bestätigte 360°-Originaltreue wiederholt werden.

## Neuer realer Fünf-Ansichten-Test

Aus der **bereits vom Nutzer bestätigten** fünfteiligen Bildtafel `3d_charakterturnaround_eines_jungen_im_thawb.png` werden fünf verschiedene Originalansichten einzeln geschnitten. Das vorhandene echte V7.4-GLB wird unabhängig aus **0°, nominal 45°, 90°, 180°, 270°** orthografisch auf seine Silhouette untersucht. Zusätzlich: obere Kopfregion als eigener Umrisstest. Referenz-Freistellung jeweils mit **drei vordefinierten Schwellen** `7,9,12`; strengster IoU je Blickwinkel ist maßgeblich. Ergebnis instabil, wenn die Umriss-/Kopf-IoU um über 0,025 schwankt.

**Freigabevorfilter:** Ganzkörper-Umrissüberlappung mindestens `0.85` UND Kopfregion mindestens `0.80` **bei allen drei** Schwellen. Ansonsten kein PASS – selbst wenn frühere Versuche das Modell technisch erfolgreich validiert haben.

| Originalperspektive | Niedrigste Ganzkörper-IoU | Niedrigste Kopf-IoU | Freistellung instabil | Ergebnis |
|---|---:|---:|---|---|
| Front 0° | **0.8445** | 0.8642 | Nein | **FAIL** |
| 3/4, nominal 45° | **0.7387** | 0.8131 | Nein | **FAIL** |
| Rechts 90° | **0.7572** | 0.8450 | **Ja** | **FAIL** |
| Rücken 180° | **0.8493** | 0.8377 | Nein | **FAIL** |
| Links 270° | **0.8242** | 0.8156 | **Ja** | **FAIL** |

- **Alle fünf echten Perspektiven werden nun unabhängig geprüft; 0/5 sind mit dem robusteren Maßstab bestanden.**
- Die Schwellenwerte zeigen eine ernsthafte **Segmentierungsempfindlichkeit** bei beiden weißen Seitenansichten. Diese dürfen nicht als präzise bewertete 3D-Likeness-Prozentsätze ausgegeben werden.
- Der Winkel „3/4“ in einer KI-generierten 2D-Tafel muss **nicht** einer physisch kalibrierten 45°-Kamera entsprechen. Eine separate, ausdrücklich **nicht freigabewirksame** Messung über 0°–90° (5°-Schritte, einfache Schwelle 9) ergab maximal `0.8127` bei ca. 20° und `0.7583` bei 45°. Es wäre unredlich, den Winkel einfach nach dem jeweils besten Ergebnis umzudefinieren.
- Die optische Identität von Gesicht, Augen, Haaren, Nasenprofil und Kufi ist **nicht** durch Silhouetten-IoU belegbar. Dieser Bericht erteilt keinerlei optische/Fach-/iPad-Freigabe.

## Feste Nachweise und Regression

Geprüfte SHA-256:
- `mein_gebet_junge_v74_sculpt_internal.glb`: `7b4db7e684144ec23c63f8ad63e5a055e66fc871adf2757be62adf2699c41490`
- Original-Turnaround PNG: `062b8555e861c680b1049ab6a3bee0212caa51cda5168a6b33a76be01aa987b9`

Es wurden lokal eine **reproduzierbare reine Python/OpenCV/Numpy Fünf-Winkel-Prüfung**, ihr maschinenlesbarer JSON-Bericht und ein eigener Negativ-Test erstellt. **16/16 QA-Regressionstests bestanden:** unabhängige Zuschnitte, eigenständige 180°-Projektion, zwei echte Seitenkameras, exakte SHA-256-Bindung, Schwelleninstabilität, sichere FAIL-Erkennung und keinerlei automatische Freigabe. Das ZIP mit Skripten, GLB und unverändertem Originalreferenzbild wurde im Gespräch erstellt, CRC-geprüft. **Keine neuen Bilder generiert.**

Der alte V7.4-Rigtest bleibt technisch gültig: `19 Gelenke`, `Qiyam/Takbir`, keine Skalierungsanimation. **Rukūʿ und Suǧūd fehlen**, iPad-/WKWebView-Vorschau ist ungeprüft. `original-boy-identity-lock-v1.json` und `forbid-placeholder-release.cjs` bleiben strikt aktiv. Der finale Charakter ist NICHT abgenommen.

## Nächste Korrektur

Nicht wieder die Maskenschwelle oder den Kamerawinkel so lange verändern, bis die Prozentzahl schön aussieht. Stattdessen den Kopf, das Gesicht, den Haar-/Kufi-Übergang, die Ärmel und die tatsächliche räumliche Drehansicht an **allen** Originalansichten korrigieren. Wegen der gestalterisch uneinheitlichen Ausgangsperspektiven braucht es zusätzlich eine **menschliche Originalidentitätsprüfung**, nicht nur mehr Statistik. Erst ein nachweislich besseres 3D-Mesh erneut und unabhängig testen; anschließend die wirklichen Gebetsbewegungen.

**Kein Merge, keine Live-App-Änderung, keine neue KI-Bild-/Video-/Audio-Generierung oder zusätzlichen Credits.**
