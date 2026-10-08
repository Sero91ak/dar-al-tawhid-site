# Formstudie V3 – Original-Jungenfigur (08.10.2026)

**Status:** Echte, geschlossene 3D-Oberfläche als **nicht freigegebene Formstudie** hergestellt. Der GLB-Kandidat liegt bislang als **Datei im laufenden Gespräch**, nicht im GitHub-Repository und nicht im Live-Kids-Release. Die bisherige kantige V2-Figur bleibt als endgültiges Design abgelehnt.

## Gegenüber der V2-Blockout-Geometrie

- Kontur-Rekonstruktion (Visual Hull) anhand der echten originalen Nutzer-Front-, Rücken- und Seitenreferenzen, modelliert aus einem räumlichen Voxelgitter.
- Rückseitige Haarform, Kufi-Band, Gesichtsmerkmale und Kleidungsstruktur sind jetzt aus Original-Farbprojektionen sichtbar, nicht mehr als primitive kugelige 3D-Ersatzobjekte konstruiert.
- Texturfarben werden richtungsabhängig auf die Dreiecksoberfläche projiziert. Rundumsicht ist real, keine bildweise GIF-Pseudodrehung; die 24 GIF-Frames wurden aus **derselben GLB-3D-Geometrie** erzeugt.
- Geprüfte lokale GLB-Geometrie: **95.530 Vertices, 191.056 Dreiecke**, `watertight=True`, knapp 3,83 MB. Vier echte Renderansichten (Vorne/Links/Hinten/Rechts).
- Quellen: Original-Jungenfigur Vorderbild, Profilbild und Rückenbild, plus die zuletzt vom Nutzer ausdrücklich angenommene **Fünf-Ansichten-Tafel**. Die finale Referenztabelle ist weiterhin unsere Designgrundlage.

## Verbleibende Sperrpunkte – ausdrücklich NICHT freigeben

1. **Noch kein Skinning/Rig/Animationsclips**: Dieses GLB ist ein geschlossenes farbiges Mesh. **Nicht** Qiyām/Takbīr als animierbar ausgeben, und keine echten Gebetsstellungen behaupten.
2. Die Texturprojektion erzeugt trotz Verbesserungen noch sichtbare Kanten, besonders am Gesicht und den Übergängen zu Stoff/Haaren.
3. **Nur provisorische linke Farbprojektion:** Gegenüberliegende Seitenfarbe wird zum Teil bilateral aus der hochaufgelösten Profilreferenz ergänzt. Dies ersetzt weder die vorhandene echte linke Originalansicht noch eine unabhängig modellierte linke Gesichtshälfte. Deshalb keine endgültige Freigabe der linken 90°-Ansicht.
4. Die Visual-Hull-Kontur macht Hände, Ärmel und Rock optisch sichtbar, aber diese sind noch nicht **getrennt riggbar**. Vor Gebetstrainer: fachgerechte Retopologie und separate bewegliche Körper-/Kleidungszonen.
5. Strenge erhaltene Posevorgaben für späteres Rigg: Beinlängen unverändert; Rukūʿ horizontal gerader Rücken; Suǧūd Stirn deutlich + Nase leicht, Lippen/Mund/Kinn ohne Kontakt; Takbīr Schulterhöhe; Qiyām rechte Hand auf linker in Brusthöhe.
6. Der V3-Kandidat darf **nicht** den vorhandenen Originalcharakter oder die Kids-Profilavatars ersetzen. Weiterhin **kein** Live-Push, keine App-Integration, keine Audio-/Quellenfreigabe.

## Nächster fachlicher/technischer Schritt

Die V3-Formstudie im direkten Vergleich zur Nutzer-Tafel optisch prüfen. Danach aus dem originalen fünfseitigen Bildsatz ein tatsächlich **separat skinnbares** Kopf-/Körper-/Arm-/Bein-/Kleidungsmodell als GLB mit 19-Knochen-Rig erstellen und anhand des vorhandenen `rigging/validate-glb.cjs` sowie `rigging/forbid-placeholder-release.cjs` validieren. Erst nach erteilter Nutzerfreigabe der echten 360°-Optik Gebetsclips nach den Qurʾān/Sunnah-/hanbalitischen Prüfregeln produzieren.

**Kosten:** Keine Runway-/ElevenLabs-/Adobe-KI-Credits für die lokale V3-Geometrieerzeugung verbraucht.
