# Mein Gebet — Testnachweis und Freigabesperre
Stand: 08.10.2026 · GitHub-Entwurf #825 · **kein Live-Release**

## Bereits implementiert

- Nur ein vorläufiger Home-Testlink **unterhalb** der vorhandenen Hörwelten, **keine** neue Hörwelten-Kapsel und **kein** eigener Bottom-Tab.
- Profilgesteuerte Grafik: `.app[data-gender="boy"]` → originale Jungen-Ganzkörperfigur, `.app[data-gender="girl"]` → originale Mädchen-Ganzkörperfigur. Fallback auf das bestehende gespeicherte Kinderprofil. Kein zweiter Geschlechtsschalter.
- Zwei eigenständige, dem Profil angepasste Hero-Hintergründe (`assets/hero-boy.jpg`, `assets/hero-girl.jpg`) und originale Ganzkörperbilder unter `assets/`.
- Ebenen: **Home → Mein Gebet → vier Bereiche → je drei anklickbare Lernstationen**. Alle 12 Stationen haben eine eigene Textvorschau mit Zurück-, Vorherige- und Nächste-Navigation.
- Die 12 Texte sind redaktionelle **Arbeitsentwürfe**, keine final geprüften islamrechtlichen Lerninhalte.
- Alle neuen Logiken und Assets bleiben unter `kids/mein-gebet/`, außer **je genau einem Skriptverweis** in den drei identischen Kids-Shell-Dateien.

## Technische Prüfung — PASS

76 synthetische DOM-Navigationstests über beiden Profiltypen (38 × 2): 
- Korrekte Home-Einbindung außerhalb des bestehenden Kapselrasters.
- Keine fünfte Hauptkapsel.
- Korrekte automatische Figur und Profilanzeige.
- Klick auf vorläufigen Home-Einstieg öffnet Gebet-Hub.
- Vier anklickbare Lernkategorien (What / Why / How / 3D).
- Drei tatsächlich anklickbare Lernstationen pro Kategorie.
- Für alle 12 Stationen: separate Detailseite und Titel.
- Vorherige/Nächste funktioniert; Rückweg zur Kategorie, Übersicht und Home funktioniert.
- JavaScript wird syntaktisch erfolgreich kompiliert.
- Drei Kids-Shell-Dateien haben identische SHA-Hashes und denselben Skriptverweis.

**Grenze:** Diese Tests simulieren Browser-DOM-Ereignisse. Sie sind **kein** realer iPhone-/WKWebView-Test, keine Bestätigung der Offline-Funktion, kein gemessener Glow-/Layout-Screenshot und keine fachliche Abnahme.

## Noch offen — keine Veröffentlichung

1. Eigens isolierte, öffentlich erreichbare **HTTPS-Staging-URL** mit sicherer Routing-Konfiguration; ein GitHub-HTML-Dateilink ist **keine funktionierende gehostete Webseite**.
2. Tatsächlicher iPhone/iPad- und Android-Test: Touch, Safari/WebView, Back-Swipe, Safe-Areas, Scroll, Theme/Profilwechsel, reduzierter Motion-Modus, Offline und Speicher.
3. Beurteilung der originalen Ganzkörperfiguren (Ausschnitt, Größe, Hintergrundkanten) und der beiden Hero-Hintergründe auf echten Geräten.
4. Kein freigegebenes echtes GLB-Modell, keine 360°-3D-Animation, keine Gebetspositionen, keine Audioproduktion. Keine Scheinregler als funktionierende Medienwiedergabe darstellen.
5. Islamrechtliche fachliche Quellenprüfung sämtlicher Detailtexte und Posen vor Veröffentlichung.
6. Zweiten dauerhaften Gebet-Tab **erst nach ausdrücklicher Freigabe**, nicht jetzt einfügen.

## Rückbau

Feature-Flag `window.DAR_KIDS_MEIN_GEBET_ENABLED=false` **vor** dem Ladevorgang gesetzt → keine Registrierung des Moduls. Vollständiger Rückbau durch Löschen von `kids/mein-gebet/` und **ausschließlich** der drei identischen `preview-v1.js`-Skriptreferenzen in `kids/index.html`, `kids/start.html`, `kids/shell.html`. Andere Kids-/Besucher-/Admin-Dateien dürfen nicht revertiert oder angepasst werden.

**Freigabestatus:** `DRAFT`; **nicht mergen, nicht live deployen** ohne Nutzerabnahme. Keine neuen ElevenLabs-/Runway-Credits in diesem Update.

## Quellen-Nachtrag: Qabd und Rafʿ al-Yadayn (08.10.2026)

**Nutzer hat für die Lernfassung festgelegt:** Qabd mit rechter auf linker Hand/Unterarm **auf Brusthöhe** und Rafʿ al-Yadayn an den vier belegten Stellen.

- Ṣaḥīḥ al-Buḫārī 736 / Muslim 390a–b: Eröffnung, vor Rukūʿ, nach Rukūʿ.
- Ṣaḥīḥ al-Buḫārī 739 / al-Muṣannaf von ʿAbd ar-Razzāq 2519 (2/68): zusätzlich beim Aufstehen zur dritten Rakʿah.
- Ṣaḥīḥ al-Buḫārī 740: Qabd rechts auf links, *ohne* explizite Handhöhe.
- Ṭāwūs: *Sunan Abī Dāwūd* 759; in *al-Marāsīl* 33: **mursal** mit explizitem Brustbezug.
- Ibn Ḫuzaymah 479: explizite Brustformulierung, deren Zusatzechtheit unterschiedlich bewertet wird.
- Daten unter `content/hanbali-review.json` (jetzt **21 Quellen-/Bewertungsverweise**, **12 Prüfpositionen**) und `content/raf-qiyam-storyboard.json` (vier Raf-Anlässe, keine vierte Gelegenheit im Zweirakʿah-Gebet). Dokumentation unter `HANBALI-QUELLENPRUEFUNG.md`.

**14/14 statische Integritäts- und Review-Sperrprüfungen bestanden:** alle Reviewverweise aufgelöst; alle Posen gesperrt; Kinder-/Audiofreigabe weiterhin `false`; kein neuer Skriptverweis auf `main`, Draft-PR weiterhin unmerged. Diese Prüfung ist **keine** finale isnād-/fiqhrechtliche Abnahme und **kein** gerätebasierter 3D-Test. 
