# DĀR AL TAWḤĪD HOME · Cinematic Edition V2
## Verbindlicher Design- und Architekturvertrag · Entwickler-Stand 18.11.2026

**Freigabestatus: Isolierter Entwurfsprototyp, nicht produktiv.** Noch keine neunsprachige Releasefreigabe, kein Seriengerät, kein signiertes OTA, keine abgeschlossene Lizenzprüfung, kein Live-Push zu Endgeräten. Vor Merge sind `AGENTS.md`, `STABILITY.md` und `docs/adult-responsive-layout-contract.md` verbindlich.

## 1. Design-Sprache und Gerät
- Nicht ein Raster aus Kapseln, sondern eine **ungeteilte Full-Bleed-Bildfläche** mit durchgehendem architektonischem Hintergrund, warm-dunklem Nachtgrün, dezenten Goldornamenten, ruhiger klassischer arabischer Schrift, großem typografischem Kontrast und feinen Linien.
- Kapseln nur für tatsächliche Touch-Aktionen. Keine Content-Kacheln, keine Karten-in-Karten. Keine permanenten Toasts oder störende Menüs.
- Primär **Landscape**. Referenzansichten: 1024×600 (klein), 1280×800 (mittel), 1600×900 und 1920×1200 (groß). Display-Diagonalen 7–11 Zoll sind kein CSS-Breakpoint: tatsächliche Pixelabmessungen und Seitenverhältnisse steuern die Layoutentscheidung. Portrait nur als sicherer Fallback, nicht als angestrebter Gerätemodus.
- Gerätespezifikation: IPS/Laminated Touch mit hoher Pixeldichte, entspiegelte Oberfläche, ausreichende Helligkeit bei Tageslicht, einheitliche Randabstände, ruhiges Gehäuse mit Lautsprecherbasis; konkrete Panels nach OEM-Muster auswählen. Kein Tablet-Kartenlook.
- HOME-Shell ist eigener Surface-Owner. Keine globalen Eingriffe in iOS, Kids, tvOS, Desktop oder vorhandene App. UI braucht neun Sprachen (`de/ar/en/tr/ku/ckb/bs/fr/es`) mit RTL in ar/ckb **vor Produktionsfreigabe**.

## 2. Startfläche
1. Kopf: Markenname, Gerät, Ort, Datum, echte Standortuhr, Einstellungen.
2. Haupt-Hero: **Nächstes Gebet** und im Verhältnis sehr groß gesetzter Gebetsname, Eintrittszeit, Sekunden-Countdown, arabischer Gebetsname.
3. Ruhige klassische Gegenfläche: Basmalah, Goldornament und kurze Qurʾān-Motivzeile.
4. Mittelstreifen: fünf Gebete Fajr/Ḍuhr/ʿAṣr/Maġrib/ʿIšāʾ mit je Namen und exakter Uhrzeit, dezente vertikale Linien, aktive Zeit in Gold, Sonnenaufgang separat.
5. Unterstreifen: Tages-Qurʾān und Qurʾān-Wiedergabe. Quellenstatus korrekt kennzeichnen; niemals veraltete Verse als „heute“.
6. Fuß: minimaler Status und nur die wesentlichen Touch-Ziele (Orte, Ḥadīṯ, Qurʾān, Bildschirmschoner).

## 3. Multi-Ort-Gebetszeiten
- Mehrere Ortsprofile mit Name, Koordinaten, IANA-Zeitzone, Fajr/Išāʾ-Winkel, ʿAṣr-Methode und manuell überprüfter Minutenabweichung.
- DĀR-API bereits vorhanden: `/api/prayer/times?lat=&lon=&tz=&angle=&asr=&date=`. Liefert fünf Gebete, nicht explizit Sonnenaufgang; Sunrise wird auf HOME gesondert berechnet.
- Lokale Berechnung aus der bereits in `cloudflare/prayer-push-scheduler.js` verwendeten astronomischen Methode. Lokale Zeiten sind als **berechnet und noch nicht lokal verifiziert** zu deklarieren. Hochbreitengrade/sonderlokale Methoden erfordern zusätzliche Implementierung; keine Nullwerte mit Fantasiezeiten überschreiben.
- Netzverlust: weiterrechnen, Countdown halten, Quellenstatus transparent; automatische Offline-Aḏān-Aktivierung erst nach Nutzerprüfung lokaler Zeiten.

## 4. Qurʾān und Radio
- Bestehende `/content/quran/surahs.json` enthält die Surenliste, `/data/quran-reciters.json` Rezitatoren, `/quran-audio/...` Verse. V2 erzeugt fortlaufende Audio-Wiedergabe bei manueller Freigabe im Browser. Ein klassischer Webbrowser garantiert kein unbeaufsichtigtes Autoplay – Seriengerät braucht nativen Audio-Dienst.
- Zwei explizite Modi: **Endlosrezitation (Playlist, KEIN Radiosender)** und **echter Live-Broadcast**, nur wenn ein autorisierter HTTPS-Stream in `media.quranRadio.streamUrl` hinterlegt ist. Niemals Playback-Playlist als Live-Sender bezeichnen.
- Für Seriengerät Audio-Rechte je Aufnahme, Offlinenutzung, kommerzielle Wiedergabe und Lizenzdauer dokumentieren. Audio-Wiedergabe bei Aḏān pausieren/resumieren.

## 5. Ḥadīṯ und Bildschirmschoner
- Source of truth ist bestehende DĀR-Ḥadīṯ-Bibliothek (`apple-tv/hadith/`); Ḥadīṯ und Āṯār nicht vermischen. V2 lädt eine begrenzte Beispielserie, keine behauptete Vollintegration der gesamten Bibliothek.
- Rotationsmodi: Tages-Ḥadīṯ, 5/15/30 Minuten. Vollbild-Bildschirmschoner On/Off, Start nach Inaktivität, Inhaltsmodus Qurʾān / Ḥadīṯ / beide, Quellenzeile und dauerhaft sichtbare Uhr/folgendes Gebet.
- Inhalte nur mit nachgewiesenem Status anzeigen; Auszüge als **Auszug** deklarieren. Für Serienausgabe vollständiger redaktionell freigegebener Rotationsfeed (mit IDs, freigegebenen Sprachen, Quellennachweis, Korrekturen und Versionierung). Vorzugsweise Shuffle-Bag ohne Wiederholung, analog `apple-tv/screensaver/rotation.json`.
- Langtext: Schrift- und Seitenumbruch responsiv, ggf. mehrseitige Anzeige mit ausreichender Lesezeit, niemals unsichtbar abschneiden.

## 6. Aḏān und Cinematic Aḏān
- Exakte Auslösung der fünf Gebete, laut und zuverlässig unabhängig vom Display-Wachzustand; aus lokaler Systemplanung und mit Kiosk-Audiodienst statt allein im Browser.
- Eigener Aḏān-Katalog unter `/apple-tv/prayer/adhan.json` als **technischer Kandidat**, Nutzungsrechte für Verkaufsgerät gesondert klären.
- Bei Aḏān wird laufender Qurʾān-Sound unterbrochen und anschließend fortgesetzt. Musikartige Soundeffekte und Spektakel nicht automatisch hinzuaddieren.
- Cinematic Mode: optionales freigegebenes Hintergrundvideo hinter stiller Typografie, 1:1 mit Aḏān-Eintritt synchronisiert. HTML-Prototyp enthält bereits ein Video-Element, `media.cinematicAdhan.videoUrl` ist aus Sicherheits-/Rechtegründen zunächst **null**. Ohne hinterlegtes Material erfolgt eine ruhige klassische Ansicht.

## 7. GitHub als Redaktionsquelle und Live-Synchronisierung
- Primärer GitHub-Repository-Einstieg: `Sero91ak/dar-al-tawhid-site`. Grundsätzlich nur vorhandenes Cloudflare-Publishing verwenden, nicht ungeprüft auf `main` pushen.
- Bereits veröffentlicht und für HOME geeignet: `/content/updates/daily.json` (Tagesvers), `/data/quran-reciters.json`, `/apple-tv/hadith/catalog.json`, `/apple-tv/hadith/series/...`, `/apple-tv/prayer/adhan.json`, `/api/prayer/times`.
- NEU vorzubereiten: `/content/home/device-config.json` (mit diesem Paket geliefert), optionale vorab kuratierte `/content/home/approved-hadith-feed.json` für effiziente Bildschirmrotation und später `/api/home/v1/...` für Pairing, Device-State, signierte Fernbefehle, OTA.
- Stand V2: die Vorschau **liest** eine GitHub-veröffentlichte Konfiguration mit Refresh, falls diese Datei im veröffentlichten Cloudflare-Site-Build liegt. Keinesfalls ist ein GitHub-Commit allein ein sofortiger Live-Geräte-Push. Produktionslösung: Versionierung und Cache-Verifikation, Polling 60–300 Sekunden oder authentifizierte serverseitige Event-Notification; Geräte holen signierte veröffentlichte Releases. Keine Admin-GitHub-Tokens im Gerät.
- redaktioneller Arbeitsfluss: GitHub- oder authentifizierte Web-Admin-Änderung → CI-Regelprüfung → kontrollierte Freigabe/Cloudflare-Deployment → geräteseitige Versionsprüfung → atomare lokale Übernahme → Rollback auf letzten validen Stand bei Fehler.
- Lokale Nutzer-Optionen (Audio, Ort, Sleep, Aḏān) haben Vorrang vor globalen Standardeinstellungen. Web-Admin darf Standort und private Einstellungen nicht unkontrolliert überschreiben.

## 8. Test und Release-Gates
- P0: Querformate 1024×600, 1280×800, 1600×900, 1920×1200, 7–11 Zoll, RTL/9 Sprachen, Schrift-Skalierung, Nacht-Helligkeit, Touch-Ziele, keine Überläufe.
- Prayer: Sommerzeitwechsel, Offline 72 Stunden, Mehr-Ort-Auswahl, 5 Gebetszeiten, nächster-Tag-Übergang, lokale Verifikation, Aḏān-Ablauf plus Vor-/Nachlauf.
- Medien: 114 Suren, jedes konfigurierte Rezitatoren-Profil, Next/Prev/Resume, Stream-Ausfall, Mute/Volume, Aḏān-Interrupt, lizenziertes Live-Radio (falls vorhanden).
- Ḥadīṯ: genau eine Quelle und Authentizitätsstatus, 5-Minuten-Wechsel, täglicher Wechsel und keine Dopplungen ohne Durchlauf.
- Gerätebetrieb: Linux-Kiosk, sicherer Boot, watchdog, A/B-Update/rollback, 168-Stunden-Dauertest, Energie-/Wärmemessung, WLAN-Neuverbindung, Stromausfall.
- Serienverkauf: Product Safety, EMV/RED, RoHS, CE-Verfahren, WEEE/ElektroG, CRA, Hersteller-/Lizenzvertrag, Service-Ersatzteile, öffentlich dokumentierte Supportzeit.

## 9. Status dieser Lieferfassung
**Tatsächlich erstellt:** eigenständige HTML-Vorschau, responsive CSS-Artwork ohne Content-Kapseln, Touch-Einstellungen, Mehr-Ort-Auswahl, API-Abruf, lokale Berechnung, Qurʾān-Basispipeline, Aḏān-Testmechanik, Vollbild-Bildschirmschoner und Content-Rotation, Konfigurationsvorlage, Screenshots.

**Noch nicht behaupten:** produktives Cloudflare-Deployment, vollständiger 3.434er-Katalog-Liveloader, 9-Sprachenabnahme, Geräte-Firmware/Hardware, Cinematic-Video, Serienlizenz, Herstellerfreigabe, Push-Backend oder verlässliche Aḏān-Automatik auf allen Browsern.