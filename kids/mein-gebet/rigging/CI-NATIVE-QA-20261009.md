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

## 09.10.2026 – Numerische Posen, validiertes Archiv und Native-CI

**Neuer nachweislich erfolgreicher GitHub-Lauf:** https://github.com/Sero91ak/dar-al-tawhid-site/actions/runs/37937012907 für `6bf3f7e489b8bde9a0593b4135e9409c1edfda5d`.

**184 native automatische Prüfungen bestanden**, davon 39 GLB-/Rigstruktur, 20 Animations-BIN, 27 Mesh-/Skin-BIN, 12 echte synthetische GLB-Datenträger-End-to-End-Tests, **20 neue numerische Knochenlängenprüfungen**, 18 Release-Sperren, 12 Rig-Freeze, 7 Winkel-Unit-Tests, 14 Projektions-Unit-Tests sowie **15 neue ZIP-Sicherheitsprüfungen**.

### Numerische Keyframe-/Zwischenbildkontrolle

- `validate-pose-bone-lengths.cjs` liest die Animationen aus dem wirklichen GLB-BIN, bildet durch Quaternionen und translatierte Restknochen die globalen Gelenkpositionen und prüft alle Skin-Bonelängen an den vorhandenen Keyframes sowie dazwischen. Qiyām und Takbīr bleiben unverändert.
- Der Prüfer verbietet degenerierte Knochen, Translationen eines Nicht-Wurzeljoints und gestreckte Zwischenhelfer, Matrix-/Scale-Manipulationen, defekte Zeitwerte und falsche Quaternionen. `validate-glb.cjs`, `forbid-placeholder-release.cjs` und `audit-project-completion.cjs` verlangen diese zusätzliche unabhängige Prüfung.
- **Grenze:** Die mathematische Invarianz von Joint-Zentren ist keine Garantie für gewichtsbedingtes Skinning-Stretching/Clipping, Stoff oder islamrechtlich korrekte Rukūʿ-/Suǧūd-Kontakte. Für reale Modelle bleibt `boneLengthInvariantVerified=false`.

### Vorbereitung auf ORIGINALEN V7.7-Archivzugriff

- `qa_v77_archive.py` sucht in der unveränderten V7.7-ZIP ausschließlich die zwei unverwechselbaren Originaldateien anhand der **exakten SHA-256-Digests** `353b028862f91922d6288cf6ede09d5c8150815657c66c9c116b7775311c07fa` (GLB) und `062b8555e861c680b1049ab6a3bee0212caa51cda5168a6b33a76be01aa987b9` (PNG).
- ZIP-Slip/Symlink/Kompressionsbomben/verdächtige Abmessungen blockieren die Ausführung. Nach erfolgreicher Dateiverifikation extrahiert das Programm **nur diese beiden exakten Dateien temporär**, startet den nativen GLB-Validator und anschließend die feste Fünf-Ansichten-Messung sowie den unkalibrierten Kamera-Sensitivitätstest. Keine unfreigegebenen Dateien, keine Ersatzreferenz, kein Deploy.
- Aufruf mit den **echten ZIP-Bytes**: `python kids/mein-gebet/rigging/qa_v77_archive.py "/PFAD/Mein_Gebet_V77_STRICT_NICHT_FREIGEGEBEN.zip" --json "/PFAD/V77-QA-Bericht.json"`.
- Ohne diese wirklich zugängliche ZIP bleibt das Ergebnis **BLOCKED**, nicht behauptete 90 %, keine Freigabe für 3D-Gesicht/Hijab/Kufi und kein neues V7.8.

**Produktionsstatus: bewusst gesperrt. Draft-PR #825 bleibt offen; keine Änderung an main oder der Live-Kinder-App.**

## 09.10.2026 – Fünf-Ansichten-Messintegrität: verschachtelte Vertexdaten

**GitHub-Actions-Lauf:** https://github.com/Sero91ak/dar-al-tawhid-site/actions/runs/37947486073, geprüfter Commit `1a0ae6e7ed09988ee9bc77860221701a5890b1ce` – vollständig **erfolgreich**.

**205 native Softwareprüfungen:** Vorherige 184 plus 21 neue, rein datenorientierte Python-Tests.

Der originale Fünf-Ansichten-Messcode `qa_original_fiveview_v3.py` verwendete bisher einen direkten `numpy.frombuffer(..., count=3*N)`-Zugriff, der **glTF-BufferView.byteStride** ignorierte. Bei einer GLB-Datei mit verschachtelten Vertexattributen konnte er gültige Bufferdaten fälschlich als Positionen interpretieren, wodurch die gerenderte Silhouette und damit der IoU-Wert nicht belastbar gewesen wären.

`glb_projection_accessor.py` behebt das durch sichere Auswertung von `bufferView.byteOffset`, `accessor.byteOffset`, `byteStride`, `count`, Komponententypen, Endlichkeit und Speichergrenzen. Es werden nur gültige, indizierte Dreiecke verarbeitet. Nicht referenzierte Vertices – insbesondere weit entfernte Dummy-Outlier – werden vor der Kamera-/Silhouetten-Skalierung aus der gerenderten Geometrie entfernt.

`test_glb_projection_accessor.py`: **21/21** echte Python-Unit-Tests bestanden, darunter verschachtelte Positionen bei 20- und 24-Byte-Strides, UInt16-/UInt32-Indizes, Out-of-bounds, NaN/Infinity, falscher Typ, verwaiste Fernvertices sowie nichtdreieckige Geometrie.

Ein zusätzlicher Blick auf GitHub-Releases und frühere CI-Artefakte ergab **kein authentisches V7.7-GLB**. Auch die gezielte Suche nach den exakten V7.7-Dateinamen im verbundenen Google Drive brachte keinen Treffer. Die in der Library vorhandene ZIP ließ sich unverändert nicht als Rohbytes materialisieren. **Deshalb wurden keine echten fünf IoU-Messwerte neu berechnet und keine Modellkonturen geändert.**

**Freigabe weiterhin NEIN:** Die bisherige nominal unkalibrierte 3/4-Messung 83,245 % bleibt ein historischer V7.7-Baselinewert, nicht eine neue Messung mit dem korrigierten Decoder. Sobald die echten, unveränderten GLB-/PNG-Bytes verfügbar werden, müssen alle fünf Blickwinkel mit der korrigierten Ausleselogik erneut ermittelt werden; menschliche Originaltreue- und Gebetspositionsabnahme sind unabhängig davon erforderlich.

## 09.10.2026 – Korrekte aktive glTF-Szene und Messmethoden-Versionierung

**Aktueller CI-Lauf:** https://github.com/Sero91ak/dar-al-tawhid-site/actions/runs/37948050710 – geprüft auf `bdf4656db028b4def2d26017ccd19aa2dfad844c`, erfolgreich.

**210/210 native automatische Tests:** 39 Rigstruktur + 20 Animations-BIN + 27 Geometrie-BIN + 12 End-to-End-GLBs + 20 numerische Gelenklängen + 18 Release-Audits + 12 Rig-Freeze + 7 Kamera-Unit-Tests + **19 aktive Szene-/Morph-/Projektions-Tests** + **21 GLB-Zugriff-/Stride-Tests** + 15 sichere V7.7-Archive-Tests.

Im bisherigen Projektions-Vergleich wurden rohe Vertexlisten zusammengestellt, ohne zu prüfen, ob Meshknoten zur **aktiven glTF-Szene** gehören. `geometry_projection_preflight.py` weist daher jetzt eine GLB-Datei zurück, wenn Meshknoten durch die aktive `scene` und deren Rootknoten nicht erreichbar sind. Das vermeidet falsche Konturen durch Geometrie in anderen Szenen; fünf weitere Tests belegen korrekte und manipulierte Szenezuordnungen.

**Wichtig für die historische Vergleichbarkeit:** Die Messmethoden-ID ist jetzt ausdrücklich `fiveview-cropped-grabcut-seeded-v4-stride-scene-safe-20261009`; der Winkeltest nutzt `v77-locked-angle-sweep-diagnostic-v2-stride-scene-safe`. Die fünf historischen V7.7-Werte aus der alten v3-Methode sind **nicht** stillschweigend zu Resultaten von v4 umdeklariert worden. Bis zur erneuten tatsächlichen Berechnung auf dem exakten GLB plus Original-PNG bleibt die neue v4-Ergebnisreihe **nicht verfügbar** (null).

Die genaue V7.7-Archivdatei wurde in GitHub-Releases/Actions-Artefakten und unter ihren spezifischen Namen im angebundenen Google Drive **nicht gefunden**; die Library-ZIP ist sichtbar, aber die Plattform gibt weiterhin keinen autorisierten Raw-Byte-Pfad aus. Folglich gab es hier keine neue reale IoU-Messung, kein Sculpt und keine Bildgeneration.

**Freigabe weiter gesperrt, GitHub PR #825 weiterhin Draft ohne Merge/Deploy.**

## 09.10.2026 – Gegenprobe: inverse Bind-Matrizen müssen zur tatsächlichen Ruhepose passen

**Abgeschlossene native GitHub Actions:** https://github.com/Sero91ak/dar-al-tawhid-site/actions/runs/37951935341, Commit `191957b2f75e4a691aaf3ceea9e75ae2f1d8a071` – alle Schritte erfolgreich.

**231 automatisch bestandene Checks:** 39 glTF-Rigstruktur + 20 Animations-BIN + 27 Geometrie-/Skin-BIN + **14 echte synthetische GLB-End-to-End-Dateitests** + 20 numerische Animations-Knochenlängen + **19 neu hinzugekommene inverse-Bind-/Ruhepose-Tests** + 18 Freigabe-Audit + 12 Rig-Freeze + 7 Kamera-Unit-Tests + 19 aktive Szenen-/Projektions-Unit-Tests + 21 ByteStride-/Geometriezugriff-Tests + 15 V7.7-ZIP-Sicherheitstests.

### Gefundene echte Prüflücke

Die bisherige `validate-glb-geometry-binary.cjs` konnte zwar erkennen, ob eine inverse Bind-Matrix endliche, annähernd orthonormale und affine Werte enthält. Das bewies **nicht**, dass die konkrete inverse Bind-Matrix die **tatsächliche globale Restposition und Restrotation ihres GLB-Joints** rückgängig macht. Beispielsweise hätte ein korrekt orthonormales, aber um 30 Zentimeter verschobenes `inverseBindMatrices` trotz anatomisch falscher Haut-/Mesh-Verschiebung formal bestanden.

`validate-inverse-bind-pose.cjs` berechnet jetzt pro Bone und pro Skin die globalen Resttransformationen einschließlich der Vorfahrenkette, erstellt daraus die mathematisch korrekte inverse Starrkörpermatrix und vergleicht **alle 16 Float32-Komponenten** des tatsächlichen Matrix-Accessors mit strikter Toleranz. Dieser unabhängige Test wird im normalen `validate-glb.cjs`, im originalitätssperrenden `forbid-placeholder-release.cjs` und im vollständigen `audit-project-completion.cjs --require-ready` verlangt.

Die GitHub-Tests wurden nicht nur abstrakt gerechnet: `test-glb-end-to-end.cjs` schreibt echte **synthetische** GLB-Dateien, verändert darin eine ansonsten plausible Bind-Matrix sowie einen Knochen-Restoffset und bestätigt, dass der finale Validator in beiden Fällen fehlschlägt. Ein Fehler der Testdaten-Erzeugung (Zusammenführen des BIN-Chunks vor dem Abschließen der Bind-Matrizen) wurde anhand der realen roten CI-Läufe identifiziert und behoben. **Der aktuelle grüne Commit ersetzt frühere rote Zwischenstände.**

**Keine Verwechslung mit V7.7:** Die originale GLB-Datei und ihre referenzierte Turnaround-PNG sind hier weiterhin nicht als überprüfbare Bytes verfügbar. Deshalb weder neue originalgetreue Modellform noch 5-Ansichten-v4-IoU; die historischen v3-Werte bleiben gekennzeichnet. Echte menschliche Prüfung von Gesicht/Kufi/Kleidung/Rukūʿ/Suǧūd und iPhone/iPad bleibt offen. Keine Veröffentlichung, keine kostenpflichtige Generierung.
