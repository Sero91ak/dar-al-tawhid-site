# TAWḤĪD KIDS · verbindliche DĪN-Lernbibliothek-Regel

**Geltung:** Sechs bestehende Kategorien in „Den Dīn lernen“, jeweils fünf eigenständige Lektionen. Staging-Ausarbeitung unter `kids-creator-staging`; öffentlicher Besucherstand bleibt bis zur ausdrücklichen Freigabe unangetastet.

## Informationsarchitektur
`Den Dīn lernen` → `6 Kategorien` → `je 5 Lektionen` → `Lesen / Hören / synchrones Mitlesen / Offline`.
Die sechs bisherigen Master-Texte behalten ihre IDs und ihren vollständigen unveränderten Wortlaut. Jede weitere Lektion hat eine global eindeutige ID, einen eigenen vollständigen Master-Text, einen aussagekräftigen Titel, eine Kurzbeschreibung, Belege und ein Audiofeld. Die Navigation bleibt schaltflächenbasiert und ist rückwärtskompatibel zu vorhandenen Deep Links. Keine Wisch-Navigation zur Kategorieauswahl.

## Quellen- und Freigaberegel
Primär Qurʾān und authentische Sunnah. Aussagen von Ṣaḥābah, Tābiʿīn, Atbāʿ at-Tābiʿīn und Salaf nur mit konkretem, überprüftem Primärnachweis; keine erfundenen Überlieferungen oder ungekennzeichneten Paraphrasen. Ausdrücklich zwischen Originalbeleg, textnaher sinngemäßer Wiedergabe und eigener kindgerechter Erklärung unterscheiden. Keine Darstellung Allahs, der Engel, des Paradieses, der Hölle oder sonstigen verborgenen Sachverhalten als angeblich authentisches Bild. Keine sektiererischen Angriffe im Kinderunterricht. Inhalt mit konservativer Quellenprüfung nach der mit dem Auftraggeber abgestimmten sunnitisch-salafitischen Ausrichtung; keine fremden theologischen Aussagen unbemerkt übernehmen.

**Statusmodell:** `existing` = vorhandener kanonischer Text; `review` = neuer ausführlicher Entwurf mit Quellen, aber ohne endgültige redaktionelle Freigabe; `approved` erst nach manueller, dokumentierter Text-/Quellenkontrolle. Textvorbereitung oder Sichtbarkeit im isolierten Creator-Test sind **keine** Publikationsfreigabe.

## Audio-Integrität
Pro Lektion genau ein verbindlicher `masterStoryText`. Für alle Altersprofile (4–5, 6–8, 9–10) exakt derselbe gesprochene Wortlaut; die Altersprofile dürfen nur Darstellung, Typografie und Bedienung variieren. Master-Audio erst nach inhaltlicher Freigabe erstellen. Audio und Mitlesetext wortgleich; später Satz-/Wort-Timing synchronisieren und reale Dateien samt Cache/Offline prüfen. Keine Fake-Player, Testhinweise oder synthetischen Audio-Platzhalter in öffentlich sichtbaren Oberflächen.

## Gestaltung
Sechs etablierte Kategorien und fotografische Bildsprache behalten; pro weiterer Lektion ein sachlich passendes kinderfreundliches Motiv, wenn geprüft und verfügbar. Adobe/Runway-Ergebnisse als dauerhaft gespeicherte komprimierte Projektdateien sichern; niemals kurzlebige Generator-URLs live referenzieren. Profile unabhängig durchgängig einfärben: Jungen Navy/Petrol mit gedämpftem Gold; Mädchen Mauve/Beere/Rosé mit warmem Gold. Keine unpassenden Türkis-Überlagerungen im Mädchenprofil. Ein Karten-/Hero-/Reader-System auf iPhone, iPad, Safari, Android, Desktop, iOS-WebView; `max-width:100%`, `min-width:0`, kein seitliches Abschneiden oder `100vw` im eingerückten Container. Bilder `object-fit:cover`, gut lesbare Overlay-Typografie, klare Abstände, sanfte nicht ablenkende Bedienrückmeldung. Nur skopierte Styles; andere KIDS-Bereiche nicht überschreiben.

## Prüfschleuse
`node kids/tools/test-deen-lessons-regression.cjs` und `node kids/tools/test-deen-curriculum-v1.cjs` in isoliertem Creator-CI. Jedes Publish überprüft Originalkategorien, IDs, 30 Texte, Quellen, Master-/Audio-Trennung, fünf dauerhaft gespeicherte neue Motive, getrennte Mädchenpalette und synchronisierte HTML-Einstiegsdateien; danach echte Online-Bytevergleiche von JS, CSS, JSON und Bilddateien. Eine erfolgreiche HTTP-200-Antwort allein gilt nicht als Live-Verifikation. Produktions-/App-Store-Veröffentlichung erst nach expliziter Freigabe.
