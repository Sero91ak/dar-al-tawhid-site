# Originalfigur V6 — Quellbild-Texturen direkt auf 3D-GLB (08.10.2026)

**Status: TECHNISCH GÜLTIG, VISUELL NICHT ABGENOMMEN, NICHT LIVE.**

## Was überprüfbar neu gebaut wurde
- Grundlage: bereits bestehendes, selbst modelliertes **echtes** V5.2-GLB und bestehende **3 Original-Perspektiven** (Front, Profil, Rücken) der Kinderfigur. Ausgangspunkt war **keine** weitere neue Bildgenerierung.
- Drei Materialtexturen wurden lokal aus genau diesen Originalfotodateien extrahiert und als PNG **in die GLB-Binärdatei eingebettet**: Kopf/Gesicht, Kufi-Orange-/Goldband, weißer Thawb. Es sind 3D-Texturen, keine neue generierte Figurenillustration.
- Neues Umfangs-UV-Mapping versucht Frontal-, Seiten- und Rückenfarbe über dieselbe bereits existierende Meshgeometrie auf 360° zusammenzuführen. V5.2-Skelett **19 Gelenke** und die technischen Clips **Qiyam/Takbir** bleiben erhalten. Die previously doppelt gerenderten Prototyp-Augen/-Pupillen/-Münder wurden aus den separaten Geometriematerialgruppen entfernt.
- Lokale V6-Binärdatei: **7.399.840 Byte**, SHA-256 `f09ca26ad472b7b6ba1f40b981a8ac6aab716f68c1b2ad17651bc7f5536a3a75`; glTF 2.0, drei in GLB eingebettete Texturen, keine externen Medien-URLs.
- **16/16 rein technische Prüfungen bestanden** (korrekte Chunkgrößen, GLB-Import, Skin 19 Gelenke, Material-UVs, eingebettete Bilder, Animationsnamen, keine Scale-Kanäle, Veröffentlichungsflags bleiben `false`).
- Reproduzierbarer Python-Quellcode, V6 und Quelldaten als ZIP im Chat bereitgestellt. **Die GLB-Binärdatei ist NICHT als Website- oder GitHub-Asset deployed.** Nur dieser Bericht ist im Repo.

## Ergebnis der tatsächlichen Sichtprüfung: ABGELEHNT

- Frontansicht zeigt jetzt Gesichtselemente aus der Originalvorlage statt künstlich gesetzter riesiger V4-Augen.
- **Seitenansicht** und 45°-Übergänge reproduzieren die originale Gesichtsgeometrie **nicht** ausreichend: Profil, Nase, Ohren und Haarsträhnen passen weiterhin nicht zur fünfseitigen Originalreferenz.
- Kufi- und Gewandgeometrie bleiben trotz Quelltextur stilistisch/strukturell deutlich vereinfacht. Starrer Ärmel und unnatürliche Falten auf texturierter Robe.
- **Befund:** Quellbild-Textur allein ersetzt keine originalgetreue 3D-Form. Die eigenen Renderkontrollen zeigen, dass der Qualitätsgate bewusst nicht besteht. Kein vorzeitiges Lob, kein weiterer Schein-Fortschritt.
- Wie früher: Rukūʿ/Suǧūd fehlen als voll funktionsfähige, fachlich abgenommene 3D-Clips; auch der Mädchen-Avatar benötigt eine gesonderte Konstruktion.

## Kritischer Unterschied für die Projektkommunikation
Die fünf ursprünglichen, von ChatGPT erzeugten **3D-stilisierten Perspektivbilder liegen als PNG/JPEG vor**, aber **kein ursprünglicher Blender-/FBX-/riggter GLB-3D-Szenenexport** aus diesem Bilderzeugungsprozess. Eine Bildgeneration bewahrt nicht automatisch die zugrunde liegende räumliche Skulptur oder ein Skelett. V2–V6 sind selbstgebaute Rekonstruktionen, nicht der originale verborgene 3D-Mesh aus dem Bildmodell.

## Folgende Arbeitsbedingung
- Die Originalfigur und ihre Kinder-Proportionen bleiben Norm. Weiterführende Arbeit an Gesichts-, Kufi-, Stoff-Topologie muss die fünf Ansichten **auch als frei drehbares, tatsächlich skinnbares GLB** erfüllen.
- Tests getrennt: **(1) gültiges 3D-Rig, (2) Originalidentität & 360°, (3) gebetsrechtlich geprüfte Posen, (4) Touch/iPad, (5) App-Integration.** Erfolg in (1) ersetzt niemals (2)–(5).
- Erst nach individueller Freigabe eines tatsächlich originalgetreuen GLB Integration auf eine getrennte HTTPS-Staging-Seite.
- **Kein Live-Push, kein Merge, keine Änderungen an anderen Apps, keine neuen KI-Bilder und keine externen KI-Credits.**
