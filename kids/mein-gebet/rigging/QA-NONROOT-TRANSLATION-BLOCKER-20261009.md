# 09.10.2026 – isolierter Sicherheitscheck der Rig-Animationen

**Status: nicht freigegeben. Keine Veröffentlichung und keine Modellabnahme.**

Prüfung von Draft-PR #825: Ein echtes, endgültig freigegebenes GLB beider Figuren ist nicht im Repository vorhanden. Die vorhandenen Rig-/Modellberichte betreffen interne Jungenkandidaten. Mädchenfigur: weiterhin nur bestätigte 2D-Vorlage; kein separat geprüftes fünfseitiges 3D-Modell.

## Neu erkannte strukturelle Prüflücke

Der vorhandene GLB-Validator `rigging/validate-glb.cjs` verbietet Animationskanäle vom Typ `scale`, akzeptiert jedoch bisher `translation` für beliebige Gelenke. Eine Verschiebung von Oberarm- oder Unterschenkelgelenken kann die effektive Knochenlänge verändern, **ohne** einen einzigen `scale`-Kanal zu verwenden.

Ein lokaler, isolierter Entwurf eines zusätzlichen Prüfers wurde mit **13 synthetischen Testfällen** gegen Rotationen, erlaubte Hips-Wurzelverschiebung, verbotene Oberarm-/Unterschenkelverschiebung, ungeskinnte Objektverschiebung, Skalierung, fehlendes Skelett, ungültige Nodes und leere Clips ausgeführt: 13/13 bestanden. Dies ist **kein Test eines realen GLB** und der Prüfer ist noch **nicht** in den Repository-Release-Pfad integriert.

**Vor jedem zukünftigen Rig-Freigabeversuch muss der Produktions-Validator auch nicht-rootgebundene Gelenktranslationen sperren oder anhand einer tatsächlich geprüften, unveränderlichen Bindpose die Knochenlängen über sämtliche Animationsframes numerisch kontrollieren.** Root-Hips-Translation darf nicht als Beinlängenänderung interpretiert werden.

## Freigabesperren bleiben zwingend

- Junge: Gesicht, Haare, Kufi, Gewand, echte fünf Ansichten, Modellhash und menschliche Sichtprüfung fehlen weiterhin.
- Mädchen: unabhängiges rosa Khimar-/Kleid-GLB, Haar-/Halsabdeckung in allen Posen und fünf Perspektiven fehlen.
- Qiyām und Takbīr sind bei einem internen Jungenkandidaten nur vorläufig; Rukūʿ, Suǧūd und übrige Gebetsstellungen sind nicht freigegeben.
- Fiqh-/Quellenprüfung, reale Safari-/iPad-/iPhone- und Offline-/HTTPS-Stagingtests fehlen.
- Temporärer Home-Einstieg und automatische Profilwahl bleiben Entwurfsfunktionen; kein zusätzlicher Tab.
- Keine neuen KI-Bilder, keine Credits, kein Merge, kein Live-Deploy.

**Keine Zahl zur Modelloriginalität, keine simulierte Testpassage und kein technischer Strukturtest ersetzen eine menschliche Sicht- und fachliche Freigabe.**
