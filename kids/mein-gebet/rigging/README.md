# 3D-Rigging — erster geprüfter technischer Meilenstein

**Feature:** DĀR AL TAWḤĪD KIDS / Mein Gebet  
**Status:** Technische Spezifikation und Validierung im separaten Draft-Branch. **Noch kein Original-GLB und keine Animation produziert.**

## Pflichtübergabe für die erste Jungenfigur

- Datei: `*.glb`, binary glTF 2.0, echtes dreidimensionales Originalmodell — kein Video, flaches PNG oder 2D-Billboard.
- Gesichtsidentität, Kopf-/Rumpf-/Beinverhältnisse, Haare, weiße Kufi mit Goldmuster und weißer Thawb exakt wie in der Originalreferenz. Keine Längenänderungen zwischen Gebetsstellungen.
- Bewegliches Skelett inklusive Schultern/Armen, Händen, Rücken, Hüfte, Knie, Füßen und Zehen; Skinned Mesh mit Gewichten.
- Animationsclips erster Meilenstein: `Qiyam` und `Takbir`. Weitere Clips erst nach freigegebenem Po­se­n­vergleich. Keine Animationskanäle, die Skalierung/Gliedmaßenlängen manipulieren.
- Schrift- und Hero-Grafiken bleiben separat. Die Mädchenfigur erhält eine eigene Körper-/Kleidungs-/Gebetspositionsprüfung, nicht einfach die Jungenbewegungen als fertig deklarieren.
- Wiederholbarer 360°-Ansichten-Test: vorne, hinten, beide Seiten, beide 45°-Ansichten. Einzelbilder aus einem 2D-Poster sind hierfür kein Ersatz.

## Bestehende verbindliche Bildreferenzen

- [Vom Nutzer bestätigter Qiyām](../assets/qiyam-brusthoehe-user-approved-ref-v1.jpg)
- [Vom Nutzer bestätigte letzte Sieben-Schritte-Tafel](../assets/gebetspositionen-sieben-schritte-user-approved-review.jpg)
- [Hanbalitische Quellen- und Variantenprüfung](../HANBALI-QUELLENPRUEFUNG.md)

## Maschinenlesbare Anforderungen

`rig-acceptance-v1.json` enthält:
- 19 benannte Pflichtgelenke
- zwei verpflichtende Clips für die erste Entwicklungsstufe
- Körperproportionen/kein Limb-Stretch
- Rukūʿ: Gerade, etwa waagerechte Rückenachse, keine überlangen Beine
- Suǧūd: Stirn und leicht Nase, **kein Lippen-, Mund- oder Kinnkontakt**
- Takbīr: Handheben auf Schulterhöhe, nicht bis zu Ohren
- Profile, Rollback- und Freigabesperren

**Wichtig:** Ein automatischer GLB-Prüfer kann diese **visuellen** Aspekte nicht endgültig beweisen. Sie müssen mit einer echten 3D-Modellansicht, Kontaktprüfung und fachlicher Abnahme bestätigt werden.

## Automatische technische Prüfung (ohne Fremdpakete)

Lokaler Test:

```bash
node kids/mein-gebet/rigging/validate-glb.test.cjs
```

Ein künftiges GLB prüfen:

```bash
node kids/mein-gebet/rigging/validate-glb.cjs /path/to/character-boy.glb boy
```

Das Prüfprogramm erkennt u. a. beschädigte Binärdateien, fehlende glTF-Skins, unvollständige Gelenknamen, nicht gewichtete Meshes, animierte Skalierungen, fehlende Clips und übergroße Dateien.

Eine **grüne technische Strukturprüfung** ist **keine** veröffentlichbare religiöse Gebetsanimation: Sie setzt **nie** `approvedToAnimate`, `approvedToTeach`, `userApproved` oder `productionApproved` auf `true`.

## Folgender Schritt

Eine **originalgetreue, skinnte GLB-Jungenfigur** muss mit einem geeigneten echten 3D-Modellierer (z. B. Blender mit Originaldesign-Referenzen) erstellt und anschließend durch den Validator geprüft werden. Adobe/Runway-Bild- und Videogenerierung ersetzt **kein** skinnbares GLB. Zusätzliche externe Kosten oder Generierungscredits benötigen vorherige ausdrückliche Freigabe.

**Keine Veränderung an Live, anderen App-Bereichen, Service Worker oder Gebets-Audios.**
