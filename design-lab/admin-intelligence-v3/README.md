# DĀR Intelligence Center V3 · Design Lab (isoliert)

**Status:** Interaktiver Design-Prototyp, keine produktive Admin-Funktion. Erstellt am 06.11.2026.

**Vorschau:** [index.html](./index.html) — standalone und ohne externe JavaScript-/CSS-Abhängigkeiten. Demo-Daten sind ausdrücklich als solche gekennzeichnet.

## Warum V3?

Der bestehende Admin-V2-Entwurf ordnet Navigation, Themen und Übersicht. V3 soll daraus eine *entscheidungsorientierte Arbeitszentrale* machen: die nächste sichere Aktion anzeigen, Belege und Datenherkunft sichtbar halten und die bestehende Redaktion ohne Systemneubau schneller bedienbar machen.

Referenzen (Gestaltungsmuster, keine Komponentenübernahme):
- Linear UI Refresh 2026 — ruhige Navigation und konsistente Oberfläche: https://linear.app/changelog/2026-03-12-ui-refresh
- Linear Triage Intelligence — Vorschläge mit nachvollziehbarer Erklärung und Annahme-/Ablehnungsoption: https://linear.app/docs/triage-intelligence
- shadcn/ui Dashboard Blocks — modulare Karten, Tabellen, Charts, Seitenleiste: https://ui.shadcn.com/blocks?category=dashboard
- Vercel Generative UI — Datenanfragen als passende Komponenten ausgeben: https://ai-sdk-patterns.vercel.app/patterns/generative-ui
- Apple Adaptability/Split Views — nach nutzbarer Fenster-/Pane-Breite, nicht nach Gerätemodell: https://developer.apple.com/design/human-interface-guidelines/layout

## In der Vorschau real bedienbar

- Zwei Palette-Varianten: **DĀR AL LAYL** und **Salbei–Elfenbein**, Wechsel und lokale Speicherung.
- Navigation: Übersicht, Prioritäten, Smart Assist, Redaktionspult, Quellen, Wissen, Besucher, System, Einstellungen.
- Globale Suche einschließlich Command Palette mit **Ctrl/Cmd+K**, direkt ausführbaren Modul-/Demo-Aufgabenaktionen.
- Prioritätsliste mit Filter „Alle“, „Wichtig“, „Redaktion“, „Technik“; Detail-Inspector mit Begründung und Prüfplan; lokale Demo-Häkchen.
- Responsive Sidebar, Mobile-Bottomnavigation mit Drawer; kompakte Tablet-/Fold-Ansicht.
- Beispiel-Workflow, System-Statusmodule und illustrative Grafik **ohne echte Besucherzahlen**.
- Technisch: eigenständige Datei, ohne Auth-/GitHub-/Cloudflare-/Supabase-Schreibaufrufe. Keine Push-Funktion.

**Nicht implementiert:** Echte LLM-Anbindung, Daten-/Rechte-Synchronisation, Veröffentlichung, Account-Login, produktive Redaktion, 9 Sprachpakete, geprüfter Server-Deploy oder vollständige Gerätematrix. Alle AI-Hinweise in dieser Vorschau sind **regelbasiert**.

## Architekturvertrag für einen späteren produktiven Ausbau

### 1. Bestehende Infrastruktur erhalten

- `/admin/` bleibt der einzige produktive Admin-Routen-Owner.
- `admin/index.html` und existierende Renderer behalten Authentifizierung, Bearbeiten, Quellen, Planungen, Social Review, Bibliothek, Analytics, Quiz sowie Publish-Validierung.
- `admin/command-center-v2.js` und `admin/appearance-v2.js` sind Ausgangspunkt, nicht parallele neue Router.
- V3 erweitert die Shell **nur kontrolliert im vorhandenen Dashboard-Slot**, keine globalen DOM-Umbauten, keine weiteren `!important`-Patch-Schichten.
- Reale Statistiken ausschließlich über bestehende interne Admin-Endpunkte und deren geprüfte Auth-Grenze lesen. Bei unbekannter Datenlage **„Nicht verfügbar“** statt erfundener Zahlen.

### 2. Klare Datenverträge

| V3-Modul | Datenquelle in produktiver Fassung | Schutz |
|---|---|---|
| Statistik | Bestehende aggregierte Admin-Analytics (`lastData` als Adapter, nicht neue Datenbank) | Fehlende Werte sichtbar |
| Redaktionspult | Bereits verwendete Post-/Quellen- und Sprachmanifeste | Kanonische IDs; 9-Sprachen-Status |
| Quellencheck | Q-Registry, Originalbelege, deduplizierte Post-/Q-Verknüpfung | Nie unbelegte KI-Behauptung |
| Release-Health | GitHub/Cloudflare Status nach vorhandener autorisierter serverseitiger Anbindung | CI != bestätigte Produktion |
| Smart Inbox | Prüfzustände aus vorhandenen expliziten Workflows | Vorschläge sind keine Veröffentlichungen |

### 3. Echte AI später, aber kontrolliert

- AI-Provider **nur serverseitig** aufrufen, mit serverseitiger Authentifizierung, Rollenprüfung und begrenzten Toolberechtigungen; keine Schlüssel oder Admin-PIN im Browser.
- Für jeden AI-Hinweis: **Beobachtung, Datenquelle, Zeitpunkt, Vertrauen/Unsicherheit, empfohlene Handlung, Gültigkeitsgrenze** anzeigen.
- „Wiederholte Inhalte“, „fehlender Nachweis“, „unvollständige Übersetzung“, „nicht bestandenes Deployment“ erst aus validierten Daten ermitteln. Nicht aus reiner Textintuition.
- **Review-first**: lesen/filtern/sortieren automatisierbar; Schreiben/Publizieren/Push/Löschen stets nur mit gültiger Rolle, nachvollziehbarem Diff und bewusster Bestätigung.
- Keine AI darf die theologischen Quellen eigenmächtig verfassen, Authentizitätsgrade erfinden oder eine fehlende Sprachfreigabe überspielen.
- API-Fehler => deaktivierte Aktionen und nachvollziehbare Meldung, nicht stilles „Erfolgreich“.

### 4. UI- und Plattformregeln

- Farben über semantische Tokens aus dem bestehenden Appearance-System; keine unabhängigen Themes im Kindmodul.
- Ein Dashboard-Hauptbereich, innen primär Trenner statt verschachtelter Karten. Lesebereich und Inspektor mit flexiblen Spalten.
- Mobile: Bottom-Nav plus Drawer; Fold zu: ein Pane; Fold auf/iPad: Listen-/Detailstruktur abhängig von **verfügbarer Breite**. Safe Areas, Tablet-Split-View, Querformat und Zoom.
- Alle **neun** vereinbarten Erwachsenen-UI-Sprachen müssen vor einer echten Produktivintegration vollständig angebunden werden. RTL für ar/ckb, keine erfundenen Originalquellen.
- Tastatur/Fokus, Screenreader, mindestens AA-Kontraste, `prefers-reduced-motion`, echte 320/360/390/430/600/768/1024/1280/1440/1920 CSS-px-Prüfungen.

### 5. Reihenfolge und Freigaben

1. **Read-only V3-Preview**: hier implementiert. Im Playwright/Chromium-Probelauf bei 320, 390, 820, 1024 und 1440 px auf Überläufe und grundlegende Interaktionen geprüft; kein Test echter Admin-Berechtigungen.
2. **Architektur-/Sicherheitsaudit** des aktuellen Admin: vor allem clientseitige Legacy-Authentifizierung und Lecks sowie CSS/Scroll-Owner; keine Secrets übernehmen.
3. **V3-Adapter im bestehenden Admin**, zunächst nur read-only und ohne neues Backend; echte Datenherkunft und „Kein Wert“-Zustände.
4. **Redaktioneller Workflow-Inspector** mit originalen Daten und neun UI-Sprachen, konservative Freigabe.
5. **Serverseitiger AI-Assistent** mit Rollen, begrenzten Tools und Audit-Log, separate explizite Implementierungsfreigabe.
6. **End-to-end-Geräteprüfung** und verifizierte Live-Auslieferung. Das bestehende Release-Problem aus [Issue #1689](https://github.com/Sero91ak/dar-al-tawhid-site/issues/1689) vorher lösen. Kein ungeprüfter Merge in produktive Dateien.

Diese Datei dient ausschließlich als **Design-Referenz für die spätere Integration**. Ein Merge der Design-Lab-Seite darf keine Änderung am Produktiv-Dashboard auslösen.