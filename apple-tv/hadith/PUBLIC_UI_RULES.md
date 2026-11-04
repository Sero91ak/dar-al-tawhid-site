# DĀR AL TAWḤĪD – VERBINDLICHE GLOBALE ANZEIGEREGEL

**HAD-0001, HAD-3374 und jede andere Kennung im Muster `HAD-####` sind ausschließlich interne Datensatzkennungen.**

## Öffentlich NIE ausgeben
- Keine `HAD-####`-Kennung als Titel, laufende Nummer, Kicker, Kapsel, Karte, Breadcrumb, Detailschrift, Quellenangabe oder Text im Ḥadīṯ-/Āṯār-Bereich.
- Keine internen IDs in sichtbaren Suchergebnissen, Suchhilfen, Kopier- oder Teilen-Texten oder öffentlichen Share-URLs.
- Dieselbe Grenze gilt für **Besucher-App, Test-App, Website/PWA, Android, iOS, iPad und Apple TV/tvOS**.
- Zählungen der gesamten Bibliothek sind erlaubt; die versteckte Datensatzkennung dagegen niemals.

## Erlaubt und wissenschaftlich erforderlich
- Bibliografische Originalnummern, z. B. `Ṣaḥīḥ Muslim, Nr. 2956`, dürfen **ausschließlich als echte Quellenstellen** angezeigt werden.
- Interne `HAD-####` bleiben in JSON, GitHub, technischen Routen/Lookup-Indizes, Logs und Synchronisierung als technische Schlüssel erhalten. Sie sind **keine** Quellenummern.
- Wenn eine Quellenummer fehlt, lasse die sichtbare Nummer **weg**; niemals durch `rec.id` ersetzen.
- Technische Routen-IDs nicht in Share-Inhalte oder öffentliche Quellenbezeichnungen kopieren.
- Für den privaten Prüf-/Redaktionsbericht dürfen die internen IDs verwendet werden.

## Regressionstest
`node scripts/assert-hadith-public-presentation.js` wird nach dem kanonischen Bibliotheksbuild ausgeführt und blockiert, sobald ein interner Schlüssel als öffentliche Ḥadīṯ-Nummer in einen generierten Index oder eine Sammlung gelangt. Neue Renderer müssen die gleiche Regel erfüllen. 

Die redaktionelle Quellenprüfung (`sharhStatus`, Isnād, Ḥadīṯ/Āṯār) bleibt unverändert.
