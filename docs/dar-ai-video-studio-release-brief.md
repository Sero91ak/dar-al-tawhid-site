# DAR KI-Video-Studio – vollständiger Freigabe- und Umsetzungsauftrag

## Ausgangslage

Der responsive Staging-Client liegt in PR **#436** auf dem Branch `codex/dar-ai-video-studio-staging`.

Staging-Dateien:

- `test/admin-video-studio.html`
- `admin/sw.js`

Der Client ist bereits für Smartphone, Tablet, Laptop und Desktop/Web vorbereitet. Er darf erst nach vollständiger Prüfung in die private DAR-Admin-App übernommen werden. Die Besucher-App bleibt vollständig adminfrei.

---

## Ziel

In der privaten DAR-Admin-App soll ein autonomes KI-Video-Studio entstehen. Der Betreiber gibt entweder ein Thema/eine Aussage ein oder lässt das Feld leer. Danach erzeugt das System serverseitig einen vollständigen DAR-Video-Beitrag:

1. neue und nicht bereits verwendete Aussage auswählen
2. Aussage und Quelle prüfen
3. Storyboard erstellen
4. gesichtslose Referenzfiguren und Szenen definieren
5. echte Videoclips über einen offiziellen Videoanbieter erzeugen
6. feste deutsche DAR-Männerstimme erzeugen
7. Untertitel, Sprecher, Quelle und Branding setzen
8. Video rendern
9. technische und inhaltliche Qualitätskontrolle durchführen
10. Vorschau bereitstellen
11. erst nach ausdrücklicher manueller Freigabe veröffentlichen

Keine automatische Live-Veröffentlichung.

---

## Verbindliche Responsive-Anforderungen

Die Bedienoberfläche muss ohne horizontales Scrollen und ohne abgeschnittene Bedienelemente in allen folgenden Breiten funktionieren:

- 320–359 px: kleine Smartphones
- 360–479 px: normale Smartphones
- 480–767 px: große Smartphones und kleine Tablets
- 768–1023 px: Tablets im Hochformat
- 1024–1199 px: Tablets im Querformat und kleine Laptops
- ab 1200 px: Desktop und Webseite

Zusätzlich prüfen:

- iOS Safari
- iOS als installierte PWA
- Android Chrome
- Android als installierte PWA
- iPadOS Hochformat und Querformat
- Android-Tablet Hochformat und Querformat
- Desktop Safari, Chrome und Edge
- kleine Höhe im Smartphone-Querformat
- Display-Zoom und Browser-Zoom
- Safe Areas bei Notch und Home-Indikator
- Bildschirmtastatur bei geöffnetem Textfeld
- `prefers-reduced-motion`

Bedienelemente müssen mindestens 44 px hoch sein. Text darf nicht abgeschnitten werden. Statuskarten und Buttons müssen umbrechen, nicht überlaufen. Auf Desktop darf die Auftragskarte sticky sein; auf Smartphone und Tablet wird sie normal untereinander dargestellt.

---

## DAR-Inhaltsprofil

### Aussage und Quelle

- Nur neue, noch nicht verwendete Aussagen auswählen.
- Sprecher, Kernaussage und Quelle gegen den bestehenden DAR-Bestand prüfen.
- Deutsche Fassung zuerst.
- Originalzitat und genaue Quellenangabe intern speichern.
- Unsichere oder unvollständige Quellen blockieren.
- Keine erfundenen Seitenzahlen, Nummern oder Überlieferungsgrade.

### Personen und Darstellungen

- Keine Darstellung des Propheten ﷺ.
- Keine identifizierbare Darstellung bestimmter Ṣaḥābah, Tābiʿīn, Salaf oder Gelehrter.
- Nur anonyme Symbolfiguren.
- Gesichter vollständig verborgen: Rückenansicht, Silhouette, tiefer Schatten, Ausschnitt oder vollständige Verdeckung.
- Angemessene Kleidung.
- Keine verzerrten Hände, zusätzlichen Finger oder unnatürlichen Körperformen.
- Keine gruseligen Masken- oder Horror-Effekte.

### Bildsprache

- fotorealistisch
- filmisch
- themenbezogen
- konsistente Figuren, Kleidung, Raum- und Farbwelt
- echte Bewegung; kein bloßer Zoom auf ein statisches Beitragsbild
- keine zufälligen Standardhintergründe
- keine Personen-Collage

### Stimme und Ton

- eine feste deutsche Männerstimme
- warm, ruhig, klar, würdevoll
- kein Werbeton
- korrekte Aussprache arabischer Namen und Begriffe
- keine Musik
- natürliche, dezente Umgebungsatmosphäre
- Naschīd nur nach späterer ausdrücklicher Änderung des Profils

### Branding

- Original-Logo von DAR AL TAWḤĪD
- dezentes Wasserzeichen
- Sprecherzeile
- synchronisierte deutsche Untertitel
- genaue Quellenangabe
- feste Zeile: `Folgt für mehr Wissen aus Qurʾān & Sunnah`
- Telegram: `@dar_al_tauhid`
- Website: `dar-al-tauhid.de`
- Instagram: `@dar_at_tawhid`
- `by Serhat Abu Malik`

### Export

- Master: 1080 × 1920, 9:16
- H.264, `yuv420p`, BT.709, AAC-LC
- konstante 30 fps
- Fast Start
- iPhone-/Android-kompatibel
- Audio ohne Clipping
- Untertitel innerhalb sicherer Ränder
- zusätzlich Vorschaubild/JPEG erzeugen

---

## Serverarchitektur

### Grundsatz

Keine Anbieter-Schlüssel im Browser, in HTML, in JavaScript-Bundles oder in GitHub-Dateien speichern. Alle Secrets ausschließlich als Cloudflare-Secrets oder in einem vergleichbaren serverseitigen Secret Store.

### API-Endpunkte

Die bestehende Clientoberfläche erwartet:

#### Auftrag erstellen

`POST /api/admin/video-studio/jobs`

Beispiel:

```json
{
  "brief": "",
  "mode": "auto",
  "voiceProfile": "dar-male",
  "budget": {
    "monthlyEur": 15,
    "maxPerVideoEur": 1.2
  },
  "profile": "dar-standard-v1",
  "format": "9:16",
  "manualApproval": true,
  "client": {
    "viewport": "Smartphone · 390 × 844 · Hochformat",
    "userAgent": "..."
  }
}
```

Antwort:

```json
{
  "ok": true,
  "job": {
    "id": "video_...",
    "status": "queued",
    "stage": "statement",
    "completedStages": [],
    "createdAt": "2026-08-02T20:00:00.000Z"
  }
}
```

#### Auftrag lesen

`GET /api/admin/video-studio/jobs/:id`

Statuswerte:

- `queued`
- `running`
- `completed`
- `failed`
- `cancelled`
- `setup_required`

Stufen:

- `statement`
- `storyboard`
- `references`
- `clips`
- `voice`
- `captions`
- `render`
- `review`

Fertige Antwort muss enthalten:

```json
{
  "id": "video_...",
  "status": "completed",
  "stage": "review",
  "completedStages": ["statement", "storyboard", "references", "clips", "voice", "captions", "render", "review"],
  "outputUrl": "https://.../final.mp4",
  "posterUrl": "https://.../poster.jpg",
  "durationSeconds": 32.4,
  "provider": "...",
  "costEur": 0.84,
  "qualityChecks": {
    "facesHidden": true,
    "handsAcceptable": true,
    "sourceVerified": true,
    "captionsSafe": true,
    "audioValid": true,
    "iphoneCompatible": true,
    "androidCompatible": true
  }
}
```

Weitere notwendige Endpunkte:

- `POST /api/admin/video-studio/jobs/:id/cancel`
- `POST /api/admin/video-studio/jobs/:id/retry`
- `DELETE /api/admin/video-studio/jobs/:id`
- `GET /api/admin/video-studio/jobs?limit=20`
- `GET /api/admin/video-studio/providers/status`
- `POST /api/admin/video-studio/jobs/:id/approve`

`approve` darf nur den internen Freigabestatus setzen. Eine Veröffentlichung auf Besucherkanälen bleibt eine separate, bewusst bestätigte Aktion.

---

## Provider-Abstraktion

Eine serverseitige Schnittstelle verwenden:

```ts
interface VideoProvider {
  id: string;
  isConfigured(env: Env): boolean;
  estimateCost(input: VideoRequest): Promise<number>;
  createClip(input: VideoRequest): Promise<ProviderJob>;
  getStatus(providerJobId: string): Promise<ProviderStatus>;
  downloadResult(providerJobId: string): Promise<ArrayBuffer>;
}
```

Der Modus `auto` wählt nur zwischen offiziell verbundenen und verfügbaren Anbietern. Kriterien:

1. DAR-Sicherheitsregeln erfüllbar
2. benötigtes 9:16-Format
3. konsistente Referenzbilder/Charaktere
4. verfügbare API
5. geschätzte Kosten unter `maxPerVideoEur`
6. aktuelles Monatsbudget nicht überschritten
7. technische Erfolgsquote

Bei Überschreitung des Budgets Auftrag vor kostenpflichtiger Generierung blockieren und im Client klar anzeigen.

---

## Speicherung und Hintergrundverarbeitung

Die Generierung darf nicht an die offene Browser-Sitzung gebunden sein. Der Auftrag muss weiterlaufen, wenn die Admin-App geschlossen wird.

Empfohlenes Modell:

- D1 oder Durable Object für Jobstatus und Metadaten
- R2 für Referenzbilder, Clips, Sprache, Poster und finale MP4
- Queue/Workflow für lange Produktionsstufen
- Cron nur für verwaiste oder unterbrochene Aufträge
- idempotente Stufen: Wiederholung darf keine doppelten Kosten erzeugen
- Kosten pro Provider-Aufruf protokollieren
- Abbruch und Wiederaufnahme ermöglichen

Keine Video-Binärdaten in GitHub speichern.

---

## Sicherheitsanforderungen

- alle `/api/admin/video-studio/*`-Endpunkte mit bestehender Admin-Authentifizierung schützen
- keine Secrets an den Client senden
- Rate Limit pro Admin und pro Gerät
- maximale Auftragsanzahl parallel begrenzen
- MIME-Type und Dateigröße validieren
- signierte, zeitlich begrenzte Download-URLs
- Logeinträge ohne vollständige Secrets oder sensible Providerantworten
- Staging und Production strikt trennen
- Staging-Aufträge dürfen niemals Besucher-Pushs auslösen
- keine Besucherstatistik durch Admin-Vorschauen verfälschen

---

## Qualitätsprüfung vor „Fertig“

Der Status `completed` darf erst gesetzt werden, wenn alle Prüfungen erfolgreich sind:

1. Quelle vorhanden und verifiziert
2. keine identifizierbare verbotene Person dargestellt
3. alle Gesichter vollständig verborgen
4. keine auffälligen Hände/Körperfehler
5. keine Musikspur
6. Stimme verständlich und gleichbleibend
7. Aussage korrekt und vollständig
8. Untertitel synchron
9. Quelle lesbar
10. Branding vollständig
11. keine abgeschnittenen Texte innerhalb 9:16-Safe-Area
12. MP4 technisch auf iOS und Android dekodierbar
13. kein schwarzer oder eingefrorener Abschnitt
14. Audio-Pegel ohne Clipping
15. Dateigröße für mobile Nutzung vertretbar

Bei Fehlern automatisch nur die betroffene Stufe wiederholen, nicht den gesamten Auftrag neu berechnen.

---

## Einbindung in die Admin-App

Nach erfolgreicher Staging-Prüfung:

1. Admin-Menüeintrag `KI-Video-Studio` ergänzen.
2. Keine bestehende Tab-ID, Funktion oder Navigation entfernen.
3. Der Menüeintrag öffnet die Studioansicht innerhalb der privaten Admin-App.
4. Authentifizierung und bestehende Admin-Session übernehmen.
5. Zurück-Navigation muss zuverlässig zur vorherigen Adminansicht führen.
6. Service Worker nur gezielt erweitern; keine Besucher-Caches anfassen.
7. Bestehende Push-, Gebetszeiten-, Bibliotheks-, Quiz- und Live-Bearbeitungsfunktionen unverändert lassen.

---

## Verbindliche Testmatrix

Mindestens folgende Viewports automatisiert oder manuell prüfen:

- 320 × 568
- 360 × 640
- 375 × 667
- 390 × 844
- 430 × 932
- 568 × 320 Querformat
- 844 × 390 Querformat
- 768 × 1024
- 820 × 1180
- 1024 × 1366
- 1180 × 820 Querformat
- 1280 × 720
- 1366 × 768
- 1440 × 900
- 1920 × 1080

Auf jeder Größe prüfen:

- kein horizontaler Overflow
- kein verdeckter Hauptbutton
- Textfelder mit Bildschirmtastatur erreichbar
- Status-Timeline lesbar
- Auftragsaktionen erreichbar
- Einstellungsfelder vollständig
- Safe-Area korrekt
- Hoch-/Querformat-Wechsel ohne Neuladen
- Browser-Zoom 200 % auf Desktop

---

## Freigabekriterien

Der Programmierer darf PR #436 erst zur Live-Freigabe vorlegen, wenn:

- responsive Testmatrix bestanden
- API und Jobstatus vollständig funktionsfähig
- mindestens ein offizieller Videoanbieter serverseitig verbunden
- feste DAR-Stimme verbunden
- R2/D1/Queue oder gleichwertige Persistenz aktiv
- ein vollständiger Testauftrag nach App-Schließung weiterläuft
- ein fertiges 9:16-Testvideo auf iPhone und Android fehlerfrei abgespielt wird
- Budgetgrenzen technisch erzwungen werden
- kein Secret im Frontend oder Repository liegt
- keine Besucher-Pushs durch Staging ausgelöst werden
- bestehende Schutzskripte und CI grün sind
- `node scripts/push-system-guard.js` grün
- `node scripts/repo-integrity-guard.js` grün
- `node scripts/change-scope-lock-guard.js` grün
- keine Regression in Besucher-App, Admin-App, Bibliothek, Quiz, Feed, Live-Bearbeitung oder Push-System

Erst danach Nutzerfreigabe einholen. Nicht selbstständig auf `main` mergen oder live veröffentlichen.
