# Xcode/Codex Masterauftrag · DARNext Apple Heritage V1
**Status:** verbindlicher Entwicklungsauftrag, noch nicht implementiert.  
**Priorität:** DARNext-only, ohne Störung der bestehenden Live-/Store-/Kids-Apps.  
**Designvertrag:** `DARNext/Documentation/APPLE-HERITAGE-DESIGN-MASTER-V1.md`

## Die Aufgabe in einem Satz
Baue die bereits existierende **native DARNext-App** schrittweise zu einer einzigartigen, barrierearmen, performanten Apple-Wissensbibliothek in historisch-islamischer Ästhetik um, **nutze dabei dieselbe geprüfte kanonische Inhaltsbasis** der DĀR-AL-TAWḤĪD-Website, und führe keine Veränderungen an der produktiven Web-/iOS-/Kids-Infrastruktur aus.

## Ausgangspunkt: Nicht kopieren, erst lesen
Repository: `Sero91ak/dar-al-tawhid-site`  
Arbeitszweig für diesen Master: `codex/darnext-apple-heritage-master-v1-20261024`  
Parent: `codex/darnext-phase4-wip-2026-10-23`  
Beide Dokumente unter `DARNext/Documentation/` sind Teil des Auftrags und müssen vollständig gelesen werden.

**Git-Disziplin:** Vor einem Wechsel lokalen Worktree, nicht eingecheckte Xcode-Projektänderungen, Targets/Schemes, separate Agent-Branches und weitere laufende Arbeiten prüfen. Mit eigenem sauberen Worktree oder gleichwertiger Isolation arbeiten. Niemals lokale fremde Änderungen per Reset/Stash/Force überschreiben, wenn sie nicht gesichert und zugeordnet sind. Kein Merge/Cherry-Pick nach `main` ohne expliziten Auftrag. Bestehende lokale DARNext-Arbeit gegen den Branch inventarisieren; nichts verloren gehen lassen.

## Pflicht-Audit vor dem ersten Code-Edit
1. Xcode-Projekt `DarAlTawhid.xcodeproj`, DARNext Target, Scheme, Deployment Target und Resource Membership tatsächlich prüfen. Quelle im Branch ggf. im Repo-Root.
2. Alle vorhandenen `DARNext`-Module inventarisieren: `App`, `Shell`, `Data`, `Domain`, `Features`, `DesignSystem`, `Resources/Content`, `Assets.xcassets`.
3. Die Inhalte/Status aus `DARNext/Resources/Content` mit zentralen kanonischen Ressourcen vergleichen (Qurʾān, Posts, Duʿāʾ, Quiz, Bücher, Publikationen, Übersetzungen). Fehlende und nur online verfügbare Bestände im Audit benennen.
4. Identifizieren, ob von `DarAlTawhid` oder anderen Targets Dateien gemeinsam genutzt werden. DARNext-only Änderungen bevorzugen.
5. Bisherige Tests lesen, insbesondere `DARNextTests/DARNextTests.swift` und UI-Tests. Baseline erstellen: Compilierbarkeit, Datenladepfade, App-Start, Navigationsziele, Ressourcen-Anwesenheit. Fehler nicht als erledigt melden.

**Audit-Ergebnis:** kompakte Markdown-Tabelle `DARNext/Documentation/IMPLEMENTATION-STATUS.md` mit Komponenten, Status (funktioniert / nur Daten / Entwurf / defekt / nicht geprüft), Risiken, Ausgangs-Commit, nachgewiesenen Tests. Führe dort eine fortlaufende Änderungs- und Fehlerliste.

## Phase A — DARNext Design Foundation
- Bestehendes `DARTheme.swift` als zentrale Design-Token-Quelle auditieren und für nightInk #091B20, deepEmerald #16372F, antiqueGold #C7A66C, parchment #F1E6D2, inkBrown #76604F und readerInk #18221F konsolidieren. Keine konkurrierenden hardcodierten Farbdefinitionen.
- Drei Erscheinungsbilder: Nachtbibliothek, Pergament, Tiefblau/Messing. System-Dark/Light, ausreichender Kontrast, sichere Persistenz einer expliziten Designwahl.
- SF Pro für Bedienung; typografischer klassischer Headline-Stil, hochwertige Serif für deutsche Editorial-Bereiche; arabische UI typografisch gesondert. Für Qurʾān Uṯmānī-Darstellung nur nach Lizenz- und Renderprüfung der Fontdatei.
- Wiederverwendung **nach Sichtprüfung** vorhandener eigener 3D-/Hero-/Brand-Assets aus dem Repo; keine unkontrollierten Emojis oder automatisch überlagernde Hintergrundgrafiken. Asymmetrische, luftige Leserflächen; feine Messinglinien; wenige funktionale Karten.
- SwiftUI-native Navigationskontrollen und Materialeffekte systemgerecht, Liquid-Glass-Unterstützung mit Availability-/Accessibility-Fallback. Keine vollflächig transparente Lesetextplatte.
- iPhone und iPad unterstützen; Tablet mit adaptiver Navigation/Split-View wo sinnvoll, keine erzwungenen Web-Styles.

**Prüfkriterium:** reproduzierbare SwiftUI Preview/Screenshots für Dark/Light/Pergament, Kompakt-/Großgerät und iPad; kein unlesbarer Text, keine doppelten Header oder überlappenden Tab-Bars.

## Phase B — Drei echte native Referenzseiten
Diese 3 Features **zuerst vollständig**, statt 30 halbfertige Masken:
1. **Dashboard**: kompakter Salam, bestehendes Branding, echte lokale Āyah, neueste freigegebene Empfehlung, Fortsetzen und Sekundäraktionen. Keine erfundenen Gebetszeiten; Permission-State offen kennzeichnen.
2. **Wissenschaftsblatt**: native Post-Detail-Ansicht, klassischer Lesesatz, komplette Markdown-/Quellentypografie, Gliederung Aussage + Verfasser + Buch + Fundstelle + Fazit. Funktionierende Native Share Sheet, Textkopie, Lesezeichen, Quellen-Sheet; markierte unverifizierte Metadaten. Kein destruktives Entfernen von Markdown-Semantik per einfacher `**`-Ersetzung.
3. **Muṣḥaf-Reader**: 114 Sūren als Navigationsgrundlage; korrekter arabischer Āyah-Text, Übersetzung, optional Transliteration, Scroll-/Leseposition, Schriftgrößen, Favoriten. Vollständig geprüfte Harakāt, RTL und Auswahl. Anbindung an bestehende AVFoundation-Audioengine, reale Tracks statt Dummy-Audio.

Nutzerschnittstellen aus echtem `LocalContentRepository` oder nachweislich freigegebenem ContentSync. Keine Demo-Inhalte als „live“ markieren.

**Prüfkriterium:** jeder Button hat Funktion; Öffnen/Zurück/Speichern/Teilen lässt sich testen; Reader funktioniert offline mit Bundledaten; Haptik reduziert; VoiceOver erkennt wesentliche Elemente.

## Phase C — Inhalte, Quellen, wissenschaftliche Tiefe
- Inventar / Zuordnung zu **kanonischen** Datenquellen; keine Parallel-Datenbank von Beiträgen manuell in DARNext pflegen.
- Explizite Strukturen `postId`, `canonicalQSourceNumber`, `sourceHash`, `reviewStatus`, `language`, `updatedAt`; unterscheiden von `surahNumber`/`ayahNumber`.
- Verbot, `/q/<nummer>/` aus einer beliebigen Sūrah-, Āyah- oder String-ID zu generieren. Korrekte Quellkarte aus Registry laden; Fallback ehrlich markieren.
- Vollständige Inhaltsgruppen: Qurʾān, Tafsīr/Tadabbur (nur geprüfter vorhandener Inhalt), Beiträge, Ḥadīṯ/Āṯār, Duʿāʾ, Bibliothek/PDFs, Wissenschaftsregister, Quiz; Kids nicht als nativen Target-Teil importieren.
- Bibliothek: PDFKit nur mit wirklich verfügbaren, verifizierten PDFs; Offline-Downloads mit Dateiprüfung; nicht auf Bücher ohne PDF künstlich verlinken.
- Duʿāʾ: Arabisch, Deutsch, Lautschrift, Quelle; Ganz/Langsam/Wort-für-Wort nur mit tatsächlich passenden Tondateien, sonst Status klar zeigen.
- Suche: de/arabisch, Varianten ohne Harakāt, Quellenbezug, Suche über Metadaten und Inhalte, Deep Link in richtigen Reader.
- Neun Sprachcodes `de,tr,en,ar,ku,ckb,bs,fr,es` vorbereiten: Kanonische IDs sprachunabhängig, geschützte Belege unübersetzt, RTL in Arabisch/Soranî. Maschinelle Übersetzung benötigt menschlich-religiöse Freigabe; Drafts nie als veröffentlicht anzeigen.

## Phase D — Echtzeitfreie, robuste Inhaltsverteilung
- Vorhandene Website-/GitHub-/Publish-Pipeline analysieren; dokumentierte, versionierte API oder Manifestquelle nutzen, keine willkürlich erfundene Server-URL.
- Ein Produkt-übergreifendes kanonisches Datenmodell. Published approved content wird nach zentralem Publish in DARNext aktualisiert; nicht von Web-UI-Layouts abhängig machen.
- Bundle-basierte Offline-Inhalte + validierter Delta-Sync. Cache und Benutzerzustand (Bookmarks, Downloads, Leseposition, Schriftmodus) voneinander trennen. Background-Neuladen nur innerhalb iOS-Beschränkungen, keine garantierte sofortige Zustellung suggerieren.
- Push (APNs/OneSignal) separat behandeln: Sprachpräferenz, korrekte Publish-Events, idempotente IDs/Deep Links, kein Versand durch simples GitHub-Kopieren. Keine Neuversandmeldung bei stiller Korrektur ohne separate Freigabe.
- Bei fehlendem Netz, veralteten Feeds und fehlender Berechtigung lokale Inhalte weiter lesbar und synchronisationsstatus erkennbar halten.

**Prüfkriterium:** neuer genehmigter Testbeitrag -> nach Sync exakt einmal angezeigt, ID/Quellnummer/Sprachen korrekt; stille Korrektur aktualisiert dieselbe ID ohne Duplikat und ohne neue Nachricht; Withdrawn verschwindet regelkonform, bestehender Bookmark wird nicht zerstört.

## Phase E — native Apple-Möglichkeiten
- PDFKit, AVFoundation/Now Playing, AirPlay, Speech-/Audio-Handling, Haptics, Spotlight/App Intents, Core Location für Gebetszeiten/Qibla, Apple Share Sheet, Widgets/Live Activities **nur nach gesonderter Zielprüfung**.
- Keine Signings, Team-IDs, Entitlements, App-Groups, Bundle-IDs, Schemes oder fremde Widget Bundles blind ändern.
- KI-Forschungsassistent erst nach belastbarer freigegebener Content-Registry und verifizierbarer Quellenantwort implementieren.

## Phase F — Tests, Geräte und Übergabe
- `DARNextTests` und `DARNextUITests` erweitern: kanonische IDs, Quell-URLs, 114 Sūren, Datenparser, nicht freigegebene Übersetzungen, arabische Diakritika, Suchtreffer und Netzwerk-/Offlinefälle.
- iPhone kompakt/groß/iPhone Duo; iPad Hoch/Quer und Split View; Dynamic Type XXL, VoiceOver, RTL, Reduce Motion, niedrige Datenrate, Neustart, Audio-Unterbrechung, Deep Link, Notification (nur in Testumgebung).
- Realen Clean Build und Build-for-Testing ausführen, wenn die Xcode-Umgebung dies zulässt. Fehlt eine Build-/Xcode-Fähigkeit, exakt berichten und diese Validierung offen lassen.
- Für iPhone-Installation: lokalen geprüften Branch in Xcode öffnen, Scheme **DARNext** und physisches iPhone wählen, **Run** ausführen; GitHub-Commit allein aktualisiert installierte App **nicht**.

## Vorgehensweise ohne Rückfrageschleife
1. Scope prüfen, isolierten Worktree/Branch sicherstellen, Audit erzeugen.
2. Priorisiert Phase A + drei Referenzseiten Phase B implementieren.
3. Kleinere, thematisch saubere Commits; nach jedem Schritt prüfen. Danach Phase C usw. nach dem Design-Master fortführen.
4. Wo eine legitime Berechtigung oder technische Voraussetzung fehlt, **nicht** simulieren. Das übrige Umsetzbare fortsetzen und den Blocker in `IMPLEMENTATION-STATUS.md` protokollieren.
5. Keine pauschalen Rewrites, keine Löschung von fremden Dateien, kein App-Store-/Live-Deployment ohne ausdrückliche Erlaubnis.
6. Am Ende jeder tatsächlich ausgeführten Arbeit nennen: geänderte Dateien, Commit-SHAs, was sicht-/testbar funktioniert, reale Build-/Testresultate, offene Punkte, nächste Umsetzung.

## Guardrails bei Xcode-Projektdateien
Projektdateien wie `.pbxproj` nur in der gerade geöffneten Umgebung zulässiger Art bearbeiten; wenn Xcode/Agent dies untersagt, nicht per Script/Shell/Patch umgehen. Stattdessen funktionierende Code-/Asset-Vorbereitung und Dokumentation liefern, konkrete Xcode-Projektverwaltungsaktion benennen, danach Build fortsetzen.

## Abschlussbedingung
Nicht „fertig“ melden, nur weil die Screens schön aussehen. DARNext gilt als fertig, wenn Design, originale kanonische Daten, wissenschaftlich korrekte Quellreferenzen, Offline-Lesbarkeit, Audio, Mehrsprachigkeit, native Navigation und Tests nachweislich zusammenarbeiten. **Im ersten Arbeitsdurchlauf** A und B funktionsfähig machen und umfassenden Statusbericht liefern; danach phasenweise fertigstellen.
