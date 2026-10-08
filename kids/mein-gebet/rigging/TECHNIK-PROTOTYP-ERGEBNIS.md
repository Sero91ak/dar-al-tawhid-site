# Technischer 3D-Prototyp V2 – Ergebnis und Grenzen

**Stand:** 08.10.2026 · **GitHub-PR #825 DRAFT** · nicht für Kids nutzbar

## Tatsächlich außerhalb von GitHub erzeugter technischer Blockout

Im aktuellen Gespräch wurde lokal mit Python, NumPy/SciPy und trimesh **eine GLB-2.0-Testdatei** erstellt und als Gesprächsdatei ausgegeben, zusammen mit einem ZIP-Testpaket und 12 Renderansichten einer 360°-Drehprobe. Die Binär-GLB liegt **noch nicht im Repository**, sondern als separate Gesprächsdatei vor. Sie ist **nicht** die fertig originalgetreu modellierte Benutzerfigur. Kein Schein-„3D“ aus generierten Bildern.

Prüfergebnisse des V2-Prototyps (lokal):

- 999.424 Byte, GLB-2.0 mit korrekter Headergröße und deklarierten Chunklängen
- 19 benannte Knochen, ein Skin, 118 skinnte Mesh-Teilgruppen, 12.354 Vertices, 23.832 Dreiecke
- Zwei reale Animationsclips: `Qiyam` und `Takbir`, je sechs Drehkanäle
- Kein animierter Skalierungskanal
- Ober-/Unterarmlängen bleiben in beiden Posen konstant (Anatomie-Proof)
- Handgelenke werden in der technischen Takbīr-Referenz ungefähr auf Schulterhöhe angehoben
- Vom lokalen Python/trimesh-GLB-Parser geladen; gerenderte Drehprobe im Gespräch verfügbar

**Optische QA – nicht bestanden für die echte Kids-App:**

1. Gesicht/Haar und Kufi sind nur grobe Geometrie und **nicht identisch** mit der vom Nutzer bestätigten Originalfigur.
2. Hände/Finger, Stoffübergänge und Kufi-Ornamentik müssen mit einem richtigen 3D-Artist beziehungsweise Blender-Workflow sauber aufgebaut werden.
3. Qiyām-/Takbīr-Übergänge müssen visuell gegen die freigegebenen Referenzen geprüft werden; die kinematische Höhe allein beweist noch keine korrekte Palmorientierung.
4. Rukūʿ und Suǧūd wurden **nicht als fertige 3D-Clips** erzeugt. Besonders kein Verlängern der Beine, gerader horizontaler Rukūʿ-Rücken, Stirn deutlich und Nase leicht am Boden, **Lippen/Kinn frei** müssen beim echten Rig abgenommen werden.
5. Keine Mädchen-GLB, keine 360°-Geräteabnahme und keine Offline-App-Integration.
6. Es wurden **keine** neuen Runway-/ElevenLabs-Credits verbraucht; lokale Testgenerierung verursacht keinen externen KI-Produktionsauftrag.

## Anschluss an bestehende Prüftechnik

Vorhandene, schon eingecheckte Dateien:
- `rig-acceptance-v1.json`: strenge 3D-Übergabekriterien
- `validate-glb.cjs`: prüft GLB-Dateistruktur, Skeleton, Skinning, zwei Clips, Ablehnung von SCALE
- `validate-glb.test.cjs`: 16 Offline-Unit-Checks (zuvor bestanden)

**Wichtig:** Ein technischer GLB-Validator allein genügt **nicht** als islamrechtliche, optische, altersgerechte oder iPhone-Freigabe. Der Status `approvedForProduction=false` und `approvedToAnimate=false` bleibt erhalten. Originalbilder, bestehende Kids-Bereiche, Profilcontroller und `main` bleiben unverändert.

## Nächste echte Produktionsanforderung

Ein professionell nach den Originalperspektiven gesculptetes, texturiertes und riggtes **Jungen-GLB** bereitstellen, ohne das Gesicht oder Körperproportionen zu verändern; dann neue Qiyām-/Takbīr-Clips im 360°-Viewer und auf echten iPhones abnehmen. Erst danach dürfen die Rukūʿ-/Suǧūd-Clips nach den getrennten Fiqh- und Bildvorgaben modelliert werden.

Die Gesprächsdateien aus diesem lokalen Prototyp **nicht automatisch als Live-App-Assets einbauen**.
