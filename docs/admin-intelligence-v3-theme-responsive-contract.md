# DĀR Admin Intelligence Center V3 · verbindlicher Theme- und Responsive-Vertrag

Stand 06.11.2026 · Gilt ausschließlich für die private Admin-Oberfläche unter `/admin/`.

## 1. Genau zwei Erscheinungsbilder

Das einzige Theme-Interface ist `admin/appearance-v2.js` mit dem Speicher `darAdminAppearanceV2` und dem HTML-Attribut `data-dar-admin-theme`. Es akzeptiert ausschließlich `layl` (DĀR AL LAYL) und `salbei` (Salbei–Elfenbein). Der Theme-Owner ist `admin/appearance-v2.css`. Weder ein Redaktionsmodul noch V3 darf ein drittes Theme, eine eigene Theme-Persistenz oder alte blaue/grüne Designvariante erzeugen.

| Element | DĀR AL LAYL | Salbei–Elfenbein |
| --- | --- | --- |
| Basis | `#0c0e0d` | `#f4f6f0` |
| Text | `#f6f0e4` | `#17211b` |
| Sekundärtext | `#b9b7a8` | `#536057` |
| Titel/Goldakzent | `#e0c994` | `#7d5d2b` |
| Panel-Basis | `#171815` | `#f9faf6` |

Alle Hintergrundflächen, Textfarben, Buttons, aktive Tabs, Rahmen, Hoverzustände, Statistik-, Editor- und Statusoberflächen folgen semantischen Variablen wie `--admin-panel-background`, `--admin-input-background`, `--admin-control-background`, `--v2ink`, `--v2muted`, `--v2gold` und den semantischen Statuswerten `--admin-success-text`, `--admin-warning-text` und `--admin-danger-text`. Fehlender Status darf nicht durch eine neue spontane Palette ersetzt werden.

**Altfarben-Bridge:** Im bestehenden `admin/index.html` sind frühere Blau-/Navy-RGB-Farbwerte in dem alten Inline-CSS durch `--admin-legacy-*-rgb` ersetzt. Diese Werte sind für beide Themes in derselben Appearance-CSS festgelegt. Neue Funktionen sollen direkt semantische Tokens benutzen, nicht neue Legacy-Variablen einführen.

Die folgenden fachlichen CSS-Eigentümer wurden für die zwei Farbwelten geprüft: `admin/social-review.css`, `admin/library-admin.css`, `admin/live-edit.css`, `admin/wissensbereich-push.css`, `admin/dar-admin-top-chrome-fix.css`. Die Original-Dokumentvorschau `.social-paper` bleibt absichtlich hell, weil sie eine eigenständige Lese-/Druckfläche ist. Warnungen und Fehler dürfen ihre Bedeutung behalten, müssen jedoch in beiden Themes ausreichenden Kontrast bieten.

## 2. Eine Layout-Shell, keine weitere Navigation

- `admin/command-center-v2.js` bleibt Eigentümer der Hauptnavigation, des Such-Dialogs, des Tab-Selectors und des Auth-Gates. V3 wird nur als read-only Überblick unter dem bestehenden Start-Tab eingefügt.
- `admin/intelligence-v3.js` darf weder Login prüfen/umgehen noch Beiträge schreiben, freigeben, veröffentlichen oder löschen. Jeder Workflow-Button geht durch den vorhandenen `#adminTabSelect`-Change-Handler; kein zweiter Router.
- Die klassischen 13 Start-Module bleiben in einem nativen zugänglichen `<details>` erreichbar. Kein Funktionsverlust durch V3-Übersicht.
- Die Sidebar und die mobile Navigation bleiben unabhängig vom Inhalt; keine eigenständigen Header-, Hero-, Scroll- oder Body-Controller in einzelnen Dashboard-Modulen.

## 3. Tatsächlich nutzbare Breite bestimmt das Layout

| Verfügbarer Viewport | Navigation | Oberfläche |
| --- | --- | --- |
| ab 1024 CSS px | volle Desktop-Sidebar | iPad groß und Desktop gleiches Navigationsmodell |
| 720–1023 CSS px | kompakte Sidebar | Tablet / iPad Stage Manager / Fold offen |
| bis 719 CSS px | Bottomnavigation plus Menü-Drawer | Smartphone / iPad schmal / Fold außen |

Zusätzlich gilt für das **nutzbare Admin-Pane nach Abzug der Sidebar** CSS `container-type:inline-size` auf `#panel`: Bei höchstens 760 px werden klassische zweispaltige Arbeitsbereiche einspaltig. Bei höchstens 520 px werden Formular-/Kartenraster weiter reduziert. V3 besitzt einen eigenen Inhaltscontainer und reagiert bei höchstens 850 px mit einer Inspektor-Spalte unter der Aufgabenliste und bei höchstens 540 px mit schmaler Kopf- und Kennzahlengeometrie.

Ein großes iPad darf deshalb Desktopnavigation verwenden. Verkleinert man sein Fenster, muss die UI ohne Reload und ohne gerätebasierten Sonderfall in die geeignete Tablet- und anschließend Smartphone-Struktur wechseln. Besucher- und Änderungsprotokoll-Spalten werden auf schmalen Fenstern **unterhalb** des Editors gezeigt, nicht unsichtbar gemacht. Auf echten Geräten sind Fold-Falz, Safe Areas, iPad Split View, Stage Manager, Hoch-/Querformat sowie Browser-Zoom zu prüfen. Die Viewport-Metadaten blockieren Zoom nicht mehr.

## 4. Datenherkunft, AI-Hinweise und Freigaben

- Der V3-Adapter liest ausschließlich vorhandene aggregierte Admin-Statistiken `lastData`. Es werden keine Besucherpersonen oder Store-Downloads erfunden. Ein fehlender Messwert erscheint als `—`/„Nicht verfügbar“, ein echter numerischer Nullwert als `0`.
- Die Hinweise von V3 sind **regelbasierte Prüfwege**, keine automatisch nachgewiesenen Fehler und keine LLM-Ausgaben. Jeder Eintrag verweist auf das bestehende zuständige Fachmodul.
- Für eine zukünftige echte AI-Anbindung sind Quellen-/Zeitnachweis, serverseitige Berechtigungsprüfung, Audit-Trail, Begrenzung der Tools, Prompt-Injection-Abwehr und manuelle Veröffentlichungsgenehmigung gesonderte Voraussetzungen.
- In V3 sind die neun UI-Sprachkataloge `de`, `en`, `ar`, `tr`, `ku`, `ckb`, `bs`, `fr`, `es` vorhanden; `ar`/`ckb` benutzen RTL. Theologische Quellenfassungen bleiben weiterhin ausschließlich nach vorhandenen Quellen- und Sprachfreigaben zulässig.

## 5. Verifikation und Grenzen

Lokale Regressionen (Node, ohne Internetzugang):

```sh
node admin/tests/intelligence-v3.test.cjs
node admin/tests/appearance-v2.test.cjs
```

GitHub prüft im PR separat App Health, Canonical State und App Lane. Für die Paletten-Grundflächen wurden die Kontrastverhältnisse Text/Sekundär/Akzent rechnerisch ermittelt: Layl `15,71/8,83/11,00`, Salbei `15,78/6,30/5,77`. Das **beweist nicht**, dass alle dynamisch gerenderten Module auf jedem Gerät visuell abgenommen sind.

**Offene echte Browser-/Geräteabnahme:** Breiten `320, 360, 390, 430, 600, 768, 1024, 1280, 1440, 1920` CSS px, iPad-Fenster frei skalieren, Split View, geöffnetes und geschlossenes Fold, Sidebar/Drawer/Bottomnavigation, Auswahl-/Tastaturfokus, Scrollgrenzen, beide Themes, RTL, kontrastreiche Fehlermeldungen, Library-/Redaktions-/Live-Editor-Interaktion und Standard-Admin-Publikationsabläufe ohne tatsächlichen Push testen.

**Release-Gate:** Weder grünes GitHub-CI noch ein bereitgestellter PR ist ein nachgewiesenes Cloudflare-Live-Update. Der Besucher-Live-Verifizierungsblocker [Issue #1689](https://github.com/Sero91ak/dar-al-tawhid-site/issues/1689) muss separat und ohne Abschaltung von Checks gelöst werden. Erst nach bestandener Live-Verifikation darf die Auslieferung als produktiv bestätigt werden.

Keine Änderungen an Besucher-App, Kids-App, Widget/Watch/TV, OneSignal, Quellen-URL-Schema oder geschützten GitHub-Workflows im Rahmen dieses Theme-Vertrags.