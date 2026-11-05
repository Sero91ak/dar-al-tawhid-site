# DĀR AL TAWḤĪD · Q50 neunsprachiger Quellen-/Lernbereich

**Status:** redaktionell vorbereitet, **nicht veröffentlicht**. Die automatisch geprüfte Struktur ersetzt keine sprachliche und isnād-fachliche Endredaktion. **Kein OneSignal-Push.**

## Eine kanonische Identität
- Postentwurf: `docs/editorial-drafts/dieses-wissen-ist-religion-isnad-20261104-q50.md` (`post:dieses-wissen-ist-religion-isnad-20261104-q50`).
- Q-Quelle: `qsource:50`, Route `/q/50/`, Datei `q/50/index.html`.
- Unterricht: `quiz:qsource:50`, Route `/lernen/wissen-ist-religion/`.
- Übersetzungen: `assets/q50-locales.json`. Gemeinsamer DOM-/Lernadapter: `assets/q50-localized.js`.
- Register: `q/_registry/shortlinks.json`, `quellen/shortlinks.json`, `quellen/index.html`; nextNumber = 51.
- Vorhandene Erwachsenensprachen: `de, ar, en, tr, ku, ckb, bs, fr, es`, für `ar` und `ckb` RTL.

## Getrennte Āthār und Einstufung
- Ibn Sīrīn: `إن هذا العلم دين فانظروا عمن تأخذون دينكم` (Muslim, Muqaddimah, Introduction 26, Islamweb Bd. 1, S. 14). Hauptweg: Ḥasan ibn ar-Rabīʿ → Ḥammād ibn Zayd → Ayyūb und Hišām → Muḥammad ibn Sīrīn; zusätzliche Parallelwege im Original.
- Ibn al-Mubārak: `الإسناد من الدين ولولا الإسناد لقال من شاء ما شاء` (Muslim, Muqaddimah, Introduction 32, Islamweb Bd. 1, S. 16). Hauptweg: Muḥammad ibn ʿAbdillāh ibn Quhzāḏ → ʿAbdān ibn ʿUṯmān → ʿAbdullāh ibn al-Mubārak.
- Beide sind **Aussagen von Gelehrten**, nicht vom Gesandten Allahs ﷺ selbst. Muslim gibt ihren Wortlaut und die Überlieferer wieder. Für eine eigenständige isnād-kritische Schlussbewertung reicht ein struktureller CI-Test nicht aus.
- Verifizierte Primärnachweise: [Muslim/Ibn Sīrīn](https://www.islamweb.net/ar/library/content/1/28/), [Muslim/Ibn al-Mubārak](https://islamweb.net/ar/library/content/1/33/); weitere Paralleltexte: [Dorar](https://dorar.net/h/QMAzjI7i/osoul), [Ibn aṣ-Ṣalāḥ](https://islamweb.net/ar/library/content/90/134/).

## Verhalten und Testvertrag
- Gespeicherte Sprache: `darAdultPreferredLocaleV1`. Explizites `?lang=<code>` hat Vorrang; bei manuellem Wechsel werden Sprache und Lernfragen sofort neu gerendert und die Auswahl gespeichert.
- `Q50` und die vier Lernfragen bleiben innerhalb der bereits geöffneten iOS-/PWA-/Web-App-Reader-Oberfläche. Der Übergang zur Lernseite wird über ein auf das konkrete Q50-Ziel beschränktes Same-Origin-Ereignis an die vorhandene App-Navigation übergeben, kein erneuter App-Start.
- Alle vier kanonischen Frage-IDs und richtigen Antwortindizes bleiben unverändert: `[1,2,0,3]`. 9 × 4 = **36** Übersetzungsfassungen mit identischem Frageninhalt. Kein Quellen-/Erklärungstext auf der Quizseite.
- Bei einem Ausfall der Sprachdatei bleibt eine deutsche, ausdrücklich als Notfassung gekennzeichnete Darstellung erhalten.
- Nötige Prüfungen: `node scripts/check-q50-nine-language.cjs`, `node q/_registry/check-qsource-standard.mjs`, `node scripts/check-quellen-client.cjs`, `python3 scripts/check-q50-nine-language-browser.py` sowie die bestehende App-/CI-Matrix.

## Vor einer Veröffentlichung
1. Beide arabischen Originalstellen, Überlieferungswege, nummerierte Nachweise und Markierungsanker nochmals fachlich kontrollieren.
2. Jede der neun Übersetzungen inklusive Begriffen Āthār/Isnād und aller 36 Fragevarianten sprachlich bestätigen; erst danach `approved=true` nach tatsächlicher Freigabe.
3. Safe Areas, RTL, Quellen→Lernen, Zurück/Home auf iPhone WKWebView, Android-PWA, Tablet und Desktop im realen Endgerät prüfen.
4. Den einzelnen kanonischen Beitrag erst nach ausdrücklich erteilter Veröffentlichungsfreigabe in `content/posts/` anlegen und den echten Live-Deploy nachweisen. **Eine OneSignal-Sendung braucht ihre eigene ausdrücklich freigegebene Beitragspublikation und Doppelversandprüfung.**
