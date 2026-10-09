# DĀR AL TAWḤĪD KIDS · Mein Gebet – GitHub-Runner QA vom 09.10.2026

**PR #825** · Nur Entwurfsbranch `feature/kids-mein-gebet-preview-20261008` · **nicht freigegeben**.

## Wirklich ausgeführte QA in GitHub Actions

**Erfolgreicher CI-Lauf:** https://github.com/Sero91ak/dar-al-tawhid-site/actions/runs/37916376903

- Geprüfter Commit: `a40fc8749ef2e2d361c09b13a80bc1d80d8456bb`.
- Runner: GitHub-hosted Ubuntu, **Node.js 22**, **Python 3.11**.
- Ergebnis: **alle Schritte erfolgreich**, einschließlich Syntax, Node.js, Python und einer absichtlich **nicht bestehenden Produktionsfreigabe** ohne reale Dateien.
- Loggezählte strukturelle/synthetische Tests: `36 + 20 + 18 + 12 + 7 + 14 = 107`.

| Testsuite | Echte Runner-Ausführung |
|---|---:|
| `validate-glb.test.cjs` – Struktur, Nicht-Wurzel-Translation, statische Skalierung, Skin-Bindpose | 36/36 |
| `test-glb-binary.cjs` – echte Buffer-Byteoperationen: Keyframes, Zeiten, Quaternions, Bounds | 20/20 |
| `test-audit-project-completion.cjs` – release-fail-closed / falsche grüne Metadaten | 18/18 |
| `test-animation-rig-freeze.cjs` – eingefrorenes V7.7 Rig, JOINTS/WEIGHTS, Clips | 12/12 |
| `test_three_quarter_camera_diagnostic.py` – Winkelreihung ohne Kalibrierungsbehauptung | 7/7 |
| `test_geometry_projection_preflight.py` – verbietet unberücksichtigte glTF-Transforms/Morphs | 14/14 |

## Qualitätsschutz für zukünftige Modellkandidaten

1. Animationen mit Namen allein reichen nicht: Produktions-GLBs benötigen wirklich vorhandene, endliche, monotone Sample-Zeitwerte, passende Datentypen und korrekte normierte Quaternionen.
2. Statische Bind-Skalierung und Matrix-Scherung an Skelettknoten werden nicht als proportionstreues Rig angenommen.
3. Die v3-IoU-Projektion bewertet rohe POSITION-Daten. Ein GLB mit aktivem nichttrivialem Mesh-Transform oder Morph-Target wird jetzt abgeblockt, statt eine fälschliche 90%-Formübereinstimmung anzuzeigen.
4. Ein späteres Geometry-only-Sculpt muss Rig, inverse Bind-Matrizen, Weights/Joint-Indizes sowie Qiyām-/Takbīr-Animationsdaten erhalten.

## Ausdrücklich NICHT geprüft oder fertiggestellt

- Das echte V7.7-GLB (SHA-256 `353b028862f91922d6288cf6ede09d5c8150815657c66c9c116b7775311c07fa`) und die Original-Turnaround-Binärdaten (SHA-256 `062b8555e861c680b1049ab6a3bee0212caa51cda5168a6b33a76be01aa987b9`) waren in dieser Sitzung nicht als zugängliche lokale Dateien verfügbar.
- Keine neue Silhouettenmessung, keine physikalische 3/4-Kamerakalibrierung, keine Verbesserung der V7.7-Mesh-Geometrie. Bekannter Stand: vorne 89,663 %, 3/4 unkalibriert 83,245 %, rechts 87,264 %, hinten 88,963 %, links 86,511 %; **0/5 ≥90 %**.
- Keine Freigabe für Gesicht, Haare, Kufi, Stoff, Rukūʿ/Suǧūd oder eine echte Mädchenfigur mit abgedecktem Haar/Hals.
- Kein echter iPad-/iPhone-Safari/WebGL-Test, kein Merge und kein Live-Deploy.

**Nächste richtige technische Produktionsarbeit:** Die tatsächlichen unveränderten Modell- und Referenzbytes in einem autorisierten Dateipfad bereitstellen, ihren SHA-256 vor jeder Rechnung erzwingen, Kamerasensitivität ohne Umdeutung der festen 45°-Messung prüfen und erst dann Kopf-/Gesichts-/Kufi-/Gewandform sculpten. Nach jedem Sculpt alle fünf IoU-Festansichten und Rig-Clip-Bytefences erneut prüfen. Die fünf Rohmasken und berechnete Sichttests ersetzen keine menschliche Originaltreue-Freigabe.

**Freigabestatus bleibt unverändert: nicht freigegeben.**

## Aktualisierung 09.10.2026 · native End-to-End-GLB-Datenprüfung

**Neuer vollständig erfolgreicher GitHub-Actions-Lauf:** https://github.com/Sero91ak/dar-al-tawhid-site/actions/runs/37932645756, geprüfter Commit `b5a99c5c9cd07a50a14684e90f7eb7dff942cef7`.

Logbelegte Testverteilung:

| Suite | Bestanden |
|---|---:|
| GLB-/Rig-Struktur inklusive Bindpose | 36 |
| Animationssample-BIN | 20 |
| **NEU:** Vertex-/Topologie-/Skin-Gewichte-BIN | **27** |
| **NEU:** echte auf Festplatte gespeicherte synthetische GLB-Dateien end-to-end | **8** |
| Strenger Release-Audit | 18 |
| Eingefrorene Animationen und Skin-Zuordnungen | 12 |
| Dreiviertel-Kamerawinkel-Diagnose (Unit-Tests) | 7 |
| Projektions-Sicherheitsfilter (Unit-Tests) | 14 |
| **Gesamt** | **142** |

**Konkret:** `validate-glb-geometry-binary.cjs` prüft im echten BIN-Chunk sämtliche referenzierten Positionen/Normalen, Gewichtsnormierung, Skin-Joint-Indizes, Dreiecksindices, bind-pose Matrixwerte und globalen räumlichen XYZ-Umfang. Ein GLB mit 2.400 angeblichen Vertices, aber nur drei benutzten Indices, wird abgelehnt. Ausführungswege: normaler `validate-glb.cjs`, `forbid-placeholder-release.cjs`, `audit-project-completion.cjs --require-ready`. Die End-to-End-Tests generieren kurzzeitig ein **synthetisches** GLB in einem temporären Verzeichnis, prüfen erfolgreiche strukturelle Verarbeitung, manipulieren anschließend unterschiedliche echte Binärbytes und stellen deren Ablehnung fest. Alle Testdateien werden danach gelöscht.

**Trennung bleibt essenziell:** Die 142 Prüfungen sind Softwaretests, **keine** gemessene V7.7-Silhouette, keine rekonstruierte Originalfigur, keine echte GLB-Binärabnahme. V7.7 hat weiterhin 0 von 5 Silhouettenansichten über 90 %, 3/4 weiterhin 83,25 % unkalibriert. Ein neuer Sculpt wäre ohne exakt geprüfte Originalbytes eine unbelegte Veränderung. Keine Produktionsfreigabe/kein Merge/kein Deploy.

## Aktualisierung · Strenge Knochen-Hierarchie und originale Figuren-Freigabesperre

**GitHub-Actions-Lauf:** https://github.com/Sero91ak/dar-al-tawhid-site/actions/runs/37933121032 · `64f67351d9461a1ad4a9825e6135fd0624db89dd` · erfolgreich.

**147 automatisch bestandene Checks:** 39 GLB-/Rigstruktur, 20 Keyframe-BIN, 27 Geometry/Topology/Skin-BIN, 10 echte synthetische GLB-Disk-Dateitests, 18 Release-Audit, 12 Rig-Freeze, 7 Kameradiagnostik-Unit-Tests, 14 Projektions-Unit-Tests.

Der Validator überprüft jetzt zusätzlich, dass **alle** 19 benannten primären Skin-Joints echte Nachkommen derselben Hips-Skelettwurzel sind. Richtig benannte, aber getrennte/frei schwebende Knochen oder eine losgelöste Kopf-/Bein-Hierarchie sind ungültig. Der End-to-End-Test schreibt ein nicht-originales Test-GLB, prüft funktionierende Import-/Struktur-/Animations-/Mesh-Bytepfade und beweist, dass der Jungen-Identitätsschutz (`forbid-placeholder-release.cjs`) **auch bei gültiger synthetischer GLB-Struktur keine Produktionsfreigabe** erteilt.

**Unveränderte Sperre:** V7.7-Originaldatei und die exakte Original-Turnaround-PNG konnten weiterhin nicht materialisiert werden; deshalb keine neue fünfseitige echte IoU-Messung, kein realer Clip-Freeze-Beweis, keine originalgetreue V7.8-Figur. Das Projekt bleibt bewusst Draft, unveröffentlicht, ohne Freigabe von Gebetsposen oder beiden Profilen.
