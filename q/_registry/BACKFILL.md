# DAR AL TAWḤĪD – Quellenmigration für sämtliche Erwachsenen-Beiträge

**Bearbeitungsspur:** Nur Erwachseneninhalte und Quellenarchiv; keine Änderungen an Kids, iOS-Shell, Push, Service Worker oder Gebetsfunktionen.

**Ausgangslage am 13.10.2026:** 474 Markdown-Dateien im kanonischen Index "content/posts/posts-index.json", Q1–Q42 in "q/_registry/shortlinks.json". Die Aussage "500+" muss ggf. über weitere Erwachsenen-Datenquellen ergänzt werden. 42 registrierte Q-Nummern bedeuten NICHT, dass 42 der 474 indexierten Beiträge bereits eindeutig verlinkt sind.

## Workflow

1. node q/_registry/backfill-post-sources.mjs --audit erzeugt eine vollständige JSON-Inventur, ohne Inhalts- oder Q-Seiten zu verändern.
2. node q/_registry/backfill-post-sources.mjs --prepare erzeugt zusätzlich pro bislang nicht eindeutig verlinktem Beitrag einen unveröffentlichten Redaktionsentwurf in q/_registry/backfill-drafts/. **Altlinks und bibliografische Angaben sind Recherchehinweise, keine validierten Quellen.**
3. Bearbeiter prüft für jeden Entwurf arabische Primärquelle, treue deutsche Wiedergabe, vollständige Werk-/Band-/Seiten-/Nummernangabe, korrekt differenzierte Authentizität/Isnād und jede Zieladresse inkl. Textfragment oder PDF-Seite. Falls Belege nicht sicher nachweisbar sind: NICHT freigeben.
4. Erst nach vollendeter inhaltlicher Prüfung reviewState:verified, approved:true, alle Review-Felder true, approvedBy und checkedAt setzen. Nur tatsächlich kontrollierte Direktnachweise erhalten verified:true mit fundierter reference.
5. node q/_registry/backfill-approved.mjs --check-reviewed prüft das Freigabepaket ohne Schreibvorgang.
6. node q/_registry/backfill-approved.mjs --apply-reviewed erzeugt NUR geprüfte nummerierte Q-Einzelansichten, ersetzt die externen Quellenlinks im Beitrags-Frontmatter durch genau EINEN internen Q-Link und führt das bestehende Quellenregister plus Offline-Snapshot fort.
7. node q/_registry/check-qsource-standard.mjs, node scripts/sync-quellen-registry.cjs --check, node scripts/check-quellen-client.cjs und sämtliche projektweit vorgeschriebenen Schutz-Tests vor Übernahme ausführen.
8. Änderungen in **Dar Test** verifizieren. Live-Veröffentlichung erst nach gesonderter Nutzerfreigabe sowie Prüfung der gültigen Änderungssperre; keine OneSignal-Nachrichten automatisch.

## Sicherheits- und Qualitätsregeln

- Bestehende Q1–Q42, Nummern, Originaltexte, Quellenseiten und Posts niemals überschreiben.
- Bei konkurrierenden Q-Zuordnungen explizit blockieren, nicht anhand von Titelähnlichkeit raten.
- Quellenstatus aus einem alten Markdown-Beitrag nicht ungeprüft zu "authentisch" aufwerten.
- Keine erfundenen arabischen Originalzitate, Isnād-Bewertungen, Direktlinks oder PDF-Seitenanker.
- Ältere Quellen werden nach Möglichkeit übernommen; bereits geprüfte Seiten werden nicht neu generiert.
- Q-Detailseite ist öffentlich eigenständig; keine Rückverweise auf die Gesamtbibliothek oder nächste/vorherige Q.
- Die Eigentümerbibliothek /quellen/ besitzt nicht allein durch noindex echten Zugriffsschutz. Vertrauliche Verwaltungsdaten erfordern Cloudflare Access mit Login, bevor der Bereich als privat bezeichnet wird.
- Alle Entwürfe aus der Audit-Action sind nur redaktionelle Prüfunterlagen. Nicht als veröffentlichte oder vollständige Quellenbelege ausweisen.

## Github-Action

Workflow "Q Source Backfill Audit (Staging Only)" analysiert bei Änderungen der Migrationsskripte die Index-Datei vollständig und stellt einen Audit-Artefaktbericht bereit, ohne eine einzige Besucherdatei zu veröffentlichen.
