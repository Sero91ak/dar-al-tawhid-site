# TAWḤĪD KIDS – Vorschlag „App-Datenschutz“ (Nutzungsdaten-Angaben) und PrivacyInfo

Stand 28.11.2026, nach Abschalten der Kinder-Konten (kein Supabase), Entfernen von Cloudflare-Analytics, Google Fonts, Typekit, Open-Meteo und everyayah.com.

## Tatsächliche Datenverarbeitung
| Was | Wohin | Gespeichert? |
|---|---|---|
| Profil (optionaler Vorname, Fortschritt, Einstellungen) | nur lokal im Gerät (localStorage) | nur auf dem Gerät |
| Seiten, Schriften, Audio, Bilder | eigene Domain `dar-al-tawhid.de` (Cloudflare Hosting) | normale Server-Zugriffsprotokolle (IP, Zeit) kurzzeitig durch den Hoster |
| Veröffentlichte Inhalte (Feed) | eigener Dienst, nur GET, keine Nutzerdaten | nein |
| Ortsfreigabe (optional) | auf 3 Dezimalstellen (~110 m) gerundete Koordinaten an eigenen Endpunkt `/api/prayer/times`; Antwort wird nur berechnet | nein, keine Speicherung, keine Verknüpfung |
| Ortssuche | lokal auf dem Gerät (kein Dienst) | nein |
| Mikrofon, Kamera, Kontakte, Fotos | nicht verwendet | – |
| Werbe-ID / Tracking | nicht verwendet | – |

## Empfehlung App Store Connect
**Konservative Variante (empfohlen):** „Wir erheben Daten“:
- **Standort → Genauer Standort**
  - Zweck: **App-Funktionalität** (Gebetszeiten)
  - Mit der Identität des Nutzers verknüpft: **Nein**
  - Zum Tracking verwendet: **Nein**

Alle anderen Kategorien: nicht erhoben.

**Alternative:** „Daten werden nicht erhoben“ ist vertretbar, weil die Koordinaten nur in Echtzeit berechnet und nicht gespeichert werden und nur an den eigenen Server gehen. Da Apple „erheben“ als „Übertragung vom Gerät“ definiert, ist die konservative Variante sicherer. Das entspricht `PrivacyInfo.xcprivacy`.

Tracking: **Nein**. Tracking-Domains: keine.

## PrivacyInfo.xcprivacy (im Repo angepasst)
- `NSPrivacyTracking` = false, keine Tracking-Domains
- `NSPrivacyCollectedDataTypes`: PreciseLocation, nicht verknüpft, kein Tracking, Zweck AppFunctionality
- `NSPrivacyAccessedAPITypes`: UserDefaults mit Grund `CA92.1` (unverändert)

## Datenschutz-URL
`https://dar-al-tawhid.de/kids/datenschutz.html` (Deutsch, in der App über „Eltern“ hinter dem Elterngate verlinkt).

## Altdaten
Frühere Test-Konten lagen bei Supabase. Die Kids-App ruft Supabase nicht mehr auf, die Altdaten existieren aber serverseitig weiter. Entscheidung offen: löschen oder behalten. Die Datenschutzseite bietet Löschung auf Anfrage an.
