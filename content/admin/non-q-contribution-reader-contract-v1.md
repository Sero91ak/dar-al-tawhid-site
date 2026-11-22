# DĀR AL TAWḤĪD – Vollständige Beitragsansicht ohne Q-Nummer

## Ziel
Ein freigegebener Beitrag benötigt keine Q-Nummer und keine zusätzliche, duplizierte Q-Seite. Er behält seine **kanonische Artikelkennung** (beispielsweise `sahabiyyat-umm-haram-seeueberfahrt-20261106`). Eine dauerhafte, direkt teilbare und appübergreifende Leseadresse führt zu:

`https://dar-al-tawhid.de/wissen/beitrag/?id=<bestehende-kennung>&lang=de`

Alle neun App-Sprachen sind verbindlich: `de, ar, en, tr, ku, ckb, bs, fr, es`. Arabisch und Soranî verwenden `dir=rtl`. Der Eintrag darf auch nach Ablauf einer Home-News-/Fokuskarte dauerhaft erreichbar bleiben.

## Verbindlicher Datenvertrag
Die kanonische Originaldatei bleibt die einzige Quelle für Artikelkennung, Quellenadresse, Veröffentlichungsstatus und Eigentümerfreigabe. Kein neuer Q-Eintrag und keine zweite Quelle. Der Übersetzungskatalog liefert `title`, `preview`, `statement`, `sharh`, `lesson`, `source` und lokalisierte Etiketten.

Der universelle Reader liest `/assets/beitrag/reader-catalogs-v1.json` und danach den passenden Quellen-/Sprachkatalog. Ein Beitrag erscheint **nur**, wenn exakt ein Originaleintrag vorhanden ist, `quellenstatus=geprueft`, `freigabeDurchSerhat=true`, die kanonische ID und URL übereinstimmen und die erforderlichen sechs Inhaltsfelder **in allen neun Sprachen** vorliegen. Unvollständige oder versteckte Inhalte bleiben gesperrt; keine automatische Übersetzung oder Ersatztexte behaupten.

Die Seite zeigt nacheinander die eigentliche Aussage, bei verifiziertem Nachweis einen kurzen arabischen Originalauszug, die **als redaktionell gekennzeichnete** belegnahe Erklärung, Lehre/Nutzen und die unveränderte Primärquelle mit Direktlink. Ein vollständiger klassischer Šarḥ, zusätzliche Āṯār oder Gelehrtenzitate erscheinen nur dann, wenn sie tatsächlich quellengeprüft und korrekt den jeweiligen Gelehrten zugeordnet wurden. Redaktionelle Aussagen dürfen **niemals** als klassisches Zitat erscheinen.

## Lernbereich
Der Reader verlinkt in der aktuell gewählten Sprache zum Lernpfad, den der Katalog definiert. Für die 16 bestehenden Frauenbeiträge bleibt `/lernen/frauen-wissen/?id=<kennung>&lang=<sprache>` mit vier Verständnisfragen und neunsprachiger Auswahl bestehen.

Für **künftige** Beitragstypen ohne eigenes Multiple-Choice-Lernmodul steht `/lernen/beitrag/?id=<kennung>&lang=<sprache>&type=<typ>` bereit: vier Verständniskarten mit Antworten aus `preview`, `statement`, `lesson` und `sharh`, nicht frei erfundenen Antwortmöglichkeiten. Ein neuer Typ wird einmalig unter `catalogs.<typ>` in `reader-catalogs-v1.json` registriert, einschließlich Quellenpfaden, neun Sprachcodes und `learningUrl`; dann gilt derselbe Leser für alle entsprechenden publizierten Beiträge.

## App-Verhalten und Governance
Das News-/Fokusmodul verlinkt direkt in die dauerhafte Leseansicht, unabhängig von Frauen-, Männer- oder Neutralprofil. Auf iOS, Android, installierter PWA, DĀR-TEST und Website werden dieselben kanonischen Daten verwendet. Der optionale Parameter `from=test` oder `from=pwa` bewahrt den Rückweg, statt Test-Nutzer ungewollt in die Besucher-App umzuleiten.

Die bestehende 48-Stunden-Fokuslogik, Profil-Empfehlungen, Q-Registry, OneSignal-Sperren, Kids-, Gebets- und Daily-Systeme bleiben unverändert. Neue Veröffentlichungen lösen **keine** Push-Nachricht allein durch einen neuen Katalogeintrag aus. Ein weiterer Push bedarf weiterhin des separaten dokumentierten Freigabeprozesses.

## Abnahme
Der allgemeine Reader wird mit Playwright auf ID-Konsistenz, allen neun Sprachen, RTL, direktem Quellenlink, Originalfreigabe, Lernlink, Spracheinstellung und appübergreifender Navigation geprüft. Bei unfreigegebenen Originalen muss er geschlossen bleiben. Automatisierte Tests sind keine unabhängige menschliche Gelehrten- oder muttersprachliche Prüfung.
