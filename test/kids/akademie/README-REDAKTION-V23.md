# DĀR AL TAWḤĪD KIDS · Unterrichtszentrale V23

## Nur KIDS-Ersteller, keine Besucherversion
Kanonischer, serverseitig geschützter Owner-Link:
`https://dar-al-tawhid.de/test/academy/unterrichtszentrale-v23.html`

Benötigt **beide** Cloudflare Worker Secrets:
`ACADEMY_OWNER_PASSWORD` und `ACADEMY_OWNER_SESSION_SECRET`.
Secrets müssen bei tatsächlich eingesetztem Worker für diese Route vorliegen.
Fehlen sie, liefert der Worker 503 statt die Seite freizugeben. Keine
passwortlose Alternative und kein iOS-Basic-Auth-Dialog am neuen Alias.

`test/kids/akademie/unterrichtszentrale-v23.html` liegt hinter der
vorhandenen Worker-First-Gate-Regel für /test/kids/akademie/*.
Auch `/test/academy/redaktion-katalog-v1.json` ist nur nach
serverseitiger Cookieprüfung abrufbar.

## Daten, Stand vom 11. Oktober 2026
- 52 Wochen × (4 neue Unterrichtstage + 2 Wiederholungstage + 1 flexibler Tag).
- 208 Unterrichtsplätze, 38 aus Quellcode importierte Inhalte inkl. Ṣidq, 170 offen.
- Alle drei Altersgruppen; vier Fächer.
- V22-Codeintegration nur bei den vier neuen Lektionen über echten GitHub-Commit belegt.
- Created / edited / Test-Publish / Visitor-Publish sind NULL, solange keine
  nachprüfbaren Einzelereignisse vorliegen. Niemals „im Code“ automatisch
  als „Besucher veröffentlicht“ werten.
- Keine V4-Vertonung für Besucher freigegeben. Vier Ṣidq-Pilotclips nur für Hörprüfung.
- Der Jahreszyklus beginnt erst nach **manueller Wahl eines Montags**; alle
  Folgedurchläufe beginnen 364 Tage später. Es gibt keine behaupteten
  Kalenderfreigaben für historische Unterrichtstage.
- Einzelne lokale Planungsnotizen und Zieltermine werden **nur im Browser**
  gespeichert. JSON- und CSV-Export zur Sicherung. Keine serverseitigen Writes
  und keine synchronisierten redaktionellen Daten in V23.

## Bewusst noch offen
1. Private Cloudflare Secrets konfigurieren und echten iPhone-Live-Login prüfen.
2. Historische GitHub-/Cloudflare-/Besucherfreigabeereignisse nachvollziehbar
   pro Lektion ergänzen. Kein Erfindung rückwirkender Daten.
3. Authentifizierte serverseitige Redaktion für Status-/Notizänderungen
   mit GitHub-Review, Rollback, Audit-Trail, Freigabeprüfungen bauen.
4. Gesonderte vollständige KIDS-Ersteller-App für alle App-Funktionen fertigstellen.
5. 170 neue Lektionen quellentreu ausarbeiten und V4-Master-Audio separat prüfen.
6. Live-Veröffentlichung von Unterricht erfordert ausdrückliche Freigabe.

## Datenquellen
`kids/data/academy-year-52weeks-v1.json`,
`kids/akademie/curriculum-v1.js`,
`kids/akademie/curriculum-v2.js`,
`kids/akademie/curriculum-v22.js`,
`test/kids/akademie/index.html` (Ṣidq).
Die redaktionelle Momentaufnahme liegt in
`test/kids/akademie/redaktion-katalog-v1.json`.
