# Modellierung V7.4 – Kopf, Kufi, Haarvolumen und Original-Silhouettenprüfung

**Stand: 08.10.2026 · GitHub-PR #825: NUR DRAFT · NICHT LIVE · NICHT FÜR KINDER FREIGEGEBEN**

## Tatsächlich lokal neu gebaut

Die letzte technisch gültige Eigenrekonstruktion wurde nicht einfach als fertig ausgegeben. Ausgehend von dem 19-Knochen-GLB-Prototyp wurde die **3D-Geometrie selbst** geändert: weichere dreidimensionale Kopfkontur, tiefere Augen statt hervorstehender Doppel-Augen, überarbeitete Nasen-/Mundkontur, Haarlocken als verjüngte dünne Geometrie, Haare mit größerem Volumen im Hinterkopfbereich, Kufi mit verbundenem ornamentalem Band, natürlichere Ärmelbreite und Schulterabstände. **Keine Bilder neu generiert und keine fotografische 2D-Textur auf Gesichtskörper projiziert**. Die ursprünglichen JPG-/PNG-Referenzen bleiben nur **Prüfmaßstab**.

**Ergebnisdatei:** `mein_gebet_junge_v74_sculpt_internal.glb` (4.382.188 Bytes). SHA-256 `7b4db7e684144ec23c63f8ad63e5a055e66fc871adf2757be62adf2699c41490`. Sie liegt vorerst als Chat-Arbeitsdatei vor, **nicht als GitHub- oder Web-App-Binärasset**.

Das GLB wurde erneut geprüft: **19 Joints**, 19 Materialprimitives, **60.996 Mesh-Vertices**, **118.800 Dreiecke**, echte Skin-Gewichte, Clips `Qiyam` und `Takbir`, keine Scale-Animationskanäle, unveränderte Ober-/Unterarmlängen. Kein Rukūʿ, Suǧūd, Mädchenmodell oder verifizierter iPad-Laufzeittest in dieser Datei.

## Strengere computergestützte Qualitätsprüfung

Neuer lokaler, reproduzierbarer Check `qa_multiview_silhouette.py`: Er rasterisiert ausschließlich die **reale räumliche GLB-Geometrie** in orthographischen Ansichten, extrahiert die Silhouetten der **bereits vorhandenen Originalbilder** und berechnet die Intersection-over-Union der Umrisse nach **einheitlicher Höhenanpassung**. Schwelle als interner Grobfilter **≥ 0,85**:

| Blickrichtung | IoU | Grobfilter |
| --- | ---: | --- |
| Vorne (Original-JPG) | **0,8716** | bestanden |
| Seitenansicht (Original-PNG) | **0,8645** | bestanden |
| Rücken (Original-PNG) | **0,8779** | bestanden |

**Wesentliche methodische Grenze:** Der Rückenumriss ist die gespiegelte orthographische X/Y-Geometrie und beweist **keine** korrekte Haare-/Kufi-Textur hinten. Die Seitenquelle prüft nur ein Profil, **nicht** beide individuellen Seiten. Silhouetten-IoU von 85–88 % bedeutet **nicht** 85–88 % Charakteridentität oder religiöse Posequalität.

**Visuelle QA weiterhin NICHT bestanden:** Die originale Augen-/Nasen-/Kopfform, Haarstruktur, Kufi-Details und Ärmelhaltung sind nach dem Drehen nicht ausreichend originalgetreu. Ein offline gerenderter QA-Blick auf Front und Seite bestätigte die verbleibenden Formfehler. Auch die tatsächliche Animation wird nicht durch die neutrale Umrissmessung abgenommen.

## Schutz und Folgearbeit

- Im enthaltenen `QA_V7_4.md` und `V7_4_QA.json` steht `production_approved=false` und `final_face_identity_pass=false`.
- Paket im Chat: GLB V7.4, reproduzierbares `build_boy_v74.py`, `validate_v74.py`, `qa_multiview_silhouette.py`, maschinenlesbare QA, sowie **bestehende** Originalreferenzen.
- Der im Repo vorhandene strenge `forbid-placeholder-release.cjs` mit SHA-256-, fünf-Blickwinkel- und Nutzerfreigabe-Gates bleibt unverändert aktiviert; die V7.4-Datei hat **keine** Freigabe.
- Nächster Modellierungsschritt: Gesicht/Lider/natürliche Haarbüschel und Stoffform auch bei echten 45°- und beiden 90°-Ansichten originalgetreu sculpten. Erst dann die von dir bestätigten Gebetsstellungen als verifizierte Animation umsetzen.
- Keine fünfte Home-Kapsel, kein permanenter Tab, kein Kids-Live-Merge, keine zusätzliche Audio-/Runway-/Adobe-Produktion.

**HARD GATE: V7.4 ist ein verbesserter technischer Zwischenstand – keine fertig akzeptierte Kinderfigur.**
