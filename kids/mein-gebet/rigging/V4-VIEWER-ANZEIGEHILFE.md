# V4 anschauen – iPad/iPhone-Viewer-Fix (08.10.2026)

**Problem:** Die ChatGPT-internen Dateivorschauen öffnen binäre `.glb`-Dateien auf iPhone und iPad nicht automatisch als frei drehbare 3D-Figuren. Früher ausgegebene HTML-Dateivorschauen ließen zum Teil keine JavaScript-Touchbedienung zu.

**In diesem Gespräch tatsächlich hergestellt:**
- `Mein_Gebet_V4_3D_Viewer_Offline.html` – ~3,3 MB **einzige HTML-Datei**, enthält die **unveränderte V4-GLB als eingebettete Base64-Binärdatei** und einen eigenen WebGL2-Viewer, ohne CDN, externe Bibliotheken oder Bildgeneration.
- `Mein_Gebet_V4_3D_Ansehen_Paket.zip` – HTML, originale V4-GLB und eine Safari-Dateiöffnungsanleitung.
- Im Viewer sind Qiyām, Takbīr, Abspielen/Pause, automatische 360°-Drehung, Front, 90° Seite, Rückansicht, Touch-Drehen, Zwei-Finger-Pinch und +/- Zoom verkabelt.
- Die V4-GLB verfügt weiterhin über 19 Skin-Joints, 19 Materialgruppen und die zwei Clips Qiyam/Takbir. Der Viewer modifiziert weder die GLB-Binärbytes noch das Rig.

**Prüfung:** Node.js-Syntaxprüfung bestanden. Browser-DOM-/WebGL-Mock-Prüfung für echten GLB-Dateiimport, 19 Meshgruppen, 19 Joints, beide Animationsnamen, Takbīr-/Qiyām-Umschaltung, Seitenansicht, Zoom und Statusmeldung bestanden. Die isolierte Chromium-Laufzeit hier **stellt kein echtes WebGL2 bereit**; ein vollständiger gerenderter GPU-/iPad-/Safari-Test wurde daher **nicht** behauptet.

**Zuverlässigere Sofort-Alternative, falls ChatGPT HTML blockiert:**
1. V4-GLB in die iOS-Dateien-App sichern.
2. **Safari** öffnen, `https://3dviewer.net` aufrufen.
3. Über **Datei öffnen** die gespeicherte lokale GLB auswählen.
4. Mit Finger drehen und per Pinch zoomen. Quelle `https://www.3dviewer.net/info/index.html` bestätigt GLB und lokale Browserdatei-Verarbeitung.

**Wichtig:** Diese Anzeige-Lösung ist **nicht auf Cloudflare Staging oder Live deployed**, und es gibt keine öffentliche Direktansicht-URL aus diesem Commit. 3dviewer.net öffnet das Modell lokal per Dateiimport, statt den Modelllink aus diesem Testbranch aufzurufen. Keine native iOS-GLB/QuickLook-Kompatibilität behaupten. Eine standardmäßig nicht installierte Browser-App wird nicht automatisch verbunden.

**Grenze:** Die Originaltreue von Gesicht/Kufi/Gewand, Rukūʿ, Suǧūd und die fachliche Gebetsabnahme sind unverändert **nicht freigegeben**. Kein Runway-/Adobe-Generierungsschritt, keine Bilder, keine neuen Credits; keine Live-App-Änderungen.
