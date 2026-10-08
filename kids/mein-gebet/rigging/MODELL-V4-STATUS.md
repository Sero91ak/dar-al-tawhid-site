# Jungenfigur V4 – echte 3D-Modellierung, noch keine Veröffentlichungsfreigabe

**Datum:** 08.10.2026 · **Bereich:** KIDS / Mein Gebet · **Status:** technischer, nicht freigegebener GLB-Kandidat.

## Warum V4 statt fehlerhafte V3-Projektion

V3 war eine Surface-/Visual-Hull-Konstruktion aus projizierten 2D-Gesichtsansichten. Beim Drehen traten Doppelgesichter, falsche Texturkanten und ungetrennte Arme auf. V4 wurde **nicht** aus diesem V3-Mesh abgeleitet. Der neue parametrisch modellierte Körper verwendet getrennte räumliche Skulptur-Bauteile für Kopf, Nase, Augen, Augenbrauen, Haarlocken, Kufi, Gewand, Ärmel, Hände, Füße und Schuhe. Die Oberflächen bestehen aus PBR-Materialfarben – **keine aufprojizierten Bilder**. Eine echte Übertragung der fünf Originalansichten in ein vom Nutzer akzeptiertes individuelles Charaktergesicht bleibt eine weitere manuelle Qualitätsaufgabe.

## Tatsächlich lokal hergestellt

- Echter binärer glTF 2.0 (`.glb`), **2.462.956 Byte**.
- **19 Knochen** in realer glTF-Skin-Hierarchie, inverse Bindmatrizen, normalisierte Hautgewichte.
- **34.104 Vertices**, **66.480 Dreiecke**, **19 materialgebündelte Draw-Primitives** (gegenüber 296 ungebündelten Skulpturteilen).
- Animationen: `Qiyam` und `Takbir`, mit Rotationskanälen, **keinen SCALE-Animationskanälen**.
- Ober-/Unterarmlängen erhalten. Qiyām-Handgelenke vor der Brust, Takbīr-Handgelenke angehoben und seitlich außen.
- Lokales Reproduktionspaket im Gespräch: `mein_gebet_junge_modellierung_v4.zip` mit **GLB**, `build_boy_v4.py`, `validate_v4.py` und README. Die **Dateibytes sind derzeit nicht im GitHub-Repository**, nur als separate Gesprächsdatei übergeben. **Nicht behaupten, dass V4 automatisch Teil der App sei.**

## Strukturprüfungen – bestanden

GLB Header/Chunkgrößen, Skins, 19 Joints, normalisierte Vertex-Gewichte, indizierte Meshes, endliche Koordinaten, normalisierte Normals, 19 Material-Primitives, Qiyām-/Takbīr-Clips, normierte Quaternionen, keine SCALE-Animation, starre anatomische Knochensegmentlängen, Wrist-Koordinaten und trimesh-Binärimport.

## Noch NICHT fertig / harte Freigabesperren

1. **Original-Likeness nicht abgenommen**: Es ist eine neu modellierte technische Formstudie, keine garantierte 1:1-Skulptur. Insbesondere Augen, Gesichtsprofil, Kufi-Ornamente und Kleidungsfalten müssen gegen die fünf vom Nutzer bestätigten Originalansichten geprüft und manuell nachmodelliert werden. **Keine weitere AI-Bildgenerierung**, entsprechend ausdrücklicher Nutzeranweisung.
2. **Rukūʿ und Suǧūd noch nicht animiert**, Gebetsrechtliche Details weiterhin nach Hanbali / Qurʾān / authentischer Sunnah zu prüfen. V4 enthält nur Qiyām-/Takbīr-Bewegungskanäle.
3. **Kein iPhone-/WKWebView-Test**, keine Profil-/Home-Vorschau-Integration und keine Offline-Auslieferung erfolgt.
4. Veröffentlichungsstatus unverändert `approvedToAnimate=false`, `approvedToTeach=false`, `productionReady=false`. Das vorhandene `original-boy-identity-lock-v1.json` und `forbid-placeholder-release.cjs` müssen vor jedem echten Release bestehen. **Kein Merge und kein Live-Push.**
5. Nicht behaupten, dass die ursprünglichen 2D-Referenzen automatisch den 3D-Kandidaten freigeben. V4 ist qualitativ vor der Kinder-App separat visuell zu prüfen.

## Nächste Arbeitsreihenfolge

1. V4 als kontrollierbare 3D-Geometrie gegen **0°/45°/90°/180°/270° Originalansichten** auf einem echten Viewer abgleichen, Identitätsunterschiede an Kopf/Gewand/Kufi gezielt modellieren.
2. Überarbeitete Gesichts-/Kleidungsgeometrie unter Beibehaltung der 19-Gelenke-Skin-Hierarchie, ohne erneute Visual-Hull-Fotoprojektion.
3. Danach Rukūʿ mit horizontal geradem Rücken/unveränderten Beinen und Suǧūd mit Stirn fest/Nase leicht/Lippen ohne Kontakt als überprüfbare Clips erzeugen.
4. Technische und religiöse Posefreigabe sowie reale iPhone-Tests vor jeder Live-Veröffentlichung.

**Abstimmung:** Der User sagte ausdrücklich „Du sollst keine Bilder erstellen“ – deshalb in diesem Schritt ausschließlich 3D-, Script- und Textdateien erzeugt; keine neuen Illustrationen, Render-Vorschaubilder oder KI-Bildgenerierungen.
